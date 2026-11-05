import { z } from "zod";
import { and, desc, eq, inArray } from "drizzle-orm";
import { savingsPlans, savingsContributions } from "@finvesting/db";
import { addMonths, projectSavings } from "@finvesting/core";
import { router, publicProcedure } from "../trpc";

const kindZ = z.enum(["installment", "savings"]);
const compoundZ = z.enum(["simple", "compound"]);
const monthZ = z.string().regex(/^\d{4}-\d{2}$/);

const planFields = z.object({
  id: z.string().uuid().optional(),
  accountId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(80),
  institution: z.string().max(80).optional(),
  kind: kindZ.default("installment"),
  interestRate: z.number().min(0).max(100),
  compounding: compoundZ.default("simple"),
  termMonths: z.number().int().min(1).max(120).optional(),
  monthlyAmount: z.number().min(0).optional(),
  startMonth: monthZ.optional(),
  maturityMonth: monthZ.optional(),
  description: z.string().max(2000).optional(),
});

function n(v: string | number | null | undefined) {
  return v != null ? Number(v) : 0;
}

function toClient(
  plan: typeof savingsPlans.$inferSelect,
  contribs: Array<typeof savingsContributions.$inferSelect>,
) {
  const monthlyAmount = n(plan.monthlyAmount);
  const termMonths = plan.termMonths ?? 0;
  const interestRate = n(plan.interestRate);
  const kind = plan.kind === "savings" ? "savings" : "installment";
  const compounding = plan.compounding === "compound" ? "compound" : "simple";
  const paidTotal = contribs.reduce((s, c) => s + n(c.amount), 0);
  const projection = termMonths > 0
    ? projectSavings({ kind, compounding, monthlyAmount, interestRate, termMonths })
    : { principal: paidTotal, interest: 0, maturity: paidTotal };
  const maturityMonth = plan.maturityMonth
    ?? (plan.startMonth && termMonths > 0 ? addMonths(plan.startMonth, termMonths - 1) : null);
  return {
    id: plan.id,
    accountId: plan.accountId,
    name: plan.name,
    institution: plan.institution,
    kind,
    interestRate,
    compounding,
    termMonths: plan.termMonths,
    monthlyAmount,
    startMonth: plan.startMonth,
    maturityMonth,
    description: plan.description,
    paidTotal,
    projection,
    contributions: contribs
      .slice()
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((c) => ({
        id: c.id,
        month: c.month,
        amount: n(c.amount),
        memo: c.memo,
      })),
  };
}

export const savingsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const plans = await ctx.db.select().from(savingsPlans)
      .where(eq(savingsPlans.userId, ctx.userId))
      .orderBy(desc(savingsPlans.updatedAt));
    if (!plans.length) return [];
    const rows = await ctx.db.select().from(savingsContributions)
      .where(and(
        eq(savingsContributions.userId, ctx.userId),
        inArray(savingsContributions.planId, plans.map((p) => p.id)),
      ));
    const byPlan = new Map<string, typeof rows>();
    for (const r of rows) {
      const list = byPlan.get(r.planId) ?? [];
      list.push(r);
      byPlan.set(r.planId, list);
    }
    return plans.map((p) => toClient(p, byPlan.get(p.id) ?? []));
  }),

  upsert: publicProcedure
    .input(z.object({
      plan: planFields,
      contributions: z.array(z.object({
        id: z.string().uuid().optional(),
        month: monthZ,
        amount: z.number().min(0),
        memo: z.string().max(200).optional(),
      })).max(240).default([]),
      deleteContributionIds: z.array(z.string().uuid()).max(240).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const p = input.plan;
      const values = {
        name: p.name.trim(),
        institution: p.institution?.trim() || null,
        kind: p.kind,
        interestRate: String(p.interestRate),
        compounding: p.compounding,
        termMonths: p.termMonths ?? null,
        monthlyAmount: p.monthlyAmount != null ? String(Math.round(p.monthlyAmount)) : null,
        startMonth: p.startMonth ?? null,
        maturityMonth: p.maturityMonth ?? null,
        description: p.description?.trim() || null,
        accountId: p.accountId ?? null,
      };
      const [plan] = p.id
        ? await ctx.db.update(savingsPlans).set(values)
          .where(and(eq(savingsPlans.id, p.id), eq(savingsPlans.userId, ctx.userId)))
          .returning()
        : await ctx.db.insert(savingsPlans).values({ ...values, userId: ctx.userId }).returning();
      if (!plan) throw new Error("적금 상품을 찾을 수 없습니다");

      if (input.deleteContributionIds.length) {
        await ctx.db.delete(savingsContributions).where(and(
          eq(savingsContributions.userId, ctx.userId),
          eq(savingsContributions.planId, plan.id),
          inArray(savingsContributions.id, input.deleteContributionIds),
        ));
      }
      for (const c of input.contributions) {
        if (!(c.amount > 0) && !c.id) continue;
        const crow = {
          month: c.month,
          amount: String(Math.round(c.amount)),
          memo: c.memo?.trim() || null,
        };
        if (c.id) {
          await ctx.db.update(savingsContributions).set(crow)
            .where(and(
              eq(savingsContributions.id, c.id),
              eq(savingsContributions.planId, plan.id),
              eq(savingsContributions.userId, ctx.userId),
            ));
        } else {
          await ctx.db.insert(savingsContributions).values({
            ...crow, planId: plan.id, userId: ctx.userId,
          }).onConflictDoUpdate({
            target: [savingsContributions.planId, savingsContributions.month],
            set: crow,
          });
        }
      }
      const contribs = await ctx.db.select().from(savingsContributions)
        .where(eq(savingsContributions.planId, plan.id));
      return toClient(plan, contribs);
    }),

  remove: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db.delete(savingsPlans)
        .where(and(eq(savingsPlans.id, input.id), eq(savingsPlans.userId, ctx.userId)))
        .returning({ id: savingsPlans.id });
      if (!row) throw new Error("적금 상품을 찾을 수 없습니다");
      return { ok: true as const };
    }),
});
