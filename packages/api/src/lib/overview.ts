import { and, eq, gte, lte } from "drizzle-orm";
import { accounts, transactions, financialProfiles, recurringCosts, type Db } from "@finvesting/db";
import { summarizeCashflow, monthlyBudgetGuide, resolvePay, brokerCashKrw, investedAssets } from "@finvesting/core";
import { loadHoldings } from "./holdings";

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
  const recurring = await db.select().from(recurringCosts)
    .where(and(eq(recurringCosts.userId, userId), eq(recurringCosts.isActive, true)));
  const recurringSum = recurring.reduce((s, r) => s + Number(r.amount), 0);

  const byType: Record<string, number> = {};
  for (const a of accts) byType[a.type] = (byType[a.type] ?? 0) + Number(a.balance);
  const liquid = (byType.cash ?? 0) + (byType.checking ?? 0) + (byType.savings ?? 0) + (byType.installment ?? 0);
  const brokerCash = brokerCashKrw(byType);
  const debt = (byType.card ?? 0) + (byType.loan ?? 0);
  const holdings = await loadHoldings(db, userId);
  // 투자자산 = 보유 평가액 + 증권·코인·연금 예수금(계좌 balance)
  const invested = investedAssets(holdings.totals.marketValueKrw, brokerCash);

  const cashflow = summarizeCashflow(txns.map((t) => ({ amount: Number(t.amount), direction: t.direction, category: t.category })));

  const pay = resolvePay({
    monthlyGrossIncome: profile?.monthlyGrossIncome,
    monthlyNetIncome: profile?.monthlyNetIncome,
    monthlyIncomeTax: profile?.monthlyIncomeTax,
    monthlyHealthInsurance: profile?.monthlyHealthInsurance,
  });
  const monthlyNetIncome = pay.net;
  const monthlyFixedCost = Number(profile?.monthlyFixedCost ?? 0) + recurringSum;
  const guide = profile && monthlyNetIncome > 0
    ? monthlyBudgetGuide({
        monthlyNetIncome,
        monthlyFixedCost,
        liquidAssets: liquid,
        investedAssets: invested,
        emergencyFundMonths: profile.emergencyFundMonths,
        riskTolerance: profile.riskTolerance as "conservative" | "moderate" | "aggressive",
      })
    : null;

  return {
    month,
    assets: { byType, liquid, invested, accountInvested: brokerCash, brokerCash, debt, net: liquid + invested - debt, accountCount: accts.length },
    holdings,
    cashflow,
    txnCount: txns.length,
    profile: profile
      ? {
          monthlyNetIncome,
          monthlyGrossIncome: pay.gross,
          monthlyIncomeTax: pay.tax,
          monthlyHealthInsurance: pay.health,
          monthlyFixedCost,
          otherFixed: Number(profile.monthlyFixedCost ?? 0),
          recurringSum,
          recurring: recurring.map((r) => ({ name: r.name, amount: Number(r.amount), category: r.category })),
          emergencyFundMonths: profile.emergencyFundMonths,
          riskTolerance: profile.riskTolerance,
        }
      : null,
    guide,
  };
}
