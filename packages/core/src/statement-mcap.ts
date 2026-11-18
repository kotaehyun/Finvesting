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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 한글 회사명 바로 뒤에만 허용하는 조사.
 * 카카오뱅크·현대차증권처럼 다른 회사로 이어지면 매칭하지 않는다.
 */
export const HANGUL_NAME_PARTICLES = [
  "까지",
  "부터",
  "보다",
  "으로",
  "가",
  "이",
  "는",
  "은",
  "를",
  "을",
  "의",
  "도",
  "와",
  "과",
  "에",
  "로",
  "만",
] as const;

const HANGUL_NAME_PARTICLE_SET = new Set<string>(HANGUL_NAME_PARTICLES);

/** 앞이 한글·숫자이거나, 뒤에 조사가 아닌 한글이 붙으면 제외한다. */
function hangulNameInTitle(title: string, name: string): boolean {
  let from = 0;
  while (from < title.length) {
    const at = title.indexOf(name, from);
    if (at < 0) return false;
    const prev = at > 0 ? title.charAt(at - 1) : "";
    const prevBlocked = prev !== "" && /[가-힣0-9]/.test(prev);
    if (!prevBlocked) {
      const run = title.slice(at + name.length).match(/^[가-힣]+/)?.[0] ?? "";
      if (run === "" || HANGUL_NAME_PARTICLE_SET.has(run)) return true;
    }
    from = at + name.length;
  }
  return false;
}

/** 영문 티커·영문 회사명은 저장된 대소문자와 단어 경계. 3글자 이하 티커와 숫자 종목코드는 제목에서 찾지 않는다. */
export function titleMentionsInstrument(title: string, symbol: string, name: string): boolean {
  const sym = symbol.trim();
  const nm = name.trim();
  if (nm.length >= 2) {
    if (/[가-힣]/.test(nm)) {
      if (hangulNameInTitle(title, nm)) return true;
    } else if (new RegExp(`\\b${escapeRegExp(nm)}\\b`).test(title)) {
      return true;
    }
  }
  if (sym.length <= 3 || /^\d+$/.test(sym)) return false;
  return new RegExp(`\\b${escapeRegExp(sym)}\\b`).test(title);
}

/** 수집 시 제목에 나온 종목 코드만. 본문은 보지 않는다. */
export function symbolsMentionedInTitle(
  title: string,
  instruments: readonly { symbol: string; name: string }[],
): string[] {
  const found: string[] = [];
  for (const inst of instruments) {
    const sym = inst.symbol.trim();
    if (!sym || found.some((s) => s.toLowerCase() === sym.toLowerCase())) continue;
    if (titleMentionsInstrument(title, sym, inst.name)) found.push(sym);
  }
  return found;
}

/** 제목으로 종목 관련 뉴스만. 저장된 symbols는 조회 조건이 아니다. 본문 없음. */
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
  if (!sym) return [];
  return rows
    .filter((n) => titleMentionsInstrument(n.title, symbol, name))
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
