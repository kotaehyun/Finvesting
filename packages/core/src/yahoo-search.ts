// Yahoo 종목 검색 결과 정규화. 시세는 저장하지 않고, 검색 응답의 제목·심볼·거래소만 쓴다.
// 뉴스 배열은 쓰지 않는다(본문·요약 저장 금지).

import { dartCompanyPopupUrl, edgarCompanyUrl, filingVenueFor } from "./disclosure-links";
import { extractKoreanCode, naverQuoteUrl, yahooQuoteUrl } from "./yahoo-fundamentals";

export type YahooSearchHit = {
  symbol: string;
  name: string;
  exchange: string | null;
  quoteType: string | null;
  yahooUrl: string;
  naverUrl: string | null;
  dartUrl: string | null;
  edgarUrl: string | null;
};

export function krStockCode(symbol: string): string | null {
  return extractKoreanCode(symbol);
}

export function naverStockUrl(symbol: string): string | null {
  return naverQuoteUrl(symbol);
}

type RawQuote = {
  symbol?: unknown;
  shortname?: unknown;
  longname?: unknown;
  exchange?: unknown;
  exchDisp?: unknown;
  quoteType?: unknown;
  typeDisp?: unknown;
};

export type InstrumentDraft = {
  symbol: string;
  market: string;
  name: string;
  assetClass: "stock" | "etf" | "crypto" | "other";
  currency: string;
};

/** Yahoo 검색 한 줄을 instruments 행으로. 지수·선물은 넣지 않는다. */
export function instrumentFromYahooHit(hit: {
  symbol: string;
  name: string;
  exchange: string | null;
  quoteType: string | null;
}): InstrumentDraft | null {
  const raw = hit.symbol.trim();
  if (!raw) return null;
  const qt = (hit.quoteType ?? "").toUpperCase();
  if (/\b(INDEX|FUTURE|OPTION|MUTUALFUND)\b/.test(qt) || qt.includes("지수") || qt.includes("선물")) {
    return null;
  }
  const name = hit.name.trim() || raw;
  const kr = /^(\d{6})\.(KS|KQ)$/i.exec(raw);
  if (kr) {
    const code = kr[1]!;
    const board = kr[2]!.toUpperCase();
    const etf = qt.includes("ETF");
    return {
      symbol: code,
      market: board === "KQ" ? "KOSDAQ" : "KRX",
      name,
      assetClass: etf ? "etf" : "stock",
      currency: "KRW",
    };
  }
  if (qt.includes("CRYPTO") || qt.includes("CCC") || qt.includes("암호화")) {
    return { symbol: raw.toUpperCase(), market: "US", name, assetClass: "crypto", currency: "USD" };
  }
  const etf = qt.includes("ETF");
  const ex = (hit.exchange ?? "").toUpperCase();
  let market = "US";
  if (ex.includes("NASDAQ") || ex === "NMS" || ex === "NGM") market = "NASDAQ";
  else if (ex.includes("NYSE") || ex === "NYQ") market = "NYSE";
  else if (ex.includes("AMEX") || ex === "ASE") market = "AMEX";
  return {
    symbol: raw.toUpperCase(),
    market,
    name,
    assetClass: etf ? "etf" : "stock",
    currency: "USD",
  };
}

export function parseYahooSearchQuotes(json: unknown, limit = 8): YahooSearchHit[] {
  const quotes = (json as { quotes?: RawQuote[] })?.quotes;
  if (!Array.isArray(quotes)) return [];
  const out: YahooSearchHit[] = [];
  const seen = new Set<string>();
  for (const q of quotes) {
    if (out.length >= limit) break;
    const symbol = typeof q.symbol === "string" ? q.symbol.trim() : "";
    if (!symbol || seen.has(symbol.toUpperCase())) continue;
    seen.add(symbol.toUpperCase());
    const name = (typeof q.shortname === "string" && q.shortname.trim()
      ? q.shortname.trim()
      : typeof q.longname === "string" ? q.longname.trim() : symbol);
    const exchange = typeof q.exchDisp === "string" && q.exchDisp.trim()
      ? q.exchDisp.trim()
      : (typeof q.exchange === "string" ? q.exchange : null);
    const quoteType = typeof q.typeDisp === "string" && q.typeDisp.trim()
      ? q.typeDisp.trim()
      : (typeof q.quoteType === "string" ? q.quoteType : null);
    const code = krStockCode(symbol);
    out.push({
      symbol,
      name: name || symbol,
      exchange,
      quoteType,
      yahooUrl: yahooQuoteUrl(symbol),
      naverUrl: naverStockUrl(symbol),
      dartUrl: code ? dartCompanyPopupUrl(code) : null,
      edgarUrl: filingVenueFor(symbol) === "edgar" ? edgarCompanyUrl(symbol) : null,
    });
  }
  return out;
}
