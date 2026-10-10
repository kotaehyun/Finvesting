import { z } from "zod";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  trades,
  instruments,
  incomes,
  payrollMonths,
  financialProfiles,
  insurancePolicies,
  savingsContributions,
  accounts,
} from "@finvesting/db";
import {
  calculateOverseasCapitalGainsTax,
  simulateTaxLossHarvesting,
  aggregateFinancialIncome,
  calculateYearEndTaxSettlement,
  type OverseasRealizedTrade,
  type OverseasUnrealizedHolding,
  type IncomeRecord,
  type YearEndTaxInput,
  type YearEndTaxResult,
} from "@finvesting/core";
import { router, publicProcedure } from "../trpc";
import { loadHoldings, latestUsdKrw } from "../lib/holdings";
import {
  parseHometaxJson,
  parseHometaxRows,
  csvToRows,
  buildTaxSettlementXlsx,
} from "@finvesting/interop";

function n(v: string | number | null | undefined): number {
  return v != null ? Number(v) : 0;
}

export const taxRouter = router({
  /**
   * 세금/연말정산 종합 요약
   */
  summary: publicProcedure
    .input(z.object({ year: z.number().int().default(2026) }).optional())
    .query(async ({ ctx, input }) => {
      const year = input?.year ?? 2026;

      // 1. 배당·이자 금융소득
      const incomeRows = await ctx.db
        .select({
          id: incomes.id,
          kind: incomes.kind,
          gross: incomes.gross,
          withheldTax: incomes.withheldTax,
          paidOn: incomes.paidOn,
          symbol: instruments.symbol,
          name: instruments.name,
        })
        .from(incomes)
        .leftJoin(instruments, eq(incomes.instrumentId, instruments.id))
        .where(eq(incomes.userId, ctx.userId))
        .orderBy(desc(incomes.paidOn));

      const incomeRecords: IncomeRecord[] = incomeRows.map((r) => ({
        id: r.id,
        kind: r.kind === "interest" ? "interest" : "dividend",
        gross: n(r.gross),
        withheldTax: n(r.withheldTax),
        paidOn: String(r.paidOn),
        symbol: r.symbol,
        name: r.name,
      }));

      const financialIncome = aggregateFinancialIncome(incomeRecords, year);

      // 2. 해외주식 양도소득세
      const holdingsData = await loadHoldings(ctx.db, ctx.userId);
      const overseasHoldings: OverseasUnrealizedHolding[] = holdingsData.positions
        .filter((p) => p.currency !== "KRW" || (p.market !== "KRX" && p.market !== "UPBIT"))
        .map((p) => ({
          symbol: p.symbol,
          name: p.name,
          quantity: p.quantity,
          avgBuyPrice: p.avgCost * p.avgFxRate,
          currentPrice: (p.lastPrice ?? p.avgCost) * p.avgFxRate,
          unrealizedPnl: p.pnlKrw ?? 0,
        }));

      // 체결 내역 중 해외 매도 체결
      const tradeRows = await ctx.db
        .select({
          id: trades.id,
          side: trades.side,
          quantity: trades.quantity,
          price: trades.price,
          fee: trades.fee,
          tax: trades.tax,
          fxRate: trades.fxRate,
          tradedAt: trades.tradedAt,
          symbol: instruments.symbol,
          name: instruments.name,
          currency: instruments.currency,
          market: instruments.market,
        })
        .from(trades)
        .innerJoin(instruments, eq(trades.instrumentId, instruments.id))
        .where(eq(trades.userId, ctx.userId))
        .orderBy(desc(trades.tradedAt));

      const overseasRealizedTrades: OverseasRealizedTrade[] = [];
      for (const t of tradeRows) {
        const isOverseas = t.currency !== "KRW" || (t.market !== "KRX" && t.market !== "UPBIT");
        if (isOverseas && t.side === "sell") {
          const fx = n(t.fxRate) || 1350;
          const qty = n(t.quantity);
          const sellPriceKrw = n(t.price) * fx;
          // 매수 평단 추정: holdings 또는 포지션 기반, 없으면 매도가의 80% 추정
          const matchingPos = holdingsData.positions.find((p) => p.symbol === t.symbol);
          const buyPriceKrw = matchingPos ? matchingPos.avgCost * matchingPos.avgFxRate : sellPriceKrw * 0.8;
          const feeAndTaxKrw = (n(t.fee) + n(t.tax)) * (t.currency === "USD" ? fx : 1);

          overseasRealizedTrades.push({
            id: t.id,
            symbol: t.symbol,
            name: t.name,
            tradedAt: t.tradedAt.toISOString(),
            quantity: qty,
            sellPrice: sellPriceKrw,
            buyPrice: buyPriceKrw,
            feeAndTax: feeAndTaxKrw,
          });
        }
      }

      const capitalGainsTax = calculateOverseasCapitalGainsTax(overseasRealizedTrades, year);
      const taxLossHarvesting = simulateTaxLossHarvesting(capitalGainsTax, overseasHoldings);

      // 3. 근로소득 연말정산 기납부 및 현황
      const payrollList = await ctx.db
        .select()
        .from(payrollMonths)
        .where(
          and(
            eq(payrollMonths.userId, ctx.userId),
            sql`${payrollMonths.month} LIKE ${`${year}-%`}`,
          ),
        );

      const [profile] = await ctx.db
        .select()
        .from(financialProfiles)
        .where(eq(financialProfiles.userId, ctx.userId))
        .limit(1);

      // 연간 급여 합산 (기록된 월 데이터가 12개월 미만이면 월평균으로 연환산)
      let annualGross = payrollList.reduce((s, p) => s + n(p.grossAmount), 0);
      let annualPrepaidTax = payrollList.reduce((s, p) => s + n(p.taxAmount), 0);
      let annualPrepaidInsurance = payrollList.reduce((s, p) => s + n(p.insuranceAmount), 0);

      if (payrollList.length > 0 && payrollList.length < 12) {
        const factor = 12 / payrollList.length;
        annualGross = Math.round(annualGross * factor);
        annualPrepaidTax = Math.round(annualPrepaidTax * factor);
        annualPrepaidInsurance = Math.round(annualPrepaidInsurance * factor);
      } else if (payrollList.length === 0 && profile) {
        annualGross = (n(profile.monthlyGrossIncome) || 5_000_000) * 12;
        annualPrepaidTax = (n(profile.monthlyIncomeTax) || 300_000) * 12;
        annualPrepaidInsurance = (n(profile.monthlyHealthInsurance) || 450_000) * 12 * 2; // 건보+국민연금
      }

      // 보험료 연간 추정
      const policies = await ctx.db
        .select()
        .from(insurancePolicies)
        .where(eq(insurancePolicies.userId, ctx.userId));
      const annualInsurancePremium = policies.reduce((s, pol) => s + n(pol.monthlyPremium) * 12, 0);

      // 청약저축 연간 추정
      const contribs = await ctx.db
        .select()
        .from(savingsContributions)
        .where(
          and(
            eq(savingsContributions.userId, ctx.userId),
            sql`${savingsContributions.month} LIKE ${`${year}-%`}`,
          ),
        );
      const annualSavingsContribution = contribs.reduce((s, c) => s + n(c.amount), 0);

      const defaultYearEndInput: YearEndTaxInput = {
        grossSalary: annualGross || 60_000_000,
        prepaidTax: annualPrepaidTax || 3_600_000,
        prepaidInsurance: annualPrepaidInsurance || 5_400_000,
        pensionSavingsContribution: 3_000_000, // 기본 시뮬레이션 값
        irpContribution: 1_500_000,
        housingSubscriptionDeposit: Math.min(annualSavingsContribution, 2_400_000),
        insurancePremiumPaid: annualInsurancePremium || 1_200_000,
        creditCardSpent: Math.round(annualGross * 0.2),
        debitCardCashSpent: Math.round(annualGross * 0.15),
        dependentsCount: 0,
      };

      const yearEndSettlement = calculateYearEndTaxSettlement(defaultYearEndInput);

      return {
        year,
        financialIncome,
        capitalGainsTax,
        taxLossHarvesting,
        yearEndSettlement,
        overseasHoldingsCount: overseasHoldings.length,
        incomesCount: incomeRecords.length,
        payrollMonthsCount: payrollList.length,
      };
    }),

  /**
   * 해외주식 양도소득세 & 절세 시뮬레이션 상세
   */
  capitalGains: publicProcedure
    .input(z.object({ year: z.number().int().default(2026) }).optional())
    .query(async ({ ctx, input }) => {
      const year = input?.year ?? 2026;
      const holdingsData = await loadHoldings(ctx.db, ctx.userId);
      const overseasHoldings: OverseasUnrealizedHolding[] = holdingsData.positions
        .filter((p) => p.currency !== "KRW" || (p.market !== "KRX" && p.market !== "UPBIT"))
        .map((p) => ({
          symbol: p.symbol,
          name: p.name,
          quantity: p.quantity,
          avgBuyPrice: p.avgCost * p.avgFxRate,
          currentPrice: (p.lastPrice ?? p.avgCost) * p.avgFxRate,
          unrealizedPnl: p.pnlKrw ?? 0,
        }));

      const tradeRows = await ctx.db
        .select({
          id: trades.id,
          side: trades.side,
          quantity: trades.quantity,
          price: trades.price,
          fee: trades.fee,
          tax: trades.tax,
          fxRate: trades.fxRate,
          tradedAt: trades.tradedAt,
          symbol: instruments.symbol,
          name: instruments.name,
          currency: instruments.currency,
          market: instruments.market,
        })
        .from(trades)
        .innerJoin(instruments, eq(trades.instrumentId, instruments.id))
        .where(eq(trades.userId, ctx.userId))
        .orderBy(desc(trades.tradedAt));

      const overseasRealizedTrades: OverseasRealizedTrade[] = [];
      for (const t of tradeRows) {
        const isOverseas = t.currency !== "KRW" || (t.market !== "KRX" && t.market !== "UPBIT");
        if (isOverseas && t.side === "sell") {
          const fx = n(t.fxRate) || 1350;
          const qty = n(t.quantity);
          const sellPriceKrw = n(t.price) * fx;
          const matchingPos = holdingsData.positions.find((p) => p.symbol === t.symbol);
          const buyPriceKrw = matchingPos ? matchingPos.avgCost * matchingPos.avgFxRate : sellPriceKrw * 0.8;
          const feeAndTaxKrw = (n(t.fee) + n(t.tax)) * (t.currency === "USD" ? fx : 1);

          overseasRealizedTrades.push({
            id: t.id,
            symbol: t.symbol,
            name: t.name,
            tradedAt: t.tradedAt.toISOString(),
            quantity: qty,
            sellPrice: sellPriceKrw,
            buyPrice: buyPriceKrw,
            feeAndTax: feeAndTaxKrw,
          });
        }
      }

      const result = calculateOverseasCapitalGainsTax(overseasRealizedTrades, year);
      const harvesting = simulateTaxLossHarvesting(result, overseasHoldings);

      return {
        year,
        result,
        harvesting,
        realizedTrades: overseasRealizedTrades,
        unrealizedHoldings: overseasHoldings,
      };
    }),

  /**
   * 금융소득(배당+이자) 상세 목록 및 종합과세 진행률
   */
  financialIncome: publicProcedure
    .input(z.object({ year: z.number().int().default(2026) }).optional())
    .query(async ({ ctx, input }) => {
      const year = input?.year ?? 2026;
      const rows = await ctx.db
        .select({
          id: incomes.id,
          kind: incomes.kind,
          gross: incomes.gross,
          withheldTax: incomes.withheldTax,
          paidOn: incomes.paidOn,
          symbol: instruments.symbol,
          name: instruments.name,
          accountName: accounts.name,
        })
        .from(incomes)
        .leftJoin(instruments, eq(incomes.instrumentId, instruments.id))
        .leftJoin(accounts, eq(incomes.accountId, accounts.id))
        .where(eq(incomes.userId, ctx.userId))
        .orderBy(desc(incomes.paidOn));

      const incomeRecords: IncomeRecord[] = rows.map((r) => ({
        id: r.id,
        kind: r.kind === "interest" ? "interest" : "dividend",
        gross: n(r.gross),
        withheldTax: n(r.withheldTax),
        paidOn: String(r.paidOn),
        symbol: r.symbol,
        name: r.name,
      }));

      const summary = aggregateFinancialIncome(incomeRecords, year);

      return {
        year,
        summary,
        items: rows.map((r) => ({
          id: r.id,
          kind: r.kind,
          gross: n(r.gross),
          withheldTax: n(r.withheldTax),
          net: n(r.gross) - n(r.withheldTax),
          paidOn: String(r.paidOn),
          symbol: r.symbol ?? "-",
          name: r.name ?? (r.kind === "dividend" ? "배당금" : "이자수익"),
          accountName: r.accountName ?? "-",
        })),
      };
    }),

  /**
   * 연말정산 인터랙티브 시뮬레이션
   * 사용자가 입력 폼에서 숫자를 변경할 때마다 즉시 재계산
   */
  simulateYearEnd: publicProcedure
    .input(
      z.object({
        grossSalary: z.number().min(0),
        prepaidTax: z.number().min(0),
        prepaidInsurance: z.number().min(0),
        pensionSavingsContribution: z.number().min(0).default(0),
        irpContribution: z.number().min(0).default(0),
        housingSubscriptionDeposit: z.number().min(0).default(0),
        insurancePremiumPaid: z.number().min(0).default(0),
        creditCardSpent: z.number().min(0).default(0),
        debitCardCashSpent: z.number().min(0).default(0),
        dependentsCount: z.number().int().min(0).max(20).default(0),
      }),
    )
    .query(({ input }) => {
      return calculateYearEndTaxSettlement(input);
    }),

  /**
   * 새로운 배당/이자 수취내역 등록 mutation
   */
  addIncome: publicProcedure
    .input(
      z.object({
        accountId: z.string().uuid(),
        instrumentId: z.string().uuid().optional(),
        kind: z.enum(["dividend", "interest"]),
        gross: z.number().positive(),
        withheldTax: z.number().min(0).optional(),
        paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 세율 15.4% 기본 계산
      const withheld = input.withheldTax !== undefined ? input.withheldTax : Math.floor(input.gross * 0.154);

      const [created] = await ctx.db
        .insert(incomes)
        .values({
          userId: ctx.userId,
          accountId: input.accountId,
          instrumentId: input.instrumentId ?? null,
          kind: input.kind,
          gross: String(input.gross),
          withheldTax: String(withheld),
          paidOn: input.paidOn,
        })
        .returning();

      return created;
    }),

  /**
   * 국세청 홈택스 간소화 파일(JSON 또는 CSV) 파싱
   */
  parseHometaxUpload: publicProcedure
    .input(
      z.object({
        filename: z.string(),
        content: z.string(),
      }),
    )
    .mutation(({ input }) => {
      const isJson = input.filename.toLowerCase().endsWith(".json") || input.content.trim().startsWith("{");
      if (isJson) {
        return parseHometaxJson(input.content);
      }
      const rows = csvToRows(input.content);
      return parseHometaxRows(rows);
    }),

  /**
   * 연말정산 및 세무 정산 내역 XLSX 엑셀 파일 생성
   */
  exportXlsx: publicProcedure
    .input(
      z.object({
        year: z.number().int().default(2026),
        inputs: z
          .object({
            grossSalary: z.number(),
            prepaidTax: z.number(),
            prepaidInsurance: z.number(),
            pensionSavingsContribution: z.number().default(0),
            irpContribution: z.number().default(0),
            housingSubscriptionDeposit: z.number().default(0),
            insurancePremiumPaid: z.number().default(0),
            creditCardSpent: z.number().default(0),
            debitCardCashSpent: z.number().default(0),
            dependentsCount: z.number().default(0),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const year = input.year;

      // 1. 연말정산 결과
      const yeInput: YearEndTaxInput = input.inputs ?? {
        grossSalary: 60_000_000,
        prepaidTax: 3_600_000,
        prepaidInsurance: 5_400_000,
        pensionSavingsContribution: 3_000_000,
        irpContribution: 1_500_000,
        housingSubscriptionDeposit: 2_400_000,
        insurancePremiumPaid: 1_296_000,
        creditCardSpent: 12_000_000,
        debitCardCashSpent: 9_000_000,
        dependentsCount: 0,
      };
      const yearEndResult = calculateYearEndTaxSettlement(yeInput);

      // 2. 해외주식 양도세 및 체결
      const holdingsData = await loadHoldings(ctx.db, ctx.userId);
      const tradeRows = await ctx.db
        .select({
          id: trades.id,
          side: trades.side,
          quantity: trades.quantity,
          price: trades.price,
          fee: trades.fee,
          tax: trades.tax,
          fxRate: trades.fxRate,
          tradedAt: trades.tradedAt,
          symbol: instruments.symbol,
          name: instruments.name,
          currency: instruments.currency,
          market: instruments.market,
        })
        .from(trades)
        .innerJoin(instruments, eq(trades.instrumentId, instruments.id))
        .where(eq(trades.userId, ctx.userId))
        .orderBy(desc(trades.tradedAt));

      const overseasTrades: OverseasRealizedTrade[] = [];
      const capitalGainsTradesList: Array<{
        tradedAt: string;
        symbol: string;
        name: string;
        quantity: number;
        sellPrice: number;
        buyPrice: number;
        feeAndTax: number;
      }> = [];

      for (const t of tradeRows) {
        const isOverseas = t.currency !== "KRW" || (t.market !== "KRX" && t.market !== "UPBIT");
        if (isOverseas && t.side === "sell") {
          const fx = n(t.fxRate) || 1350;
          const qty = n(t.quantity);
          const sellPriceKrw = n(t.price) * fx;
          const matchingPos = holdingsData.positions.find((p) => p.symbol === t.symbol);
          const buyPriceKrw = matchingPos ? matchingPos.avgCost * matchingPos.avgFxRate : sellPriceKrw * 0.8;
          const feeAndTaxKrw = (n(t.fee) + n(t.tax)) * (t.currency === "USD" ? fx : 1);

          overseasTrades.push({
            id: t.id,
            symbol: t.symbol,
            name: t.name,
            tradedAt: t.tradedAt.toISOString(),
            quantity: qty,
            sellPrice: sellPriceKrw,
            buyPrice: buyPriceKrw,
            feeAndTax: feeAndTaxKrw,
          });

          capitalGainsTradesList.push({
            tradedAt: t.tradedAt.toISOString(),
            symbol: t.symbol,
            name: t.name,
            quantity: qty,
            sellPrice: sellPriceKrw,
            buyPrice: buyPriceKrw,
            feeAndTax: feeAndTaxKrw,
          });
        }
      }
      const capitalGains = calculateOverseasCapitalGainsTax(overseasTrades, year);

      // 3. 금융소득
      const incomeRows = await ctx.db
        .select({
          id: incomes.id,
          kind: incomes.kind,
          gross: incomes.gross,
          withheldTax: incomes.withheldTax,
          paidOn: incomes.paidOn,
          symbol: instruments.symbol,
          name: instruments.name,
        })
        .from(incomes)
        .leftJoin(instruments, eq(incomes.instrumentId, instruments.id))
        .where(eq(incomes.userId, ctx.userId))
        .orderBy(desc(incomes.paidOn));

      const incomeRecords: IncomeRecord[] = incomeRows.map((r) => ({
        id: r.id,
        kind: r.kind === "interest" ? "interest" : "dividend",
        gross: n(r.gross),
        withheldTax: n(r.withheldTax),
        paidOn: String(r.paidOn),
        symbol: r.symbol,
        name: r.name,
      }));
      const financialIncome = aggregateFinancialIncome(incomeRecords, year);

      const incomesList = incomeRows.map((r) => ({
        paidOn: String(r.paidOn),
        kind: r.kind,
        name: r.name ?? (r.kind === "dividend" ? "배당금" : "이자수익"),
        gross: n(r.gross),
        withheldTax: n(r.withheldTax),
        net: n(r.gross) - n(r.withheldTax),
      }));

      const xlsxBytes = buildTaxSettlementXlsx({
        year,
        userName: "사용자",
        yearEndResult,
        yearEndInput: yeInput,
        capitalGains,
        financialIncome,
        incomesList,
        capitalGainsTrades: capitalGainsTradesList,
      });

      const base64 = Buffer.from(xlsxBytes).toString("base64");
      const filename = `연말정산_정산명세서_${year}년.xlsx`;

      return {
        filename,
        base64,
        sizeBytes: xlsxBytes.byteLength,
      };
    }),
});
