import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { accounts } from "@finvesting/db";
import { router, publicProcedure } from "../trpc";

export const accountsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.select().from(accounts).where(and(eq(accounts.userId, ctx.userId), eq(accounts.isActive, true))),
  ),
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      institution: z.string().optional(),
      type: z.enum(["checking", "savings", "installment", "brokerage", "crypto", "card", "cash", "pension", "loan"]),
      currency: z.string().default("KRW"),
      balance: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db.insert(accounts).values({ ...input, userId: ctx.userId, balance: String(input.balance) }).returning();
      return row;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(80).optional(),
      institution: z.string().max(80).optional(),
      type: z.enum(["checking", "savings", "installment", "brokerage", "crypto", "card", "cash", "pension", "loan"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...patch } = input;
      const values: { name?: string; institution?: string | null; type?: typeof input.type } = {};
      if (patch.name != null) values.name = patch.name.trim();
      if (patch.institution != null) values.institution = patch.institution.trim() || null;
      if (patch.type != null) values.type = patch.type;
      const [row] = await ctx.db.update(accounts).set(values)
        .where(and(eq(accounts.id, id), eq(accounts.userId, ctx.userId)))
        .returning();
      if (!row) throw new Error("계좌를 찾을 수 없습니다");
      return row;
    }),
});
