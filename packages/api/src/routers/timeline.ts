import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import {
  accounts,
  incomes,
  instruments,
  payrollMonths,
  savingsContributions,
  savingsPlans,
  trades,
  transactions,
} from "@finvesting/db";
import {
  buildFinancialTimeline,
  filterTimelineEvents,
  calculateTimelineSummary,
  groupTimelineByDate,
  type TimelineInputs,
  type TimelineFilter,
} from "@finvesting/core";
import { router, publicProcedure } from "../trpc";

const timelineFilterSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  typeGroup: z.enum(["all", "cashflow", "trade", "income", "savings", "payroll"]).default("all"),
  keyword: z.string().optional(),
  limit: z.number().min(1).max(500).default(200),
}).optional();

// DB 미구동 또는 초기 빈 상태 시 데모/폴백 데이터
const FALLBACK_TIMELINE_INPUTS: TimelineInputs = {
  transactions: [
    {
      id: "demo-txn-1",
      date: "2026-09-25",
      time: "09:15:20",
      amount: "3850000",
      direction: "in",
      category: "salary",
      merchant: "(주)테크핀 급여",
      accountName: "신한 주거래 우대통장",
    },
    {
      id: "demo-txn-2",
      date: "2026-09-24",
      time: "19:40:12",
      amount: "68000",
      direction: "out",
      category: "food",
      merchant: "을지로 양꼬치",
      accountName: "현대카드 ZERO",
    },
    {
      id: "demo-txn-3",
      date: "2026-09-22",
      time: "12:15:30",
      amount: "6500",
      direction: "out",
      category: "food",
      merchant: "스타벅스 강남역점",
      accountName: "현대카드 ZERO",
    },
    {
      id: "demo-txn-4",
      date: "2026-09-20",
      time: "10:00:00",
      amount: "250000",
      direction: "out",
      category: "housing",
      merchant: "아파트 관리비 자동이체",
      accountName: "신한 주거래 우대통장",
    },
    {
      id: "demo-txn-5",
      date: "2026-09-15",
      time: "14:20:00",
      amount: "1000000",
      direction: "transfer",
      category: "transfer",
      memo: "키움증권 예수금 이체",
      accountName: "신한 주거래 우대통장",
    },
    {
      id: "demo-txn-6",
      date: "2026-08-25",
      time: "09:10:00",
      amount: "3850000",
      direction: "in",
      category: "salary",
      merchant: "(주)테크핀 급여",
      accountName: "신한 주거래 우대통장",
    },
  ],
  trades: [
    {
      id: "demo-trade-1",
      tradedAt: "2026-09-23T09:35:00.000Z",
      side: "buy",
      quantity: "15",
      price: "72000",
      symbol: "005930",
      name: "삼성전자",
      currency: "KRW",
      accountName: "키움증권 종합위탁",
      memo: "월 적립식 매수",
    },
    {
      id: "demo-trade-2",
      tradedAt: "2026-09-21T22:30:00.000Z",
      side: "buy",
      quantity: "3",
      price: "230.5",
      fxRate: "1348.5",
      symbol: "AAPL",
      name: "Apple Inc.",
      currency: "USD",
      accountName: "토스증권 해외주식",
      memo: "아이폰18 출시 기대",
    },
    {
      id: "demo-trade-3",
      tradedAt: "2026-08-20T10:15:00.000Z",
      side: "buy",
      quantity: "20",
      price: "71500",
      symbol: "005930",
      name: "삼성전자",
      currency: "KRW",
      accountName: "키움증권 종합위탁",
    },
  ],
  incomes: [
    {
      id: "demo-inc-1",
      paidOn: "2026-09-18",
      kind: "dividend",
      gross: "54150",
      withheldTax: "8330",
      symbol: "005930",
      name: "삼성전자",
      accountName: "키움증권 종합위탁",
    },
    {
      id: "demo-inc-2",
      paidOn: "2026-08-14",
      kind: "interest",
      gross: "12500",
      withheldTax: "1920",
      symbol: "CMA",
      name: "발행어음 CMA 이자",
      accountName: "키움증권 CMA",
    },
  ],
  savings: [
    {
      id: "demo-sav-1",
      month: "2026-09",
      amount: "500000",
      planName: "청년도약계좌",
      institution: "KB국민은행",
      memo: "정부 기여금 매칭 적금",
    },
    {
      id: "demo-sav-2",
      month: "2026-08",
      amount: "500000",
      planName: "청년도약계좌",
      institution: "KB국민은행",
    },
  ],
  payrolls: [
    {
      id: "demo-pay-1",
      month: "2026-09",
      grossAmount: "4500000",
      netAmount: "3850000",
      taxAmount: "380000",
      insuranceAmount: "270000",
      baseAmount: "3900000",
      bonusAmount: "300000",
    },
    {
      id: "demo-pay-2",
      month: "2026-08",
      grossAmount: "4500000",
      netAmount: "3850000",
      taxAmount: "380000",
      insuranceAmount: "270000",
      baseAmount: "3900000",
      bonusAmount: "300000",
    },
  ],
};

