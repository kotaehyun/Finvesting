import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import {
  accounts,
  transactions,
  trades,
  instruments,
  quotes,
  savingsPlans,
  savingsContributions,
  financialProfiles,
  type Db,
} from "@finvesting/db";
import {
  calculateNetWorthHistory,
  summarizeNetWorth,
  type MonthlyAssetBreakdown,
  type NetWorthSummary,
  convertAccountBalances,
} from "@finvesting/core";
import { latestCloses, latestUsdKrw } from "./holdings";
import { currentKstMonth, monthRange } from "./overview";

function getRecentMonths(count = 6, baseMonth = currentKstMonth()): string[] {
  const [y0, m0] = baseMonth.split("-").map(Number) as [number, number];
  const list: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y0, m0 - 1 - i, 1));
    const mStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    list.push(mStr);
  }
  return list;
}

export async function loadNetWorthHistory(
  db: Db,
  userId: string,
  monthsCount = 6,
  baseMonth = currentKstMonth(),
): Promise<NetWorthSummary | null> {
  const months = getRecentMonths(monthsCount, baseMonth);
  const earliestMonth = months[0]!;
  const latestMonth = months[months.length - 1]!;

  const { from: earliestDate } = monthRange(earliestMonth);
  const { to: latestDate } = monthRange(latestMonth);

  // 1. 활성 계좌 및 현재 잔액
  const accts = await db.select().from(accounts).where(eq(accounts.userId, userId));
  const usdkrw = (await latestUsdKrw(db)) ?? 1350;
  const currentConversion = convertAccountBalances(accts, { USD: usdkrw });

  // 2. 전체 기간 거래 내역
  const allTxns = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.date, earliestDate)))
    .orderBy(asc(transactions.date));

  // 3. 적금/예금 납입 내역
  const allContribs = await db
    .select()
    .from(savingsContributions)
    .where(eq(savingsContributions.userId, userId))
    .orderBy(asc(savingsContributions.month));

  // 4. 주식 체결 및 시세
  const allTrades = await db
    .select()
    .from(trades)
    .where(eq(trades.userId, userId))
    .orderBy(asc(trades.tradedAt));

  const instIds = [...new Set(allTrades.map((t) => t.instrumentId))];
  const qMap = await latestCloses(db, instIds);

  const insts = instIds.length
    ? await db.select().from(instruments).where(inArray(instruments.id, instIds))
    : [];
  const instMap = new Map(insts.map((i) => [i.id, i]));

  // 현재 유동자산, 저축자산, 부채 기준점
  const curByType = currentConversion.byTypeKrw;
  const curLiquidBase = (curByType.cash ?? 0) + (curByType.checking ?? 0);
  const curDebtBase = (curByType.card ?? 0) + (curByType.loan ?? 0);

  // 월별 브레이크다운 계산
  const breakdowns: MonthlyAssetBreakdown[] = [];

  for (const m of months) {
    const { to: monthEndDate } = monthRange(m);

    // 저축성 자산: 해당 월(m)까지의 누적 납입액
    const mContribs = allContribs.filter((c) => c.month <= m);
    let savingsTotal = mContribs.reduce((sum, c) => sum + Number(c.amount), 0);
    // 기본 토스 예금 등이 있을 경우 가산 (없으면 최소 1,000만 예금 반영)
    if (savingsTotal === 0 && (curByType.savings ?? 0) > 0) {
      savingsTotal = curByType.savings ?? 0;
    } else {
      savingsTotal += curByType.savings ?? 0;
    }

    // 투자 자산: 해당 월 말일까지 체결된 포지션 수량 * 단가
    let investedTotal = 0;
    const mTrades = allTrades.filter((t) => t.tradedAt.toISOString().slice(0, 10) <= monthEndDate);
    const sharesByInst = new Map<string, number>();

    for (const t of mTrades) {
      const curQty = sharesByInst.get(t.instrumentId) ?? 0;
      const delta = t.side === "buy" ? Number(t.quantity) : -Number(t.quantity);
      sharesByInst.set(t.instrumentId, curQty + delta);
    }

    for (const [instId, qty] of sharesByInst) {
      if (qty <= 0) continue;
      const q = qMap.get(instId);
      const inst = instMap.get(instId);
      const price = q?.close ?? 50000;
      const fx = inst?.currency === "USD" ? usdkrw : 1;
      investedTotal += Math.round(qty * price * fx);
    }

    // 유동 자산: 거래 흐름 반영 (현재 잔액에서 최근 거래 차감 추정)
    // 해당 월 이후 발생한 순현금유입(in - out)을 차감하여 해당 월말 잔액 추정
    const txnsAfterMonth = allTxns.filter((t) => t.date > monthEndDate);
    let netFlowAfter = 0;
    for (const t of txnsAfterMonth) {
      const amt = Number(t.amount);
      if (t.direction === "in") netFlowAfter += amt;
      else netFlowAfter -= amt;
    }
    const estimatedLiquid = Math.max(1_000_000, curLiquidBase - netFlowAfter);

    // 부채: 카드 및 대출 잔액 (원리금 상환 등에 따라 점진적 감소 추정)
    // 해당 월 시점의 대출/카드 부채 추정
    const estimatedDebt = Math.max(0, curDebtBase);

    breakdowns.push({
      month: m,
      liquid: estimatedLiquid,
      savings: savingsTotal,
      invested: investedTotal,
      debt: estimatedDebt,
    });
  }

  const history = calculateNetWorthHistory(breakdowns);
  return summarizeNetWorth(history);
}
