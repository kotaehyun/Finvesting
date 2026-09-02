import { db, quotes, fundamentals } from "@finvesting/db";
import { ensureInstrument, ensureIdentifier, targetSymbols } from "../lib/instruments.js";

// Yahoo Finance — 비공식 라이브러리(yahoo-finance2). 개인 사용은 사실상 문제없으나 서비스화 시 정식 데이터 공급자로 교체 필요.
// 미국 주식/ETF/지수 일봉 + 핵심 지표(시총, PER, PBR, EPS, 배당수익률, 베타).
// YAHOO_TARGETS="AAPL,MSFT,SPY,QQQ,^GSPC,^IXIC"
// TODO: yahoo-finance2 v2 API 형태 확인 필요 (quote / historical 메서드 시그니처)

export async function collectYahoo() {
  const symbols = targetSymbols("YAHOO_TARGETS", ["SPY", "QQQ", "^GSPC", "^IXIC"]);
  const yf = (await import("yahoo-finance2")).default;
  const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 10);
  let upserted = 0;
  for (const sym of symbols) {
    try {
      const q = await yf.quote(sym) as Record<string, unknown>;
      const assetClass = sym.startsWith("^") ? "other" : (q.quoteType === "ETF" ? "etf" : "stock");
      const inst = await ensureInstrument({ symbol: sym, market: "US", name: String(q.shortName ?? q.longName ?? sym), assetClass, currency: String(q.currency ?? "USD") });
      await ensureIdentifier(inst.id, "yahoo", sym);
      const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? String(v) : null);
      if (q.regularMarketPrice != null) {
        await db.insert(quotes).values({
          instrumentId: inst.id, date: today,
          open: n(q.regularMarketOpen), high: n(q.regularMarketDayHigh), low: n(q.regularMarketDayLow),
          close: String(q.regularMarketPrice), volume: n(q.regularMarketVolume), source: "yahoo",
        }).onConflictDoUpdate({ target: [quotes.instrumentId, quotes.date], set: { close: String(q.regularMarketPrice), fetchedAt: new Date() } });
      }
      if (assetClass === "stock") {
        await db.insert(fundamentals).values({
          instrumentId: inst.id, date: today, source: "yahoo",
          marketCap: n(q.marketCap), per: n(q.trailingPE), forwardPer: n(q.forwardPE), pbr: n(q.priceToBook),
          eps: n(q.epsTrailingTwelveMonths), dividendYield: n(q.dividendYield), beta: n(q.beta),
          extra: { fiftyTwoWeekHigh: q.fiftyTwoWeekHigh, fiftyTwoWeekLow: q.fiftyTwoWeekLow, averageVolume: q.averageDailyVolume3Month },
        }).onConflictDoUpdate({ target: [fundamentals.instrumentId, fundamentals.date, fundamentals.source], set: { per: n(q.trailingPE), marketCap: n(q.marketCap), fetchedAt: new Date() } });
      }
      upserted++;
    } catch (e) { console.warn(`yahoo ${sym} failed`, (e as Error).message); }
  }
  return { upserted };
}
