import { and, eq, gte, lte } from "drizzle-orm";
import { accounts, transactions, financialProfiles, type Db } from "@finvesting/db";
import { summarizeCashflow, monthlyBudgetGuide } from "@finvesting/core";

export function currentKstMonth() {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 7);
}

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const from = `${month}-01`;
  const to = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
  return { from, to };
}

export async function loadOverview(db: Db, userId: string, month = currentKstMonth()) {
  const { from, to } = monthRange(month);

  const accts = await db.select().from(accounts).where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)));
  const txns = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.date, from), lte(transactions.date, to)));
  const [profile] = await db.select().from(financialProfiles).where(eq(financialProfiles.userId, userId));

  const byType: Record<string, number> = {};
  for (const a of accts) byType[a.type] = (byType[a.type] ?? 0) + Number(a.balance);
  const liquid = (byType.cash ?? 0) + (byType.checking ?? 0) + (byType.savings ?? 0) + (byType.installment ?? 0);
  const invested = (byType.brokerage ?? 0) + (byType.crypto ?? 0) + (byType.pension ?? 0);
  const debt = (byType.card ?? 0) + (byType.loan ?? 0);

  const cashflow = summarizeCashflow(txns.map((t) => ({ amount: Number(t.amount), direction: t.direction, category: t.category })));

  const guide = profile
    ? monthlyBudgetGuide({
        monthlyNetIncome: Number(profile.monthlyNetIncome ?? 0),
        monthlyFixedCost: Number(profile.monthlyFixedCost ?? 0),
        liquidAssets: liquid,
        investedAssets: invested,
        emergencyFundMonths: profile.emergencyFundMonths,
        riskTolerance: profile.riskTolerance as "conservative" | "moderate" | "aggressive",
      })
    : null;

  return {
    month,
    assets: { byType, liquid, invested, debt, net: liquid + invested - debt, accountCount: accts.length },
    cashflow,
    txnCount: txns.length,
    guide,
  };
}
