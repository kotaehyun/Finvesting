import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { insurancePolicies } from "@finvesting/db";
import { createProvider, INSURANCE_COVERAGE_SYSTEM, buildContextBlock } from "@finvesting/ai";
import { router, publicProcedure } from "../trpc";
import { loadCoverageSnapshot, toInsuranceClient } from "../lib/insurance-coverage";

const kindZ = z.enum(["life", "health", "cancer", "critical", "accident", "disability", "property", "other"]);
const monthZ = z.string().regex(/^\d{4}-\d{2}$/);
const shapeZ = z.enum(["hex", "hept"]);

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

export const insuranceRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const snap = await loadCoverageSnapshot(ctx.db, ctx.userId);
    return {
      policies: snap.policies,
      annualIncome: snap.annualIncome,
      hex: snap.hex,
      hept: snap.hept,
    };
  }),

  recommend: publicProcedure
    .input(z.object({ shape: shapeZ.default("hept") }))
    .mutation(async ({ ctx, input }) => {
      const snap = await loadCoverageSnapshot(ctx.db, ctx.userId);
      const analysis = input.shape === "hex" ? snap.hex : snap.hept;
      const context = input.shape === "hex" ? snap.contextHex : snap.contextHept;
      const llm = createProvider();
      const advice = await llm.chat([
        { role: "system", content: INSURANCE_COVERAGE_SYSTEM },
        { role: "system", content: buildContextBlock({ "보장 공백": context }) },
        { role: "user", content: "부족한 보장을 우선순위대로 설명해 주세요. 상품·보험사 이름은 대지 마세요." },
      ]);
      return {
        advice,
        provider: llm.name,
        weakest: analysis.weakest,
        missing: analysis.missing,
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
      return toInsuranceClient(row);
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
