import { describe, expect, it } from "vitest";
import { summarizeCashflow } from "./cashflow";

describe("summarizeCashflow", () => {
  it("수입·고정비·변동비·저축을 나눈다. 이체는 소비에 넣지 않는다", () => {
    const s = summarizeCashflow([
      { amount: 300, direction: "in", category: "salary" },
      { amount: 50, direction: "out", category: "housing" },
      { amount: 30, direction: "out", category: "food" },
      { amount: 40, direction: "out", category: "saving" },
      { amount: 10, direction: "out", category: "transfer" },
    ]);
    expect(s.income).toBe(300);
    expect(s.fixedCost).toBe(50);
    expect(s.variableCost).toBe(30);
    expect(s.savingAndInvest).toBe(40);
    expect(s.net).toBe(180);
    expect(s.savingRate).toBeCloseTo(40 / 300);
    expect(s.spendingRate).toBeCloseTo(80 / 300);
  });

  it("수입이 0이면 비율은 0", () => {
    const s = summarizeCashflow([{ amount: 10, direction: "out", category: "food" }]);
    expect(s.savingRate).toBe(0);
    expect(s.spendingRate).toBe(0);
  });

  it("입금 other_income·출금 uncategorized는 수입·소비에 들어가고, 둘 다 transfer면 빠진다", () => {
    const inflated = summarizeCashflow([
      { amount: 100_000, direction: "out", category: "uncategorized" },
      { amount: 100_000, direction: "in", category: "other_income" },
    ]);
    expect(inflated.income).toBe(100_000);
    expect(inflated.variableCost).toBe(100_000);

    const moved = summarizeCashflow([
      { amount: 100_000, direction: "out", category: "transfer" },
      { amount: 100_000, direction: "in", category: "transfer" },
    ]);
    expect(moved.income).toBe(0);
    expect(moved.variableCost).toBe(0);
    expect(moved.net).toBe(0);
  });
});
