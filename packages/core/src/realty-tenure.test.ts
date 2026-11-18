import { describe, expect, it } from "vitest";
import { REALTY_LEASE_TRADE, REALTY_TENURE, REALTY_TENURE_DETAIL, leaseJulyWolseShare } from "./realty-tenure";

describe("realty tenure", () => {
  it("점유 임차와 거래 월세를 따로 두고 7월 건수 합이 맞다", () => {
    expect(REALTY_TENURE.own + REALTY_TENURE.rent + REALTY_TENURE.free).toBeCloseTo(100, 5);
    expect(REALTY_LEASE_TRADE.wolseYtd).toBe(68.3);
    expect(REALTY_LEASE_TRADE.julyJeonse + REALTY_LEASE_TRADE.julyWolse).toBe(REALTY_LEASE_TRADE.julyDeals);
    expect(leaseJulyWolseShare()).toBeCloseTo(142_523 / 210_985, 6);
  });

  it("수도권·연령·성별은 공표 칸만 두고 직업·전세 분리는 비운다", () => {
    const sudo = REALTY_TENURE_DETAIL.regions.find((r) => r.id === "sudo");
    const metro = REALTY_TENURE_DETAIL.regions.find((r) => r.id === "metro");
    const youth = REALTY_TENURE_DETAIL.cohorts.find((c) => c.id === "youth");
    const seoul = REALTY_TENURE_DETAIL.sidos.find((s) => s.id === "seoul");
    const under20 = REALTY_TENURE_DETAIL.ages.find((a) => a.id === "u20");
    expect(sudo).toMatchObject({ own: 52.7, rent: 44.4, free: 2.8, hold: 55.6 });
    expect(metro?.free).toBeNull();
    expect(youth?.areas.find((a) => a.id === "sudo")?.rent).toBe(85.9);
    expect(REALTY_TENURE_DETAIL.sex.find((s) => s.id === "female")?.own).toBe(46.9);
    expect(REALTY_TENURE_DETAIL.ages.find((a) => a.id === "a20")?.own).toBe(5.3);
    expect(under20?.own).toBeNull();
    expect(under20 && under20.rent + under20.free).toBeCloseTo(100, 5);
    expect(seoul).toMatchObject({ own: 44.1, rent: 53.4, free: 2.5 });
    expect(REALTY_TENURE_DETAIL.sidos).toHaveLength(17);
    const capitalMean = ["seoul", "incheon", "gyeonggi"]
      .map((id) => REALTY_TENURE_DETAIL.sidos.find((s) => s.id === id)?.own ?? 0)
      .reduce((sum, n) => sum + n, 0) / 3;
    expect(capitalMean).not.toBeCloseTo(sudo?.own ?? 0, 1);
    expect(REALTY_TENURE_DETAIL.missing).toContain("직업");
  });
});
