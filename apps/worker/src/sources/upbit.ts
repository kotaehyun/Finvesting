import { db, instruments, quotes } from "@finvesting/db";
import { eq, and } from "drizzle-orm";

// 업비트 공개 API (키 불필요). 일봉 종가 기준.
const MARKETS = ["KRW-BTC", "KRW-ETH"];

export async function collectUpbit() {
  let upserted = 0;
  for (const m of MARKETS) {
    const res = await fetch(`https://api.upbit.com/v1/candles/days?market=${m}&count=1`);
    if (!res.ok) throw new Error(`upbit ${m}: ${res.status}`);
    const [c] = (await res.json()) as Array<{ candle_date_time_kst: string; opening_price: number; high_price: number; low_price: number; trade_price: number; candle_acc_trade_volume: number }>;
    if (!c) continue;
    const symbol = m.replace("KRW-", "");
    let [inst] = await db.select().from(instruments).where(and(eq(instruments.symbol, symbol), eq(instruments.market, "UPBIT")));
    if (!inst) [inst] = await db.insert(instruments).values({ symbol, market: "UPBIT", name: symbol, assetClass: "crypto", currency: "KRW" }).returning();
    await db.insert(quotes).values({
      instrumentId: inst!.id, date: c.candle_date_time_kst.slice(0, 10),
      open: String(c.opening_price), high: String(c.high_price), low: String(c.low_price), close: String(c.trade_price),
      volume: String(Math.round(c.candle_acc_trade_volume)), source: "upbit",
    }).onConflictDoUpdate({ target: [quotes.instrumentId, quotes.date], set: { close: String(c.trade_price), fetchedAt: new Date() } });
    upserted++;
  }
  return { upserted };
}
