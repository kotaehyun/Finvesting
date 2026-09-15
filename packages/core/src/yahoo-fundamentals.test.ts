import { describe, expect, it } from "vitest";
import {
  formatCompactMoney,
  formatExtraValue,
  formatFundamentalValue,
  formatFundamentalsContext,
  parseFundamentalExtra,
  yahooQuoteUrl,
  yahooSavesFundamentals,
} from "./yahoo-fundamentals";

describe("yahooSavesFundamentals", () => {
  it("주식·ETF만 저장한다", () => {
    expect(yahooSavesFundamentals("stock")).toBe(true);
    expect(yahooSavesFundamentals("etf")).toBe(true);
    expect(yahooSavesFundamentals("other", "EQUITY")).toBe(true);
    expect(yahooSavesFundamentals("other", "ETF")).toBe(true);
    expect(yahooSavesFundamentals("stock", "FUTURE")).toBe(false);
    expect(yahooSavesFundamentals("other", "INDEX")).toBe(false);
    expect(yahooSavesFundamentals("crypto")).toBe(false);
    expect(yahooSavesFundamentals("other")).toBe(false);
  });
});

describe("표시 단위 (2026-09-14 AAPL/SPY 실측 스냅샷)", () => {
  it("시총·ROE·배당·D/E를 Yahoo 단위로 적는다", () => {
    expect(formatFundamentalValue("marketCap", 4_849_207_869_440, "USD")).toBe("4.85T USD");
    expect(formatFundamentalValue("roe", 1.4875101, "USD")).toBe("148.8%");
    expect(formatFundamentalValue("dividendYield", 0.33, "USD")).toBe("0.33%");
    expect(formatFundamentalValue("debtToEquity", 78.445, "USD")).toBe("78.4");
    expect(formatFundamentalValue("per", 38.148106, "USD")).toBe("38.15");
    expect(formatCompactMoney(500_000_000_000_000, "KRW")).toBe("500.00조원");
  });

  it("ETF extra는 퍼센트 숫자 그대로다", () => {
    expect(formatExtraValue("ytdReturn", 13.07293, "USD")).toBe("13.07%");
    expect(formatExtraValue("netExpenseRatio", 0.0945, "USD")).toBe("0.0945%");
  });
});

describe("parse / context / url", () => {
  it("extra에서 숫자만 남긴다", () => {
    expect(parseFundamentalExtra({
      fiftyTwoWeekHigh: "344.57",
      quoteType: "EQUITY",
      skip: "x",
    })).toEqual({ fiftyTwoWeekHigh: 344.57, quoteType: "EQUITY" });
  });

  it("컨텍스트에 있는 칸만 적는다", () => {
    const t = formatFundamentalsContext({
      symbol: "AAPL", name: "Apple", currency: "USD", date: "2026-09-12", source: "yahoo",
      marketCap: 4_849_207_869_440, per: 38.15, forwardPer: null, pbr: null, eps: 8.71,
      roe: 1.4875, dividendYield: 0.33, revenueTtm: null, netIncomeTtm: null,
      debtToEquity: 78.445, beta: 1.085, extra: { fiftyTwoWeekLow: 235.03, fiftyTwoWeekHigh: 344.57 },
    });
    expect(t).toContain("Apple(AAPL)");
    expect(t).toContain("Market cap 4.85T USD");
    expect(t).toContain("ROE 148.8%");
    expect(t).toContain("Div. yield 0.33%");
    expect(t).not.toContain("TTM revenue");
    expect(t).toContain("52w");
  });

  it("야후 시세 페이지 URL을 만든다", () => {
    expect(yahooQuoteUrl("AAPL")).toBe("https://finance.yahoo.com/quote/AAPL");
    expect(yahooQuoteUrl("")).toBe("https://finance.yahoo.com/");
  });
});
