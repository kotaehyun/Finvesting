import { mergeTaxTrend } from "./statement";

export type TrendTxn = {
  date: string; // YYYY-MM-DD
  amount: number;
  direction: string;
  category: string;
};

export type CashflowTrendPoint = {
  month: string;
  tax: number;
  spend: number;
  save: number;
  invest: number;
};

/** 기준월부터 거꾸로 count개월. 예: 2026-09, 3 → 2026-07, 2026-08, 2026-09 */
export function listMonths(through: string, count: number): string[] {
  const [y0, m0] = through.split("-").map(Number);
  if (!y0 || !m0 || count < 1) return [];
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(y0, m0 - 1 - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

/**
 * 월별 세액·소비·저축·투자.
 * 세액은 거래 `income_tax`와 수동 입력을 합친다(같은 달은 수동 우선).
 * 소비는 이체·저축·투자·근로소득세를 뺀 출금.
 */
export function buildCashflowTrends(
  txns: TrendTxn[],
  taxManual: Array<{ month: string; amount: number }>,
  months: string[],
): CashflowTrendPoint[] {
  const spend = new Map<string, number>();
  const save = new Map<string, number>();
  const invest = new Map<string, number>();
  const taxActual = new Map<string, number>();

  for (const t of txns) {
    const month = String(t.date).slice(0, 7);
    const amt = Number(t.amount) || 0;
    if (!(amt > 0) || t.direction !== "out") continue;
    if (t.category === "transfer") continue;
    if (t.category === "income_tax") {
      taxActual.set(month, (taxActual.get(month) ?? 0) + amt);
      continue;
    }
    if (t.category === "saving") {
      save.set(month, (save.get(month) ?? 0) + amt);
      continue;
    }
    if (t.category === "investment") {
      invest.set(month, (invest.get(month) ?? 0) + amt);
      continue;
    }
    spend.set(month, (spend.get(month) ?? 0) + amt);
  }

  const tax = new Map(mergeTaxTrend(
    taxManual,
    [...taxActual.entries()].map(([month, amount]) => ({ month, amount })),
  ).map((p) => [p.month, p.amount]));

  return months.map((month) => ({
    month,
    tax: tax.get(month) ?? 0,
    spend: spend.get(month) ?? 0,
    save: save.get(month) ?? 0,
    invest: invest.get(month) ?? 0,
  }));
}
