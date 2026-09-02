import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { accounts } from "@finvesting/db";
import { router, publicProcedure } from "../trpc.js";

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
});
