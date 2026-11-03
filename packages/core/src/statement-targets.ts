// 재무제표 수집 대상. 보유·관심 ∪ env. corp_code·CIK는 공식 목록이 있을 때만.
// 목록에 없으면 건너뛴다. 식별자를 추측하지 않는다.

import { extractKoreanCode } from "./yahoo-fundamentals";
import { filingVenueFor } from "./disclosure-links";

export type HeldInstrumentRef = {
  symbol: string;
  market: string;
  name?: string | null;
};

export type DartTargetSpec = { stock: string; corp?: string; name?: string };
export type EdgarTargetSpec = { ticker: string; cik?: string; name?: string };
export type DartCollectTarget = { stock: string; corp: string; name: string };
export type EdgarCollectTarget = { ticker: string; cik: string; name: string };

export type DartCorpEntry = { corp: string; name: string };
export type SecTickerEntry = { cik: string; title: string };

const KR_MARKETS = new Set(["KRX", "KOSDAQ"]);
const US_MARKETS = new Set(["US", "NYSE", "NASDAQ", "AMEX"]);

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}>\\s*([^<]*)\\s*</${name}>`, "i"));
  return (m?.[1] ?? "").trim();
}

/** DART 고유번호 8자리. 숫자가 아니면 null. */
export function padDartCorpCode(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (!d || d.length > 8) return null;
  return d.padStart(8, "0");
}

/** SEC CIK 10자리. */
export function padSecCik(raw: string | number): string | null {
  const d = String(raw).replace(/\D/g, "");
  if (!d || d.length > 10) return null;
  return d.padStart(10, "0");
}

export function dartStockCodeFromInstrument(symbol: string, market: string): string | null {
  const code = extractKoreanCode(symbol);
  if (code) return code;
  const m = market.trim().toUpperCase();
  if (!KR_MARKETS.has(m)) return null;
  const digits = symbol.trim().replace(/\.(KS|KQ)$/i, "");
  return /^\d{6}$/.test(digits) ? digits : null;
}

export function edgarTickerFromInstrument(symbol: string, market: string): string | null {
  const m = market.trim().toUpperCase();
  if (!US_MARKETS.has(m)) return null;
  if (extractKoreanCode(symbol)) return null;
  const t = symbol.trim().toUpperCase();
  if (filingVenueFor(t) !== "edgar") return null;
  return t;
}

/** `종목코드` 또는 `종목코드:corp_code` 또는 `종목코드:corp_code:이름`. */
export function parseDartTarget(raw: string): DartTargetSpec | null {
  const t = raw.trim();
  if (!t) return null;
  const [stockRaw, corpRaw, ...nameParts] = t.split(":");
  if (!stockRaw) return null;
  const stock = extractKoreanCode(stockRaw) ?? stockRaw.trim();
  if (!/^\d{6}$/.test(stock)) return null;
  const corp = corpRaw?.trim() ? padDartCorpCode(corpRaw) ?? undefined : undefined;
  const name = nameParts.join(":").trim() || undefined;
  return { stock, corp, name };
}

/** `티커` 또는 `티커:CIK` 또는 `티커:CIK:이름`. */
export function parseEdgarTarget(raw: string): EdgarTargetSpec | null {
  const t = raw.trim();
  if (!t) return null;
  const [tickerRaw, cikRaw, ...nameParts] = t.split(":");
  if (!tickerRaw) return null;
  const ticker = tickerRaw.trim().toUpperCase();
  if (!ticker || extractKoreanCode(ticker) || filingVenueFor(ticker) === "dart") return null;
  if (filingVenueFor(ticker) !== "edgar") return null;
  const cik = cikRaw?.trim() ? padSecCik(cikRaw) ?? undefined : undefined;
  const name = nameParts.join(":").trim() || undefined;
  return { ticker, cik, name };
}

export function parseDartCorpCodeXml(xml: string): Map<string, DartCorpEntry> {
  const out = new Map<string, DartCorpEntry>();
  if (!xml.trim()) return out;
  for (const m of xml.matchAll(/<list>([\s\S]*?)<\/list>/gi)) {
    const block = m[1] ?? "";
    const stock = tag(block, "stock_code");
    const corp = padDartCorpCode(tag(block, "corp_code"));
    const name = tag(block, "corp_name");
    if (!/^\d{6}$/.test(stock) || !corp) continue;
    out.set(stock, { corp, name: name || stock });
  }
  return out;
}

export function parseSecCompanyTickers(json: unknown): Map<string, SecTickerEntry> {
  const out = new Map<string, SecTickerEntry>();
  if (json == null) return out;
  const rows = Array.isArray(json)
    ? json
    : typeof json === "object"
      ? Object.values(json as Record<string, unknown>)
      : [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Record<string, unknown>;
    const ticker = String(rec.ticker ?? "").trim().toUpperCase();
    const cik = padSecCik(String(rec.cik_str ?? rec.cik ?? ""));
    const title = String(rec.title ?? "").trim();
    if (!ticker || !cik || filingVenueFor(ticker) !== "edgar") continue;
    if (!out.has(ticker)) out.set(ticker, { cik, title: title || ticker });
  }
  return out;
}

export function dartNeedsCatalog(held: HeldInstrumentRef[], env: string[]): boolean {
  if (held.some((h) => dartStockCodeFromInstrument(h.symbol, h.market))) return true;
  return env.some((raw) => {
    const p = parseDartTarget(raw);
    return Boolean(p && !p.corp);
  });
}

export function edgarNeedsCatalog(held: HeldInstrumentRef[], env: string[]): boolean {
  if (held.some((h) => edgarTickerFromInstrument(h.symbol, h.market))) return true;
  return env.some((raw) => {
    const p = parseEdgarTarget(raw);
    return Boolean(p && !p.cik);
  });
}

export function resolveDartTargets(opts: {
  held: HeldInstrumentRef[];
  env: string[];
  catalog: Map<string, DartCorpEntry>;
}): { targets: DartCollectTarget[]; unmatched: string[] } {
  const byStock = new Map<string, DartTargetSpec>();
  for (const h of opts.held) {
    const stock = dartStockCodeFromInstrument(h.symbol, h.market);
    if (!stock) continue;
    const prev = byStock.get(stock);
    byStock.set(stock, { stock, corp: prev?.corp, name: prev?.name ?? h.name?.trim() ?? undefined });
  }
  for (const raw of opts.env) {
    const spec = parseDartTarget(raw);
    if (!spec) continue;
    const prev = byStock.get(spec.stock);
    byStock.set(spec.stock, {
      stock: spec.stock,
      corp: spec.corp ?? prev?.corp,
      name: spec.name ?? prev?.name,
    });
  }
  const targets: DartCollectTarget[] = [];
  const unmatched: string[] = [];
  for (const spec of byStock.values()) {
    const hit = opts.catalog.get(spec.stock);
    const corp = spec.corp ?? hit?.corp;
    const name = spec.name ?? hit?.name ?? spec.stock;
    if (!corp) unmatched.push(spec.stock);
    else targets.push({ stock: spec.stock, corp, name });
  }
  return { targets, unmatched };
}

export function resolveEdgarTargets(opts: {
  held: HeldInstrumentRef[];
  env: string[];
  catalog: Map<string, SecTickerEntry>;
}): { targets: EdgarCollectTarget[]; unmatched: string[] } {
  const byTicker = new Map<string, EdgarTargetSpec>();
  for (const h of opts.held) {
    const ticker = edgarTickerFromInstrument(h.symbol, h.market);
    if (!ticker) continue;
    const prev = byTicker.get(ticker);
    byTicker.set(ticker, { ticker, cik: prev?.cik, name: prev?.name ?? h.name?.trim() ?? undefined });
  }
  for (const raw of opts.env) {
    const spec = parseEdgarTarget(raw);
    if (!spec) continue;
    const prev = byTicker.get(spec.ticker);
    byTicker.set(spec.ticker, {
      ticker: spec.ticker,
      cik: spec.cik ?? prev?.cik,
      name: spec.name ?? prev?.name,
    });
  }
  const targets: EdgarCollectTarget[] = [];
  const unmatched: string[] = [];
  for (const spec of byTicker.values()) {
    const hit = opts.catalog.get(spec.ticker);
    const cik = spec.cik ?? hit?.cik;
    const name = spec.name ?? hit?.title ?? spec.ticker;
    if (!cik) unmatched.push(spec.ticker);
    else targets.push({ ticker: spec.ticker, cik, name });
  }
  return { targets, unmatched };
}
