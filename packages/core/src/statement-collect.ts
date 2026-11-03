// 재무제표 수집 기간. DART·EDGAR가 같은 연도 폭을 쓴다.
// 감사의견은 사업보고서(연간)만. 분기는 숫자만 모은다.

/** 포함 연도 수. 올해부터 거슬러 5개 사업연도(예: 2026이면 2022~2026). */
export const STATEMENT_COLLECT_YEAR_SPAN = 5;

/** OpenDART `reprt_code` → `fiscal_period`. 4분기는 사업보고서에 포함. */
export type DartReportCode = "11011" | "11012" | "11013" | "11014";

export type DartReportSpec = {
  code: DartReportCode;
  period: "FY" | "Q1" | "H1" | "Q3";
  /** 감사의견 API는 사업보고서만 */
  audit: boolean;
};

export const DART_REPORTS: readonly DartReportSpec[] = [
  { code: "11011", period: "FY", audit: true },
  { code: "11013", period: "Q1", audit: false },
  { code: "11012", period: "H1", audit: false },
  { code: "11014", period: "Q3", audit: false },
];

/** 수집 대상 사업연도. 최신→과거. `now`는 테스트용. */
export function statementCollectYears(now: Date = new Date()): number[] {
  const latest = now.getFullYear();
  const out: number[] = [];
  for (let i = 0; i < STATEMENT_COLLECT_YEAR_SPAN; i++) out.push(latest - i);
  return out;
}

/** EDGAR companyfacts에서 남길 최소 fy (이보다 작으면 skip). */
export function edgarMinFiscalYear(now: Date = new Date()): number {
  return now.getFullYear() - (STATEMENT_COLLECT_YEAR_SPAN - 1);
}

const PERIOD_RANK: Record<string, number> = {
  FY: 0,
  H1: 1,
  Q3: 2,
  Q2: 3,
  Q1: 4,
  Q4: 5,
};

/** 같은 연도·표에서 연간(FY)을 먼저. 없으면 반기·분기 순. */
export function preferStatementRow<T extends { statement: string; fiscalPeriod: string }>(
  rows: readonly T[],
  statement: string,
): T | undefined {
  const of = rows.filter((r) => r.statement === statement);
  if (!of.length) return undefined;
  return [...of].sort(
    (a, b) => (PERIOD_RANK[a.fiscalPeriod] ?? 99) - (PERIOD_RANK[b.fiscalPeriod] ?? 99),
  )[0];
}
