// 본인 세무 미리보기. 세율·결정세액은 간이세액표·홈택스가 없어 계산하지 않는다.
// 해외주식 양도: 로드맵 3단계의 연 250만원 기본공제만. 국내 주식·코인 양도는 넣지 않는다.
// 배당·이자는 원장 금액만 합친다. 원천징수 세율을 추정하지 않는다.

import { isKoreanSymbol } from "./yahoo-fundamentals";
import type { TradeLike } from "./portfolio";
import { yearEndDeductionFields } from "./year-end-deductions";

export const OVERSEAS_STOCK_CGT_DEDUCTION_KRW = 2_500_000;

export type DataSlotStatus = "collected" | "empty" | "unavailable";

export type TaxTrade = TradeLike & {
  id: string;
  tradedAt: string;
  market: string;
  symbol: string;
  currency: string;
  assetClass: string;
};

export type InvestmentIncomeRow = {
  kind: string;
  gross: number;
  withheldTax: number;
  paidOn: string;
};

export function seoulCalendarYear(isoOrDate: string): number {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return 0;
  return Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric" }).format(d));
}

export function isOverseasEquity(input: {
  market: string;
  symbol: string;
  assetClass: string;
}): boolean {
  if (input.assetClass !== "stock" && input.assetClass !== "etf") return false;
  if (isKoreanSymbol(input.symbol)) return false;
  const m = input.market.trim().toUpperCase();
  if (m === "KRX" || m === "KOSDAQ" || m === "UPBIT") return false;
  return true;
}

type LotPos = {
  quantity: number;
  avgCost: number;
  avgFxRate: number;
};

function emptyLot(): LotPos {
  return { quantity: 0, avgCost: 0, avgFxRate: 1 };
}

/** 한 체결의 원화 실현손익. 평단법은 portfolio와 같다. */
export function applyTradeLot(p: LotPos, t: TradeLike): { next: LotPos; sellPnlKrw: number } {
  const next = { ...p };
  const fee = (t.fee ?? 0) + (t.tax ?? 0);
  const fx = t.fxRate ?? 1;
  if (t.side === "buy") {
    const prevCost = next.avgCost * next.quantity;
    const addCost = t.price * t.quantity + fee;
    const newQty = next.quantity + t.quantity;
    next.avgFxRate = newQty > 0 ? (prevCost * next.avgFxRate + addCost * fx) / (prevCost + addCost || 1) : 1;
    next.avgCost = newQty > 0 ? (prevCost + addCost) / newQty : 0;
    next.quantity = newQty;
    return { next, sellPnlKrw: 0 };
  }
  if (t.quantity > next.quantity) {
    throw new Error(`매도 수량이 보유(${next.quantity})보다 많습니다`);
  }
  const qty = t.quantity;
  const sellPnlKrw = (t.price * qty - fee) * fx - next.avgCost * qty * next.avgFxRate;
  next.quantity -= qty;
  if (next.quantity === 0) {
    next.avgCost = 0;
    next.avgFxRate = 1;
  }
  return { next, sellPnlKrw };
}

export type OverseasCgtPreview = {
  year: number;
  sellCount: number;
  realizedKrw: number;
  deductionKrw: number;
  deductionAppliedKrw: number;
  taxableKrw: number;
};

export function overseasStockCgtPreview(trades: TaxTrade[], year: number): OverseasCgtPreview {
  const ordered = [...trades].sort((a, b) => {
    const t = a.tradedAt.localeCompare(b.tradedAt);
    return t !== 0 ? t : a.id.localeCompare(b.id);
  });
  const lots = new Map<string, LotPos>();
  let realizedKrw = 0;
  let sellCount = 0;
  for (const t of ordered) {
    const prev = lots.get(t.instrumentId) ?? emptyLot();
    const { next, sellPnlKrw } = applyTradeLot(prev, t);
    lots.set(t.instrumentId, next);
    if (t.side !== "sell") continue;
    if (seoulCalendarYear(t.tradedAt) !== year) continue;
    if (!isOverseasEquity(t)) continue;
    realizedKrw += sellPnlKrw;
    sellCount += 1;
  }
  const gain = Math.max(0, realizedKrw);
  const deductionAppliedKrw = Math.min(OVERSEAS_STOCK_CGT_DEDUCTION_KRW, gain);
  const taxableKrw = Math.max(0, Math.round(gain - OVERSEAS_STOCK_CGT_DEDUCTION_KRW));
  return {
    year,
    sellCount,
    realizedKrw,
    deductionKrw: OVERSEAS_STOCK_CGT_DEDUCTION_KRW,
    deductionAppliedKrw,
    taxableKrw: realizedKrw > 0 ? taxableKrw : 0,
  };
}

