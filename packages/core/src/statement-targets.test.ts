import { describe, expect, it } from "vitest";
import {
  dartNeedsCatalog,
  dartStockCodeFromInstrument,
  edgarNeedsCatalog,
  edgarTickerFromInstrument,
  padDartCorpCode,
  padSecCik,
  parseDartCorpCodeXml,
  parseDartTarget,
  parseEdgarTarget,
  parseSecCompanyTickers,
  resolveDartTargets,
  resolveEdgarTargets,
  statementLookupHeldRefs,
} from "./statement-targets";

describe("pad identifiers", () => {
  it("DART 고유번호는 8자리, CIK는 10자리", () => {
    expect(padDartCorpCode("126380")).toBe("00126380");
    expect(padDartCorpCode("00126380")).toBe("00126380");
    expect(padDartCorpCode("abc")).toBeNull();
    expect(padSecCik(320193)).toBe("0000320193");
    expect(padSecCik("0000320193")).toBe("0000320193");
  });
});

describe("instrument → 공시 심볼", () => {
  it("국내 6자리·접미만 DART", () => {
    expect(dartStockCodeFromInstrument("005930.KS", "KRX")).toBe("005930");
    expect(dartStockCodeFromInstrument("035420", "KOSDAQ")).toBe("035420");
    expect(dartStockCodeFromInstrument("AAPL", "NASDAQ")).toBeNull();
    expect(dartStockCodeFromInstrument("BTC", "UPBIT")).toBeNull();
  });

  it("미국 시장만 EDGAR. 업비트 티커는 제외", () => {
    expect(edgarTickerFromInstrument("AAPL", "NASDAQ")).toBe("AAPL");
    expect(edgarTickerFromInstrument("BRK.B", "NYSE")).toBe("BRK.B");
    expect(edgarTickerFromInstrument("BTC", "UPBIT")).toBeNull();
    expect(edgarTickerFromInstrument("005930", "KRX")).toBeNull();
  });
});

describe("parse env target", () => {
  it("DART는 종목만 또는 corp·이름", () => {
    expect(parseDartTarget("005930")).toEqual({ stock: "005930", corp: undefined, name: undefined });
    expect(parseDartTarget("005930.KS:126380:삼성전자")).toEqual({
      stock: "005930",
      corp: "00126380",
      name: "삼성전자",
    });
    expect(parseDartTarget("AAPL")).toBeNull();
  });

  it("EDGAR는 티커만 또는 CIK·이름", () => {
    expect(parseEdgarTarget("AAPL")).toEqual({ ticker: "AAPL", cik: undefined, name: undefined });
    expect(parseEdgarTarget("AAPL:320193:Apple")).toEqual({
      ticker: "AAPL",
      cik: "0000320193",
      name: "Apple",
    });
    expect(parseEdgarTarget("005930")).toBeNull();
  });
});

describe("공식 목록 파싱", () => {
  it("corpCode.xml 상장만. 빈 stock_code는 버림", () => {
    const xml = `<?xml version="1.0"?>
<result>
  <list>
    <corp_code>00126380</corp_code>
    <corp_name>삼성전자</corp_name>
    <corp_eng_name>SAMSUNG ELECTRONICS CO., LTD.</corp_eng_name>
    <stock_code>005930</stock_code>
    <modify_date>20220125</modify_date>
  </list>
  <list>
    <corp_code>00412345</corp_code>
    <corp_name>비상장</corp_name>
    <stock_code></stock_code>
    <modify_date>20220125</modify_date>
  </list>
</result>`;
    const map = parseDartCorpCodeXml(xml);
    expect(map.get("005930")).toEqual({ corp: "00126380", name: "삼성전자" });
    expect(map.size).toBe(1);
  });

  it("company_tickers.json 티커→CIK", () => {
    const map = parseSecCompanyTickers({
      "0": { cik_str: 320193, ticker: "AAPL", title: "Apple Inc." },
      "1": { cik_str: 789019, ticker: "MSFT", title: "MICROSOFT CORP" },
    });
    expect(map.get("AAPL")).toEqual({ cik: "0000320193", title: "Apple Inc." });
    expect(map.get("MSFT")?.cik).toBe("0000789019");
  });
});

