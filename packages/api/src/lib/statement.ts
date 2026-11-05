import { and, desc, eq, gte, lte } from "drizzle-orm";
import { financialProfiles, recurringCosts, incomeTaxMonths, transactions, type Db } from "@finvesting/db";
import {
  buildMonthlyLedger,
  buildPayrollLedger,
  mergeTaxTrend,
  resolvePay,
  sumPayTrends,
} from "@finvesting/core";
import { monthRange } from "./overview";
import { loadPayTrends } from "./pay-trends";

const TXN_DEBIT_LABEL: Record<string, string> = {
  housing: "주거",
  utilities: "공과금",
  insurance: "보험",
  subscription: "구독",
  phone: "휴대폰",
  income_tax: "근로소득세(거래)",
  health_insurance: "건보료(거래)",
  food: "식비",
  transport: "교통",
  shopping: "쇼핑",
  leisure: "여가",
  health: "건강",
  education: "교육",
  misc: "기타",
  saving: "저축",
  investment: "투자",
  loan_repayment: "대출상환",
  uncategorized: "미분류",
};

const TXN_CREDIT_LABEL: Record<string, string> = {
  salary: "급여(거래)",
  bonus: "상여",
  interest: "이자",
  dividend: "배당",
  other_income: "기타수입",
};

function n(v: string | number | null | undefined) {
  return v != null ? Number(v) : 0;
}

export async function loadStatement(db: Db, userId: string, month: string) {
  const { from, to } = monthRange(month);
  const [profile] = await db.select().from(financialProfiles).where(eq(financialProfiles.userId, userId));
  const recurring = await db.select().from(recurringCosts)
    .where(and(eq(recurringCosts.userId, userId), eq(recurringCosts.isActive, true)));
  const taxRows = await db.select().from(incomeTaxMonths)
    .where(eq(incomeTaxMonths.userId, userId))
    .orderBy(desc(incomeTaxMonths.month));
  const txns = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.date, from), lte(transactions.date, to)));

  const payEarnings = Array.isArray(profile?.payEarnings)
    ? (profile.payEarnings as Array<{ name?: string; amount?: number | string }>).map((e) => ({
      label: String(e.name ?? "").trim() || "수당",
      amount: n(e.amount),
    })).filter((e) => e.amount > 0)
    : [];
  const earnSum = payEarnings.reduce((s, e) => s + e.amount, 0);
  const pay = resolvePay({
    monthlyGrossIncome: earnSum > 0 ? earnSum : profile?.monthlyGrossIncome,
    monthlyNetIncome: profile?.monthlyNetIncome,
    monthlyIncomeTax: profile?.monthlyIncomeTax,
    monthlyHealthInsurance: profile?.monthlyHealthInsurance,
  });

  const creditBy: Record<string, number> = {};
  const debitBy: Record<string, number> = {};
  const taxActualBy: Record<string, number> = {};

  for (const t of txns) {
    const amt = n(t.amount);
    if (t.direction === "in" && (t.category === "interest" || t.category === "dividend")) {
      creditBy[t.category] = (creditBy[t.category] ?? 0) + amt;
    } else if (t.direction === "out" && t.category !== "transfer") {
      debitBy[t.category] = (debitBy[t.category] ?? 0) + amt;
    }
  }

  const allTaxTxns = await db.select({ date: transactions.date, amount: transactions.amount, category: transactions.category })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.direction, "out")));
  for (const t of allTaxTxns) {
    if (t.category !== "income_tax") continue;
    const m = String(t.date).slice(0, 7);
    taxActualBy[m] = (taxActualBy[m] ?? 0) + n(t.amount);
  }

  const payroll = buildPayrollLedger({
    grossIncome: pay.gross,
    nationalPension: pay.nationalPension,
    healthInsurance: pay.healthInsurance,
    longTermCare: pay.longTermCare,
    employmentInsurance: pay.employmentInsurance,
    nationalTax: pay.nationalTax,
    localTax: pay.localTax,
    netIncome: pay.net,
    earnings: payEarnings,
  });
  const monthly = buildMonthlyLedger({
    netIncome: pay.net,
    otherCredits: Object.entries(creditBy).map(([category, amount]) => ({
      label: TXN_CREDIT_LABEL[category] ?? category, amount, category,
    })),
    recurring: recurring.map((r) => ({ label: r.name, amount: n(r.amount), category: r.category })),
    otherFixed: n(profile?.monthlyFixedCost),
    actualDebits: Object.entries(debitBy).map(([category, amount]) => ({
      label: TXN_DEBIT_LABEL[category] ?? category, amount, category,
    })),
  });

  const taxTrend = mergeTaxTrend(
    taxRows.map((r) => ({ month: r.month, amount: n(r.amount) })),
    Object.entries(taxActualBy).map(([m, amount]) => ({ month: m, amount })),
  );
  const payTrend = await loadPayTrends(db, userId, month, 12);

  return {
    month,
    pay,
    otherFixed: n(profile?.monthlyFixedCost),
    recurringSum: recurring.reduce((s, r) => s + n(r.amount), 0),
    recurring: recurring.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      amount: n(r.amount),
      dayOfMonth: r.dayOfMonth,
      memo: r.memo,
      isActive: r.isActive,
    })),
    taxMonths: taxRows.map((r) => ({ id: r.id, month: r.month, amount: n(r.amount) })),
    taxTrend,
    payroll,
    monthly,
    payTrend,
    payYear: sumPayTrends(payTrend),
  };
}
