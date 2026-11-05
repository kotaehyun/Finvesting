import { describe, expect, it } from "vitest";
import { brokerCashKrw, investedAssets } from "./invested";

describe("investedAssets", () => {
  it("보유 평가액과 예수금을 더한다", () => {
    expect(investedAssets(1_000_000, 200_000)).toBe(1_200_000);
    expect(investedAssets(0, 50_000)).toBe(50_000);
    expect(investedAssets(80_000, 0)).toBe(80_000);
  });

  it("max가 아니라 합이라 예수금이  inter 빠지지 않는다", () => {
    expect(investedAssets(100, 300)).toBe(400);
    expect(Math.max(100, 300)).toBe(300);
  });
});

describe("brokerCashKrw", () => {
  it("증권·코인·연금만 합치고 입출금은 빼 둔다", () => {
    expect(brokerCashKrw({
      brokerage: 10,
      crypto: 3,
      pension: 2,
      checking: 100,
      savings: 50,
    })).toBe(15);
  });
});
