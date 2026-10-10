import { describe, expect, it } from "vitest";
import {
  calculatePriceChange,
  filterWatchlist,
  formatChangePct,
  sortWatchlist,
  summarizeWatchlist,
  type WatchlistItem,
} from "./watchlist";

describe("watchlist core functions", () => {
  it("calculatePriceChange calculates difference and percentage correctly", () => {
    const res1 = calculatePriceChange(75000, 70000);
    expect(res1).toEqual({ change: 5000, changePct: 7.14 });

    const res2 = calculatePriceChange(68000, 70000);
    expect(res2).toEqual({ change: -2000, changePct: -2.86 });

    expect(calculatePriceChange(null, 70000)).toBeNull();
    expect(calculatePriceChange(70000, 0)).toBeNull();
  });

  it("formatChangePct formats positive, negative and zero percentages with sign", () => {
    expect(formatChangePct(3.456)).toBe("+3.46%");
    expect(formatChangePct(-2.1)).toBe("-2.10%");
    expect(formatChangePct(0)).toBe("0.00%");
    expect(formatChangePct(null)).toBe("-");
  });

  const sampleItems: WatchlistItem[] = [
    {
      id: "1",
      instrumentId: "i1",
      symbol: "005930",
      name: "삼성전자",
      market: "KRX",
      currency: "KRW",
      assetClass: "stock",
      note: "배당 안정성",
      addedAt: "2026-01-01T00:00:00Z",
      lastPrice: 75000,
      changePct: 2.5,
    },
    {
      id: "2",
      instrumentId: "i2",
      symbol: "AAPL",
      name: "Apple Inc.",
      market: "NASDAQ",
      currency: "USD",
      assetClass: "stock",
      note: "AI 신제품 발표",
      addedAt: "2026-02-01T00:00:00Z",
      lastPrice: 220,
      changePct: -1.2,
    },
    {
      id: "3",
      instrumentId: "i3",
      symbol: "BTC",
      name: "비트코인",
      market: "UPBIT",
      currency: "KRW",
      assetClass: "crypto",
      note: null,
      addedAt: "2026-03-01T00:00:00Z",
      lastPrice: 105000000,
      changePct: 5.8,
    },
  ];

  it("filterWatchlist filters by market, query and assetClass", () => {
    const krxOnly = filterWatchlist(sampleItems, { market: "KRX" });
    expect(krxOnly).toHaveLength(1);
    expect(krxOnly[0]!.symbol).toBe("005930");

    const usOnly = filterWatchlist(sampleItems, { market: "US" });
    expect(usOnly).toHaveLength(1);
    expect(usOnly[0]!.symbol).toBe("AAPL");

    const searchRes = filterWatchlist(sampleItems, { query: "apple" });
    expect(searchRes).toHaveLength(1);
    expect(searchRes[0]!.symbol).toBe("AAPL");

    const noteSearch = filterWatchlist(sampleItems, { query: "배당" });
    expect(noteSearch).toHaveLength(1);
    expect(noteSearch[0]!.symbol).toBe("005930");
  });

  it("sortWatchlist sorts by change_desc, change_asc, name_asc, added_desc", () => {
    const sortedByChangeDesc = sortWatchlist(sampleItems, "change_desc");
    expect(sortedByChangeDesc.map((i) => i.symbol)).toEqual(["BTC", "005930", "AAPL"]);

    const sortedByChangeAsc = sortWatchlist(sampleItems, "change_asc");
    expect(sortedByChangeAsc.map((i) => i.symbol)).toEqual(["AAPL", "005930", "BTC"]);

    const sortedByName = sortWatchlist(sampleItems, "name_asc");
    expect(sortedByName.map((i) => i.name)).toEqual(["비트코인", "삼성전자", "Apple Inc."]);
  });

  it("summarizeWatchlist returns up/down/flat counts", () => {
    const summary = summarizeWatchlist(sampleItems);
    expect(summary).toEqual({
      total: 3,
      upCount: 2,
      downCount: 1,
      flatCount: 0,
    });
  });
});
