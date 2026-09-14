import { z } from "zod";
import { and, desc, eq, inArray, isNotNull, notInArray, or, sql, type SQL } from "drizzle-orm";
import { news, macroIndicators, quotes, instruments } from "@finvesting/db";
import {
  ANALYST_TITLE_RE,
  NEWS_CATEGORIES,
  NEWS_CATEGORY_IDS,
  OPINION_CATEGORIES,
  OPINION_CATEGORY_IDS,
  allOpinionSources,
  newsCategoriesForLang,
  newsCategoryForSource,
  opinionCategoriesForLang,
  opinionCategoryForItem,
  opinionCategoryForSource,
  sourcesForNewsCategory,
  sourcesForOpinionCategory,
  WORLD_INDICES,
  worldIndexByYahoo,
  worldIndexYahooTickers,
} from "@finvesting/core";
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

const newsOnly = notInArray(news.source, allOpinionSources());
const analystTitle = sql`${news.title} ~ ${ANALYST_TITLE_RE.source}`;
const opinionBoard = or(inArray(news.source, allOpinionSources()), analystTitle);

export const marketRouter = router({
  latestNews: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(30) }).optional())
    .query(({ ctx, input }) =>
      ctx.db.select(newsListCols).from(news).where(newsOnly)
        .orderBy(sql`${news.publishedAt} DESC NULLS LAST`).limit(input?.limit ?? 30),
    ),

  latestOpinions: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(({ ctx, input }) =>
      ctx.db.select(newsListCols).from(news).where(opinionBoard)
        .orderBy(sql`${news.publishedAt} DESC NULLS LAST`).limit(input?.limit ?? 20),
    ),

  // 뉴스 대시보드. embedding/raw 본문은 내리지 않는다. lang은 raw.lang. 분류는 source.
  newsFeed: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(200).default(80),
      lang: z.enum(["ko", "en"]).optional(),
      publisher: z.string().min(1).max(80).optional(),
      category: z.enum(NEWS_CATEGORY_IDS).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 80;
      const conds: SQL[] = [newsOnly];
      if (input?.lang) conds.push(sql`${news.raw}->>'lang' = ${input.lang}`);
      if (input?.publisher) conds.push(eq(news.publisher, input.publisher));
      if (input?.category) conds.push(inArray(news.source, sourcesForNewsCategory(input.category)));

      const selectCols = {
        ...newsListCols,
        lang: sql<string | null>`${news.raw}->>'lang'`,
        source: news.source,
      };
      const order = sql`${news.publishedAt} DESC NULLS LAST`;

      let rawItems;
      const split = !input?.category && !input?.publisher;
      if (split) {
        const cats = newsCategoriesForLang(input?.lang);
        const per = Math.min(limit, 80);
        const chunks = await Promise.all(cats.map((c) => {
          const where = and(...conds, inArray(news.source, sourcesForNewsCategory(c.id)));
          return ctx.db.select(selectCols).from(news).where(where).orderBy(order).limit(per);
        }));
        rawItems = chunks.flat();
      } else {
        rawItems = await ctx.db.select(selectCols).from(news).where(and(...conds)).orderBy(order).limit(limit);
      }

      const items = rawItems.map((n) => ({ ...n, category: newsCategoryForSource(n.source) }));

      const langRows = await ctx.db.select({
        lang: sql<string>`coalesce(${news.raw}->>'lang', '')`,
        n: sql<number>`count(*)::int`,
      }).from(news).where(newsOnly).groupBy(sql`coalesce(${news.raw}->>'lang', '')`);
      const sourceRows = await ctx.db.select({
        source: news.source,
        n: sql<number>`count(*)::int`,
      }).from(news).where(newsOnly).groupBy(news.source);

      const pubConds: SQL[] = [newsOnly];
      if (input?.lang) pubConds.push(sql`${news.raw}->>'lang' = ${input.lang}`);
      if (input?.category) pubConds.push(inArray(news.source, sourcesForNewsCategory(input.category)));
      pubConds.push(isNotNull(news.publisher));
      const publishers = await ctx.db.select({
        publisher: news.publisher,
        n: sql<number>`count(*)::int`,
      }).from(news)
        .where(and(...pubConds))
        .groupBy(news.publisher)
        .orderBy(desc(sql`count(*)`));

      const byLang: Record<string, number> = {};
      let total = 0;
      for (const r of langRows) {
        const n = ni(r.n);
        byLang[r.lang] = n;
        total += n;
      }
      const byCategory: Record<string, number> = Object.fromEntries(NEWS_CATEGORY_IDS.map((id) => [id, 0]));
      for (const r of sourceRows) {
        const cat = newsCategoryForSource(r.source);
        if (cat !== "other") byCategory[cat] = (byCategory[cat] ?? 0) + ni(r.n);
      }
      return {
        items,
        stats: {
          total,
          ko: byLang.ko ?? 0,
          en: byLang.en ?? 0,
          categories: NEWS_CATEGORIES.map((c) => ({ id: c.id, label: c.label, n: byCategory[c.id] ?? 0 })),
        },
        publishers: publishers
          .filter((p): p is { publisher: string; n: number } => Boolean(p.publisher))
          .map((p) => ({ publisher: p.publisher, n: ni(p.n) })),
      };
    }),

  // 오피니언 대시보드. 전용 RSS + 국내 뉴스 제목의 투자의견. 본문 없음.
  opinionFeed: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(200).default(40),
      lang: z.enum(["ko", "en"]).optional(),
      publisher: z.string().min(1).max(80).optional(),
      category: z.enum(OPINION_CATEGORY_IDS).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 40;
      const conds: SQL[] = [];
      if (input?.lang) conds.push(sql`${news.raw}->>'lang' = ${input.lang}`);
      if (input?.publisher) conds.push(eq(news.publisher, input.publisher));
      if (input?.category === "analyst") conds.push(or(inArray(news.source, sourcesForOpinionCategory("analyst")), analystTitle)!);
      else if (input?.category) {
        conds.push(inArray(news.source, sourcesForOpinionCategory(input.category)));
        conds.push(sql`not (${analystTitle})`);
      } else conds.push(opinionBoard!);

      const selectCols = {
        ...newsListCols,
        lang: sql<string | null>`${news.raw}->>'lang'`,
        source: news.source,
      };
      const order = sql`${news.publishedAt} DESC NULLS LAST`;

      let rawItems;
      const split = !input?.category && !input?.publisher;
      if (split) {
        const cats = opinionCategoriesForLang(input?.lang);
        const per = Math.min(limit, 40);
        const chunks = await Promise.all(cats.map((c) => {
          const extra: SQL[] = c.id === "analyst"
            ? [or(inArray(news.source, sourcesForOpinionCategory("analyst")), analystTitle)!]
            : [inArray(news.source, sourcesForOpinionCategory(c.id)), sql`not (${analystTitle})`];
          const langCond = input?.lang ? [sql`${news.raw}->>'lang' = ${input.lang}`] : [];
          return ctx.db.select(selectCols).from(news).where(and(...langCond, ...extra)).orderBy(order).limit(per);
        }));
        rawItems = chunks.flat();
      } else {
        rawItems = await ctx.db.select(selectCols).from(news).where(and(...conds)).orderBy(order).limit(limit);
      }

      const items = rawItems.map((n) => ({ ...n, category: opinionCategoryForItem(n.source, n.title) }));

      const sourceRows = await ctx.db.select({
        source: news.source,
        n: sql<number>`count(*)::int`,
      }).from(news).where(inArray(news.source, allOpinionSources())).groupBy(news.source);
      const extraAnalyst = await ctx.db.select({
        n: sql<number>`count(*)::int`,
      }).from(news).where(and(analystTitle, newsOnly));

      const pubConds: SQL[] = [opinionBoard!];
      if (input?.lang) pubConds.push(sql`${news.raw}->>'lang' = ${input.lang}`);
      if (input?.category === "analyst") pubConds.push(or(inArray(news.source, sourcesForOpinionCategory("analyst")), analystTitle)!);
      else if (input?.category) pubConds.push(inArray(news.source, sourcesForOpinionCategory(input.category)));
      pubConds.push(isNotNull(news.publisher));
      const publishers = await ctx.db.select({
        publisher: news.publisher,
        n: sql<number>`count(*)::int`,
      }).from(news)
        .where(and(...pubConds))
        .groupBy(news.publisher)
        .orderBy(desc(sql`count(*)`));

      const byCategory: Record<string, number> = Object.fromEntries(OPINION_CATEGORY_IDS.map((id) => [id, 0]));
      let ko = 0;
      let en = 0;
      for (const r of sourceRows) {
        const cat = opinionCategoryForSource(r.source);
        const n = ni(r.n);
        if (cat !== "other") byCategory[cat] = (byCategory[cat] ?? 0) + n;
        if (cat === "kr_column") ko += n;
        else if (cat !== "other") en += n;
      }
      const extra = ni(extraAnalyst[0]?.n);
      byCategory.analyst = (byCategory.analyst ?? 0) + extra;
      ko += extra;
      const total = ko + en;

      return {
        items,
        stats: {
          total,
          ko,
          en,
          categories: OPINION_CATEGORIES.map((c) => ({ id: c.id, label: c.label, n: byCategory[c.id] ?? 0 })),
        },
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

  // 세계 지수 최신 종가. 위젯과 별개로 worker Yahoo가 채운 숫자만.
  indexBoard: publicProcedure.query(async ({ ctx }) => {
    const tickers = worldIndexYahooTickers();
    const insts = await ctx.db.select({
      id: instruments.id,
      symbol: instruments.symbol,
      name: instruments.name,
      currency: instruments.currency,
    }).from(instruments).where(inArray(instruments.symbol, tickers));
    const bySym = new Map<string, {
      id: string; label: string; symbol: string; currency: string | null; date: string | null; close: number | null; changePct: number | null;
    }>();
    for (const inst of insts) {
      const qs = await ctx.db.select({
        date: quotes.date,
        close: quotes.close,
      }).from(quotes).where(eq(quotes.instrumentId, inst.id)).orderBy(desc(quotes.date)).limit(2);
      const close = qs[0] ? Number(qs[0].close) : null;
      const prev = qs[1] ? Number(qs[1].close) : null;
      const meta = worldIndexByYahoo(inst.symbol);
      bySym.set(inst.symbol.toUpperCase(), {
        id: meta?.id ?? inst.symbol,
        label: meta?.label ?? inst.name,
        symbol: inst.symbol,
        currency: inst.currency,
        date: qs[0]?.date ?? null,
        close: Number.isFinite(close) ? close : null,
        changePct: close != null && prev && prev !== 0 ? (close - prev) / prev : null,
      });
    }
    const indices = WORLD_INDICES.map((i) => bySym.get(i.yahoo.toUpperCase()) ?? {
      id: i.id, label: i.label, symbol: i.yahoo, currency: null, date: null, close: null, changePct: null,
    });
    const sa = await ctx.db.select(newsListCols).from(news)
      .where(eq(news.source, "rss:seeking-alpha"))
      .orderBy(sql`${news.publishedAt} DESC NULLS LAST`)
      .limit(6);
    return { indices, seekingAlpha: sa };
  }),

  instruments: publicProcedure.query(({ ctx }) => ctx.db.select().from(instruments)),
});
