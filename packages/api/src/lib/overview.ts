import { and, eq, gte, lte } from "drizzle-orm";
import {
  accounts, transactions, financialProfiles, recurringCosts,
  savingsPlans, savingsContributions, type Db,
} from "@finvesting/db";
import { summarizeCashflow, monthlyBudgetGuide, resolvePay, brokerCashKrw, investedAssets, addMonths } from "@finvesting/core";
import { loadHoldings } from "./holdings";

export function currentKstMonth() {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 7);
}

export function currentKstDate() {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 10);
}

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const from = `${month}-01`;
  const to = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
  return { from, to };
}

function scheduledOn(month: string, dayOfMonth: number) {
  const last = Number(monthRange(month).to.slice(8));
  const day = Math.min(Math.max(1, dayOfMonth), last);
  return `${month}-${String(day).padStart(2, "0")}`;
}

export type UpcomingItem = {
  kind: "recurring" | "savings_pay" | "savings_maturity";
  title: string;
  scheduledOn: string;
  amount: number | null;
  actualAmount: number | null;
  href: string;
};

export async function loadOverview(db: Db, userId: string, month = currentKstMonth()) {
  const { from, to } = monthRange(month);
  const asOf = currentKstDate();
  const isCurrentMonth = month === currentKstMonth();

  const accts = await db.select().from(accounts).where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)));
  const txns = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.date, from), lte(transactions.date, to)));
  const [profile] = await db.select().from(financialProfiles).where(eq(financialProfiles.userId, userId));
  const recurring = await db.select().from(recurringCosts)
    .where(and(eq(recurringCosts.userId, userId), eq(recurringCosts.isActive, true)));
  const recurringSum = recurring.reduce((s, r) => s + Number(r.amount), 0);
  const plans = await db.select().from(savingsPlans).where(eq(savingsPlans.userId, userId));
  const monthContribs = plans.length
    ? await db.select().from(savingsContributions).where(and(
      eq(savingsContributions.userId, userId),
      eq(savingsContributions.month, month),
    ))
    : [];
  const contribByPlan = new Map<string, number>();
  for (const c of monthContribs) {
    contribByPlan.set(c.planId, (contribByPlan.get(c.planId) ?? 0) + Number(c.amount));
  }

  const byType: Record<string, number> = {};
  for (const a of accts) byType[a.type] = (byType[a.type] ?? 0) + Number(a.balance);
  const liquid = (byType.cash ?? 0) + (byType.checking ?? 0) + (byType.savings ?? 0) + (byType.installment ?? 0);
  const brokerCash = brokerCashKrw(byType);
  const debt = (byType.card ?? 0) + (byType.loan ?? 0);
  const holdings = await loadHoldings(db, userId);
  // 투자자산 = 보유 평가액 + 증권·코인·연금 예수금(계좌 balance)
  const invested = investedAssets(holdings.totals.marketValueKrw, brokerCash);

  const cashflow = summarizeCashflow(txns.map((t) => ({ amount: Number(t.amount), direction: t.direction, category: t.category })));
  const uncategorizedCount = txns.filter((t) => t.category === "uncategorized").length;
  const quoteDates = holdings.positions.map((p) => p.lastDate).filter((d): d is string => d != null);
  const quoteAsOf = quoteDates.length ? quoteDates.reduce((a, b) => (a > b ? a : b)) : null;

  const upcoming: UpcomingItem[] = [];
  for (const r of recurring) {
    if (r.dayOfMonth == null) continue;
    upcoming.push({
      kind: "recurring",
      title: r.name,
      scheduledOn: scheduledOn(month, r.dayOfMonth),
      amount: Number(r.amount),
      actualAmount: null,
      href: "/profile?menu=fixed",
    });
  }
  for (const p of plans) {
    const start = p.startMonth;
    const term = p.termMonths;
    const maturity = p.maturityMonth
      ?? (start && term != null && term > 0 ? addMonths(start, term - 1) : null);
    const inTerm = (!start || start <= month) && (!maturity || month <= maturity);
    const monthlyAmount = p.monthlyAmount != null ? Number(p.monthlyAmount) : null;
    if (p.kind !== "savings" && inTerm && monthlyAmount != null && monthlyAmount > 0) {
      upcoming.push({
        kind: "savings_pay",
        title: `${p.name} 납입(예정)`,
        scheduledOn: `${month}-01`,
        amount: monthlyAmount,
        actualAmount: contribByPlan.get(p.id) ?? null,
        href: "/profile?menu=savings",
      });
    }
    if (maturity === month) {
      upcoming.push({
        kind: "savings_maturity",
        title: `${p.name} 만기(예정)`,
        scheduledOn: `${month}-01`,
        amount: null,
        actualAmount: null,
        href: "/profile?menu=savings",
      });
    }
  }
  upcoming.sort((a, b) => a.scheduledOn.localeCompare(b.scheduledOn) || a.title.localeCompare(b.title));

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
    isCurrentMonth,
    asOf,
    assets: { byType, liquid, invested, accountInvested: brokerCash, brokerCash, debt, net: liquid + invested - debt, accountCount: accts.length },
    holdings,
    cashflow,
    txnCount: txns.length,
    uncategorizedCount,
    quoteAsOf,
    upcoming,
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
