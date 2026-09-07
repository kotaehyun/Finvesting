import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { accounts, transactions } from "@finvesting/db";
import { router, publicProcedure } from "../trpc";
import { parseUpload } from "../lib/parse-upload";

const parsedRow = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  direction: z.enum(["in", "out"]),
  merchant: z.string().nullish(),
  memo: z.string().nullish(),
  balanceAfter: z.number().nullish(),
  raw: z.record(z.unknown()),
});

function categoryFor(direction: "in" | "out") {
  return direction === "in" ? "other_income" as const : "uncategorized" as const;
}

function dupKey(r: { date: string; amount: number | string; direction: string; memo?: string | null; merchant?: string | null }) {
  return `${r.date}|${Number(r.amount)}|${r.direction}|${r.memo ?? ""}|${r.merchant ?? ""}`;
}

export const transactionsRouter = router({
  list: publicProcedure
    .input(z.object({ accountId: z.string().uuid(), limit: z.number().min(1).max(200).default(50) }))
    .query(async ({ ctx, input }) => {
      const [acct] = await ctx.db.select({ id: accounts.id }).from(accounts)
        .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.userId)));
      if (!acct) return [];
      return ctx.db.select().from(transactions)
        .where(and(eq(transactions.userId, ctx.userId), eq(transactions.accountId, input.accountId)))
        .orderBy(desc(transactions.date))
        .limit(input.limit);
    }),

  previewImport: publicProcedure
    .input(z.object({
      filename: z.string().min(1).max(200),
      contentBase64: z.string().min(1).max(2_800_000),
    }))
    .mutation(({ input }) => parseUpload(input.filename, input.contentBase64)),

  commitImport: publicProcedure
    .input(z.object({
      accountId: z.string().uuid(),
      detected: z.string().min(1),
      rows: z.array(parsedRow).min(1).max(5000),
    }))
    .mutation(async ({ ctx, input }) => {
      const [acct] = await ctx.db.select().from(accounts)
        .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.userId), eq(accounts.isActive, true)));
      if (!acct) throw new Error("계좌를 찾을 수 없습니다");

      const existing = await ctx.db.select({
        date: transactions.date, amount: transactions.amount, direction: transactions.direction,
        memo: transactions.memo, merchant: transactions.merchant,
      }).from(transactions).where(and(eq(transactions.userId, ctx.userId), eq(transactions.accountId, input.accountId)));
      const seen = new Set(existing.map((e) => dupKey({ ...e, date: String(e.date) })));

      const toInsert = input.rows.filter((r) => {
        const k = dupKey(r);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      for (let i = 0; i < toInsert.length; i += 200) {
        const chunk = toInsert.slice(i, i + 200);
        await ctx.db.insert(transactions).values(chunk.map((r) => ({
          userId: ctx.userId,
          accountId: input.accountId,
          date: r.date,
          amount: String(r.amount),
          direction: r.direction,
          category: categoryFor(r.direction),
          merchant: r.merchant ?? undefined,
          memo: r.memo ?? undefined,
          source: `csv:${input.detected}`,
          raw: r.raw,
        })));
      }

      const lastBal = [...input.rows].reverse().find((r) => r.balanceAfter != null);
      if (lastBal?.balanceAfter != null) {
        await ctx.db.update(accounts).set({ balance: String(lastBal.balanceAfter) }).where(eq(accounts.id, input.accountId));
      }

      return { inserted: toInsert.length, duplicate: input.rows.length - toInsert.length, balanceUpdated: lastBal?.balanceAfter ?? null };
    }),
});
