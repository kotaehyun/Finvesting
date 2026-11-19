/**
 * EDGAR companyfacts 기간 고르기.
 * 한 10-Q는 같은 `end`로 3개월 값과 연초부터의 누적 값을 같이 준다.
 * 손익·현금흐름은 DART와 같이 누적(Q1 3개월, Q2 6개월, Q3 9개월, FY 12개월)만 쓴다.
 * 재무상태는 시점 값이라 기간 길이로 거르지 않는다.
 */

export type EdgarFlowStatement = "income" | "cashflow";
export type EdgarStatementKind = EdgarFlowStatement | "balance";

/** `start`~`end`가 3·6·9·12개월에 들어가면 그 개월. 애매하면 null. */
export function edgarSpanMonths(
  start: string | null | undefined,
  end: string | null | undefined,
): 3 | 6 | 9 | 12 | null {
  if (!start || !end) return null;
  const a = Date.parse(`${start.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${end.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return null;
  const days = Math.round((b - a) / 86_400_000);
  if (days >= 80 && days <= 110) return 3;
  if (days >= 160 && days <= 200) return 6;
  if (days >= 250 && days <= 290) return 9;
  if (days >= 340 && days <= 380) return 12;
  return null;
}

/** 손익·현금흐름이 쓸 누적 개월. 모르는 `fp`는 null. */
export function edgarCumulativeMonths(fp: string): 3 | 6 | 9 | 12 | null {
  switch (fp.trim().toUpperCase()) {
    case "FY": return 12;
    case "Q1": return 3;
    case "Q2": return 6;
    case "Q3": return 9;
    default: return null;
  }
}

/**
 * 같은 기간 후보 중 하나를 고른다.
 * 손익·현금흐름은 누적 개월이 맞는 것 중 `end`가 최신인 값. 없으면 null.
 * 재무상태는 `end`가 최신인 값.
 */
export function pickEdgarFact<T extends { start?: string | null; end: string; val: number }>(
  statement: EdgarStatementKind,
  fp: string,
  facts: readonly T[],
): T | null {
  if (!facts.length) return null;
  const sorted = [...facts].sort((a, b) => b.end.localeCompare(a.end));
  if (statement === "balance") return sorted[0] ?? null;
  const want = edgarCumulativeMonths(fp);
  if (want == null) return null;
  return sorted.find((f) => edgarSpanMonths(f.start, f.end) === want) ?? null;
}
