import { and, eq } from "drizzle-orm";
import { db, quotes, fundamentals, macroIndicators } from "@finvesting/db";
import { parseEnvTargets, unionUnique, WORLD_INDICES, worldIndexByYahoo, worldIndexMarket, worldIndexYahooTickers, yahooSavesFundamentals, yahooTickersFor, yahooBoardMarket, yahooBoardSymbol, DEFAULT_YAHOO_STOCKS, FX_PAIRS, fxYahooTickers } from "@finvesting/core";
import { ensureInstrument, ensureIdentifier, loadQuoteTargets } from "../lib/instruments";

// Yahoo Finance — 비공식 라이브러리 yahoo-finance2 v3 (v2는 2025년 지원 종료).
// 개인 사용은 사실상 문제없으나 서비스화 시 정식 데이터 공급자로 교체 필요.
// 대상 = 보유·관심 + YAHOO_TARGETS + DEFAULT_YAHOO_STOCKS(카카오 035720.KS) + 세계 지수(core/world-indices).
// KRX는 005930.KS 실패 시 .KQ 재시도. KIS는 이번 범위 아님.
// USDKRW 등 환율: Yahoo FX를 macro_indicators에 source=yahoo로 넣는다.
// 같은 (code, date)에 ECOS가 있으면 USDKRW는 덮어쓰지 않는다.
// 429(Too Many Requests)가 잦으므로 종목 간 간격 + 재시도.
// 주식·ETF는 quote 외에 quoteSummary(financialData, defaultKeyStatistics)로 ROE·TTM·D/E·베타를 채운다. 지수·상품은 시세만.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const GAP_MS = Number(process.env.YAHOO_GAP_MS ?? 1500);

type Quote = Record<string, unknown>;
type Summary = { financialData?: Record<string, unknown>; defaultKeyStatistics?: Record<string, unknown> };
type ChartBar = {
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
};
type Yf = {
  quote: (s: string) => Promise<unknown>;
  quoteSummary: (s: string, opts: { modules: string[] }) => Promise<Summary>;
  chart: (s: string, opts: { period1: string; interval: "1d" }) => Promise<{ quotes: ChartBar[]; meta?: { currency?: string } }>;
};
type Held = { id: string; symbol: string; market: string; name: string; assetClass: string; currency: string };
type Job = { tickers: string[]; inst?: Held };

const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? String(v) : null);

function dividendYieldStr(q: Quote): string | null {
  const dy = n(q.dividendYield);
  if (dy != null) return dy;
  // quote.dividendYield는 퍼센트 숫자(AAPL 0.33). trailing은 비율(0.0032)이라 ×100.
  const trail = typeof q.trailingAnnualDividendYield === "number" ? q.trailingAnnualDividendYield : null;
  if (trail != null && Number.isFinite(trail)) return String(trail * 100);
  return null;
}

function extraFromQuote(q: Quote): Record<string, unknown> {
  const extra: Record<string, unknown> = {};
  if (typeof q.fiftyTwoWeekHigh === "number") extra.fiftyTwoWeekHigh = q.fiftyTwoWeekHigh;
  if (typeof q.fiftyTwoWeekLow === "number") extra.fiftyTwoWeekLow = q.fiftyTwoWeekLow;
  if (typeof q.averageDailyVolume3Month === "number") extra.averageVolume = q.averageDailyVolume3Month;
  if (typeof q.ytdReturn === "number") extra.ytdReturn = q.ytdReturn;
  if (typeof q.netExpenseRatio === "number") extra.netExpenseRatio = q.netExpenseRatio;
  if (typeof q.netAssets === "number") extra.netAssets = q.netAssets;
  if (typeof q.quoteType === "string") extra.quoteType = q.quoteType;
  return extra;
}

async function quoteWithRetry(yf: Yf, sym: string, tries = 3): Promise<Quote | null> {
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

async function quoteFirst(yf: Yf, tickers: string[]): Promise<{ ticker: string; q: Quote } | null> {
  for (const ticker of tickers) {
    const q = await quoteWithRetry(yf, ticker);
    if (q && q.regularMarketPrice != null) return { ticker, q };
    if (tickers.length > 1) await sleep(GAP_MS);
  }
  return null;
}

async function summaryWithRetry(yf: Yf, sym: string, tries = 3): Promise<Summary | null> {
  for (let i = 0; i < tries; i++) {
    try {
      return await yf.quoteSummary(sym, { modules: ["financialData", "defaultKeyStatistics"] });
    } catch (e) {
      const msg = (e as Error).message ?? String(e);
      if (/Too Many Requests|429/.test(msg) && i < tries - 1) { await sleep(5000 * (i + 1)); continue; }
      console.warn(`yahoo ${sym} summary failed`, msg.split("\n")[0]);
      return null;
    }
  }
  return null;
}

async function chartWithRetry(yf: Yf, sym: string, period1: string, tries = 3): Promise<ChartBar[] | null> {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await yf.chart(sym, { period1, interval: "1d" });
      return r.quotes ?? [];
    } catch (e) {
      const msg = (e as Error).message ?? String(e);
      if (/Too Many Requests|429/.test(msg) && i < tries - 1) { await sleep(5000 * (i + 1)); continue; }
      console.warn(`yahoo ${sym} chart failed`, msg.split("\n")[0]);
      return null;
    }
  }
  return null;
}

