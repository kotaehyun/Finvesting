import { describe, expect, it } from "vitest";
import {
  EI_STABILITY_BANDS,
  MIN_WAGE_2026,
  belowMinWage,
  CIVIL_PAY,
  CIVIL_PAY_GRADES,
  CIVIL_PAY_TABLE,
  civilPayAmount,
  civilPayCsv,
  employerEmploymentInsurance,
} from "./labor-cost";

describe("employerEmploymentInsurance", () => {
  it("300만에 150명 미만이면 실업 각 0.9%·안정 0.25%", () => {
    const e = employerEmploymentInsurance(3_000_000, "under150");
    expect(e.unemploymentEmployee).toBe(27_000);
    expect(e.unemploymentEmployer).toBe(27_000);
    expect(e.stabilityEmployer).toBe(7_500);
    expect(e.employerTotal).toBe(34_500);
    expect(e.employeeTotal).toBe(27_000);
  });

  it("1,000명 이상 안정은 0.85%", () => {
    const e = employerEmploymentInsurance(3_000_000, "large");
    expect(e.stabilityEmployer).toBe(25_500);
    expect(e.employerTotal).toBe(52_500);
  });

  it("시행령 네 구간만 둔다", () => {
    expect(EI_STABILITY_BANDS.map((b) => b.rateBp)).toEqual([25, 45, 65, 85]);
  });
});

describe("civilPayAmount", () => {
  it("별표 3 봉급월액이고 없는 칸은 0이 아니다", () => {
    expect(CIVIL_PAY.basis).toMatch(/제5조/);
    expect(CIVIL_PAY.basis).toMatch(/별표 3/);
    expect(CIVIL_PAY_GRADES.map((g) => g.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(CIVIL_PAY_TABLE).toHaveLength(32);
    expect(civilPayAmount(9, 1)).toBe(2_133_000);
    expect(civilPayAmount(5, 5)).toBe(3_390_900);
    expect(civilPayAmount(1, 23)).toBe(8_001_400);
    expect(civilPayAmount(1, 24)).toBeNull();
    expect(civilPayAmount(6, 32)).toBe(4_967_800);
    expect(civilPayAmount(7, 32)).toBeNull();
    expect(civilPayCsv()).toMatch(/별표 3/);
    expect(civilPayCsv()).toMatch(/2133000/);
    expect(civilPayCsv()).not.toMatch(/,0,/);
  });

  it("넣은 기본급만 최저임금과 비교한다", () => {
    expect(belowMinWage(0)).toBe(false);
    expect(belowMinWage(2_000_000)).toBe(true);
    expect(belowMinWage(2_156_880)).toBe(false);
    expect(MIN_WAGE_2026.hourly).toBe(10_320);
    expect(MIN_WAGE_2026.monthly209).toBe(2_156_880);
  });
});
