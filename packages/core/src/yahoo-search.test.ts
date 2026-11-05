import { describe, expect, it } from "vitest";
import { instrumentFromYahooHit, krStockCode, parseYahooSearchQuotes } from "./yahoo-search";
import { yahooQuoteUrl } from "./yahoo-fundamentals";

describe("yahoo search", () => {
  it("삼성전자 KS는 네이버·DART 링크", () => {
    expect(krStockCode("005930.KS")).toBe("005930");
    expect(krStockCode("005930")).toBe("005930");
    const hits = parseYahooSearchQuotes({
      quotes: [
        { symbol: "005930.KS", shortname: "SamsungElec", exchange: "KSC", quoteType: "EQUITY" },
        { symbol: "AAPL", shortname: "Apple Inc.", exchDisp: "NASDAQ", typeDisp: "Equity" },
        { symbol: "005930.KS", shortname: "dup" },
      ],
    });
    expect(hits).toHaveLength(2);
    expect(hits[0]?.naverUrl).toContain("005930");
    expect(hits[0]?.dartUrl).toContain("005930");
    expect(hits[0]?.edgarUrl).toBeNull();
    expect(hits[1]?.naverUrl).toBeNull();
    expect(hits[1]?.dartUrl).toBeNull();
    expect(hits[1]?.edgarUrl).toContain("CIK=AAPL");
    expect(hits[1]?.yahooUrl).toBe(yahooQuoteUrl("AAPL"));
  });

  it("검색 줄을 instruments 초안으로 바꾼다", () => {
    expect(instrumentFromYahooHit({
      symbol: "005930.KS", name: "SamsungElec", exchange: "KSC", quoteType: "주식",
    })).toEqual({ symbol: "005930", market: "KRX", name: "SamsungElec", assetClass: "stock", currency: "KRW" });
    expect(instrumentFromYahooHit({
      symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", quoteType: "Equity",
    })).toEqual({ symbol: "AAPL", market: "NASDAQ", name: "Apple Inc.", assetClass: "stock", currency: "USD" });
    expect(instrumentFromYahooHit({
      symbol: "SPY", name: "SPDR S&P 500", exchange: "NYSE", quoteType: "ETF",
    })?.assetClass).toBe("etf");
    expect(instrumentFromYahooHit({
      symbol: "^GSPC", name: "S&P 500", exchange: "SNP", quoteType: "INDEX",
    })).toBeNull();
  });
});
