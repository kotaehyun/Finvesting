import { describe, expect, it } from "vitest";
import {
  DART_REPORTS,
  edgarMinFiscalYear,
  preferStatementRow,
  statementCollectYears,
  STATEMENT_COLLECT_YEAR_SPAN,
} from "./statement-collect";

describe("수집 연도", () => {
  it("올해부터 5개 사업연도", () => {
    expect(STATEMENT_COLLECT_YEAR_SPAN).toBe(5);
    expect(statementCollectYears(new Date("2026-11-03T00:00:00Z"))).toEqual([
      2026, 2025, 2024, 2023, 2022,
    ]);
    expect(edgarMinFiscalYear(new Date("2026-11-03T00:00:00Z"))).toBe(2022);
  });
});

describe("DART 보고서", () => {
  it("사업보고서만 감사, 분기는 Q1·H1·Q3", () => {
    expect(DART_REPORTS.filter((r) => r.audit).map((r) => r.code)).toEqual(["11011"]);
    expect(DART_REPORTS.map((r) => r.period)).toEqual(["FY", "Q1", "H1", "Q3"]);
  });
});

describe("기간 우선", () => {
  it("같은 표에서 FY를 Q보다 먼저", () => {
    const rows = [
      { statement: "income", fiscalPeriod: "Q1", items: 1 },
      { statement: "income", fiscalPeriod: "FY", items: 2 },
      { statement: "balance", fiscalPeriod: "H1", items: 3 },
    ];
    expect(preferStatementRow(rows, "income")?.fiscalPeriod).toBe("FY");
    expect(preferStatementRow(rows, "balance")?.fiscalPeriod).toBe("H1");
    expect(preferStatementRow(rows, "cashflow")).toBeUndefined();
  });
});
