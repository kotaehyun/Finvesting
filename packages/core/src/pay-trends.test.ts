import { describe, expect, it } from "vitest";
import { buildPayTrends, sumPayTrends } from "./pay-trends";

describe("buildPayTrends", () => {
  it("스냅샷 달을 쓰고 없는 달은 세액만 넣는다", () => {
    const t = buildPayTrends(
      ["2026-07", "2026-08", "2026-09"],
      [{
        month: "2026-09", base: 3_400_000, allowance: 200_000, bonus: 600_000, other: 0,
        gross: 4_200_000, tax: 275_000, insurance: 408_130, net: 3_516_870,
      }],
      [{ month: "2026-07", amount: 240_000 }, { month: "2026-08", amount: 245_000 }],
    );
    expect(t[0]).toMatchObject({ month: "2026-07", base: 0, tax: 240_000 });
    expect(t[1]?.tax).toBe(245_000);
    expect(t[2]?.base).toBe(3_400_000);
    expect(t[2]?.bonus).toBe(600_000);
  });
});

describe("sumPayTrends", () => {
  it("12개월 세전을 연봉 합으로 더한다", () => {
    const s = sumPayTrends([
      { month: "2026-08", base: 100, allowance: 0, bonus: 0, other: 0, gross: 100, tax: 10, insurance: 5, net: 85 },
      { month: "2026-09", base: 200, allowance: 0, bonus: 50, other: 0, gross: 250, tax: 20, insurance: 10, net: 220 },
    ]);
    expect(s.gross).toBe(350);
    expect(s.bonus).toBe(50);
    expect(s.tax).toBe(30);
  });
});
