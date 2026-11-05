import { describe, expect, it } from "vitest";
import {
  MARKET_REF_LINKS,
  WORLD_INDICES,
  tvTickerTapeSymbols,
  tvSymbolOverviewSymbols,
  worldIndexByYahoo,
  worldIndexYahooTickers,
  commodityWorldIndices,
  equityWorldIndices,
} from "./world-indices";

describe("world indices", () => {
  it("야후 심볼은 확인된 지수·상품만", () => {
    expect(worldIndexYahooTickers()).toEqual([
      "^KS11", "^KQ11", "^GSPC", "^IXIC", "^DJI", "^N225", "^GDAXI", "^HSI", "BTC-USD",
      "GC=F", "SI=F", "HG=F", "CL=F", "BZ=F",
    ]);
    expect(worldIndexByYahoo("^ks11")?.label).toBe("코스피");
    expect(worldIndexByYahoo("^kq11")?.href).toContain("KOSDAQ");
    expect(worldIndexByYahoo("BTC-USD")?.label).toBe("비트코인");
    expect(worldIndexByYahoo("nope")).toBeUndefined();
  });

  it("참조 사이트는 임베드가 아니라 링크", () => {
    const ids = MARKET_REF_LINKS.map((l) => l.id);
    expect(ids).toContain("naver");
    expect(ids).toContain("kis");
    expect(ids).toContain("krx");
    expect(ids).toContain("investing-idx");
    expect(ids).toContain("investing-fx");
    expect(ids).toContain("investing-btc");
    expect(ids).toContain("finviz-map");
    expect(ids).toContain("sa");
    expect(ids).toContain("investing-cmdty");
    expect(WORLD_INDICES.every((i) => i.tv.includes(":"))).toBe(true);
    expect(tvTickerTapeSymbols().every((s) => !s.proName.startsWith("KRX:"))).toBe(true);
    expect(tvSymbolOverviewSymbols()[0]).toEqual(["S&P 500", "FOREXCOM:SPXUSD|1D"]);
    expect(tvSymbolOverviewSymbols().at(-1)).toEqual(["브렌트", "TVC:UKOIL|1D"]);
    expect(tvSymbolOverviewSymbols().every((row) => !row[1].startsWith("KRX:"))).toBe(true);
    expect(commodityWorldIndices().map((i) => i.id)).toEqual(["gold", "silver", "copper", "wti", "brent"]);
    expect(equityWorldIndices().some((i) => i.id === "btc")).toBe(true);
    expect(equityWorldIndices().some((i) => i.id === "gold")).toBe(false);
  });
});
