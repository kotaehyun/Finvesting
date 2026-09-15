import { describe, expect, it } from "vitest";
import {
  REALTY_OFFICIAL_ASSET,
  REALTY_OFFICIAL_FLOW_ROWS,
  REALTY_OFFICIAL_HOUSES,
  REALTY_OFFICIAL_METRO_HEADS,
  formatManwon,
  realtyOfficialCapitalAwayCount,
  realtyOfficialSplitCount,
} from "./realty-officials";

describe("realty officials", () => {
  it("보도 원문 평균·증감과 맞는다", () => {
    expect(REALTY_OFFICIAL_ASSET.count).toBe(1903);
    expect(REALTY_OFFICIAL_ASSET.avgMan).toBe(209_563);
    expect(REALTY_OFFICIAL_ASSET.deltaMan).toBe(14_870);
    expect(REALTY_OFFICIAL_ASSET.up + REALTY_OFFICIAL_ASSET.down).toBe(1903);
    expect(formatManwon(209_563)).toBe("20억 9,563만 원");
    expect(formatManwon(14_870)).toBe("1억 4,870만 원");
  });

  it("광역단체장 16명 중 관할 밖 수도권 주택은 6명이다", () => {
    expect(REALTY_OFFICIAL_METRO_HEADS).toBe(16);
    expect(realtyOfficialCapitalAwayCount()).toBe(6);
    expect(realtyOfficialSplitCount()).toBe(2);
    expect(REALTY_OFFICIAL_HOUSES.filter((h) => h.flow === "capital-away")).toHaveLength(4);
    expect(REALTY_OFFICIAL_FLOW_ROWS.reduce((s, r) => s + r.count, 0)).toBe(16);
    expect(REALTY_OFFICIAL_HOUSES.some((h) => h.house.includes("대치"))).toBe(true);
    expect(REALTY_OFFICIAL_HOUSES.some((h) => h.flow === "none")).toBe(true);
  });
});
