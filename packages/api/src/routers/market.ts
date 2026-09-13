import { z } from "zod";
import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { news, macroIndicators, quotes, instruments } from "@finvesting/db";
import { router, publicProcedure } from "../trpc";

const newsListCols = {
  id: news.id,
  title: news.title,
  url: news.url,
  publisher: news.publisher,
  publishedAt: news.publishedAt,
  summary: news.summary,
};

function ni(v: unknown) {
  return Number(v) || 0;
}

export const marketRouter = router({
  latestNews: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(30) }).optional())
    .query(({ ctx, input }) =>
      ctx.db.select(newsListCols).from(news).orderBy(sql`${news.publishedAt} DESC NULLS LAST`).limit(input?.limit ?? 30),
    ),

  // 뉴스 대시보드. embedding/raw 본문은 내리지 않는다. lang은 raw.lang.
  newsFeed: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(200).default(80),
      lang: z.enum(["ko", "en"]).optional(),
      publisher: z.string().min(1).max(80).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const conds = [];
      if (input?.lang) conds.push(sql`${news.raw}->>'lang' = ${input.lang}`);
      if (input?.publisher) conds.push(eq(news.publisher, input.publisher));
      const where = conds.length ? and(...conds) : undefined;
      const items = await ctx.db.select({
        ...newsListCols,
        lang: sql<string | null>`${news.raw}->>'lang'`,
        source: news.source,
      }).from(news)
        .where(where)
        .orderBy(sql`${news.publishedAt} DESC NULLS LAST`)
        .limit(input?.limit ?? 80);
      const langRows = await ctx.db.select({
        lang: sql<string>`coalesce(${news.raw}->>'lang', '')`,
        n: sql<number>`count(*)::int`,
      }).from(news).groupBy(sql`coalesce(${news.raw}->>'lang', '')`);
      const publishers = await ctx.db.select({
        publisher: news.publisher,
        n: sql<number>`count(*)::int`,
      }).from(news)
        .where(isNotNull(news.publisher))
        .groupBy(news.publisher)
        .orderBy(desc(sql`count(*)`));
      const byLang: Record<string, number> = {};
      let total = 0;
      for (const r of langRows) {
        const n = ni(r.n);
        byLang[r.lang] = n;
        total += n;
      }
      return {
        items,
        stats: { total, ko: byLang.ko ?? 0, en: byLang.en ?? 0 },
        publishers: publishers
          .filter((p): p is { publisher: string; n: number } => Boolean(p.publisher))
          .map((p) => ({ publisher: p.publisher, n: ni(p.n) })),
      };
    }),

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
