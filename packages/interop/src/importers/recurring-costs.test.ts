import { describe, expect, it } from "vitest";
import { parseRecurringCostCsv, recurringCostsToCsv } from "./recurring-costs";

describe("parseRecurringCostCsv", () => {
  it("한글 헤더와 분류 별칭을 읽는다", () => {
    const csv = "이름,분류,금액,출금일,메모\n휴대폰,휴대폰,55000,15,\n전기요금,공과금,\"40,000\",20,한전\n";
    const r = parseRecurringCostCsv(csv);
    expect(r.rows).toEqual([
      { name: "휴대폰", category: "phone", amount: 55000, dayOfMonth: 15, memo: undefined },
      { name: "전기요금", category: "utilities", amount: 40000, dayOfMonth: 20, memo: "한전" },
    ]);
    expect(r.skipped).toEqual([]);
  });

  it("헤더가 없으면 skip 한다", () => {
    const r = parseRecurringCostCsv("a,b\n1,2\n");
    expect(r.rows).toEqual([]);
    expect(r.skipped[0]?.reason).toMatch(/헤더/);
  });
});

describe("recurringCostsToCsv", () => {
  it("다시 읽으면 같은 행이 된다", () => {
    const src = [{ name: "월세", category: "housing", amount: 500000, dayOfMonth: 1, memo: "관리비 별도" }];
    const r = parseRecurringCostCsv(recurringCostsToCsv(src));
    expect(r.rows).toEqual(src);
  });
});
