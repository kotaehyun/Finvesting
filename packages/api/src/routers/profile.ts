import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { financialProfiles, recurringCosts, incomeTaxMonths, type Db } from "@finvesting/db";
import { resolvePay } from "@finvesting/core";
import { upsertPayrollMonth } from "../lib/pay-trends";
import {
  parseRecurringCostRows,
  recurringCostsToCsv,
  recurringCostsToXlsx,
  recurringCostsToDocx,
  detectTableFileKind,
  detectTransactionImporter,
  genericBankImporter,
  BANK_CSV_HEADER,
  RECURRING_CSV_HEADER,
  rowsToXlsx,
  rowsToDocx,
} from "@finvesting/interop";
import { router, publicProcedure } from "../trpc";
import { currentKstMonth } from "../lib/overview";
import { loadStatement } from "../lib/statement";
import { loadCashflowTrends } from "../lib/trends";
import { toBase64, uploadToRows } from "../lib/table-file";

const riskTolerance = z.enum(["conservative", "moderate", "aggressive"]);
const monthStr = z.string().regex(/^\d{4}-\d{2}$/);

const payEarningFields = z.object({
  name: z.string().min(1).max(80),
  amount: z.number().min(0),
});

const profileFields = z.object({
  monthlyGrossIncome: z.number().min(0).optional(),
  monthlyNetIncome: z.number().min(0).optional(),
  monthlyIncomeTax: z.number().min(0).optional(),
  monthlyHealthInsurance: z.number().min(0).optional(),
  monthlyFixedCost: z.number().min(0).optional(),
  emergencyFundMonths: z.number().int().min(1).max(36).default(6),
  riskTolerance: riskTolerance.default("moderate"),
  payEarnings: z.array(payEarningFields).max(40).optional(),
});

const recurringFields = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(80),
  category: z.string().min(1).max(32),
  amount: z.number().min(0),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  memo: z.string().max(200).optional(),
});

function parsePayEarnings(raw: unknown): Array<{ name: string; amount: number }> {
  if (!Array.isArray(raw)) return [];
  return raw.map((e) => {
    const row = e as { name?: unknown; amount?: unknown };
    return { name: String(row.name ?? "").trim(), amount: Number(row.amount) || 0 };
  }).filter((e) => e.name && e.amount > 0);
}

function toClient(row: typeof financialProfiles.$inferSelect) {
  const payEarnings = parsePayEarnings(row.payEarnings);
  const pay = resolvePay({
    ...row,
    monthlyGrossIncome: payEarnings.length
      ? payEarnings.reduce((s, e) => s + e.amount, 0)
      : row.monthlyGrossIncome,
  });
  return {
    monthlyGrossIncome: row.monthlyGrossIncome != null ? Number(row.monthlyGrossIncome) : null,
    monthlyNetIncome: row.monthlyNetIncome != null ? Number(row.monthlyNetIncome) : null,
    monthlyIncomeTax: row.monthlyIncomeTax != null ? Number(row.monthlyIncomeTax) : null,
    monthlyHealthInsurance: row.monthlyHealthInsurance != null ? Number(row.monthlyHealthInsurance) : null,
    monthlyFixedCost: row.monthlyFixedCost != null ? Number(row.monthlyFixedCost) : null,
    emergencyFundMonths: row.emergencyFundMonths,
    riskTolerance: row.riskTolerance,
    payEarnings,
    resolved: pay,
  };
}

async function upsertTaxMonth(db: Db, userId: string, month: string, amount: number) {
  const [existing] = await db.select({ id: incomeTaxMonths.id })
    .from(incomeTaxMonths).where(and(eq(incomeTaxMonths.userId, userId), eq(incomeTaxMonths.month, month)));
  if (existing) {
    await db.update(incomeTaxMonths).set({ amount: String(Math.round(amount)) }).where(eq(incomeTaxMonths.id, existing.id));
  } else {
    await db.insert(incomeTaxMonths).values({ userId, month, amount: String(Math.round(amount)) });
  }
}

