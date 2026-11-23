import { desc, eq, inArray } from "drizzle-orm";
import { fundamentals, instruments, quotes, type Db } from "@finvesting/db";
import {
  fillMissingPerPbr,
  parseFundamentalExtra,
  type FundamentalBoardRow,
  type FundamentalsBoard,
} from "@finvesting/core";

export type { FundamentalBoardRow, FundamentalsBoard };

function num(v: string | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function loadLatestFundamentals(db: Db): Promise<FundamentalsBoard> {
  try {
    const rows = await db.select({
      instrumentId: fundamentals.instrumentId,
      date: fundamentals.date,
      source: fundamentals.source,
      marketCap: fundamentals.marketCap,
      per: fundamentals.per,
      forwardPer: fundamentals.forwardPer,
      pbr: fundamentals.pbr,
      eps: fundamentals.eps,
      roe: fundamentals.roe,
      dividendYield: fundamentals.dividendYield,
      revenueTtm: fundamentals.revenueTtm,
      netIncomeTtm: fundamentals.netIncomeTtm,
      debtToEquity: fundamentals.debtToEquity,
      beta: fundamentals.beta,
      extra: fundamentals.extra,
      symbol: instruments.symbol,
      name: instruments.name,
      market: instruments.market,
      assetClass: instruments.assetClass,
      currency: instruments.currency,
    }).from(fundamentals)
      .innerJoin(instruments, eq(fundamentals.instrumentId, instruments.id))
      .where(eq(fundamentals.source, "yahoo"))
      .orderBy(desc(fundamentals.date), desc(fundamentals.fetchedAt));

    const seen = new Set<string>();
    const out: FundamentalBoardRow[] = [];
    for (const r of rows) {
      if (seen.has(r.instrumentId)) continue;
      seen.add(r.instrumentId);
      const marketCap = num(r.marketCap);
      const roe = num(r.roe);
      const netIncomeTtm = num(r.netIncomeTtm);
      const filled = fillMissingPerPbr({
        per: num(r.per),
        pbr: num(r.pbr),
        roe,
        marketCap,
        netIncomeTtm,
      });
      const extra = parseFundamentalExtra(r.extra);
      if (filled.filledPer) extra.perDerived = true;
      if (filled.filledPbr) extra.pbrDerived = true;
      out.push({
        instrumentId: r.instrumentId,
        symbol: r.symbol,
        name: r.name,
        market: r.market,
        assetClass: r.assetClass,
        currency: r.currency,
        date: r.date,
        source: r.source,
        marketCap,
        per: filled.per,
        forwardPer: num(r.forwardPer),
        pbr: filled.pbr,
        eps: num(r.eps),
        roe,
        dividendYield: num(r.dividendYield),
        revenueTtm: num(r.revenueTtm),
        netIncomeTtm,
        debtToEquity: num(r.debtToEquity),
        beta: num(r.beta),
        extra,
        lastPrice: null,
        lastPriceDate: null,
        lastPriceSource: null,
      });
    }

    if (!out.length) return { status: "empty", items: [] };

    const qrows = await db.select({
      instrumentId: quotes.instrumentId,
      date: quotes.date,
      close: quotes.close,
      source: quotes.source,
    }).from(quotes)
      .where(inArray(quotes.instrumentId, out.map((r) => r.instrumentId)))
      .orderBy(desc(quotes.date));
    const latest = new Map<string, (typeof qrows)[number]>();
    for (const q of qrows) {
      if (!latest.has(q.instrumentId)) latest.set(q.instrumentId, q);
    }
    for (const r of out) {
      const q = latest.get(r.instrumentId);
      if (!q) continue;
      r.lastPrice = num(q.close);
      r.lastPriceDate = q.date;
      r.lastPriceSource = q.source;
    }
    return { status: "ok", items: out };
  } catch {
    return { status: "unavailable", items: [] };
  }
}

/** 종목 1건의 최신 Yahoo 펀더멘털. 없으면 null. */
export async function loadFundamentalByInstrumentId(
  db: Db,
  instrumentId: string,
): Promise<FundamentalBoardRow | null> {
  const board = await loadLatestFundamentals(db);
  if (board.status !== "ok") return null;
  return board.items.find((r) => r.instrumentId === instrumentId) ?? null;
}
