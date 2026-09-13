import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { financialProfiles, insurancePolicies } from "@finvesting/db";
import { analyzeCoverage, type PolicyCoverage } from "@finvesting/core";
import { router, publicProcedure } from "../trpc";

const kindZ = z.enum(["life", "health", "cancer", "critical", "accident", "disability", "property", "other"]);
const monthZ = z.string().regex(/^\d{4}-\d{2}$/);

const policyFields = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(80),
  insurer: z.string().max(80).optional(),
  kind: kindZ.default("other"),
  monthlyPremium: z.number().min(0).default(0),
  deathAmount: z.number().min(0).default(0),
  medicalCovered: z.boolean().default(false),
  cancerAmount: z.number().min(0).default(0),
  brainAmount: z.number().min(0).default(0),
  heartAmount: z.number().min(0).default(0),
  accidentAmount: z.number().min(0).default(0),
  disabilityAmount: z.number().min(0).default(0),
  startMonth: monthZ.optional(),
  endMonth: monthZ.optional(),
  memo: z.string().max(2000).optional(),
});

function n(v: string | number | null | undefined) {
  return v != null ? Number(v) : 0;
}

function toClient(row: typeof insurancePolicies.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    insurer: row.insurer,
    kind: row.kind,
    monthlyPremium: n(row.monthlyPremium),
    deathAmount: n(row.deathAmount),
    medicalCovered: row.medicalCovered,
    cancerAmount: n(row.cancerAmount),
    brainAmount: n(row.brainAmount),
    heartAmount: n(row.heartAmount),
    accidentAmount: n(row.accidentAmount),
    disabilityAmount: n(row.disabilityAmount),
    startMonth: row.startMonth,
    endMonth: row.endMonth,
    memo: row.memo,
  };
}

function toCoverage(p: ReturnType<typeof toClient>): PolicyCoverage {
  return {
    death: p.deathAmount,
    medical: p.medicalCovered,
    cancer: p.cancerAmount,
    brain: p.brainAmount,
    heart: p.heartAmount,
    accident: p.accidentAmount,
    disability: p.disabilityAmount,
  };
}

export const insuranceRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select().from(insurancePolicies)
      .where(eq(insurancePolicies.userId, ctx.userId))
      .orderBy(desc(insurancePolicies.updatedAt));
    const [profile] = await ctx.db.select({ monthlyGrossIncome: financialProfiles.monthlyGrossIncome })
      .from(financialProfiles)
      .where(eq(financialProfiles.userId, ctx.userId))
      .limit(1);
    const policies = rows.map(toClient);
    const annualIncome = n(profile?.monthlyGrossIncome) * 12;
    const coverages = policies.map(toCoverage);
    return {
      policies,
      annualIncome,
      hex: analyzeCoverage(coverages, annualIncome, "hex"),
      hept: analyzeCoverage(coverages, annualIncome, "hept"),
    };
  }),

  upsert: publicProcedure
    .input(policyFields)
    .mutation(async ({ ctx, input }) => {
      const values = {
        name: input.name.trim(),
        insurer: input.insurer?.trim() || null,
        kind: input.kind,
        monthlyPremium: String(Math.round(input.monthlyPremium)),
        deathAmount: String(Math.round(input.deathAmount)),
        medicalCovered: input.medicalCovered,
        cancerAmount: String(Math.round(input.cancerAmount)),
        brainAmount: String(Math.round(input.brainAmount)),
        heartAmount: String(Math.round(input.heartAmount)),
        accidentAmount: String(Math.round(input.accidentAmount)),
        disabilityAmount: String(Math.round(input.disabilityAmount)),
        startMonth: input.startMonth ?? null,
        endMonth: input.endMonth ?? null,
        memo: input.memo?.trim() || null,
      };
      const [row] = input.id
        ? await ctx.db.update(insurancePolicies).set(values)
          .where(and(eq(insurancePolicies.id, input.id), eq(insurancePolicies.userId, ctx.userId)))
          .returning()
        : await ctx.db.insert(insurancePolicies).values({ ...values, userId: ctx.userId }).returning();
      if (!row) throw new Error("보험 증권을 찾을 수 없습니다");
      return toClient(row);
    }),

  remove: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db.delete(insurancePolicies)
        .where(and(eq(insurancePolicies.id, input.id), eq(insurancePolicies.userId, ctx.userId)))
        .returning({ id: insurancePolicies.id });
      if (!row) throw new Error("보험 증권을 찾을 수 없습니다");
      return { ok: true as const };
    }),
});
