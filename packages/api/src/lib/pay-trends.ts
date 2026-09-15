import { and, eq, gte, lte } from "drizzle-orm";
import { payrollMonths, incomeTaxMonths, financialProfiles, type Db, type DbClient } from "@finvesting/db";
import {
  buildPayTrends,
  payTrendMonths,
  resolvePay,
  summarizePayEarnings,
  type PayTrendPoint,
} from "@finvesting/core";

function n(v: string | number | null | undefined) {
  return v != null ? Number(v) : 0;
}

function fromRow(r: typeof payrollMonths.$inferSelect): PayTrendPoint {
  return {
    month: r.month,
    base: n(r.baseAmount),
    allowance: n(r.allowanceAmount),
    bonus: n(r.bonusAmount),
    other: n(r.otherAmount),
    gross: n(r.grossAmount),
    tax: n(r.taxAmount),
    insurance: n(r.insuranceAmount),
    net: n(r.netAmount),
  };
}

export async function upsertPayrollMonth(
  db: DbClient,
  userId: string,
  month: string,
  pay: {
    gross: number; net: number; nationalTax: number; localTax: number;
    nationalPension: number; healthInsurance: number; longTermCare: number; employmentInsurance: number;
  },
  earnings: Array<{ name: string; amount: number }>,
) {
  const parts = summarizePayEarnings(earnings);
  const base = parts.gross > 0 ? parts.base : pay.gross;
  const allowance = parts.gross > 0 ? parts.allowance : 0;
  const bonus = parts.gross > 0 ? parts.bonus : 0;
  const other = parts.gross > 0 ? parts.other : 0;
  const gross = parts.gross > 0 ? parts.gross : pay.gross;
  const tax = Math.max(0, pay.nationalTax) + Math.max(0, pay.localTax);
  const insurance = Math.max(0, pay.nationalPension) + Math.max(0, pay.healthInsurance)
    + Math.max(0, pay.longTermCare) + Math.max(0, pay.employmentInsurance);
  const net = pay.net > 0 ? pay.net : Math.max(0, gross - tax - insurance);
  const values = {
    baseAmount: String(Math.round(base)),
    allowanceAmount: String(Math.round(allowance)),
    bonusAmount: String(Math.round(bonus)),
    otherAmount: String(Math.round(other)),
    grossAmount: String(Math.round(gross)),
    taxAmount: String(Math.round(tax)),
    insuranceAmount: String(Math.round(insurance)),
    netAmount: String(Math.round(net)),
    earnings: earnings.length ? earnings : null,
  };
  const [existing] = await db.select({ id: payrollMonths.id }).from(payrollMonths)
    .where(and(eq(payrollMonths.userId, userId), eq(payrollMonths.month, month)));
  if (existing) {
    await db.update(payrollMonths).set(values).where(eq(payrollMonths.id, existing.id));
  } else if (gross > 0 || tax > 0) {
    await db.insert(payrollMonths).values({ ...values, userId, month });
  }
}

export async function loadPayTrends(db: Db, userId: string, throughMonth: string, count = 12) {
  const months = payTrendMonths(throughMonth, count);
  const from = months[0] ?? throughMonth;
  const to = months[months.length - 1] ?? throughMonth;
  const [snaps, taxRows, profile] = await Promise.all([
    db.select().from(payrollMonths).where(and(
      eq(payrollMonths.userId, userId),
      gte(payrollMonths.month, from),
      lte(payrollMonths.month, to),
    )),
    db.select().from(incomeTaxMonths).where(eq(incomeTaxMonths.userId, userId)),
    db.select().from(financialProfiles).where(eq(financialProfiles.userId, userId)).then((r) => r[0]),
  ]);
  let current: PayTrendPoint | null = null;
  if (profile) {
    const earnings = Array.isArray(profile.payEarnings)
      ? (profile.payEarnings as Array<{ name?: string; amount?: number | string }>).map((e) => ({
        name: String(e.name ?? "").trim(),
        amount: n(e.amount),
      })).filter((e) => e.name && e.amount > 0)
      : [];
    const parts = summarizePayEarnings(earnings);
    const pay = resolvePay({
      monthlyGrossIncome: parts.gross > 0 ? parts.gross : profile.monthlyGrossIncome,
      monthlyNetIncome: profile.monthlyNetIncome,
      monthlyIncomeTax: profile.monthlyIncomeTax,
      monthlyHealthInsurance: profile.monthlyHealthInsurance,
    });
    const tax = pay.nationalTax + pay.localTax;
    const insurance = pay.nationalPension + pay.healthInsurance + pay.longTermCare + pay.employmentInsurance;
    if (pay.gross > 0) {
      current = {
        month: throughMonth,
        base: parts.gross > 0 ? parts.base : pay.gross,
        allowance: parts.allowance,
        bonus: parts.bonus,
        other: parts.other,
        gross: parts.gross > 0 ? parts.gross : pay.gross,
        tax, insurance,
        net: pay.net,
      };
    }
  }
  return buildPayTrends(
    months,
    snaps.map(fromRow),
    taxRows.map((r) => ({ month: r.month, amount: n(r.amount) })),
    current,
  );
}
