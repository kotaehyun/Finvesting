import { db, quotes, fundamentals } from "@finvesting/db";
import { ensureInstrument, ensureIdentifier, targetSymbols } from "../lib/instruments";

// Yahoo Finance — 비공식 라이브러리 yahoo-finance2 v3 (v2는 2025년 지원 종료).
// 개인 사용은 사실상 문제없으나 서비스화 시 정식 데이터 공급자로 교체 필요.
// 미국 주식/ETF/지수 일봉 + 핵심 지표(시총, PER, PBR, EPS, 배당수익률, 베타).
// YAHOO_TARGETS="AAPL,MSFT,SPY,QQQ,^GSPC,^IXIC"
// 429(Too Many Requests)가 잦으므로 종목 간 간격 + 재시도.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const GAP_MS = Number(process.env.YAHOO_GAP_MS ?? 1500);

type Quote = Record<string, unknown>;

async function quoteWithRetry(yf: { quote: (s: string) => Promise<unknown> }, sym: string, tries = 3): Promise<Quote | null> {
  for (let i = 0; i < tries; i++) {
    try {
      return (await yf.quote(sym)) as Quote;
    } catch (e) {
      const msg = (e as Error).message ?? String(e);
      if (/Too Many Requests|429/.test(msg) && i < tries - 1) { await sleep(5000 * (i + 1)); continue; }
      console.warn(`yahoo ${sym} failed`, msg.split("\n")[0]);
      return null;
    }
  }
  return null;
}

export async function collectYahoo() {
  const symbols = targetSymbols("YAHOO_TARGETS", ["SPY", "QQQ", "^GSPC", "^IXIC"]);
  const mod = await import("yahoo-finance2");
  const YahooFinance = mod.default as unknown as new (opts?: { suppressNotices?: string[] }) => { quote: (s: string) => Promise<unknown> };
  const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 10);
  let upserted = 0;
  for (const sym of symbols) {
    const q = await quoteWithRetry(yf, sym);
    if (!q) { await sleep(GAP_MS); continue; }
    try {
      const assetClass = sym.startsWith("^") ? "other" : (q.quoteType === "ETF" ? "etf" : "stock");
      const inst = await ensureInstrument({ symbol: sym, market: "US", name: String(q.shortName ?? q.longName ?? sym), assetClass, currency: String(q.currency ?? "USD") });
      await ensureIdentifier(inst.id, "yahoo", sym);
      const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? String(v) : null);
      // 시세일: 야후가 주는 거래 시각(regularMarketTime, 초 단위) 기준 미국 동부 날짜. 없으면 KST 오늘
      const t = q.regularMarketTime;
      const tradeDate = t instanceof Date ? t.toLocaleString("sv-SE", { timeZone: "America/New_York" }).slice(0, 10)
        : typeof t === "number" ? new Date(t * 1000).toLocaleString("sv-SE", { timeZone: "America/New_York" }).slice(0, 10)
        : today;
      if (q.regularMarketPrice != null) {
        await db.insert(quotes).values({
          instrumentId: inst.id, date: tradeDate,
          open: n(q.regularMarketOpen), high: n(q.regularMarketDayHigh), low: n(q.regularMarketDayLow),
          close: String(q.regularMarketPrice), volume: n(q.regularMarketVolume), source: "yahoo",
        }).onConflictDoUpdate({
          target: [quotes.instrumentId, quotes.date],
          set: {
            open: n(q.regularMarketOpen), high: n(q.regularMarketDayHigh), low: n(q.regularMarketDayLow),
            close: String(q.regularMarketPrice), volume: n(q.regularMarketVolume), fetchedAt: new Date(),
          },
        });
      }
      if (assetClass === "stock") {
        const extra = { fiftyTwoWeekHigh: q.fiftyTwoWeekHigh, fiftyTwoWeekLow: q.fiftyTwoWeekLow, averageVolume: q.averageDailyVolume3Month };
        await db.insert(fundamentals).values({
          instrumentId: inst.id, date: tradeDate, source: "yahoo",
          marketCap: n(q.marketCap), per: n(q.trailingPE), forwardPer: n(q.forwardPE), pbr: n(q.priceToBook),
          eps: n(q.epsTrailingTwelveMonths), dividendYield: n(q.dividendYield), beta: n(q.beta),
          extra,
        }).onConflictDoUpdate({
          target: [fundamentals.instrumentId, fundamentals.date, fundamentals.source],
          set: {
            marketCap: n(q.marketCap), per: n(q.trailingPE), forwardPer: n(q.forwardPE), pbr: n(q.priceToBook),
            eps: n(q.epsTrailingTwelveMonths), dividendYield: n(q.dividendYield), beta: n(q.beta),
            extra, fetchedAt: new Date(),
          },
        });
      }
      upserted++;
    } catch (e) { console.warn(`yahoo ${sym} save failed`, (e as Error).message); }
    await sleep(GAP_MS);
  }
  return { upserted, of: symbols.length };
}
