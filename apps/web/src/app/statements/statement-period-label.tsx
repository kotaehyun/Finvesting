import { statementPeriodLabel } from "@finvesting/core";

/** 연도 옆 기간. 예: 2026 · 3분기 누적, 2025 · 연간 */
export function StatementPeriodLabel({
  year,
  period,
}: {
  year: number;
  period?: string | null;
}) {
  const label = statementPeriodLabel(period);
  if (!label) return <>{year}</>;
  return <>{year} · {label}</>;
}
