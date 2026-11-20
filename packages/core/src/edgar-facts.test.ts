import { describe, expect, it } from "vitest";
import { edgarSpanMonths, mergeEdgarItems, pickEdgarFact } from "./edgar-facts";

describe("edgar 기간 길이", () => {
  it("3·6·9·12개월을 가른다", () => {
    expect(edgarSpanMonths("2025-01-01", "2025-03-31")).toBe(3);
    expect(edgarSpanMonths("2025-01-01", "2025-06-30")).toBe(6);
    expect(edgarSpanMonths("2025-01-01", "2025-09-30")).toBe(9);
    expect(edgarSpanMonths("2025-01-01", "2025-12-31")).toBe(12);
    expect(edgarSpanMonths("2025-01-01", "2025-01-20")).toBeNull();
  });

  it("같은 end의 3개월과 누적 중 누적을 고른다", () => {
    const facts = [
      { start: "2025-04-01", end: "2025-06-30", val: 3 },
      { start: "2025-01-01", end: "2025-06-30", val: 6 },
    ];
    expect(pickEdgarFact("income", "Q2", facts)?.val).toBe(6);
    expect(pickEdgarFact("cashflow", "Q3", [
      { start: "2025-07-01", end: "2025-09-30", val: 3 },
      { start: "2025-01-01", end: "2025-09-30", val: 9 },
    ])?.val).toBe(9);
    expect(pickEdgarFact("income", "FY", [
      { start: "2025-01-01", end: "2025-12-31", val: 12 },
      { start: "2025-10-01", end: "2025-12-31", val: 3 },
    ])?.val).toBe(12);
    expect(pickEdgarFact("income", "Q1", [
      { start: "2025-01-01", end: "2025-03-31", val: 3 },
    ])?.val).toBe(3);
  });

  it("기간이 안 맞으면 비우고, 재무상태는 end가 최신인 값을 쓴다", () => {
    expect(pickEdgarFact("income", "Q2", [
      { start: "2025-04-01", end: "2025-06-30", val: 3 },
    ])).toBeNull();
    expect(pickEdgarFact("balance", "Q2", [
      { start: "2025-04-01", end: "2025-06-30", val: 1 },
      { end: "2025-09-30", val: 2 },
    ])?.val).toBe(2);
  });

  it("기간이 안 맞는 키만 빼고 나머지 칸은 남긴다", () => {
    expect(mergeEdgarItems(
      { revenue: 10, net_income: 3, operating_income: 4 },
      { revenue: 12 },
      ["net_income"],
    )).toEqual({ revenue: 12, operating_income: 4 });
  });
});
