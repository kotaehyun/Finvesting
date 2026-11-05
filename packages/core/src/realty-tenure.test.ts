import { describe, expect, it } from "vitest";
import { REALTY_LEASE_TRADE, REALTY_TENURE, leaseJulyWolseShare } from "./realty-tenure";

describe("realty tenure", () => {
  it("점유 임차와 거래 월세를 따로 두고 7월 건수 합이 맞다", () => {
    expect(REALTY_TENURE.own + REALTY_TENURE.rent + REALTY_TENURE.free).toBeCloseTo(100, 5);
    expect(REALTY_LEASE_TRADE.wolseYtd).toBe(68.3);
    expect(REALTY_LEASE_TRADE.julyJeonse + REALTY_LEASE_TRADE.julyWolse).toBe(REALTY_LEASE_TRADE.julyDeals);
    expect(leaseJulyWolseShare()).toBeCloseTo(142_523 / 210_985, 6);
  });
});
