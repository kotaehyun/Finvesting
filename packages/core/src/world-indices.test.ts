import { describe, expect, it } from "vitest";
import {
  MARKET_REF_LINKS,
  WORLD_INDICES,
  worldIndexByYahoo,
  worldIndexYahooTickers,
} from "./world-indices";

describe("world indices", () => {
  it("야후 심볼은 확인된 지수·상품만", () => {
    expect(worldIndexYahooTickers()).toEqual([
      "^KS11", "^KQ11", "^GSPC", "^IXIC", "^DJI", "^N225", "^GDAXI", "^HSI", "GC=F", "CL=F",
    ]);
    expect(worldIndexByYahoo("^ks11")?.label).toBe("KOSPI");
    expect(worldIndexByYahoo("nope")).toBeUndefined();
  });

  it("참조 사이트는 임베드가 아니라 링크", () => {
    const ids = MARKET_REF_LINKS.map((l) => l.id);
    expect(ids).toContain("investing-idx");
    expect(ids).toContain("finviz-map");
    expect(ids).toContain("sa");
    expect(WORLD_INDICES.every((i) => i.tv.includes(":"))).toBe(true);
  });
});
