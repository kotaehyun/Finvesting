import { describe, expect, it } from "vitest";
import { analyzeCoverage, formatCoverageContext, recommendedCoverages, sumCoverages } from "./insurance-coverage";

const empty = { death: 0, medical: false, cancer: 0, brain: 0, heart: 0, accident: 0, disability: 0 };

describe("recommendedCoverages", () => {
  it("사망은 연소득 5배, 실손은 1(가입 권장)", () => {
    const r = recommendedCoverages(50_400_000);
    expect(r.death).toBe(252_000_000);
    expect(r.medical).toBe(1);
    expect(r.cancer).toBe(50_400_000);
    expect(r.disability).toBe(151_200_000);
  });
});

describe("sumCoverages", () => {
  it("여러 증권 금액을 더하고 실손은 하나라도 있으면 1", () => {
    const s = sumCoverages([
      { ...empty, death: 100, cancer: 20, medical: false },
      { ...empty, death: 50, medical: true, brain: 10 },
    ]);
    expect(s.death).toBe(150);
    expect(s.cancer).toBe(20);
    expect(s.brain).toBe(10);
    expect(s.medical).toBe(1);
  });
});

describe("analyzeCoverage", () => {
  it("가입이 없으면 7축 모두 부족", () => {
    const r = analyzeCoverage([], 50_400_000, "hept");
    expect(r.axes).toHaveLength(7);
    expect(r.missing).toHaveLength(7);
    expect(r.weakest?.id).toBe("death");
  });

  it("실손만 있으면 그 축은 충족", () => {
    const r = analyzeCoverage([{ ...empty, medical: true }], 50_400_000, "hept");
    expect(r.axes.find((a) => a.id === "medical")!.missing).toBe(false);
    expect(r.axes.find((a) => a.id === "medical")!.ratio).toBe(1);
    expect(r.missing.some((a) => a.id === "medical")).toBe(false);
  });

  it("육각형은 뇌+심장을 중대질병으로 합친다", () => {
    const r = analyzeCoverage(
      [{ ...empty, brain: 50_000_000, heart: 50_000_000 }],
      50_400_000,
      "hex",
    );
    expect(r.axes).toHaveLength(6);
    const crit = r.axes.find((a) => a.id === "critical")!;
    expect(crit.label).toBe("중대질병");
    expect(crit.covered).toBe(100_000_000);
    expect(crit.recommended).toBe(100_000_000);
    expect(crit.missing).toBe(false);
    expect(r.axes.map((a) => a.id)).toEqual(["death", "medical", "cancer", "critical", "accident", "disability"]);
  });
});

describe("formatCoverageContext", () => {
  it("약한 축과 가입 증권을 한국어로 적는다", () => {
    const policies = [{
      ...empty, name: "검증 실손", kind: "health", monthlyPremium: 35_000,
      medical: true, cancer: 30_000_000,
    }];
    const analysis = analyzeCoverage(policies, 50_400_000, "hept");
    const text = formatCoverageContext(analysis, 50_400_000, policies);
    expect(text).toContain("50,400,000원");
    expect(text).toContain("검증 실손");
    expect(text).toContain("가장 약한 축: 사망");
    expect(text).toContain("실손: 가입");
    expect(text).toContain("암:");
    expect(text).not.toContain("삼성생명 종신");
  });
});
