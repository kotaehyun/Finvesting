import { describe, expect, it } from "vitest";
import { yearEndSettlement, yearEndWageSlip, splitAnnualWithholdingTax } from "./year-end-pay";

const year = {
  month: "합계",
  base: 40_800_000,
  allowance: 2_400_000,
  bonus: 7_200_000,
  other: 0,
  gross: 50_400_000,
  tax: 3_300_000,
  insurance: 4_897_560,
  net: 42_202_440,
};

describe("yearEndWageSlip", () => {
  it("고용노동부 지급|공제 칸으로 연 합을 나눈다", () => {
    const s = yearEndWageSlip(year);
    expect(s.earnings.find((r) => r.name === "기본급")?.amount).toBe(40_800_000);
    expect(s.earnings.find((r) => r.name === "수당")?.group).toBe("monthly");
    expect(s.payTotal).toBe(50_400_000);
    expect(s.deductions.find((d) => d.name === "4대보험")?.amount).toBe(4_897_560);
    expect(s.net).toBe(42_202_440);
  });

  it("연 세금합을 국세 10 : 지방세 1로 나눈다", () => {
    expect(splitAnnualWithholdingTax(330_000)).toEqual({ nationalTax: 300_000, localTax: 30_000 });
  });
});

describe("yearEndSettlement", () => {
  it("총급여에서 근로소득공제·본인공제를 뺀다", () => {
    const y = yearEndSettlement(year, 2_394_000);
    expect(y.annualGross).toBe(50_400_000);
    expect(y.earnedIncomeDeduction).toBe(12_270_000);
    expect(y.personalExemption).toBe(1_500_000);
    expect(y.pensionDeduction).toBe(2_394_000);
    expect(y.prepaidTax).toBe(3_300_000);
  });
});
