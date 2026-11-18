import { describe, expect, it } from "vitest";
import {
  buildMcapBoards,
  formatMcapLabel,
  matchNewsForSymbol,
  rankByMarketCap,
  symbolsMentionedInTitle,
  statementLookupYahooTickers,
  titleMentionsInstrument,
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

  it("3글자 이하 티커는 제목에 잡지 않고 회사 이름만 잡는다", () => {
    const news = [
      { id: "1", title: "Very strong demand", url: "u1", publisher: null, publishedAt: null },
      { id: "2", title: "Visa raises dividend", url: "u2", publisher: null, publishedAt: null },
    ];
    expect(matchNewsForSymbol(news, "V", "Visa").map((n) => n.id)).toEqual(["2"]);
    expect(symbolsMentionedInTitle("Very strong demand", [{ symbol: "V", name: "Visa" }])).toEqual([]);
    expect(symbolsMentionedInTitle("Visa raises dividend", [{ symbol: "V", name: "Visa" }])).toEqual(["V"]);
  });

  it("영문 티커는 대소문자를 구분한다", () => {
    expect(titleMentionsInstrument("Rising costs hit retailers", "COST", "Costco")).toBe(false);
    expect(titleMentionsInstrument("COST beats estimates", "COST", "Costco")).toBe(true);
    expect(titleMentionsInstrument("Heavy snow closes roads", "SNOW", "Snowflake")).toBe(false);
    expect(titleMentionsInstrument("Meta-analysis shows...", "META", "Meta Platforms")).toBe(false);
    expect(symbolsMentionedInTitle("Rising costs hit retailers", [{ symbol: "COST", name: "Costco" }])).toEqual([]);
  });

  it("영문 회사명은 저장된 표기 그대로 찾는다", () => {
    expect(titleMentionsInstrument("meta-analysis of trials", "META", "Meta")).toBe(false);
    expect(titleMentionsInstrument("Meta unveils new model", "META", "Meta")).toBe(true);
  });

  it("한글 회사명은 조사만 뒤에 붙을 때 찾는다", () => {
    expect(titleMentionsInstrument("카카오뱅크 실적 발표", "035720", "카카오")).toBe(false);
    expect(titleMentionsInstrument("카카오, 3분기 흑자", "035720", "카카오")).toBe(true);
    expect(titleMentionsInstrument("카카오가 인수", "035720", "카카오")).toBe(true);
    expect(titleMentionsInstrument("카카오의 신사업", "035720", "카카오")).toBe(true);
    expect(titleMentionsInstrument("현대차증권 리포트", "005380", "현대차")).toBe(false);
    expect(titleMentionsInstrument("현대차 노조 파업", "005380", "현대차")).toBe(true);
    expect(titleMentionsInstrument("1만도 안 되는 거래량", "204320", "만도")).toBe(false);
    expect(titleMentionsInstrument("만도, 자율주행 수주", "204320", "만도")).toBe(true);
  });

  it("저장된 symbols만으로는 오탐 제목을 통과시키지 않는다", () => {
    const news = [
      { id: "1", title: "Rising costs hit retailers", url: "u1", publisher: null, publishedAt: null, symbols: ["COST"] },
      { id: "2", title: "COST beats estimates", url: "u2", publisher: null, publishedAt: null, symbols: ["COST"] },
    ];
    expect(matchNewsForSymbol(news, "COST", "Costco").map((n) => n.id)).toEqual(["2"]);
  });
});
