import { describe, expect, it } from "vitest";
import { detectSpendAnomalies, formatSpendAnomalyContext, type SpendAnomalyTxn } from "./spend-anomaly";

function food(date: string, amount: number, extra: Partial<SpendAnomalyTxn> = {}): SpendAnomalyTxn {
  return { date, amount, direction: "out", category: "food", ...extra };
}

describe("detectSpendAnomalies", () => {
  it("이전 최댓값보다 큰 분류만 돌려주고, 그 달을 기준 달로 적는다", () => {
    const result = detectSpendAnomalies([
      food("2026-05-03", 80_000),
      food("2026-06-03", 90_000),
      food("2026-07-03", 100_000),
      food("2026-08-02", 40_000, { merchant: "식당", id: "a" }),
      food("2026-08-20", 170_000, { merchant: "회식", id: "b" }),
      food("2026-08-01", 50_000, { category: "saving" }),
    ], "2026-08");
    expect(result.status).toBe("ok");
    expect(result.comparedMonths).toBe(3);
    expect(result.flags).toEqual([
      {
        category: "food",
        monthTotal: 210_000,
        baselineMax: 100_000,
        baselineMonth: "2026-07",
        outlierCount: 1,
        outliers: [{ id: "b", date: "2026-08-20", amount: 170_000, merchant: "회식", memo: null }],
      },
    ]);
  });

  it("최댓값과 같으면 넘었다고 하지 않는다", () => {
    const result = detectSpendAnomalies([
      food("2026-05-01", 10),
      food("2026-06-01", 10),
      food("2026-07-01", 100),
      food("2026-08-01", 100),
    ], "2026-08");
    expect(result.status).toBe("ok");
    expect(result.flags).toEqual([]);
  });

  it("소비가 있는 이전 달이 3개월 미만이면 비교하지 않는다", () => {
    const result = detectSpendAnomalies([
      food("2026-06-01", 10),
      food("2026-07-01", 10),
      food("2026-08-01", 10_000),
    ], "2026-08");
    expect(result.status).toBe("insufficient");
    expect(result.comparedMonths).toBe(2);
    expect(result.flags).toEqual([]);
  });

  it("이전 달에 없던 분류와 저축·이체·미분류는 빼 둔다", () => {
    const rows: SpendAnomalyTxn[] = [
      food("2026-02-01", 10),
      food("2026-03-01", 10),
      food("2026-04-01", 10),
      { date: "2026-08-01", amount: 9_000_000, direction: "out", category: "shopping" },
      { date: "2026-08-01", amount: 9_000_000, direction: "out", category: "saving" },
      { date: "2026-08-01", amount: 9_000_000, direction: "out", category: "investment" },
      { date: "2026-08-01", amount: 9_000_000, direction: "out", category: "transfer" },
      { date: "2026-08-01", amount: 9_000_000, direction: "out", category: "uncategorized" },
      { date: "2026-08-01", amount: 9_000_000, direction: "in", category: "salary" },
      food("2026-08-01", 10),
    ];
    const result = detectSpendAnomalies(rows, "2026-08");
    expect(result.status).toBe("ok");
    expect(result.flags).toEqual([]);
  });

  it("합계만 넘고 한 건은 최댓값을 넘지 않으면 거래 목록은 비운다", () => {
    const result = detectSpendAnomalies([
      food("2026-05-01", 100),
      food("2026-06-01", 100),
      food("2026-07-01", 100),
      food("2026-08-01", 60),
      food("2026-08-02", 60),
    ], "2026-08");
    expect(result.flags[0]?.outlierCount).toBe(0);
    expect(result.flags[0]?.outliers).toEqual([]);
    expect(result.flags[0]?.monthTotal).toBe(120);
  });

  it("이 달 소비가 없으면 empty다", () => {
    const result = detectSpendAnomalies([
      food("2026-05-01", 10),
      food("2026-06-01", 10),
      food("2026-07-01", 10),
    ], "2026-08");
    expect(result.status).toBe("empty");
    expect(result.comparedMonths).toBe(3);
  });

  it("같은 최댓값은 더 최근 달을 기준 달로 적는다", () => {
    const result = detectSpendAnomalies([
      food("2026-05-01", 50),
      food("2026-06-01", 80),
      food("2026-07-01", 80),
      food("2026-08-01", 90),
    ], "2026-08");
    expect(result.flags[0]?.baselineMonth).toBe("2026-07");
    expect(result.flags[0]?.baselineMax).toBe(80);
  });
});

describe("formatSpendAnomalyContext", () => {
  it("넘긴 분류의 금액과 기준 달만 적는다", () => {
    const text = formatSpendAnomalyContext(detectSpendAnomalies([
      food("2026-05-03", 80_000),
      food("2026-06-03", 90_000),
      food("2026-07-03", 100_000),
      food("2026-08-20", 170_000, { merchant: "회식" }),
    ], "2026-08"));
    expect(text).toContain("식비 170,000원");
    expect(text).toContain("이전 최댓값 100,000원, 2026-07");
    expect(text).toContain("2026-08-20 회식 170,000원");
    expect(text).not.toContain("9,000,000");
  });

  it("넘지 않으면 없다고 적는다", () => {
    const text = formatSpendAnomalyContext(detectSpendAnomalies([
      food("2026-05-01", 10),
      food("2026-06-01", 10),
      food("2026-07-01", 100),
      food("2026-08-01", 100),
    ], "2026-08"));
    expect(text).toContain("최댓값을 넘지 않습니다");
  });
});
