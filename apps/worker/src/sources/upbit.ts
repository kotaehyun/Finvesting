import { db, quotes } from "@finvesting/db";
import { parseEnvTargets, unionUnique, upbitMarketCode } from "@finvesting/core";
import { ensureInstrument, loadQuoteTargets } from "../lib/instruments";

// 업비트 공개 API (키 불필요). 일봉 종가 기준.
// 대상 = 보유·관심 중 market=UPBIT + env UPBIT_TARGETS(있으면 합집합).

export async function collectUpbit() {
  const { upbit } = await loadQuoteTargets();
  const fromDb = upbit.map((i) => upbitMarketCode(i.symbol));
  const fromEnv = parseEnvTargets(process.env.UPBIT_TARGETS).map(upbitMarketCode);
  const markets = unionUnique(fromDb, fromEnv);
  if (!markets.length) return { upserted: 0, of: 0, skipped: "no UPBIT holdings/watchlist or UPBIT_TARGETS" };

  let upserted = 0;
  let bars = 0;
  for (const m of markets) {
    try {
      const res = await fetch(`https://api.upbit.com/v1/candles/days?market=${m}&count=90`);
      if (!res.ok) { console.warn(`upbit ${m}: ${res.status}`); continue; }
      const candles = (await res.json()) as Array<{ candle_date_time_kst: string; opening_price: number; high_price: number; low_price: number; trade_price: number; candle_acc_trade_volume: number }>;
      if (!Array.isArray(candles) || !candles.length) continue;
      const symbol = m.replace("KRW-", "");
      const held = upbit.find((i) => i.symbol.toUpperCase() === symbol);
      const inst = held
        ? { id: held.id }
        : await ensureInstrument({ symbol, market: "UPBIT", name: symbol, assetClass: "crypto", currency: "KRW" });
      for (const c of candles) {
        await db.insert(quotes).values({
          instrumentId: inst.id, date: c.candle_date_time_kst.slice(0, 10),
          open: String(c.opening_price), high: String(c.high_price), low: String(c.low_price), close: String(c.trade_price),
          volume: String(Math.round(c.candle_acc_trade_volume)), source: "upbit",
        }).onConflictDoUpdate({
          target: [quotes.instrumentId, quotes.date],
          set: {
            open: String(c.opening_price), high: String(c.high_price), low: String(c.low_price),
            close: String(c.trade_price), volume: String(Math.round(c.candle_acc_trade_volume)), fetchedAt: new Date(),
          },
        });
        bars++;
      }
      upserted++;
    } catch (e) { console.warn(`upbit ${m} failed`, (e as Error).message); }
  }
  return { upserted, of: markets.length, bars };
}
