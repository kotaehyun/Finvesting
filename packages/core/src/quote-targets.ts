// 시세 수집 대상 매핑. 보유·관심 종목의 market → 업비트/야후 심볼.
// env *_TARGETS는 합집합으로만 더한다.

export type QuoteCollector = "upbit" | "yahoo";

export type InstrumentRef = {
  symbol: string;
  market: string;
};

export function parseEnvTargets(raw: string | undefined | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const s = part.trim();
    if (!s) continue;
    const key = s.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

export function unionUnique(a: string[], b: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of [...a, ...b]) {
    const key = s.trim().toUpperCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(s.trim());
  }
  return out;
}

export function quoteCollectorFor(market: string): QuoteCollector | null {
  const m = market.trim().toUpperCase();
  if (m === "UPBIT") return "upbit";
  if (m === "NASDAQ" || m === "NYSE" || m === "AMEX" || m === "US" || m === "KRX" || m === "KOSDAQ") return "yahoo";
  return null;
}

/** 업비트 REST 마켓 코드. BTC → KRW-BTC, KRW-ETH는 그대로. */
export function upbitMarketCode(symbol: string): string {
  const s = symbol.trim().toUpperCase();
  if (s.startsWith("KRW-")) return s;
  return `KRW-${s.replace(/^KRW-/, "")}`;
}

/**
 * 야후 조회 심볼. KRX는 `.KS` 우선, 실패 시 `.KQ`를 쓰도록 둘 다 준다.
 * 코스닥을 market=KOSDAQ으로 넣은 경우 `.KQ`만.
 */
export function yahooTickersFor(market: string, symbol: string): string[] {
  const m = market.trim().toUpperCase();
  const s = symbol.trim();
  if (!s) return [];
  if (/\.(KS|KQ)$/i.test(s) || s.startsWith("^") || s.includes("=")) return [s];
  if (m === "KOSDAQ") return [`${s}.KQ`];
  if (m === "KRX") return [`${s}.KS`, `${s}.KQ`];
  return [s];
}

export function splitByCollector(rows: InstrumentRef[]): { upbit: InstrumentRef[]; yahoo: InstrumentRef[] } {
  const upbit: InstrumentRef[] = [];
  const yahoo: InstrumentRef[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const key = `${r.market.trim().toUpperCase()}:${r.symbol.trim().toUpperCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const c = quoteCollectorFor(r.market);
    if (c === "upbit") upbit.push(r);
    else if (c === "yahoo") yahoo.push(r);
  }
  return { upbit, yahoo };
}
