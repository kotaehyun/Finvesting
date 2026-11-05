import { listMonths } from "./trends";

export type PayTrendPoint = {
  month: string;
  base: number;
  allowance: number;
  bonus: number;
  other: number;
  gross: number;
  tax: number;
  insurance: number;
  net: number;
};

export function emptyPayTrend(month: string): PayTrendPoint {
  return { month, base: 0, allowance: 0, bonus: 0, other: 0, gross: 0, tax: 0, insurance: 0, net: 0 };
}

export function sumPayTrends(points: PayTrendPoint[]): PayTrendPoint {
  return points.reduce((s, p) => ({
    month: "합계",
    base: s.base + p.base,
    allowance: s.allowance + p.allowance,
    bonus: s.bonus + p.bonus,
    other: s.other + p.other,
    gross: s.gross + p.gross,
    tax: s.tax + p.tax,
    insurance: s.insurance + p.insurance,
    net: s.net + p.net,
  }), emptyPayTrend("합계"));
}

/** 스냅샷이 있으면 그걸 쓰고, 없으면 세액만 수동값을 넣는다. 기준월은 current로 비어 있는 칸을 채운다. */
export function buildPayTrends(
  months: string[],
  snapshots: PayTrendPoint[],
  taxFallback: Array<{ month: string; amount: number }>,
  current?: PayTrendPoint | null,
): PayTrendPoint[] {
  const snap = new Map(snapshots.filter((s) => s.gross > 0 || s.tax > 0 || s.insurance > 0).map((s) => [s.month, s]));
  const tax = new Map(taxFallback.filter((t) => t.amount > 0).map((t) => [t.month, t.amount]));
  return months.map((month) => {
    const hit = snap.get(month);
    if (hit) return { ...hit, month };
    if (current && current.month === month && (current.gross > 0 || current.tax > 0)) {
      return { ...current, month };
    }
    const t = tax.get(month) ?? 0;
    return { ...emptyPayTrend(month), tax: t };
  });
}

export function payTrendMonths(through: string, count = 12) {
  return listMonths(through, count);
}