// 세계 지수 일봉. quote()는 당일만 넣어서 스파크라인에 점이 부족하다. 40일 미만이면 90일 차트를 채운다.
async function collectIndexCharts(yf: Yf) {
  const period1 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  let bars = 0;
  for (const idx of WORLD_INDICES) {
    const inst = await ensureInstrument({
      symbol: idx.yahoo,
      market: worldIndexMarket(idx),
      name: idx.label,
      assetClass: idx.region === "crypto" ? "crypto" : "other",
      currency: idx.region === "kr" ? "KRW" : idx.region === "jp" ? "JPY" : idx.region === "eu" ? "EUR" : idx.region === "hk" ? "HKD" : "USD",
    });
    const have = await db.select({ date: quotes.date }).from(quotes).where(eq(quotes.instrumentId, inst.id)).limit(40);
    if (have.length >= 40) continue;
    await ensureIdentifier(inst.id, "yahoo", idx.yahoo);
    const rows = await chartWithRetry(yf, idx.yahoo, period1);
    if (!rows?.length) { await sleep(GAP_MS); continue; }
    const values: Array<{
      instrumentId: string;
      date: string;
      open: string | null;
      high: string | null;
      low: string | null;
      close: string;
      volume: string | null;
      source: string;
    }> = [];
    const seen = new Set<string>();
    for (const b of rows) {
      if (!(b.date instanceof Date) || b.close == null || !Number.isFinite(b.close)) continue;
      const date = b.date.toISOString().slice(0, 10);
      if (seen.has(date)) continue;
      seen.add(date);
      values.push({
        instrumentId: inst.id,
        date,
        open: n(b.open),
        high: n(b.high),
        low: n(b.low),
        close: String(b.close),
        volume: n(b.volume),
        source: "yahoo",
      });
    }
    if (values.length) {
      await db.insert(quotes).values(values).onConflictDoNothing();
      bars += values.length;
    }
    await sleep(GAP_MS);
  }
  return { bars };
}

function seoulDate(t: unknown, fallback: string): string {
  if (t instanceof Date) return t.toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 10);
  if (typeof t === "number") return new Date(t * 1000).toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 10);
  return fallback;
}

async function collectFxRates(yf: Yf) {
  const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 10);
  const period1 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  let upserted = 0;
  let bars = 0;
  let usdkrw = false;
  let from: "yahoo" | "ecos" | undefined;
  for (const pair of FX_PAIRS) {
    const have = await db.select({ date: macroIndicators.date }).from(macroIndicators)
      .where(eq(macroIndicators.code, pair.code)).limit(40);
    if (have.length < 40) {
      const rows = await chartWithRetry(yf, pair.yahoo, period1);
      if (rows?.length) {
        const values: Array<{ code: string; date: string; value: string; unit: string; source: string }> = [];
        const seen = new Set<string>();
        for (const b of rows) {
          if (!(b.date instanceof Date) || b.close == null || !Number.isFinite(b.close)) continue;
          const date = b.date.toISOString().slice(0, 10);
          if (seen.has(date)) continue;
          seen.add(date);
          values.push({ code: pair.code, date, value: String(b.close), unit: pair.unit, source: "yahoo" });
        }
        if (values.length) {
          await db.insert(macroIndicators).values(values).onConflictDoNothing();
          bars += values.length;
        }
      }
      await sleep(GAP_MS);
    }
    const q = await quoteWithRetry(yf, pair.yahoo);
    const px = q?.regularMarketPrice;
    if (!q || typeof px !== "number" || !Number.isFinite(px)) { await sleep(GAP_MS); continue; }
    const date = seoulDate(q.regularMarketTime, today);
    const value = String(px);
    const [existing] = await db.select({ source: macroIndicators.source })
      .from(macroIndicators)
      .where(and(eq(macroIndicators.code, pair.code), eq(macroIndicators.date, date)))
      .limit(1);
    if (pair.code === "USDKRW" && existing?.source === "ecos") {
      usdkrw = true;
      from = "ecos";
      await sleep(GAP_MS);
      continue;
    }
    await db.insert(macroIndicators).values({
      code: pair.code, date, value, unit: pair.unit, source: "yahoo",
    }).onConflictDoUpdate({
      target: [macroIndicators.code, macroIndicators.date],
      set: { value, fetchedAt: new Date(), source: "yahoo" },
    });
    upserted++;
    if (pair.code === "USDKRW") { usdkrw = true; from = "yahoo"; }
    await sleep(GAP_MS);
  }
  return { usdkrw, from, fx: upserted, fxBars: bars };
}