export type InvestmentIncomeTotals = {
  year: number;
  dividendGross: number;
  dividendWithheld: number;
  interestGross: number;
  interestWithheld: number;
  rowCount: number;
};

export function sumInvestmentIncomes(rows: InvestmentIncomeRow[], year: number): InvestmentIncomeTotals {
  let dividendGross = 0;
  let dividendWithheld = 0;
  let interestGross = 0;
  let interestWithheld = 0;
  let rowCount = 0;
  for (const r of rows) {
    if (seoulCalendarYear(`${r.paidOn}T12:00:00+09:00`) !== year) continue;
    rowCount += 1;
    const gross = Number(r.gross) || 0;
    const withheld = Number(r.withheldTax) || 0;
    if (r.kind === "dividend") {
      dividendGross += gross;
      dividendWithheld += withheld;
    } else if (r.kind === "interest") {
      interestGross += gross;
      interestWithheld += withheld;
    }
  }
  return { year, dividendGross, dividendWithheld, interestGross, interestWithheld, rowCount };
}

export type DeductionSlot = {
  id: string;
  label: string;
  amount: number | null;
  status: DataSlotStatus;
  note: string;
};

export function yearEndDeductionSlots(input: {
  annualGross: number;
  annualPension: number;
}): DeductionSlot[] {
  return yearEndDeductionFields(input).map((f) => ({
    id: f.id,
    label: f.label,
    amount: f.amount,
    status: f.status,
    note: f.note,
  }));
}

export const TXN_ACCOUNT_LABELS: Record<string, string> = {
  salary: "급여",
  bonus: "상여",
  interest: "이자",
  dividend: "배당",
  other_income: "기타수입",
  housing: "주거",
  utilities: "공과금",
  phone: "휴대폰",
  insurance: "보험",
  health_insurance: "건보료",
  income_tax: "근로소득세",
  subscription: "구독",
  food: "식비",
  transport: "교통",
  shopping: "쇼핑",
  leisure: "여가",
  health: "건강",
  education: "교육",
  misc: "기타",
  saving: "저축",
  investment: "투자",
  loan_repayment: "대출상환",
  uncategorized: "미분류",
  transfer: "이체",
};

export type CashTxnForLedger = {
  date: string;
  amount: number;
  direction: "in" | "out" | "transfer";
  category: string;
  merchant?: string | null;
  memo?: string | null;
};

/** 차변=입금, 대변=출금. 더존 양식이 아니라 세무사 전달용 범용 칸. */
export function cashTxnsToLedgerRows(rows: CashTxnForLedger[]): Array<{
  date: string;
  account: string;
  debit: number;
  credit: number;
  description: string;
  counterparty?: string;
  memo?: string;
}> {
  return rows.map((r) => {
    const amount = Math.max(0, Number(r.amount) || 0);
    const inDir = r.direction === "in";
    return {
      date: r.date,
      account: TXN_ACCOUNT_LABELS[r.category] ?? r.category,
      debit: inDir ? amount : 0,
      credit: inDir ? 0 : amount,
      description: r.memo?.trim() || r.merchant?.trim() || TXN_ACCOUNT_LABELS[r.category] || r.category,
      counterparty: r.merchant?.trim() || undefined,
      memo: r.direction === "transfer" ? "이체" : undefined,
    };
  });
}
