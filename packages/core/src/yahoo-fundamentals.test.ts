import { describe, expect, it } from "vitest";
import {
  formatCompactMoney,
  formatExtraValue,
  formatFundamentalValue,
  formatFundamentalsContext,
  parseFundamentalExtra,
  yahooQuoteUrl,
  yahooSavesFundamentals,
  isKoreanSymbol,
  statementsUrl,
  marketRegionFor,
  evaluateFundamentalSignals,
  fiftyTwoWeekPosition,
  fiftyTwoWeekGauge,
  matchInstrumentQuery,
  instrumentQueryKey,
  isMoneyFundamentalSortKey,
  fundamentalLookups,
  fundamentalVenueLookups,
} from "./yahoo-fundamentals";
import { naverStockUrl } from "./yahoo-search";

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

  it("국내 조회는 네이버, 해외 조회는 Yahoo", () => {
    const kr = fundamentalLookups("005930.KS");
    expect(kr.map((l) => l.id)).toEqual(["naver", "kakaopaysec"]);
    expect(kr[0]).toMatchObject({ id: "naver", primary: true });
    expect(kr[0]?.url).toBe("https://stock.naver.com/domestic/stock/005930/price");
    expect(kr.some((l) => l.id.startsWith("yahoo"))).toBe(false);

    const bare = fundamentalLookups("005930", "KRX");
    expect(bare[0]?.url).toContain("/005930/price");

    const us = fundamentalLookups("AAPL");
    expect(us.map((l) => l.id)).toEqual(["yahoo", "yahoo-stats"]);
    expect(us[0]?.url).toBe("https://finance.yahoo.com/quote/AAPL");
    expect(us[1]?.url).toContain("/key-statistics");
    expect(us.some((l) => l.id === "naver" || l.id === "kakaopaysec")).toBe(false);

    expect(fundamentalVenueLookups("kr").map((l) => l.id)).toEqual(["naver-home", "kakaopaysec"]);
    expect(fundamentalVenueLookups("us").map((l) => l.id)).toEqual(["yahoo-home"]);
    expect(fundamentalVenueLookups("all").map((l) => l.id)).toEqual(["naver-home", "kakaopaysec", "yahoo-home"]);
  });
});

describe("한국 종목 및 시장 판별", () => {
  it("코스피/코스닥 심볼을 식별하고 네이버 및 statements URL을 만든다", () => {
    expect(isKoreanSymbol("005930.KS")).toBe(true);
    expect(isKoreanSymbol("035720.KQ")).toBe(true);
    expect(isKoreanSymbol("000660")).toBe(true);
    expect(isKoreanSymbol("AAPL")).toBe(false);

    expect(naverStockUrl("005930.KS")).toBe("https://stock.naver.com/domestic/stock/005930/price");
    expect(naverStockUrl("005930")).toBe("https://stock.naver.com/domestic/stock/005930/price");
    expect(naverStockUrl("AAPL")).toBeNull();

    expect(statementsUrl("005930.KS")).toBe("/statements?q=005930");
    expect(statementsUrl("AAPL")).toBe("/statements?q=AAPL");

    expect(marketRegionFor("005930.KS")).toBe("kr");
    expect(marketRegionFor("AAPL")).toBe("us");
    expect(marketRegionFor("035720", "KRX")).toBe("kr");
    expect(marketRegionFor("NESN.SW", "SWX")).toBe("other");
  });
});

describe("투자 신호 및 52주 게이지", () => {
  it("저PBR, 우량ROE, 고배당, 고부채 신호를 평가한다", () => {
    const signals = evaluateFundamentalSignals({
      pbr: 0.85,
      per: 12.0,
      roe: 0.18,
      dividendYield: 4.5,
      debtToEquity: 250,
    });
    expect(signals.map((s) => s.id)).toEqual(["low_pbr", "high_roe", "high_div", "high_debt"]);
  });

  it("52주 주가 위치 비율을 계산한다", () => {
    expect(fiftyTwoWeekPosition(100, 200, 150)).toBe(50);
    expect(fiftyTwoWeekPosition(100, 200, 90)).toBe(0);
    expect(fiftyTwoWeekPosition(100, 200, 210)).toBe(100);
    expect(fiftyTwoWeekPosition(undefined, 200, 150)).toBeNull();
    expect(fiftyTwoWeekPosition(100, 200, 110)).toBe(10);
    expect(fiftyTwoWeekPosition(100, 200, 190)).toBe(90);
  });

  it("행의 lastPrice로 게이지를 계산하고 중간값을 쓰지 않는다", () => {
    const extra = { fiftyTwoWeekLow: 100, fiftyTwoWeekHigh: 200 };
    const lowRow = {
      extra,
      lastPrice: 110,
      lastPriceDate: "2026-09-16",
      lastPriceSource: "yahoo",
    };
    const highRow = { ...lowRow, lastPrice: 190 };
    expect(fiftyTwoWeekGauge(lowRow)).toBe(10);
    expect(fiftyTwoWeekGauge(highRow)).toBe(90);
    expect(fiftyTwoWeekGauge(lowRow)).not.toBe(fiftyTwoWeekGauge(highRow));
    expect(fiftyTwoWeekGauge({ extra, lastPrice: (100 + 200) / 2 })).toBe(50);
    expect(fiftyTwoWeekGauge({ extra, lastPrice: null })).toBeNull();
    expect(lowRow.lastPriceDate).toBe("2026-09-16");
    expect(lowRow.lastPriceSource).toBe("yahoo");
  });

  it("재무제표 q는 수집 목록에서 해당 종목만 고른다", () => {
    const items = [
      { id: "1", symbol: "AAPL", name: "Apple" },
      { id: "2", symbol: "005930", name: "삼성전자", market: "KRX" },
    ];
    expect(instrumentQueryKey("005930.KS")).toBe("005930");
    expect(matchInstrumentQuery(items, "AAPL")?.id).toBe("1");
    expect(matchInstrumentQuery(items, "aapl")?.id).toBe("1");
    expect(matchInstrumentQuery(items, "005930")?.id).toBe("2");
    expect(matchInstrumentQuery(items, "005930.KS")?.id).toBe("2");
    expect(matchInstrumentQuery(items, "MSFT")).toBeUndefined();
    expect(isMoneyFundamentalSortKey("marketCap")).toBe(true);
    expect(isMoneyFundamentalSortKey("per")).toBe(false);
  });
});

