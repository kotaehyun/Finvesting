import { and, eq, inArray } from "drizzle-orm";
import { db, instruments, instrumentIdentifiers, trades, watchlist } from "@finvesting/db";
import { parseEnvTargets, quoteCollectorFor, unionUnique, type InstrumentRef } from "@finvesting/core";

type AssetClass = "stock" | "etf" | "bond" | "crypto" | "fund" | "other";

// (symbol, market)로 종목을 찾거나 만든다. 어댑터 공용.
export async function ensureInstrument(p: { symbol: string; market: string; name: string; assetClass: AssetClass; currency: string }) {
  const [found] = await db.select().from(instruments).where(and(eq(instruments.symbol, p.symbol), eq(instruments.market, p.market)));
  if (found) {
    if (p.name && found.name !== p.name && (/^\d{6}/.test(found.name) || found.name.includes(","))) {
      await db.update(instruments).set({ name: p.name }).where(eq(instruments.id, found.id));
      return { ...found, name: p.name };
    }
    return found;
  }
  if (/^\d{6}$/.test(p.symbol)) {
    const [kr] = await db.select().from(instruments).where(eq(instruments.symbol, p.symbol));
    if (kr) {
      await db.update(instruments).set({ market: p.market, name: p.name, currency: p.currency, assetClass: p.assetClass }).where(eq(instruments.id, kr.id));
      return { ...kr, market: p.market, name: p.name, currency: p.currency, assetClass: p.assetClass };
    }
  }
  const [created] = await db.insert(instruments).values(p).onConflictDoNothing().returning();
  if (created) return created;
  const [again] = await db.select().from(instruments).where(and(eq(instruments.symbol, p.symbol), eq(instruments.market, p.market)));
  return again!;
}

export async function ensureIdentifier(instrumentId: string, provider: string, externalId: string) {
  await db.insert(instrumentIdentifiers).values({ instrumentId, provider, externalId }).onConflictDoNothing();
}

// 수집 대상: trades(체결) ∪ watchlist(관심). env *_TARGETS는 있으면 합집합.
export function targetSymbols(envKey: string, fallback: string[] = []) {
  const fromEnv = parseEnvTargets(process.env[envKey]);
  return fromEnv.length ? unionUnique(fromEnv, []) : fallback;
}

export async function loadHeldInstruments(): Promise<Array<InstrumentRef & { id: string; name: string; assetClass: string; currency: string }>> {
  const tradeIds = await db.selectDistinct({ instrumentId: trades.instrumentId }).from(trades);
  const watchIds = await db.selectDistinct({ instrumentId: watchlist.instrumentId }).from(watchlist);
  const ids = [...new Set([...tradeIds, ...watchIds].map((r) => r.instrumentId))];
  if (!ids.length) return [];
  const rows = await db.select().from(instruments).where(inArray(instruments.id, ids));
  return rows.map((r) => ({
    id: r.id,
    symbol: r.symbol,
    market: r.market,
    name: r.name,
    assetClass: r.assetClass,
    currency: r.currency,
  }));
}

export async function loadQuoteTargets() {
  const held = await loadHeldInstruments();
  return {
    held,
    upbit: held.filter((h) => quoteCollectorFor(h.market) === "upbit"),
    yahoo: held.filter((h) => quoteCollectorFor(h.market) === "yahoo"),
  };
}

export { parseEnvTargets, quoteCollectorFor, unionUnique };
