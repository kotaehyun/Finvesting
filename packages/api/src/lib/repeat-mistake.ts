import { eq, inArray } from "drizzle-orm";
import { accounts, instruments, trades, type Db } from "@finvesting/db";
import { detectRepeatMistakes, type RepeatMistakeResult } from "@finvesting/core";
import { toTradeLike } from "./holdings";

export async function loadRepeatMistakes(db: Db, userId: string): Promise<RepeatMistakeResult> {
  const tradeRows = await db.select().from(trades).where(eq(trades.userId, userId));
  if (tradeRows.length === 0) return detectRepeatMistakes([]);

  const accountIds = [...new Set(tradeRows.map((t) => t.accountId))];
  const instrumentIds = [...new Set(tradeRows.map((t) => t.instrumentId))];
  const accts = accountIds.length
    ? await db.select({ id: accounts.id, name: accounts.name }).from(accounts).where(inArray(accounts.id, accountIds))
    : [];
  const insts = instrumentIds.length
    ? await db.select({ id: instruments.id, symbol: instruments.symbol, name: instruments.name }).from(instruments).where(inArray(instruments.id, instrumentIds))
    : [];
  const acctMap = new Map(accts.map((a) => [a.id, a.name]));
  const instMap = new Map(insts.map((i) => [i.id, i]));

  return detectRepeatMistakes(tradeRows.map((t) => {
    const inst = instMap.get(t.instrumentId);
    return {
      ...toTradeLike(t),
      id: t.id,
      tradedAt: t.tradedAt,
      createdAt: t.createdAt,
      accountId: t.accountId,
      accountName: acctMap.get(t.accountId) ?? null,
      symbol: inst?.symbol ?? t.instrumentId,
      name: inst?.name ?? null,
    };
  }));
}
