import { describe, expect, it } from "vitest";
import {
  asStatementItems,
  formatAuditContext,
  formatStatementContext,
  goingConcernMentioned,
  statementRatios,
} from "./financial-statements";

describe("asStatementItems / ratios", () => {
  it("숫자만 남긴다", () => {
    expect(asStatementItems({ revenue: "100", skip: "x", operating_income: 10 })).toEqual({
      revenue: 100,
      operating_income: 10,
    });
  });

  it("매출·자산이 있을 때만 비율을 낸다", () => {
    const r = statementRatios({
      revenue: 100, operating_income: 20, net_income: 10,
      total_assets: 200, total_liabilities: 80, total_equity: 120, cfo: 15,
    });
    expect(r.opMargin).toBeCloseTo(0.2);
    expect(r.netMargin).toBeCloseTo(0.1);
    expect(r.debtToAssets).toBeCloseTo(0.4);
    expect(r.roe).toBeCloseTo(10 / 120);
    expect(r.cfoMinusNetIncome).toBe(5);
  });

  it("분모 0이면 그 비율은 빼다", () => {
    expect(statementRatios({ revenue: 0, operating_income: 1 })).toEqual({});
  });
});

describe("감사 컨텍스트", () => {
  it("계속기업 문구를 찾는다", () => {
    expect(goingConcernMentioned("계속기업 관련 중요한 불확실성")).toBe(true);
    expect(goingConcernMentioned("핵심감사사항: 수익인식")).toBe(false);
  });

  it("감사인·의견·계속기업 노트를 적는다", () => {
    const t = formatAuditContext({
      fiscalYear: 2025,
      auditor: "삼일회계법인",
      opinion: "적정",
      emphasis: "계속기업 관련 중요한 불확실성",
      keyAuditMatters: "수익인식",
      receiptNo: "1",
    });
    expect(t).toContain("삼일회계법인");
    expect(t).toContain("적정");
    expect(t).toContain("계속기업");
    expect(t).toContain("수익인식");
  });
});

describe("formatStatementContext", () => {
  it("없는 표와 감사는 비웠다고 한다", () => {
    const t = formatStatementContext({
      symbol: "005930", name: "삼성전자", fiscalYear: 2025, currency: "KRW",
      income: { revenue: 1_000_000 },
    });
    expect(t).toContain("매출액 1,000,000원");
    expect(t).toContain("감사의견");
    expect(t).toContain("없음");
    expect(t).not.toContain("재무상태표");
  });
});