describe("resolveDartTargets", () => {
  const catalog = new Map([
    ["005930", { corp: "00126380", name: "삼성전자" }],
    ["000660", { corp: "00164779", name: "SK하이닉스" }],
  ]);

  it("보유 ∪ env, 목록에서 corp. env corp가 우선", () => {
    const r = resolveDartTargets({
      held: [{ symbol: "005930.KS", market: "KRX", name: "Samsung" }],
      env: ["000660", "035720:00538000:카카오"],
      catalog,
    });
    expect(r.targets).toEqual([
      { stock: "005930", corp: "00126380", name: "Samsung" },
      { stock: "000660", corp: "00164779", name: "SK하이닉스" },
      { stock: "035720", corp: "00538000", name: "카카오" },
    ]);
    expect(r.unmatched).toEqual([]);
  });

  it("목록에 없으면 unmatched. 숫자를 만들지 않음", () => {
    const r = resolveDartTargets({
      held: [{ symbol: "999999", market: "KRX", name: "없는종목" }],
      env: [],
      catalog,
    });
    expect(r.targets).toEqual([]);
    expect(r.unmatched).toEqual(["999999"]);
  });

  it("업비트는 대상이 아님", () => {
    const r = resolveDartTargets({
      held: [{ symbol: "BTC", market: "UPBIT" }],
      env: [],
      catalog,
    });
    expect(r.targets).toEqual([]);
    expect(r.unmatched).toEqual([]);
  });
});

describe("resolveEdgarTargets", () => {
  const catalog = new Map([
    ["AAPL", { cik: "0000320193", title: "Apple Inc." }],
    ["MSFT", { cik: "0000789019", title: "MICROSOFT CORP" }],
  ]);

  it("보유 ∪ env, 목록에서 CIK", () => {
    const r = resolveEdgarTargets({
      held: [{ symbol: "aapl", market: "NASDAQ", name: "Apple" }],
      env: ["MSFT"],
      catalog,
    });
    expect(r.targets).toEqual([
      { ticker: "AAPL", cik: "0000320193", name: "Apple" },
      { ticker: "MSFT", cik: "0000789019", name: "MICROSOFT CORP" },
    ]);
  });

  it("CIK 없는 티커는 unmatched", () => {
    const r = resolveEdgarTargets({
      held: [],
      env: ["ZZZZ"],
      catalog,
    });
    expect(r.targets).toEqual([]);
    expect(r.unmatched).toEqual(["ZZZZ"]);
  });
});

describe("statementLookupHeldRefs", () => {
  it("국내·미국 섹터 종목을 중복 없이", () => {
    const kr = statementLookupHeldRefs(["kr"]);
    const us = statementLookupHeldRefs(["us"]);
    expect(kr.length).toBeGreaterThan(20);
    expect(us.length).toBeGreaterThan(20);
    expect(kr.some((h) => h.symbol === "035420" && h.market === "KRX")).toBe(true);
    expect(us.some((h) => h.symbol === "NVDA" && h.market === "US")).toBe(true);
    expect(new Set(kr.map((h) => h.symbol)).size).toBe(kr.length);
  });
});

describe("catalog 필요 여부", () => {
  it("env에 corp가 있고 국내 보유가 없으면 DART 목록 생략", () => {
    expect(dartNeedsCatalog([], ["005930:00126380:삼성전자"])).toBe(false);
    expect(dartNeedsCatalog([{ symbol: "005930", market: "KRX" }], [])).toBe(true);
    expect(dartNeedsCatalog([], ["005930"])).toBe(true);
  });

  it("env에 CIK가 있고 미국 보유가 없으면 EDGAR 목록 생략", () => {
    expect(edgarNeedsCatalog([], ["AAPL:0000320193"])).toBe(false);
    expect(edgarNeedsCatalog([{ symbol: "AAPL", market: "US" }], [])).toBe(true);
    expect(edgarNeedsCatalog([], ["AAPL"])).toBe(true);
  });
});
