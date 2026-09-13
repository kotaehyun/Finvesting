import { describe, expect, it } from "vitest";
import { earnedIncomeDeduction, incomeTaxBaseFromMonthly, statutoryWithholding } from "./payroll";

describe("statutoryWithholding", () => {
  it("300만 원 세전에 2026 근로자 부담을 원 단위 절사한다", () => {
    const w = statutoryWithholding(3_000_000, 0);
    expect(w.nationalPension).toBe(142_500);
    expect(w.healthInsurance).toBe(107_850);
    expect(w.longTermCare).toBe(14_172);
    expect(w.employmentInsurance).toBe(27_000);
    expect(w.localTax).toBe(0);
  });

  it("국세가 있으면 지방세는 10%다", () => {
    const w = statutoryWithholding(3_000_000, 80_000);
    expect(w.nationalTax).toBe(80_000);
    expect(w.localTax).toBe(8_000);
  });

  it("국민연금은 상한을 넘지 않는다", () => {
    const w = statutoryWithholding(20_000_000, 0);
    expect(w.pensionBase).toBe(6_590_000);
    expect(w.nationalPension).toBe(313_025);
  });
});

describe("earnedIncomeDeduction / incomeTaxBaseFromMonthly", () => {
  it("연 5,040만(월 420만)은 4,500만 초과 구간이다", () => {
    // 1,200만 + (5,040만 − 4,500만) × 5%
    expect(earnedIncomeDeduction(50_400_000)).toBe(12_270_000);
  });

  it("과세표준은 총급여−근로소득공제−본인기본공제−국민연금 연액", () => {
    const w = statutoryWithholding(4_200_000, 250_000);
    const b = incomeTaxBaseFromMonthly(4_200_000, w.nationalPension);
    expect(b.annualGross).toBe(50_400_000);
    expect(b.earnedIncomeDeduction).toBe(12_270_000);
    expect(b.earnedIncome).toBe(38_130_000);
    expect(b.personalExemption).toBe(1_500_000);
    expect(b.pensionDeduction).toBe(w.nationalPension * 12);
    expect(b.taxableBase).toBe(38_130_000 - 1_500_000 - w.nationalPension * 12);
    expect(b.monthlyTaxableBase).toBe(Math.floor(b.taxableBase / 12));
  });
});
