import { and, eq } from "drizzle-orm";
import { db, quotes, fundamentals, macroIndicators } from "@finvesting/db";
import { parseEnvTargets, yahooTickersFor } from "@finvesting/core";
import { ensureInstrument, ensureIdentifier, loadQuoteTargets } from "../lib/instruments";

// Yahoo Finance — 비공식 라이브러리 yahoo-finance2 v3 (v2는 2025년 지원 종료).
// 개인 사용은 사실상 문제없으나 서비스화 시 정식 데이터 공급자로 교체 필요.
// 대상 = 보유·관심(NASDAQ|NYSE|AMEX|US|KRX|KOSDAQ) + env YAHOO_TARGETS(있으면 합집합).
// KRX는 005930.KS 실패 시 .KQ 재시도. KIS는 이번 범위 아님.
// USDKRW: KRW=X를 macro_indicators에 source=yahoo로 넣는다.
// 같은 (code, date)에 ECOS가 있으면 덮어쓰지 않는다. ECOS 수집이 있으면 source=ecos로 갱신한다.
// 429(Too Many Requests)가 잦으므로 종목 간 간격 + 재시도.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const GAP_MS = Number(process.env.YAHOO_GAP_MS ?? 1500);

type Quote = Record<string, unknown>;
type Held = { id: string; symbol: string; market: string; name: string; assetClass: string; currency: string };
type Job = { tickers: string[]; inst?: Held };

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

async function quoteFirst(yf: { quote: (s: string) => Promise<unknown> }, tickers: string[]): Promise<{ ticker: string; q: Quote } | null> {
  for (const ticker of tickers) {
    const q = await quoteWithRetry(yf, ticker);
    if (q && q.regularMarketPrice != null) return { ticker, q };
    if (tickers.length > 1) await sleep(GAP_MS);
  }
  return null;
}

async function collectUsdKrw(yf: { quote: (s: string) => Promise<unknown> }) {
  const q = await quoteWithRetry(yf, "KRW=X");
  const px = q?.regularMarketPrice;
  if (!q || typeof px !== "number" || !Number.isFinite(px)) return { usdkrw: false };
  const t = q.regularMarketTime;
  const date = t instanceof Date ? t.toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 10)
    : typeof t === "number" ? new Date(t * 1000).toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 10)
    : new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 10);
  const value = String(px);
  const [existing] = await db.select({ source: macroIndicators.source })
    .from(macroIndicators)
    .where(and(eq(macroIndicators.code, "USDKRW"), eq(macroIndicators.date, date)))
    .limit(1);
  if (existing?.source === "ecos") return { usdkrw: true, from: "ecos" };
  await db.insert(macroIndicators).values({
    code: "USDKRW", date, value, unit: "KRW", source: "yahoo",
  }).onConflictDoUpdate({
    target: [macroIndicators.code, macroIndicators.date],
    set: { value, fetchedAt: new Date(), source: "yahoo" },
  });
  return { usdkrw: true, from: "yahoo" };
}

export async function collectYahoo() {
  const { yahoo } = await loadQuoteTargets();
  const jobs: Job[] = yahoo.map((inst) => ({ tickers: yahooTickersFor(inst.market, inst.symbol), inst }));
  const seen = new Set(jobs.flatMap((j) => j.tickers.map((t) => t.toUpperCase())));
  for (const sym of parseEnvTargets(process.env.YAHOO_TARGETS)) {
    if (seen.has(sym.toUpperCase())) continue;
    if (sym.toUpperCase() === "KRW=X") continue;
    seen.add(sym.toUpperCase());
    jobs.push({ tickers: [sym] });
  }

  const mod = await import("yahoo-finance2");
  const YahooFinance = mod.default as unknown as new (opts?: { suppressNotices?: string[] }) => { quote: (s: string) => Promise<unknown> };
  const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 10);

  const fx = await collectUsdKrw(yf);
  await sleep(GAP_MS);

  let upserted = 0;
  for (const job of jobs) {
    const hit = await quoteFirst(yf, job.tickers);
    if (!hit) { await sleep(GAP_MS); continue; }
    const { ticker, q } = hit;
    try {
      const assetClass = job.inst?.assetClass
        ?? (ticker.startsWith("^") ? "other" : (q.quoteType === "ETF" ? "etf" : "stock"));
      const inst = job.inst
        ? { id: job.inst.id }
        : await ensureInstrument({
          symbol: ticker,
          market: "US",
          name: String(q.shortName ?? q.longName ?? ticker),
          assetClass: assetClass === "bond" || assetClass === "crypto" || assetClass === "fund" || assetClass === "other" || assetClass === "etf" ? assetClass : "stock",
          currency: String(q.currency ?? "USD"),
        });
      await ensureIdentifier(inst.id, "yahoo", ticker);
      const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? String(v) : null);
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
    } catch (e) { console.warn(`yahoo ${ticker} save failed`, (e as Error).message); }
    await sleep(GAP_MS);
  }
  return { upserted, of: jobs.length, ...fx };
}
