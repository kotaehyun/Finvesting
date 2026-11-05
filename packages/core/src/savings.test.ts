import { describe, expect, it } from "vitest";
import { addMonths, installmentSimpleInterest, projectSavings } from "./savings";

describe("installmentSimpleInterest", () => {
  it("월 10만·연 3.6%·12개월 단리 이자는 23,400원", () => {
    const p = installmentSimpleInterest(100_000, 3.6, 12);
    expect(p.principal).toBe(1_200_000);
    expect(p.interest).toBe(23_400);
    expect(p.maturity).toBe(1_223_400);
  });
});

describe("projectSavings", () => {
  it("예금 단리는 원금×연리×개월/12", () => {
    const p = projectSavings({
      kind: "savings", compounding: "simple",
      monthlyAmount: 1_000_000, interestRate: 3.6, termMonths: 12,
    });
    expect(p.principal).toBe(1_000_000);
    expect(p.interest).toBe(36_000);
  });
});

describe("addMonths", () => {
  it("2026-01에서 11개월이면 2026-12", () => {
    expect(addMonths("2026-01", 11)).toBe("2026-12");
  });
});
