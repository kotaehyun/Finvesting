import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { trades, instruments, quotes, macroIndicators, accounts, type Db } from "@finvesting/db";
import { buildPositions, summarizeByAccount, summarizeByClass, summarizeByCurrency, unrealizedPnl, unrealizedPnlContribution, type Position } from "@finvesting/core";

/** 최신 USDKRW. 소스는 구분하지 않는다 — 같은 날짜는 ECOS가 yahoo를 덮어쓴다. */
export async function latestUsdKrw(db: Db) {
  const [row] = await db.select({ value: macroIndicators.value })
    .from(macroIndicators)
    .where(eq(macroIndicators.code, "USDKRW"))
    .orderBy(desc(macroIndicators.date))
    .limit(1);
  return row ? Number(row.value) : null;
}

export async function latestCloses(db: Db, instrumentIds: string[]) {
  const out = new Map<string, { close: number; date: string; source: string }>();
  if (!instrumentIds.length) return out;
  const latest = db
    .select({
      instrumentId: quotes.instrumentId,
      maxDate: sql<string>`max(${quotes.date})`.as("max_date"),
    })
    .from(quotes)
    .where(inArray(quotes.instrumentId, instrumentIds))
    .groupBy(quotes.instrumentId)
    .as("quote_latest");
  const rows = await db
    .select({
      instrumentId: quotes.instrumentId,
      date: quotes.date,
      close: quotes.close,
      source: quotes.source,
    })
    .from(quotes)
    .innerJoin(latest, and(eq(quotes.instrumentId, latest.instrumentId), eq(quotes.date, latest.maxDate)));
  for (const r of rows) out.set(r.instrumentId, { close: Number(r.close), date: String(r.date), source: r.source });
  return out;
}

export function toTradeLike(t: { instrumentId: string; side: "buy" | "sell"; quantity: string | number; price: string | number; fee: string | number; tax: string | number; fxRate: string | number | null }) {
  return {
    instrumentId: t.instrumentId,
    side: t.side,
    quantity: Number(t.quantity),
    price: Number(t.price),
    fee: Number(t.fee),
    tax: Number(t.tax),
    fxRate: t.fxRate != null ? Number(t.fxRate) : undefined,
  };
}

function currentFx(currency: string, usdkrw: number | null, avgFxRate: number) {
  if (currency === "KRW") return 1;
  if (currency === "USD" && usdkrw != null) return usdkrw;
  return avgFxRate;
}

export async function loadHoldings(db: Db, userId: string) {
  const tradeRows = await db.select().from(trades).where(eq(trades.userId, userId)).orderBy(asc(trades.tradedAt));
  const accts = await db.select().from(accounts).where(eq(accounts.userId, userId));
  const acctMap = new Map(accts.map((a) => [a.id, a]));

  const tradesByAccount = new Map<string, typeof tradeRows>();
  for (const t of tradeRows) {
    const list = tradesByAccount.get(t.accountId) ?? [];
    list.push(t);
    tradesByAccount.set(t.accountId, list);
  }

  const all: Array<Position & { accountId: string }> = [];
  for (const [accountId, rows] of tradesByAccount) {
    const posMap = buildPositions(rows.map(toTradeLike));
    for (const p of posMap.values()) all.push({ ...p, accountId });
  }

  const ids = [...new Set(all.map((p) => p.instrumentId))];
  const insts = ids.length ? await db.select().from(instruments).where(inArray(instruments.id, ids)) : [];
  const instMap = new Map(insts.map((i) => [i.id, i]));
  const qMap = await latestCloses(db, ids);
  const usdkrw = await latestUsdKrw(db);

  const positions = all.map((p) => {
    const inst = instMap.get(p.instrumentId);
    const acct = acctMap.get(p.accountId);
    const q = qMap.get(p.instrumentId);
    const currency = inst?.currency ?? "KRW";
    const fx = currentFx(currency, usdkrw, p.avgFxRate);
    const u = q && p.quantity > 0 ? unrealizedPnl(p, q.close, fx) : null;
    return {
      accountId: p.accountId,
      accountName: acct?.name ?? "",
      institution: acct?.institution ?? null,
      accountType: acct?.type ?? "brokerage",
      instrumentId: p.instrumentId,
      symbol: inst?.symbol ?? p.instrumentId,
      name: inst?.name ?? "",
      market: inst?.market ?? "",
      assetClass: inst?.assetClass ?? "other",
      currency,
      quantity: p.quantity,
      avgCost: p.avgCost,
      avgFxRate: p.avgFxRate,
      lastPrice: q?.close ?? null,
      lastDate: q?.date ?? null,
      quoteSource: q?.source ?? null,
      marketValue: u?.marketValue ?? null,
      cost: p.quantity * p.avgCost,
      pnl: u?.pnl ?? null,
      pnlRate: u?.pnlRate ?? null,
      marketValueKrw: u?.marketValueKrw ?? null,
      costKrw: p.quantity * p.avgCost * p.avgFxRate,
      pnlKrw: u?.pnlKrw ?? null,
      realizedPnl: p.realizedPnl,
      realizedPnlKrw: p.realizedPnlKrw,
    };
  });

  const open = positions.filter((p) => p.quantity > 0);
  const closed = positions.filter((p) => p.quantity === 0 && p.realizedPnl !== 0);
  const totals = {
    marketValueKrw: open.reduce((s, p) => s + (p.marketValueKrw ?? 0), 0),
    costKrw: open.reduce((s, p) => s + p.costKrw, 0),
    pnlKrw: open.reduce((s, p) => s + (p.pnlKrw ?? 0), 0),
    realizedPnlKrw: positions.reduce((s, p) => s + p.realizedPnlKrw, 0),
    openCount: open.length,
    missingQuote: open.filter((p) => p.lastPrice == null).length,
  };

  const summaryRows = positions.map((p) => ({
    accountId: p.accountId,
    assetClass: p.assetClass,
    quantity: p.quantity,
    marketValueKrw: p.marketValueKrw,
    costKrw: p.costKrw,
    pnlKrw: p.pnlKrw,
  }));
  const byClass = summarizeByClass(open.length ? summaryRows.filter((r) => r.quantity > 0) : []);
  const byCurrency = summarizeByCurrency(open.map((p) => ({
    quantity: p.quantity,
    currency: p.currency,
    marketValueKrw: p.marketValueKrw,
  })));
  const pnlContribution = unrealizedPnlContribution(open);
  const byAccount = summarizeByAccount(
    summaryRows,
    accts.map((a) => ({
      id: a.id,
      name: a.name,
      institution: a.institution,
      type: a.type,
      balance: Number(a.balance),
    })),
  );

  return { positions: open, closed, totals, byClass, byCurrency, pnlContribution, byAccount, tradeCount: tradeRows.length, usdkrw };
}
