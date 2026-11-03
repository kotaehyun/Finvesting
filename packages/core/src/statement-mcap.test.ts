import { describe, expect, it } from "vitest";
import {
  buildMcapBoards,
  formatMcapLabel,
  matchNewsForSymbol,
  rankByMarketCap,
  statementLookupYahooTickers,
} from "./statement-mcap";

describe("시가총액 순위", () => {
  it("시총 큰 순, 코인·지수·시총 없음 제외", () => {
    const rows = rankByMarketCap([
      { instrumentId: "1", symbol: "A", name: "A", market: "US", currency: "USD", marketCap: 10 },
      { instrumentId: "2", symbol: "B", name: "B", market: "US", currency: "USD", marketCap: 50 },
      { instrumentId: "3", symbol: "C", name: "C", market: "US", currency: "USD", marketCap: null },
      { instrumentId: "4", symbol: "BTC", name: "BTC", market: "UPBIT", currency: "KRW", marketCap: 99, assetClass: "crypto" },
    ]);
    expect(rows.map((r) => r.symbol)).toEqual(["B", "A"]);
    expect(rows[0]?.rank).toBe(1);
    expect(rows[1]?.rank).toBe(2);
  });

  it("시총 라벨은 Yahoo 단위 포맷", () => {
    expect(formatMcapLabel(4_849_207_869_440, "USD")).toContain("T");
  });

  it("섹터 종목을 Yahoo 티커로 펼친다", () => {
    const t = statementLookupYahooTickers(["kr", "us"]);
    expect(t).toContain("005930.KS");
    expect(t).toContain("AAPL");
    expect(t).toContain("JPM");
  });

  it("국내·해외 보드를 나눈다", () => {
    const b = buildMcapBoards([
      { instrumentId: "1", symbol: "005930", name: "삼성전자", market: "KRX", currency: "KRW", marketCap: 400 },
      { instrumentId: "2", symbol: "AAPL", name: "Apple", market: "NASDAQ", currency: "USD", marketCap: 3000 },
      { instrumentId: "3", symbol: "BTC", name: "BTC", market: "UPBIT", currency: "KRW", marketCap: 99, assetClass: "crypto" },
    ], 10);
    expect(b.kr.map((r) => r.symbol)).toEqual(["005930"]);
    expect(b.world.map((r) => r.symbol)).toEqual(["AAPL"]);
  });

  it("뉴스 매칭은 심볼·이름·symbols", () => {
    const news = [
      { id: "1", title: "Apple earnings", url: "u1", publisher: "X", publishedAt: null, symbols: ["AAPL"] },
      { id: "2", title: "삼성전자 실적", url: "u2", publisher: "Y", publishedAt: null },
      { id: "3", title: " unrelated ", url: "u3", publisher: null, publishedAt: null },
    ];
    expect(matchNewsForSymbol(news, "AAPL", "Apple").map((n) => n.id)).toEqual(["1"]);
    expect(matchNewsForSymbol(news, "005930", "삼성전자").map((n) => n.id)).toEqual(["2"]);
  });
});
