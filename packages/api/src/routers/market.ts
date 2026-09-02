import { z } from "zod";
import { desc, eq, inArray } from "drizzle-orm";
import { news, macroIndicators, quotes, instruments } from "@finvesting/db";
import { router, publicProcedure } from "../trpc.js";

export const marketRouter = router({
  latestNews: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(30) }).optional())
    .query(({ ctx, input }) => ctx.db.select().from(news).orderBy(desc(news.publishedAt)).limit(input?.limit ?? 30)),

  macro: publicProcedure
    .input(z.object({ codes: z.array(z.string()) }))
    .query(({ ctx, input }) =>
      ctx.db.select().from(macroIndicators).where(inArray(macroIndicators.code, input.codes)).orderBy(desc(macroIndicators.date)).limit(500),
    ),

  quotes: publicProcedure
    .input(z.object({ instrumentId: z.string().uuid(), limit: z.number().default(120) }))
    .query(({ ctx, input }) =>
      ctx.db.select().from(quotes).where(eq(quotes.instrumentId, input.instrumentId)).orderBy(desc(quotes.date)).limit(input.limit),
    ),

  instruments: publicProcedure.query(({ ctx }) => ctx.db.select().from(instruments)),
});
