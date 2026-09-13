import { describe, expect, it } from "vitest";
import {
  parseEnvTargets,
  quoteCollectorFor,
  splitByCollector,
  unionUnique,
  upbitMarketCode,
  yahooTickersFor,
} from "./quote-targets";

describe("parseEnvTargets / unionUnique", () => {
  it("없거나 빈 값은 빈 배열", () => {
    expect(parseEnvTargets(undefined)).toEqual([]);
    expect(parseEnvTargets("  , , ")).toEqual([]);
  });

  it("env와 DB 심볼을 대소문자 무시하고 합친다", () => {
    expect(parseEnvTargets("AAPL, MSFT, aapl")).toEqual(["AAPL", "MSFT"]);
    expect(unionUnique(["BTC"], ["btc", "ETH"])).toEqual(["BTC", "ETH"]);
  });
});

describe("quoteCollectorFor", () => {
  it("업비트·미국·KRX만 수집하고 나머지는 건너뛴다", () => {
    expect(quoteCollectorFor("UPBIT")).toBe("upbit");
    expect(quoteCollectorFor("NASDAQ")).toBe("yahoo");
    expect(quoteCollectorFor("NYSE")).toBe("yahoo");
    expect(quoteCollectorFor("AMEX")).toBe("yahoo");
    expect(quoteCollectorFor("KRX")).toBe("yahoo");
    expect(quoteCollectorFor("KOSDAQ")).toBe("yahoo");
    expect(quoteCollectorFor("KIS")).toBeNull();
  });
});

describe("upbitMarketCode", () => {
  it("KRW- 접두를 맞춘다", () => {
    expect(upbitMarketCode("BTC")).toBe("KRW-BTC");
    expect(upbitMarketCode("krw-eth")).toBe("KRW-ETH");
  });
});

describe("yahooTickersFor", () => {
  it("KRX는 .KS 다음 .KQ", () => {
    expect(yahooTickersFor("KRX", "005930")).toEqual(["005930.KS", "005930.KQ"]);
  });

  it("KOSDAQ은 .KQ만, 미국은 심볼 그대로", () => {
    expect(yahooTickersFor("KOSDAQ", "035420")).toEqual(["035420.KQ"]);
    expect(yahooTickersFor("NASDAQ", "AAPL")).toEqual(["AAPL"]);
  });

  it("이미 접미가 있으면 그대로", () => {
    expect(yahooTickersFor("KRX", "035420.KQ")).toEqual(["035420.KQ"]);
  });
});

describe("splitByCollector", () => {
  it("같은 종목은 한 번만, 수집기별로 나눈다", () => {
    const r = splitByCollector([
      { symbol: "BTC", market: "UPBIT" },
      { symbol: "btc", market: "upbit" },
      { symbol: "005930", market: "KRX" },
      { symbol: "AAPL", market: "NASDAQ" },
    ]);
    expect(r.upbit).toEqual([{ symbol: "BTC", market: "UPBIT" }]);
    expect(r.yahoo.map((x) => x.symbol)).toEqual(["005930", "AAPL"]);
  });
});