export async function collectYahoo() {
  const { yahoo } = await loadQuoteTargets();
  const jobs: Job[] = yahoo.map((inst) => ({ tickers: yahooTickersFor(inst.market, inst.symbol), inst }));
  const seen = new Set(jobs.flatMap((j) => j.tickers.map((t) => t.toUpperCase())));
  const fxSkip = new Set(fxYahooTickers().map((s) => s.toUpperCase()));
  for (const sym of unionUnique(parseEnvTargets(process.env.YAHOO_TARGETS), [...DEFAULT_YAHOO_STOCKS, ...worldIndexYahooTickers()])) {
    if (seen.has(sym.toUpperCase())) continue;
    if (fxSkip.has(sym.toUpperCase())) continue;
    seen.add(sym.toUpperCase());
    const kr = yahooBoardSymbol(sym);
    const tickers = /^\d{6}$/.test(kr) ? yahooTickersFor("KRX", kr) : [sym];
    for (const t of tickers) seen.add(t.toUpperCase());
    jobs.push({ tickers });
  }

  const mod = await import("yahoo-finance2");
  const YahooFinance = mod.default as unknown as new (opts?: { suppressNotices?: string[] }) => Yf;
  const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 10);

  const fx = await collectFxRates(yf);
  await sleep(GAP_MS);

  let upserted = 0;
  for (const job of jobs) {
    const hit = await quoteFirst(yf, job.tickers);
    if (!hit) { await sleep(GAP_MS); continue; }
    const { ticker, q } = hit;
    try {
      const meta = worldIndexByYahoo(ticker);
      const qt = typeof q.quoteType === "string" ? q.quoteType.toUpperCase() : "";
      const assetClass = job.inst?.assetClass
        ?? (meta?.region === "crypto" || qt === "CRYPTOCURRENCY" ? "crypto"
          : (ticker.startsWith("^") || ticker.includes("=") || qt === "INDEX" || qt === "FUTURE" || qt === "CURRENCY"
            ? "other"
            : (qt === "ETF" ? "etf" : "stock")));
      const inst = job.inst
        ? { id: job.inst.id }
        : await ensureInstrument({
          symbol: yahooBoardSymbol(ticker),
          market: meta ? worldIndexMarket(meta) : yahooBoardMarket(ticker),
          name: String(meta?.label ?? q.shortName ?? q.longName ?? ticker),
          assetClass: ticker.startsWith("^") || ticker.includes("=")
            ? "other"
            : (assetClass === "bond" || assetClass === "crypto" || assetClass === "fund" || assetClass === "other" || assetClass === "etf" ? assetClass : "stock"),
          currency: String(q.currency ?? "USD"),
        });
      await ensureIdentifier(inst.id, "yahoo", ticker);
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
      if (yahooSavesFundamentals(assetClass, typeof q.quoteType === "string" ? q.quoteType : null)) {
        await sleep(GAP_MS);
        const summary = await summaryWithRetry(yf, ticker);
        const fd = summary?.financialData ?? {};
        const ks = summary?.defaultKeyStatistics ?? {};
        const extra = extraFromQuote(q);
        const beta = n(q.beta) ?? n(ks.beta);
        await db.insert(fundamentals).values({
          instrumentId: inst.id, date: tradeDate, source: "yahoo",
          marketCap: n(q.marketCap) ?? n(q.netAssets),
          per: n(q.trailingPE), forwardPer: n(q.forwardPE), pbr: n(q.priceToBook),
          eps: n(q.epsTrailingTwelveMonths), dividendYield: dividendYieldStr(q), beta,
          roe: n(fd.returnOnEquity), revenueTtm: n(fd.totalRevenue),
          netIncomeTtm: n(ks.netIncomeToCommon), debtToEquity: n(fd.debtToEquity),
          extra,
        }).onConflictDoUpdate({
          target: [fundamentals.instrumentId, fundamentals.date, fundamentals.source],
          set: {
            marketCap: n(q.marketCap) ?? n(q.netAssets),
            per: n(q.trailingPE), forwardPer: n(q.forwardPE), pbr: n(q.priceToBook),
            eps: n(q.epsTrailingTwelveMonths), dividendYield: dividendYieldStr(q), beta,
            roe: n(fd.returnOnEquity), revenueTtm: n(fd.totalRevenue),
            netIncomeTtm: n(ks.netIncomeToCommon), debtToEquity: n(fd.debtToEquity),
            extra, fetchedAt: new Date(),
          },
        });
      }
      upserted++;
    } catch (e) { console.warn(`yahoo ${ticker} save failed`, (e as Error).message); }
    await sleep(GAP_MS);
  }
  const charts = await collectIndexCharts(yf);
  return { upserted, of: jobs.length, ...fx, chartBars: charts.bars };
}
