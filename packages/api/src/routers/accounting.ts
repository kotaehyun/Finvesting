import { z } from "zod";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import {
  transactions,
  accounts,
  incomes,
  trades,
  instruments,
  payrollMonths,
} from "@finvesting/db";
import {
  buildJournalEntries,
  type RawAccountingTransaction,
  type RawAccountingInvestmentIncome,
  type RawAccountingTrade,
  type RawAccountingPayroll,
} from "@finvesting/core";
import {
  exportDouzoneSmartACsv,
  exportWehagoCsv,
  exportSemuSarangCsv,
  buildAccountingJournalXlsx,
  type ExportJournalRow,
} from "@finvesting/interop";
import { router, publicProcedure } from "../trpc";

function n(v: string | number | null | undefined): number {
  return v != null ? Number(v) : 0;
}

export const accountingRouter = router({
  /**
   * 복식부기 분개 미리보기 및 대차평형 검증
   */
  preview: publicProcedure
    .input(
      z
        .object({
          year: z.number().int().optional(),
          month: z.string().optional(), // "YYYY-MM" or "all"
          sourceType: z
            .enum(["all", "transaction", "dividend", "interest", "trade", "payroll"])
            .default("all"),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const year = input?.year ?? 2026;
      const month = input?.month;
      const filterSource = input?.sourceType ?? "all";

      let startDate: string | undefined;
      let endDate: string | undefined;

      if (month && month !== "all") {
        startDate = `${month}-01`;
        endDate = `${month}-31`;
      } else if (year) {
        startDate = `${year}-01-01`;
        endDate = `${year}-12-31`;
      }

      // 1. Transactions & Accounts
      const rawTxRows = await ctx.db
        .select({
          id: transactions.id,
          date: transactions.date,
          amount: transactions.amount,
          direction: transactions.direction,
          category: transactions.category,
          merchant: transactions.merchant,
          memo: transactions.memo,
          accountName: accounts.name,
          accountType: accounts.type,
          institution: accounts.institution,
        })
        .from(transactions)
        .leftJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(eq(transactions.userId, ctx.userId))
        .orderBy(desc(transactions.date));

      const rawTransactions: RawAccountingTransaction[] = rawTxRows.map((tx) => ({
        id: tx.id,
        date: tx.date,
        accountType: tx.accountType ?? "checking",
        accountName: tx.accountName ?? "계좌",
        institution: tx.institution ?? undefined,
        type: tx.direction === "in" ? "income" : tx.direction === "out" ? "expense" : "transfer",
        category: tx.category ?? undefined,
        merchant: tx.merchant ?? undefined,
        description: tx.memo ?? undefined,
        amount: n(tx.amount),
      }));

      // 2. Investment Incomes (배당/이자)
      const rawIncRows = await ctx.db
        .select({
          id: incomes.id,
          paidOn: incomes.paidOn,
          kind: incomes.kind,
          gross: incomes.gross,
          withheldTax: incomes.withheldTax,
          symbol: instruments.symbol,
          name: instruments.name,
          accountName: accounts.name,
          accountType: accounts.type,
          institution: accounts.institution,
        })
        .from(incomes)
        .leftJoin(instruments, eq(incomes.instrumentId, instruments.id))
        .leftJoin(accounts, eq(incomes.accountId, accounts.id))
        .where(eq(incomes.userId, ctx.userId))
        .orderBy(desc(incomes.paidOn));

      const rawInvestmentIncomes: RawAccountingInvestmentIncome[] = rawIncRows.map((inc) => {
        const gross = n(inc.gross);
        const tax = n(inc.withheldTax);
        return {
          id: inc.id,
          date: inc.paidOn,
          ticker: inc.symbol ?? undefined,
          name: inc.name ?? undefined,
          incomeType: inc.kind === "dividend" ? "dividend" : "interest",
          accountName: inc.accountName ?? undefined,
          accountType: inc.accountType ?? undefined,
          institution: inc.institution ?? undefined,
          grossAmount: gross,
          netAmount: gross - tax,
          taxAmount: tax,
        };
      });

      // 3. Trades (주식 매매 체결)
      const rawTradeRows = await ctx.db
        .select({
          id: trades.id,
          tradedAt: trades.tradedAt,
          side: trades.side,
          quantity: trades.quantity,
          price: trades.price,
          fee: trades.fee,
          tax: trades.tax,
          fxRate: trades.fxRate,
          symbol: instruments.symbol,
          name: instruments.name,
          accountName: accounts.name,
          accountType: accounts.type,
          institution: accounts.institution,
        })
        .from(trades)
        .leftJoin(instruments, eq(trades.instrumentId, instruments.id))
        .leftJoin(accounts, eq(trades.accountId, accounts.id))
        .where(eq(trades.userId, ctx.userId))
        .orderBy(desc(trades.tradedAt));

      const rawTrades: RawAccountingTrade[] = rawTradeRows.map((tr) => {
        const qty = n(tr.quantity);
        const price = n(tr.price);
        const fx = n(tr.fxRate) || 1;
        const total = qty * price * fx;
        const dateStr = tr.tradedAt ? new Date(tr.tradedAt).toISOString().slice(0, 10) : "2026-01-01";
        return {
          id: tr.id,
          date: dateStr,
          ticker: tr.symbol ?? "UNKNOWN",
          name: tr.name ?? tr.symbol ?? undefined,
          side: tr.side,
          accountName: tr.accountName ?? undefined,
          accountType: tr.accountType ?? undefined,
          institution: tr.institution ?? undefined,
          quantity: qty,
          price,
          totalAmount: total,
          realizedPnl: tr.side === "sell" ? Math.round(total * 0.15) : undefined, // 추정 또는 원가 기준
        };
      });

      // 4. Payrolls (급여대장) & 입금 은행
      const checkingAccounts = await ctx.db
        .select({ name: accounts.name, institution: accounts.institution })
        .from(accounts)
        .where(and(eq(accounts.userId, ctx.userId), eq(accounts.type, "checking")))
        .limit(1);
      const defaultBank = checkingAccounts[0]?.institution || checkingAccounts[0]?.name || "KB국민은행";

      const rawPayrollRows = await ctx.db
        .select()
        .from(payrollMonths)
        .where(eq(payrollMonths.userId, ctx.userId))
        .orderBy(desc(payrollMonths.month));

      const rawPayrolls: RawAccountingPayroll[] = rawPayrollRows.map((pr) => ({
        id: pr.id,
        date: `${pr.month}-25`,
        grossIncome: n(pr.grossAmount),
        netIncome: n(pr.netAmount),
        healthInsurance: n(pr.insuranceAmount),
        incomeTax: n(pr.taxAmount),
        receivingBank: defaultBank,
        receivingAccountName: checkingAccounts[0]?.name ?? undefined,
      }));

      // 복식부기 분개 생성
      const result = buildJournalEntries({
        transactions: filterSource === "all" || filterSource === "transaction" ? rawTransactions : [],
        investmentIncomes:
          filterSource === "all" || filterSource === "dividend" || filterSource === "interest"
            ? rawInvestmentIncomes
            : [],
        trades: filterSource === "all" || filterSource === "trade" ? rawTrades : [],
        payrolls: filterSource === "all" || filterSource === "payroll" ? rawPayrolls : [],
        startDate,
        endDate,
      });

      return result;
    }),

  /**
   * 전표 파일 내보내기 (더존 Smart A / 위하고 / 세무사랑 / XLSX 워크북)
   */
  exportFile: publicProcedure
    .input(
      z.object({
        year: z.number().int().default(2026),
        month: z.string().optional(), // "YYYY-MM" or "all"
        format: z.enum(["douzone", "wehago", "semusarang", "xlsx"]).default("xlsx"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const year = input.year;
      const month = input.month;

      let startDate: string | undefined;
      let endDate: string | undefined;

      if (month && month !== "all") {
        startDate = `${month}-01`;
        endDate = `${month}-31`;
      } else if (year) {
        startDate = `${year}-01-01`;
        endDate = `${year}-12-31`;
      }

      // 전체 원장 수집
      const rawTxRows = await ctx.db
        .select({
          id: transactions.id,
          date: transactions.date,
          amount: transactions.amount,
          direction: transactions.direction,
          category: transactions.category,
          merchant: transactions.merchant,
          memo: transactions.memo,
          accountName: accounts.name,
          accountType: accounts.type,
          institution: accounts.institution,
        })
        .from(transactions)
        .leftJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(eq(transactions.userId, ctx.userId));

      const rawTransactions: RawAccountingTransaction[] = rawTxRows.map((tx) => ({
        id: tx.id,
        date: tx.date,
        accountType: tx.accountType ?? "checking",
        accountName: tx.accountName ?? "계좌",
        institution: tx.institution ?? undefined,
        type: tx.direction === "in" ? "income" : tx.direction === "out" ? "expense" : "transfer",
        category: tx.category ?? undefined,
        merchant: tx.merchant ?? undefined,
        description: tx.memo ?? undefined,
        amount: n(tx.amount),
      }));

      const rawIncRows = await ctx.db
        .select({
          id: incomes.id,
          paidOn: incomes.paidOn,
          kind: incomes.kind,
          gross: incomes.gross,
          withheldTax: incomes.withheldTax,
          symbol: instruments.symbol,
          name: instruments.name,
          accountName: accounts.name,
          accountType: accounts.type,
          institution: accounts.institution,
        })
        .from(incomes)
        .leftJoin(instruments, eq(incomes.instrumentId, instruments.id))
        .leftJoin(accounts, eq(incomes.accountId, accounts.id))
        .where(eq(incomes.userId, ctx.userId));

      const rawInvestmentIncomes: RawAccountingInvestmentIncome[] = rawIncRows.map((inc) => {
        const gross = n(inc.gross);
        const tax = n(inc.withheldTax);
        return {
          id: inc.id,
          date: inc.paidOn,
          ticker: inc.symbol ?? undefined,
          name: inc.name ?? undefined,
          incomeType: inc.kind === "dividend" ? "dividend" : "interest",
          accountName: inc.accountName ?? undefined,
          accountType: inc.accountType ?? undefined,
          institution: inc.institution ?? undefined,
          grossAmount: gross,
          netAmount: gross - tax,
          taxAmount: tax,
        };
      });

      const rawTradeRows = await ctx.db
        .select({
          id: trades.id,
          tradedAt: trades.tradedAt,
          side: trades.side,
          quantity: trades.quantity,
          price: trades.price,
          fxRate: trades.fxRate,
          symbol: instruments.symbol,
          name: instruments.name,
          accountName: accounts.name,
          accountType: accounts.type,
          institution: accounts.institution,
        })
        .from(trades)
        .leftJoin(instruments, eq(trades.instrumentId, instruments.id))
        .leftJoin(accounts, eq(trades.accountId, accounts.id))
        .where(eq(trades.userId, ctx.userId));

      const rawTrades: RawAccountingTrade[] = rawTradeRows.map((tr) => {
        const qty = n(tr.quantity);
        const price = n(tr.price);
        const fx = n(tr.fxRate) || 1;
        const total = qty * price * fx;
        const dateStr = tr.tradedAt ? new Date(tr.tradedAt).toISOString().slice(0, 10) : "2026-01-01";
        return {
          id: tr.id,
          date: dateStr,
          ticker: tr.symbol ?? "UNKNOWN",
          name: tr.name ?? tr.symbol ?? undefined,
          side: tr.side,
          accountName: tr.accountName ?? undefined,
          accountType: tr.accountType ?? undefined,
          institution: tr.institution ?? undefined,
          quantity: qty,
          price,
          totalAmount: total,
          realizedPnl: tr.side === "sell" ? Math.round(total * 0.15) : undefined,
        };
      });

      const checkingAccountsExport = await ctx.db
        .select({ name: accounts.name, institution: accounts.institution })
        .from(accounts)
        .where(and(eq(accounts.userId, ctx.userId), eq(accounts.type, "checking")))
        .limit(1);
      const defaultBankExport =
        checkingAccountsExport[0]?.institution || checkingAccountsExport[0]?.name || "KB국민은행";

      const rawPayrollRows = await ctx.db
        .select()
        .from(payrollMonths)
        .where(eq(payrollMonths.userId, ctx.userId));

      const rawPayrolls: RawAccountingPayroll[] = rawPayrollRows.map((pr) => ({
        id: pr.id,
        date: `${pr.month}-25`,
        grossIncome: n(pr.grossAmount),
        netIncome: n(pr.netAmount),
        healthInsurance: n(pr.insuranceAmount),
        incomeTax: n(pr.taxAmount),
        receivingBank: defaultBankExport,
        receivingAccountName: checkingAccountsExport[0]?.name ?? undefined,
      }));

      const journal = buildJournalEntries({
        transactions: rawTransactions,
        investmentIncomes: rawInvestmentIncomes,
        trades: rawTrades,
        payrolls: rawPayrolls,
        startDate,
        endDate,
      });

      // Flatten lines for export
      const exportRows: ExportJournalRow[] = journal.entries.flatMap((g) =>
        g.lines.map((l) => ({
          voucherNo: l.voucherNo,
          lineNo: l.lineNo,
          date: l.date,
          side: l.side,
          accountCode: l.accountCode,
          accountName: l.accountName,
          counterparty: l.counterparty,
          amount: l.amount,
          memo: l.memo,
        }))
      );

      const periodLabel = month && month !== "all" ? month : `${year}년`;

      if (input.format === "douzone") {
        const csv = exportDouzoneSmartACsv(exportRows);
        return {
          filename: `Finvesting_${periodLabel}_더존_SmartA_일반전표.csv`,
          content: csv,
          mimeType: "text/csv;charset=utf-8",
          isBase64: false,
        };
      }

      if (input.format === "wehago") {
        const csv = exportWehagoCsv(exportRows);
        return {
          filename: `Finvesting_${periodLabel}_위하고_WEHAGO_전표.csv`,
          content: csv,
          mimeType: "text/csv;charset=utf-8",
          isBase64: false,
        };
      }

      if (input.format === "semusarang") {
        const csv = exportSemuSarangCsv(exportRows);
        return {
          filename: `Finvesting_${periodLabel}_세무사랑Pro_일반전표.csv`,
          content: csv,
          mimeType: "text/csv;charset=utf-8",
          isBase64: false,
        };
      }

      // Default: XLSX 4-sheet workbook
      const xlsxBuffer = buildAccountingJournalXlsx(exportRows);
      const base64 = Buffer.from(xlsxBuffer).toString("base64");
      return {
        filename: `Finvesting_${periodLabel}_회계전표_통합워크북.xlsx`,
        content: base64,
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        isBase64: true,
      };
    }),
});
