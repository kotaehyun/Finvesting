import { describe, expect, it } from "vitest";
import { monthlyBudgetGuide } from "./allocation.js";

const base = {
  monthlyNetIncome: 1_000_000,
  monthlyFixedCost: 400_000,
  liquidAssets: 10_000_000,
  investedAssets: 5_000_000,
  emergencyFundMonths: 6,
  riskTolerance: "moderate" as const,
};

describe("monthlyBudgetGuide", () => {
  it("비상금이 충분하면 50/30/20에서 출발한다", () => {
    const g = monthlyBudgetGuide(base);
    expect(g.needs).toBe(500_000);
    expect(g.wants).toBe(300_000);
    expect(g.saveAndInvest).toBe(200_000);
    expect(g.emergencyFundGap).toBe(0);
  });

  it("비상금이 부족하면 예적금 비중을 높인다", () => {
    const g = monthlyBudgetGuide({ ...base, liquidAssets: 0 });
    expect(g.emergencyFundGap).toBe(2_400_000);
    expect(g.notes.length).toBeGreaterThan(0);
    expect(g.ofWhichDeposit).toBeGreaterThan(g.ofWhichInvest);
  });
});
