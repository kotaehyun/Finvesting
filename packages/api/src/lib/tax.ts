import { and, asc, eq, gte, lte } from "drizzle-orm";
import { genericCsvExporter } from "@finvesting/interop";
import {
  cashTxnsToLedgerRows,
  overseasStockCgtPreview,
  sumInvestmentIncomes,
  yearEndDeductionSlots,
  yearEndSettlement,
  sumPayTrends,
  type DataLoadStatus,
  type DeductionSlot,
  type InvestmentIncomeTotals,
  type OverseasCgtPreview,
  type TaxTrade,
} from "@finvesting/core";
import { accounts, incomes, instruments, trades, transactions, type Db } from "@finvesting/db";
import { loadPayrollYear } from "./pay-trends";

function num(v: string | number | null | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export type TaxYearBoard = {
  status: DataLoadStatus;
  year: number;
  cgt: OverseasCgtPreview;
  incomes: InvestmentIncomeTotals;
  deductions: DeductionSlot[];
  ledgerRowCount: number;
  note: string;
};

export async function loadTaxYear(db: Db, userId: string, year: number): Promise<TaxYearBoard> {
  const emptyCgt = overseasStockCgtPreview([], year);
  const emptyInc = sumInvestmentIncomes([], year);
  try {
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    const [tradeRows, incomeRows, txnRows, paySnaps] = await Promise.all([
      db.select({
        id: trades.id,
        instrumentId: trades.instrumentId,
        side: trades.side,
        quantity: trades.quantity,
        price: trades.price,
        fee: trades.fee,
        tax: trades.tax,
        fxRate: trades.fxRate,
        tradedAt: trades.tradedAt,
        symbol: instruments.symbol,
        market: instruments.market,
        currency: instruments.currency,
        assetClass: instruments.assetClass,
      }).from(trades)
        .innerJoin(instruments, eq(trades.instrumentId, instruments.id))
        .where(eq(trades.userId, userId))
        .orderBy(asc(trades.tradedAt), asc(trades.id)),
      db.select({
        kind: incomes.kind,
        gross: incomes.gross,
        withheldTax: incomes.withheldTax,
        paidOn: incomes.paidOn,
      }).from(incomes).where(eq(incomes.userId, userId)),
      db.select({
        date: transactions.date,
        amount: transactions.amount,
        direction: transactions.direction,
        category: transactions.category,
        merchant: transactions.merchant,
        memo: transactions.memo,
      }).from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(and(eq(transactions.userId, userId), gte(transactions.date, from), lte(transactions.date, to))),
      loadPayrollYear(db, userId, year),
    ]);

    const taxTrades: TaxTrade[] = tradeRows.map((t) => ({
      id: t.id,
      instrumentId: t.instrumentId,
      side: t.side,
      quantity: num(t.quantity),
      price: num(t.price),
      fee: num(t.fee),
      tax: num(t.tax),
      fxRate: t.fxRate != null ? num(t.fxRate) : undefined,
      tradedAt: t.tradedAt instanceof Date ? t.tradedAt.toISOString() : String(t.tradedAt),
      symbol: t.symbol,
      market: t.market,
      currency: t.currency,
      assetClass: t.assetClass,
    }));

    let cgt = emptyCgt;
    try {
      cgt = overseasStockCgtPreview(taxTrades, year);
    } catch {
      return {
        status: "unavailable",
        year,
        cgt: emptyCgt,
        incomes: emptyInc,
        deductions: yearEndDeductionSlots({ annualGross: 0, annualPension: 0 }),
        ledgerRowCount: 0,
        note: "체결 원장이 세금 미리보기에 맞지 않습니다. 매도 수량이 보유보다 많으면 계산하지 않습니다.",
      };
    }

    const yearPay = sumPayTrends(paySnaps);
    const settlement = yearEndSettlement(yearPay, 0);
    const deductions = yearEndDeductionSlots({
      annualGross: settlement.annualGross,
      annualPension: settlement.pensionDeduction,
    });
    const inc = sumInvestmentIncomes(incomeRows.map((r) => ({
      kind: r.kind,
      gross: num(r.gross),
      withheldTax: num(r.withheldTax),
      paidOn: r.paidOn,
    })), year);
    const ledgerRowCount = cashTxnsToLedgerRows(txnRows.map((r) => ({
      date: r.date,
      amount: num(r.amount),
      direction: r.direction,
      category: r.category,
      merchant: r.merchant,
      memo: r.memo,
    }))).length;

    const hasAny = cgt.sellCount > 0 || inc.rowCount > 0 || settlement.annualGross > 0 || ledgerRowCount > 0;
    return {
      status: hasAny ? "ok" : "empty",
      year,
      cgt,
      incomes: inc,
      deductions,
      ledgerRowCount,
      note: "세율·결정세액은 계산하지 않습니다. 더존·위하고 양식은 빈 템플릿이 오면 붙입니다.",
    };
  } catch {
    return {
      status: "unavailable",
      year,
      cgt: emptyCgt,
      incomes: emptyInc,
      deductions: yearEndDeductionSlots({ annualGross: 0, annualPension: 0 }),
      ledgerRowCount: 0,
      note: "DB 연결 불가. 고정 샘플은 쓰지 않습니다.",
    };
  }
}

export async function exportTaxLedgerCsv(db: Db, userId: string, year: number): Promise<{ filename: string; base64: string } | { status: "unavailable" | "empty"; note: string }> {
  try {
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    const txnRows = await db.select({
      date: transactions.date,
      amount: transactions.amount,
      direction: transactions.direction,
      category: transactions.category,
      merchant: transactions.merchant,
      memo: transactions.memo,
    }).from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(and(eq(transactions.userId, userId), gte(transactions.date, from), lte(transactions.date, to)));
    const rows = cashTxnsToLedgerRows(txnRows.map((r) => ({
      date: r.date,
      amount: num(r.amount),
      direction: r.direction,
      category: r.category,
      merchant: r.merchant,
      memo: r.memo,
    })));
    if (!rows.length) return { status: "empty", note: "해당 연 통장 거래가 없습니다." };
    const file = genericCsvExporter.export(rows);
    return {
      filename: `finvesting-ledger-${year}.csv`,
      base64: Buffer.from(file.data).toString("base64"),
    };
  } catch {
    return { status: "unavailable", note: "DB 연결 불가. 장부를 만들지 않습니다." };
  }
}
