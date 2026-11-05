import { describe, expect, it } from "vitest";
import { citWorksheet, CORP_SOLE_DIFF, emptyCitInput } from "./corp-tax";

describe("citWorksheet", () => {
  it("과세표준에 세율을 곱하지 않는다", () => {
    const w = citWorksheet({ ...emptyCitInput(), taxableIncome: 100_000_000 });
    expect(w.corporateTax).toBe(0);
    expect(w.localTax).toBe(0);
  });

  it("넣은 법인세의 10%만 법인지방소득세", () => {
    const w = citWorksheet({ taxableIncome: 0, corporateTax: 1_000_000, interimPaid: 200_000 });
    expect(w.localTax).toBe(100_000);
    expect(w.total).toBe(1_100_000);
    expect(w.remaining).toBe(900_000);
  });

  it("개인과 법인을 나눈다", () => {
    expect(CORP_SOLE_DIFF.some((r) => r.corp.includes("간이과세 없음"))).toBe(true);
    expect(CORP_SOLE_DIFF.some((r) => r.corp.includes("3.3%"))).toBe(true);
  });
});