export const timelineRouter = router({
  list: publicProcedure
    .input(timelineFilterSchema)
    .query(async ({ ctx, input }) => {
      let inputs: TimelineInputs = {
        transactions: [],
        trades: [],
        incomes: [],
        savings: [],
        payrolls: [],
      };
      let isFallback = false;

      try {
        // 1. Transactions
        const txRows = await ctx.db
          .select({
            id: transactions.id,
            date: transactions.date,
            amount: transactions.amount,
            direction: transactions.direction,
            category: transactions.category,
            merchant: transactions.merchant,
            memo: transactions.memo,
            source: transactions.source,
            raw: transactions.raw,
            accountName: accounts.name,
          })
          .from(transactions)
          .leftJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(eq(transactions.userId, ctx.userId))
          .orderBy(desc(transactions.date))
          .limit(input?.limit ?? 200);

        // 2. Trades
        const tradeRows = await ctx.db
          .select({
            id: trades.id,
            tradedAt: trades.tradedAt,
            side: trades.side,
            quantity: trades.quantity,
            price: trades.price,
            fee: trades.fee,
            tax: trades.tax,
            fxRate: trades.fxRate,
            memo: trades.memo,
            symbol: instruments.symbol,
            name: instruments.name,
            market: instruments.market,
            currency: instruments.currency,
            accountName: accounts.name,
          })
          .from(trades)
          .innerJoin(instruments, eq(trades.instrumentId, instruments.id))
          .leftJoin(accounts, eq(trades.accountId, accounts.id))
          .where(eq(trades.userId, ctx.userId))
          .orderBy(desc(trades.tradedAt))
          .limit(input?.limit ?? 100);

        // 3. Incomes (배당/이자)
        const incomeRows = await ctx.db
          .select({
            id: incomes.id,
            paidOn: incomes.paidOn,
            kind: incomes.kind,
            gross: incomes.gross,
            withheldTax: incomes.withheldTax,
            symbol: instruments.symbol,
            name: instruments.name,
            accountName: accounts.name,
          })
          .from(incomes)
          .leftJoin(instruments, eq(incomes.instrumentId, instruments.id))
          .leftJoin(accounts, eq(incomes.accountId, accounts.id))
          .where(eq(incomes.userId, ctx.userId))
          .orderBy(desc(incomes.paidOn))
          .limit(100);

        // 4. Savings (적금 납입)
        const savingRows = await ctx.db
          .select({
            id: savingsContributions.id,
            month: savingsContributions.month,
            amount: savingsContributions.amount,
            memo: savingsContributions.memo,
            planName: savingsPlans.name,
            institution: savingsPlans.institution,
          })
          .from(savingsContributions)
          .innerJoin(savingsPlans, eq(savingsContributions.planId, savingsPlans.id))
          .where(eq(savingsContributions.userId, ctx.userId))
          .orderBy(desc(savingsContributions.month))
          .limit(100);

        // 5. Payroll
        const payrollRows = await ctx.db
          .select({
            id: payrollMonths.id,
            month: payrollMonths.month,
            grossAmount: payrollMonths.grossAmount,
            netAmount: payrollMonths.netAmount,
            taxAmount: payrollMonths.taxAmount,
            insuranceAmount: payrollMonths.insuranceAmount,
            baseAmount: payrollMonths.baseAmount,
            bonusAmount: payrollMonths.bonusAmount,
          })
          .from(payrollMonths)
          .where(eq(payrollMonths.userId, ctx.userId))
          .orderBy(desc(payrollMonths.month))
          .limit(24);

        const totalFound =
          txRows.length + tradeRows.length + incomeRows.length + savingRows.length + payrollRows.length;

        if (totalFound === 0) {
          inputs = FALLBACK_TIMELINE_INPUTS;
          isFallback = true;
        } else {
          inputs = {
            transactions: txRows,
            trades: tradeRows,
            incomes: incomeRows,
            savings: savingRows,
            payrolls: payrollRows,
          };
        }
      } catch {
        // DB 연결 실패 또는 미구동 시 데모 데이터 제공
        inputs = FALLBACK_TIMELINE_INPUTS;
        isFallback = true;
      }

      // 1. 전체 통합 타임라인 생성
      const allEvents = buildFinancialTimeline(inputs);

      // 2. 가용 가능한 월 목록 추출
      const monthSet = new Set<string>();
      for (const ev of allEvents) {
        if (ev.date && ev.date.length >= 7) {
          monthSet.add(ev.date.slice(0, 7));
        }
      }
      const availableMonths = Array.from(monthSet).sort((a, b) => b.localeCompare(a));

      // 3. 필터 적용
      const filter: TimelineFilter = {
        month: input?.month,
        typeGroup: input?.typeGroup,
        keyword: input?.keyword,
      };
      const filteredEvents = filterTimelineEvents(allEvents, filter);

      // 4. 요약 통계 및 일별 그룹핑
      const summary = calculateTimelineSummary(filteredEvents);
      const groups = groupTimelineByDate(filteredEvents);

      return {
        events: filteredEvents,
        groups,
        summary,
        availableMonths,
        activeMonth: input?.month || null,
        activeTypeGroup: input?.typeGroup || "all",
        isFallback,
      };
    }),
});