async function saveProfile(db: Db, userId: string, input: z.infer<typeof profileFields>, month = currentKstMonth()) {
  const hasEarnings = input.payEarnings !== undefined;
  const earnings = (input.payEarnings ?? []).filter((e) => e.name.trim() && e.amount > 0);
  const earnSum = earnings.reduce((s, e) => s + e.amount, 0);
  const gross = hasEarnings && earnSum > 0 ? earnSum : input.monthlyGrossIncome;
  const pay = resolvePay({
    monthlyGrossIncome: gross,
    monthlyNetIncome: input.monthlyNetIncome,
    monthlyIncomeTax: input.monthlyIncomeTax,
    monthlyHealthInsurance: input.monthlyHealthInsurance,
  });
  if (!(pay.net > 0) && !(pay.gross > 0)) {
    throw new Error("세전 또는 세후 월 소득을 입력하세요");
  }
  const values = {
    monthlyGrossIncome: pay.gross > 0 ? String(Math.round(pay.gross)) : null,
    monthlyNetIncome: pay.net > 0 ? String(Math.round(pay.net)) : null,
    monthlyIncomeTax: input.monthlyIncomeTax != null ? String(Math.round(input.monthlyIncomeTax)) : null,
    monthlyHealthInsurance: input.monthlyHealthInsurance != null ? String(Math.round(input.monthlyHealthInsurance)) : null,
    monthlyFixedCost: String(Math.round(input.monthlyFixedCost ?? 0)),
    emergencyFundMonths: input.emergencyFundMonths,
    riskTolerance: input.riskTolerance,
    ...(hasEarnings ? {
      payEarnings: earnings.length ? earnings.map((e) => ({ name: e.name.trim(), amount: Math.round(e.amount) })) : null,
    } : {}),
  };
  const [existing] = await db.select({ id: financialProfiles.id })
    .from(financialProfiles).where(eq(financialProfiles.userId, userId));
  const [row] = existing
    ? await db.update(financialProfiles).set(values).where(eq(financialProfiles.userId, userId)).returning()
    : await db.insert(financialProfiles).values({ ...values, userId }).returning();
  if (pay.tax > 0) await upsertTaxMonth(db, userId, month, pay.tax);
  await upsertPayrollMonth(db, userId, month, pay, earnings);
  return toClient(row!);
}

