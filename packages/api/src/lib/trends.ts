import { and, eq, gte, lte } from "drizzle-orm";
import { incomeTaxMonths, transactions, type Db } from "@finvesting/db";
import { buildCashflowTrends, listMonths } from "@finvesting/core";
import { monthRange } from "./overview";

function n(v: string | number | null | undefined) {
  return v != null ? Number(v) : 0;
}

export async function loadCashflowTrends(db: Db, userId: string, throughMonth: string, count = 12) {
  const months = listMonths(throughMonth, count);
  const from = monthRange(months[0] ?? throughMonth).from;
  const to = monthRange(months[months.length - 1] ?? throughMonth).to;
  const [txns, taxRows] = await Promise.all([
    db.select({
      date: transactions.date,
      amount: transactions.amount,
      direction: transactions.direction,
      category: transactions.category,
    }).from(transactions).where(and(
      eq(transactions.userId, userId),
      gte(transactions.date, from),
      lte(transactions.date, to),
    )),
    db.select().from(incomeTaxMonths).where(eq(incomeTaxMonths.userId, userId)),
  ]);
  return buildCashflowTrends(
    txns.map((t) => ({
      date: String(t.date),
      amount: n(t.amount),
      direction: t.direction,
      category: t.category,
    })),
    taxRows.map((r) => ({ month: r.month, amount: n(r.amount) })),
    months,
  );
}
