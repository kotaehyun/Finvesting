import { describe, expect, it } from "vitest";
import {
  DART_REPORTS,
  edgarMinFiscalYear,
  alignStatementRows,
  defaultStatementYear,
  preferStatementRow,
  statementCollectYears,
  statementPeriodLabel,
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

  it("FY 다음으로 3분기가 반기보다 앞이다", () => {
    const rows = [
      { statement: "income", fiscalPeriod: "H1" },
      { statement: "income", fiscalPeriod: "Q3" },
      { statement: "income", fiscalPeriod: "Q1" },
    ];
    expect(preferStatementRow(rows, "income")?.fiscalPeriod).toBe("Q3");
    expect(statementPeriodLabel("Q3")).toBe("3분기 누적");
    expect(statementPeriodLabel("FY")).toBe("연간");
  });

  it("기본 연도는 FY가 있는 최신 연도이고, 고르면 그 연도", () => {
    const rows = [
      { fiscalYear: 2026, fiscalPeriod: "Q3" },
      { fiscalYear: 2025, fiscalPeriod: "FY" },
      { fiscalYear: 2025, fiscalPeriod: "Q3" },
    ];
    expect(defaultStatementYear(rows)).toBe(2025);
    expect(defaultStatementYear(rows, 2026)).toBe(2026);
    expect(defaultStatementYear([])).toBeUndefined();
  });

  it("재무상태·현금흐름은 손익 기간이 아니면 비운다", () => {
    const rows = [
      { statement: "income", fiscalPeriod: "Q3" },
      { statement: "balance", fiscalPeriod: "FY" },
      { statement: "balance", fiscalPeriod: "Q3" },
      { statement: "cashflow", fiscalPeriod: "H1" },
    ];
    const aligned = alignStatementRows(rows);
    expect(aligned.period).toBe("Q3");
    expect(aligned.balance?.fiscalPeriod).toBe("Q3");
    expect(aligned.cashflow).toBeUndefined();
  });
});
