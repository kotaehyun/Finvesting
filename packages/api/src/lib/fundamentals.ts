import { desc, eq } from "drizzle-orm";
import { fundamentals, instruments, type Db } from "@finvesting/db";
import {
  parseFundamentalExtra,
  type FundamentalSnapshot,
} from "@finvesting/core";

function num(v: string | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export type FundamentalBoardRow = FundamentalSnapshot & {
  instrumentId: string;
  market: string;
  assetClass: string;
};

export async function loadLatestFundamentals(db: Db): Promise<FundamentalBoardRow[]> {
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
    out.push({
      instrumentId: r.instrumentId,
      symbol: r.symbol,
      name: r.name,
      market: r.market,
      assetClass: r.assetClass,
      currency: r.currency,
      date: r.date,
      source: r.source,
      marketCap: num(r.marketCap),
      per: num(r.per),
      forwardPer: num(r.forwardPer),
      pbr: num(r.pbr),
      eps: num(r.eps),
      roe: num(r.roe),
      dividendYield: num(r.dividendYield),
      revenueTtm: num(r.revenueTtm),
      netIncomeTtm: num(r.netIncomeTtm),
      debtToEquity: num(r.debtToEquity),
      beta: num(r.beta),
      extra: parseFundamentalExtra(r.extra),
    });
  }
  return out;
}