export const profileRouter = router({
  get: publicProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db.select().from(financialProfiles).where(eq(financialProfiles.userId, ctx.userId));
    return row ? toClient(row) : null;
  }),

  statement: publicProcedure
    .input(z.object({ month: monthStr }).optional())
    .query(({ ctx, input }) => loadStatement(ctx.db, ctx.userId, input?.month ?? currentKstMonth())),

  trends: publicProcedure
    .input(z.object({ month: monthStr.optional(), count: z.number().int().min(3).max(24).default(12) }).optional())
    .query(({ ctx, input }) =>
      loadCashflowTrends(ctx.db, ctx.userId, input?.month ?? currentKstMonth(), input?.count ?? 12)),

  templates: publicProcedure.query(() => {
    const rec = [[...RECURRING_CSV_HEADER], ["휴대폰", "휴대폰", "55000", "15", ""]];
    const bank = [[...BANK_CSV_HEADER], ["2026-09-01", "1000000", "", "급여", "1000000"], ["2026-09-02", "", "12000", "점심", "988000"]];
    return {
      recurring: {
        csv: recurringCostsToCsv([{ name: "휴대폰", category: "phone", amount: 55000, dayOfMonth: 15 }]),
        xlsxBase64: toBase64(rowsToXlsx(rec, "고정비")),
        docxBase64: toBase64(rowsToDocx(rec)),
        filenameCsv: "fixed-costs-template.csv",
        filenameXlsx: "fixed-costs-template.xlsx",
        filenameDocx: "fixed-costs-template.docx",
      },
      bank: {
        csv: "\uFEFF" + bank.map((r) => r.join(",")).join("\n") + "\n",
        xlsxBase64: toBase64(rowsToXlsx(bank, "통장")),
        docxBase64: toBase64(rowsToDocx(bank)),
        filenameCsv: "bank-template.csv",
        filenameXlsx: "bank-template.xlsx",
        filenameDocx: "bank-template.docx",
      },
    };
  }),

  previewFile: publicProcedure
    .input(z.object({
      filename: z.string().min(1).max(200),
      contentBase64: z.string().min(1).max(2_800_000),
    }))
    .mutation(({ input }) => {
      const kind = detectTableFileKind(input.filename);
      const table = uploadToRows(input.filename, input.contentBase64);
      const importer = detectTransactionImporter(table) ?? genericBankImporter;
      const bank = importer.parse(table);
      const recurring = parseRecurringCostRows(table);
      const detected = bank.rows.length ? "bank" : recurring.rows.length ? "recurring" : "table";
      return {
        kind,
        detected,
        rows: table.slice(0, 80),
        rowCount: table.length,
        bank: { rows: bank.rows, skipped: bank.skipped, detected: bank.detected },
        recurring: { rows: recurring.rows, skipped: recurring.skipped },
      };
    }),

  previewPay: publicProcedure
    .input(profileFields.pick({
      monthlyGrossIncome: true,
      monthlyNetIncome: true,
      monthlyIncomeTax: true,
      monthlyHealthInsurance: true,
    }).optional())
    .query(({ input }) => resolvePay(input ?? {})),

  upsert: publicProcedure
    .input(profileFields)
    .mutation(({ ctx, input }) => saveProfile(ctx.db, ctx.userId, input)),

  // 더존·위하고식 일괄 저장: 기본정보 + 고정비 그리드 + 세액 그리드
  workspaceSave: publicProcedure
    .input(z.object({
      month: monthStr.optional(),
      profile: profileFields.optional(),
      recurring: z.array(recurringFields).max(200).default([]),
      deleteRecurringIds: z.array(z.string().uuid()).max(200).default([]),
      taxMonths: z.array(z.object({ month: monthStr, amount: z.number().min(0) })).max(120).default([]),
      deleteTaxIds: z.array(z.string().uuid()).max(120).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.deleteRecurringIds.length) {
        await ctx.db.delete(recurringCosts).where(and(
          eq(recurringCosts.userId, ctx.userId),
          inArray(recurringCosts.id, input.deleteRecurringIds),
        ));
      }
      for (const row of input.recurring) {
        const values = {
          name: row.name.trim(),
          category: row.category,
          amount: String(Math.round(row.amount)),
          dayOfMonth: row.dayOfMonth,
          memo: row.memo,
          isActive: true,
        };
        if (row.id) {
          const [updated] = await ctx.db.update(recurringCosts).set(values)
            .where(and(eq(recurringCosts.id, row.id), eq(recurringCosts.userId, ctx.userId))).returning();
          if (!updated) throw new Error(`고정 항목을 찾을 수 없습니다: ${row.name}`);
        } else {
          await ctx.db.insert(recurringCosts).values({ ...values, userId: ctx.userId });
        }
      }
      if (input.deleteTaxIds.length) {
        await ctx.db.delete(incomeTaxMonths).where(and(
          eq(incomeTaxMonths.userId, ctx.userId),
          inArray(incomeTaxMonths.id, input.deleteTaxIds),
        ));
      }
      for (const t of input.taxMonths) {
        await upsertTaxMonth(ctx.db, ctx.userId, t.month, t.amount);
      }
      const profile = input.profile
        ? await saveProfile(ctx.db, ctx.userId, input.profile, input.month ?? currentKstMonth())
        : null;
      return { ok: true as const, profile };
    }),

  recurringUpsert: publicProcedure
    .input(recurringFields)
    .mutation(async ({ ctx, input }) => {
      const values = {
        name: input.name.trim(),
        category: input.category,
        amount: String(Math.round(input.amount)),
        dayOfMonth: input.dayOfMonth,
        memo: input.memo,
        isActive: true,
      };
      if (input.id) {
        const [row] = await ctx.db.update(recurringCosts).set(values)
          .where(and(eq(recurringCosts.id, input.id), eq(recurringCosts.userId, ctx.userId))).returning();
        if (!row) throw new Error("고정 항목을 찾을 수 없습니다");
        return row;
      }
      const [row] = await ctx.db.insert(recurringCosts).values({ ...values, userId: ctx.userId }).returning();
      return row!;
    }),

  recurringExport: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select().from(recurringCosts)
      .where(and(eq(recurringCosts.userId, ctx.userId), eq(recurringCosts.isActive, true)));
    const mapped = rows.map((r) => ({
      name: r.name,
      category: r.category,
      amount: Number(r.amount),
      dayOfMonth: r.dayOfMonth ?? undefined,
      memo: r.memo ?? undefined,
    }));
    return {
      csv: recurringCostsToCsv(mapped),
      xlsxBase64: toBase64(recurringCostsToXlsx(mapped)),
      docxBase64: toBase64(recurringCostsToDocx(mapped)),
      filename: "fixed-costs.csv",
      filenameXlsx: "fixed-costs.xlsx",
      filenameDocx: "fixed-costs.docx",
    };
  }),

  recurringImport: publicProcedure
    .input(z.object({
      filename: z.string().min(1).max(200),
      contentBase64: z.string().min(1).max(2_800_000),
    }))
    .mutation(async ({ ctx, input }) => {
      const table = uploadToRows(input.filename, input.contentBase64);
      const parsed = parseRecurringCostRows(table);
      const existing = await ctx.db.select().from(recurringCosts)
        .where(eq(recurringCosts.userId, ctx.userId));
      const byName = new Map(existing.map((r) => [r.name, r]));
      let inserted = 0;
      let updated = 0;
      for (const row of parsed.rows) {
        const values = {
          name: row.name,
          category: row.category,
          amount: String(Math.round(row.amount)),
          dayOfMonth: row.dayOfMonth,
          memo: row.memo,
          isActive: true,
        };
        const found = byName.get(row.name);
        if (found) {
          await ctx.db.update(recurringCosts).set(values).where(eq(recurringCosts.id, found.id));
          updated++;
        } else {
          const [created] = await ctx.db.insert(recurringCosts).values({ ...values, userId: ctx.userId }).returning();
          if (created) byName.set(row.name, created);
          inserted++;
        }
      }
      return { inserted, updated, skipped: parsed.skipped, detected: "recurring-costs" };
    }),

  recurringRemove: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(recurringCosts)
        .where(and(eq(recurringCosts.id, input.id), eq(recurringCosts.userId, ctx.userId)));
      return { id: input.id };
    }),

  taxMonthUpsert: publicProcedure
    .input(z.object({ month: monthStr, amount: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      await upsertTaxMonth(ctx.db, ctx.userId, input.month, input.amount);
      return { month: input.month, amount: Math.round(input.amount) };
    }),

  taxMonthRemove: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(incomeTaxMonths)
        .where(and(eq(incomeTaxMonths.id, input.id), eq(incomeTaxMonths.userId, ctx.userId)));
      return { id: input.id };
    }),
});
