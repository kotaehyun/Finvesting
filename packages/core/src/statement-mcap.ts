// `/statements` 시가총액 보기. 순위는 Yahoo 수집 `marketCap`만. 없으면 비움.

import { STATEMENT_LOOKUP_GROUPS, type StatementRegionId } from "./statement-regions";
import { unionUnique, yahooTickersFor } from "./quote-targets";
import { formatFundamentalValue } from "./yahoo-fundamentals";

export type McapRankRow = {
  instrumentId: string;
  symbol: string;
  name: string;
  market: string;
  currency: string;
  marketCap: number;
  rank: number;
};

/** 시총 있는 행만, 큰 순. 통화가 섞이면 호출 측에서 먼저 걸러야 한다. */
export function rankByMarketCap<T extends {
  instrumentId: string;
  symbol: string;
  name: string;
  market: string;
  currency: string;
  marketCap?: number | null;
  assetClass?: string | null;
}>(rows: readonly T[]): McapRankRow[] {
  const ranked = rows
    .filter((r) => {
      const ac = (r.assetClass ?? "stock").toLowerCase();
      if (ac === "crypto" || ac === "index") return false;
      return r.marketCap != null && Number.isFinite(r.marketCap) && (r.marketCap as number) > 0;
    })
    .sort((a, b) => (b.marketCap as number) - (a.marketCap as number));
  return ranked.map((r, i) => ({
    instrumentId: r.instrumentId,
    symbol: r.symbol,
    name: r.name,
    market: r.market,
    currency: r.currency,
    marketCap: r.marketCap as number,
    rank: i + 1,
  }));
}

export function formatMcapLabel(marketCap: number, currency: string): string {
  return formatFundamentalValue("marketCap", marketCap, currency);
}

/** 섹터 바로가기 종목을 Yahoo 수집 대상에 합친다. 국내는 .KS 우선. */
export function statementLookupYahooTickers(
  regionIds: readonly StatementRegionId[] = ["kr", "us"],
): string[] {
  const out: string[] = [];
  for (const rid of regionIds) {
    const groups = STATEMENT_LOOKUP_GROUPS[rid] ?? [];
    for (const g of groups) {
      for (const c of g.companies) {
        if (rid === "kr") out.push(...yahooTickersFor("KRX", c.symbol));
        else if (rid === "us") out.push(...yahooTickersFor("US", c.symbol));
      }
    }
  }
  return unionUnique(out, []);
}

export function isDomesticListedMarket(market: string): boolean {
  const m = market.trim().toUpperCase();
  return m === "KRX" || m === "KOSDAQ";
}

/** Yahoo 수집 해외 상장(주로 미국). 전 세계 공식 순위표가 아님. */
export function isOverseasListedMarket(market: string): boolean {
  const m = market.trim().toUpperCase();
  return m === "US" || m === "NYSE" || m === "NASDAQ" || m === "AMEX";
}

export function buildMcapBoards<T extends {
  instrumentId: string;
  symbol: string;
  name: string;
  market: string;
  currency: string;
  marketCap?: number | null;
  assetClass?: string | null;
}>(rows: readonly T[], limit = 20): { kr: McapRankRow[]; world: McapRankRow[] } {
  return {
    kr: rankByMarketCap(rows.filter((r) => isDomesticListedMarket(r.market))).slice(0, limit),
    world: rankByMarketCap(rows.filter((r) => isOverseasListedMarket(r.market))).slice(0, limit),
  };
}

/** 제목·symbols 배열로 종목 관련 뉴스만. 본문 없음. */
export function matchNewsForSymbol<T extends {
  id: string;
  title: string;
  url: string;
  publisher: string | null;
  publishedAt: Date | string | null;
  symbols?: string[] | null;
}>(
  rows: readonly T[],
  symbol: string,
  name: string,
  limit = 3,
): Array<{
  id: string;
  title: string;
  url: string;
  publisher: string | null;
  publishedAt: string | null;
}> {
  const sym = symbol.trim().toLowerCase();
  const nm = name.trim().toLowerCase();
  if (!sym) return [];
  return rows
    .filter((n) => {
      if (Array.isArray(n.symbols) && n.symbols.some((s) => String(s).toLowerCase() === sym)) return true;
      const t = n.title.toLowerCase();
      if (t.includes(sym)) return true;
      if (nm.length >= 2 && t.includes(nm)) return true;
      return false;
    })
    .slice(0, limit)
    .map((n) => ({
      id: n.id,
      title: n.title,
      url: n.url,
      publisher: n.publisher,
      publishedAt: n.publishedAt
        ? (typeof n.publishedAt === "string" ? n.publishedAt : n.publishedAt.toISOString())
        : null,
    }));
}
