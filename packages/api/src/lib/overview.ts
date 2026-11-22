import { and, eq, gte, lte } from "drizzle-orm";
import {
  accounts, transactions, financialProfiles, recurringCosts,
  savingsPlans, savingsContributions, type Db,
} from "@finvesting/db";
import { summarizeCashflow, monthlyBudgetGuide, resolvePay, brokerCashKrw, investedAssets, addMonths, convertAccountBalances, detectSpendAnomalies, explainHoldingRisk, buildProactiveAlerts, SPEND_ANOMALY_LOOKBACK_MONTHS, type RiskTolerance } from "@finvesting/core";
import { latestUsdKrw, loadHoldings } from "./holdings";
import { loadRepeatMistakes } from "./repeat-mistake";

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
  const baselineFrom = `${addMonths(month, -SPEND_ANOMALY_LOOKBACK_MONTHS)}-01`;

  const accts = await db.select().from(accounts).where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)));
  const txns = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.date, baselineFrom), lte(transactions.date, to)));
  const monthTxns = txns.filter((t) => t.date >= from && t.date <= to);
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

  const usdkrw = await latestUsdKrw(db);
  const conversion = convertAccountBalances(accts, { USD: usdkrw });
  const byType = conversion.byTypeKrw;
  const liquid = (byType.cash ?? 0) + (byType.checking ?? 0) + (byType.savings ?? 0) + (byType.installment ?? 0);
  const brokerCash = brokerCashKrw(byType);
  const debt = (byType.card ?? 0) + (byType.loan ?? 0);
  const holdings = await loadHoldings(db, userId);
  // 투자자산 = 보유 평가액 + 증권·코인·연금 예수금(계좌 balance)
  const invested = investedAssets(holdings.totals.marketValueKrw, brokerCash);

  const cashflow = summarizeCashflow(monthTxns.map((t) => ({ amount: Number(t.amount), direction: t.direction, category: t.category })));
  const uncategorizedCount = monthTxns.filter((t) => t.category === "uncategorized").length;
  const spendAnomaly = detectSpendAnomalies(txns.map((t) => ({
    id: t.id,
    date: t.date,
    amount: Number(t.amount),
    direction: t.direction,
    category: t.category,
    merchant: t.merchant,
    memo: t.memo,
  })), month);
  const riskTolerance: RiskTolerance | null = profile?.riskTolerance === "conservative" || profile?.riskTolerance === "moderate" || profile?.riskTolerance === "aggressive"
    ? profile.riskTolerance
    : null;
  const riskExplain = explainHoldingRisk({
    positions: holdings.positions.map((p) => ({
      symbol: p.symbol,
      name: p.name,
      assetClass: p.assetClass,
      currency: p.currency,
      quantity: p.quantity,
      marketValueKrw: p.marketValueKrw,
    })),
    riskTolerance,
    usdkrw: holdings.usdkrw,
  });
  const repeatMistake = await loadRepeatMistakes(db, userId);
  const alerts = buildProactiveAlerts({
    uncategorizedCount,
    missingQuoteCount: holdings.totals.missingQuote,
    spendAnomaly,
    riskExplain,
    repeatMistake,
  });
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
    assets: {
      byType,
      byCurrency: conversion.byCurrency,
      liquid,
      invested,
      accountInvested: brokerCash,
      brokerCash,
      debt,
      net: liquid + invested - debt,
      accountCount: accts.length,
      unconvertedCount: conversion.unconvertedCount,
      unconvertedCurrencies: conversion.unconvertedCurrencies,
      isFxComplete: conversion.isFxComplete,
    },
    holdings,
    cashflow,
    spendAnomaly,
    riskExplain,
    repeatMistake,
    alerts,
    txnCount: monthTxns.length,
    uncategorizedCount,
    quoteAsOf,
    upcoming,
    profile: profile
      ? {
          monthlyNetIncome,
          monthlyGrossIncome: pay.gross,
          monthlyIncomeTax: pay.tax ?? 0,
          monthlyHealthInsurance: pay.health ?? 0,
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
