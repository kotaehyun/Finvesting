import { describe, expect, it } from "vitest";
import { buildCashflowTrends, listMonths } from "./trends";

describe("listMonths", () => {
  it("기준월을 포함해 거꾸로 채운다", () => {
    expect(listMonths("2026-09", 3)).toEqual(["2026-07", "2026-08", "2026-09"]);
  });
});

describe("buildCashflowTrends", () => {
  it("세액·소비·저축·투자를 월별로 나눈다. 이체와 근로소득세는 소비에 넣지 않는다", () => {
    const points = buildCashflowTrends(
      [
        { date: "2026-08-05", amount: 80_000, direction: "out", category: "food" },
        { date: "2026-08-10", amount: 200_000, direction: "out", category: "saving" },
        { date: "2026-09-01", amount: 50_000, direction: "out", category: "food" },
        { date: "2026-09-02", amount: 30_000, direction: "out", category: "investment" },
        { date: "2026-09-03", amount: 10_000, direction: "out", category: "transfer" },
        { date: "2026-09-04", amount: 20_000, direction: "out", category: "income_tax" },
        { date: "2026-09-05", amount: 3_000_000, direction: "in", category: "salary" },
      ],
      [{ month: "2026-08", amount: 240_000 }],
      ["2026-08", "2026-09"],
    );
    expect(points).toEqual([
      { month: "2026-08", tax: 240_000, spend: 80_000, save: 200_000, invest: 0 },
      { month: "2026-09", tax: 20_000, spend: 50_000, save: 0, invest: 30_000 },
    ]);
  });

  it("같은 달 수동 세액이 거래보다 우선한다", () => {
    const points = buildCashflowTrends(
      [{ date: "2026-09-04", amount: 20_000, direction: "out", category: "income_tax" }],
      [{ month: "2026-09", amount: 250_000 }],
      ["2026-09"],
    );
    expect(points[0]?.tax).toBe(250_000);
  });
});
