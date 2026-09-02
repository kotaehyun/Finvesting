import { and, eq } from "drizzle-orm";
import { db, instruments, instrumentIdentifiers } from "@finvesting/db";

type AssetClass = "stock" | "etf" | "bond" | "crypto" | "fund" | "other";

// (symbol, market)로 종목을 찾거나 만든다. 어댑터 공용.
export async function ensureInstrument(p: { symbol: string; market: string; name: string; assetClass: AssetClass; currency: string }) {
  const [found] = await db.select().from(instruments).where(and(eq(instruments.symbol, p.symbol), eq(instruments.market, p.market)));
  if (found) return found;
  const [created] = await db.insert(instruments).values(p).returning();
  return created!;
}

export async function ensureIdentifier(instrumentId: string, provider: string, externalId: string) {
  await db.insert(instrumentIdentifiers).values({ instrumentId, provider, externalId }).onConflictDoNothing();
}

// 수집 대상 목록: 관심 종목 + 보유 종목. 지금은 환경변수로 간단히, 이후 watchlist/trades 테이블에서 읽도록 교체.
export function targetSymbols(envKey: string, fallback: string[]) {
  const v = process.env[envKey];
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : fallback;
}
