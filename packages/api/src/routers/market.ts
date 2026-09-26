import { z } from "zod";
import { and, desc, eq, inArray, isNotNull, notInArray, or, sql, type SQL } from "drizzle-orm";
import { news, macroIndicators, quotes, instruments, watchlist } from "@finvesting/db";
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
  equityWorldIndices,
  commodityWorldIndices,
  FX_PAIRS,
  displayFx,
  INFLATION_COUNTRIES,
  inflationTone,
  wbInflCode,
  ECB_AREA,
  ECB_MEMBER_ISO2,
  POLICY_RATE_COUNTRIES,
  bisPolCode,
  isPolicyPeriodStale,
  policyRateTone,
  parseYahooSearchQuotes,
  instrumentFromYahooHit,
  KOFIA_MAIN_URL,
  parseKofiaMainHtml,
  ECOS_HHLOAN_CODES,
  ECOS_HHLOAN_HS_CODES,
  ECOS_HHNPL_CODES,
  REALTY_METROS,
  alignedShare,
  eokToJo,
  loanGrowth,
  loanYoySeries,
  metroLoanRank,
  realtyLoanMacroCodes,
  ecosLoanRateMacroCodes,
  applyLiveRates,
  realtyRateSnapshot,
  shareOf,
  type LoanPoint,
  type RealtyMetroId,
} from "@finvesting/core";
import { TRPCError } from "@trpc/server";
import { loadLatestFundamentals } from "../lib/fundamentals";
import { latestCloses } from "../lib/holdings";
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
      try {
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
          status: items.length ? "ok" as const : "empty" as const,
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
      } catch {
        return {
          items: [],
          status: "unavailable" as const,
          stats: {
            total: 0,
            ko: 0,
            en: 0,
            categories: NEWS_CATEGORIES.map((c) => ({ id: c.id, label: c.label, n: 0 })),
          },
          publishers: [],
        };
      }
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
      id: string; label: string; symbol: string; currency: string | null; date: string | null; close: number | null; changePct: number | null; spark: number[];
      href: string | null; hrefLabel: string | null; quoteSource: string | null;
    }>();
    for (const inst of insts) {
      const qs = await ctx.db.select({
        date: quotes.date,
        close: quotes.close,
      }).from(quotes).where(eq(quotes.instrumentId, inst.id)).orderBy(desc(quotes.date)).limit(60);
      const close = qs[0] ? Number(qs[0].close) : null;
      const prev = qs[1] ? Number(qs[1].close) : null;
      const meta = worldIndexByYahoo(inst.symbol);
      const spark = [...qs].reverse().map((q) => Number(q.close)).filter((n) => Number.isFinite(n));
      bySym.set(inst.symbol.toUpperCase(), {
        id: meta?.id ?? inst.symbol,
        label: meta?.label ?? inst.name,
        symbol: inst.symbol,
        currency: inst.currency,
        date: qs[0]?.date ?? null,
        close: Number.isFinite(close) ? close : null,
        changePct: close != null && prev && prev !== 0 ? (close - prev) / prev : null,
        spark,
        href: meta?.href ?? null,
        hrefLabel: meta?.hrefLabel ?? null,
        quoteSource: "yahoo",
      });
    }
    const empty = (i: (typeof WORLD_INDICES)[number]) => ({
      id: i.id, label: i.label, symbol: i.yahoo, currency: null, date: null, close: null, changePct: null, spark: [] as number[],
      href: i.href ?? null, hrefLabel: i.hrefLabel ?? null, quoteSource: null,
    });
    const indices = equityWorldIndices().map((i) => bySym.get(i.yahoo.toUpperCase()) ?? empty(i));
    const commodities = commodityWorldIndices().map((i) => bySym.get(i.yahoo.toUpperCase()) ?? empty(i));

    const [upbitBtc] = await ctx.db.select({ id: instruments.id, currency: instruments.currency })
      .from(instruments)
      .where(and(eq(instruments.symbol, "BTC"), eq(instruments.market, "UPBIT")))
      .limit(1);
    if (upbitBtc) {
      const qs = await ctx.db.select({ date: quotes.date, close: quotes.close })
        .from(quotes).where(eq(quotes.instrumentId, upbitBtc.id)).orderBy(desc(quotes.date)).limit(60);
      const close = qs[0] ? Number(qs[0].close) : null;
      if (close != null && Number.isFinite(close)) {
        const prev = qs[1] ? Number(qs[1].close) : null;
        const btcAt = indices.findIndex((x) => x.id === "btc");
        if (btcAt >= 0) {
          const meta = WORLD_INDICES.find((i) => i.id === "btc");
          indices[btcAt] = {
            id: "btc",
            label: meta?.label ?? "비트코인",
            symbol: "BTC",
            currency: upbitBtc.currency ?? "KRW",
            date: qs[0]?.date ?? null,
            close,
            changePct: prev && prev !== 0 ? (close - prev) / prev : null,
            spark: [...qs].reverse().map((q) => Number(q.close)).filter((n) => Number.isFinite(n)),
            href: meta?.href ?? null,
            hrefLabel: meta?.hrefLabel ?? null,
            quoteSource: "upbit",
          };
        }
      }
    }

    const fx = [];
    for (const pair of FX_PAIRS) {
      const rows = await ctx.db.select({
        date: macroIndicators.date,
        value: macroIndicators.value,
        source: macroIndicators.source,
      }).from(macroIndicators).where(eq(macroIndicators.code, pair.code)).orderBy(desc(macroIndicators.date)).limit(60);
      const raw = rows[0] ? Number(rows[0].value) : null;
      const prev = rows[1] ? Number(rows[1].value) : null;
      const close = raw != null && Number.isFinite(raw) ? displayFx(raw, pair) : null;
      fx.push({
        id: pair.id,
        label: pair.label,
        symbol: pair.yahoo,
        currency: pair.unit,
        date: rows[0]?.date ?? null,
        close,
        changePct: raw != null && prev && prev !== 0 ? (raw - prev) / prev : null,
        spark: [...rows].reverse().map((r) => {
          const n = Number(r.value);
          return Number.isFinite(n) ? displayFx(n, pair) : NaN;
        }).filter((n) => Number.isFinite(n)),
        href: pair.href,
        hrefLabel: "Investing.com",
        quoteSource: rows[0]?.source ?? null,
      });
    }

    const dates = [...indices, ...commodities, ...fx].map((i) => i.date).filter((d): d is string => d != null);
    const asOf = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;
    const sa = await ctx.db.select(newsListCols).from(news)
      .where(eq(news.source, "rss:seeking-alpha"))
      .orderBy(sql`${news.publishedAt} DESC NULLS LAST`)
      .limit(6);
    return { indices, commodities, fx, asOf, delayed: true as const, source: "yahoo" as const, seekingAlpha: sa };
  }),

  watchlist: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select({
      id: watchlist.id,
      instrumentId: watchlist.instrumentId,
      note: watchlist.note,
      symbol: instruments.symbol,
      name: instruments.name,
      market: instruments.market,
      currency: instruments.currency,
    }).from(watchlist)
      .innerJoin(instruments, eq(watchlist.instrumentId, instruments.id))
      .where(eq(watchlist.userId, ctx.userId));
    const qMap = await latestCloses(ctx.db, rows.map((r) => r.instrumentId));
    return rows.map((r) => {
      const q = qMap.get(r.instrumentId);
      return {
        ...r,
        lastPrice: q?.close ?? null,
        lastDate: q?.date ?? null,
        quoteSource: q?.source ?? null,
      };
    });
  }),

  watchAdd: publicProcedure
    .input(z.object({
      symbol: z.string().min(1).max(32),
      name: z.string().min(1).max(80),
      exchange: z.string().max(40).nullable(),
      quoteType: z.string().max(40).nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const draft = instrumentFromYahooHit(input);
      if (!draft) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "지수·선물은 관심 종목에 넣지 않습니다." });
      }
      const [found] = await ctx.db.select().from(instruments)
        .where(and(eq(instruments.symbol, draft.symbol), eq(instruments.market, draft.market)));
      const inst = found ?? (await ctx.db.insert(instruments).values({
        symbol: draft.symbol,
        market: draft.market,
        name: draft.name,
        assetClass: draft.assetClass,
        currency: draft.currency,
      }).returning())[0];
      if (!inst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "종목을 만들지 못했습니다." });
      const [existing] = await ctx.db.select().from(watchlist)
        .where(and(eq(watchlist.userId, ctx.userId), eq(watchlist.instrumentId, inst.id)));
      if (existing) return { id: existing.id, already: true as const, symbol: inst.symbol, name: inst.name };
      const [row] = await ctx.db.insert(watchlist).values({
        userId: ctx.userId,
        instrumentId: inst.id,
      }).returning();
      return { id: row!.id, already: false as const, symbol: inst.symbol, name: inst.name };
    }),

  watchRemove: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(watchlist).where(and(eq(watchlist.id, input.id), eq(watchlist.userId, ctx.userId)));
      return { ok: true as const };
    }),

  instruments: publicProcedure.query(({ ctx }) => ctx.db.select().from(instruments)),

  inflationMap: publicProcedure.query(async ({ ctx }) => {
    const codes = INFLATION_COUNTRIES.map((c) => wbInflCode(c.iso2));
    let rows: { code: string; date: string; value: string; source: string }[] = [];
    try {
      rows = await ctx.db.select({
        code: macroIndicators.code,
        date: macroIndicators.date,
        value: macroIndicators.value,
        source: macroIndicators.source,
      }).from(macroIndicators).where(inArray(macroIndicators.code, codes)).orderBy(desc(macroIndicators.date));
    } catch {
      rows = [];
    }
    const latest = new Map<string, { date: string; value: number; source: string }>();
    for (const r of rows) {
      if (latest.has(r.code)) continue;
      const n = Number(r.value);
      if (!Number.isFinite(n)) continue;
      latest.set(r.code, { date: r.date, value: n, source: r.source });
    }
    const items = INFLATION_COUNTRIES.map((c) => {
      const hit = latest.get(wbInflCode(c.iso2));
      return {
        iso2: c.iso2,
        label: c.label,
        date: hit?.date ?? null,
        value: hit?.value ?? null,
        source: hit?.source ?? null,
        tone: hit ? inflationTone(hit.value) : null,
      };
    });
    const years = items.map((i) => i.date).filter((d): d is string => d != null);
    return { items, asOf: years.length ? years.reduce((a, b) => (a > b ? a : b)) : null, delayed: true as const };
  }),

  policyRateMap: publicProcedure.query(async ({ ctx }) => {
    const codes = [...POLICY_RATE_COUNTRIES.map((c) => bisPolCode(c.iso2)), bisPolCode(ECB_AREA.iso2)];
    let rows: { code: string; date: string; value: string; source: string }[] = [];
    try {
      rows = await ctx.db.select({
        code: macroIndicators.code,
        date: macroIndicators.date,
        value: macroIndicators.value,
        source: macroIndicators.source,
      }).from(macroIndicators).where(inArray(macroIndicators.code, codes)).orderBy(desc(macroIndicators.date));
    } catch {
      rows = [];
    }
    const latest = new Map<string, { date: string; value: number; source: string }>();
    for (const r of rows) {
      if (latest.has(r.code)) continue;
      const n = Number(r.value);
      if (!Number.isFinite(n)) continue;
      latest.set(r.code, { date: r.date, value: n, source: r.source });
    }
    const xm = latest.get(bisPolCode(ECB_AREA.iso2));
    const ecbMembers = new Set<string>(ECB_MEMBER_ISO2);
    function resolve(iso2: string, label: string) {
      const own = latest.get(bisPolCode(iso2));
      const ownOk = own != null && !isPolicyPeriodStale(own.date.slice(0, 7));
      if (ownOk && own) {
        return { iso2, label, date: own.date, value: own.value, source: own.source, via: "national" as const, tone: policyRateTone(own.value) };
      }
      const xmOk = xm != null && !isPolicyPeriodStale(xm.date.slice(0, 7));
      if (ecbMembers.has(iso2) && xmOk && xm) {
        return { iso2, label, date: xm.date, value: xm.value, source: xm.source, via: "ecb" as const, tone: policyRateTone(xm.value) };
      }
      return { iso2, label, date: null, value: null, source: null, via: "national" as const, tone: null };
    }
    const items = [
      resolve(ECB_AREA.iso2, ECB_AREA.label),
      ...POLICY_RATE_COUNTRIES.map((c) => resolve(c.iso2, c.label)),
    ];
    const dates = items.map((i) => i.date).filter((d): d is string => d != null);
    return { items, asOf: dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null, delayed: true as const };
  }),

  searchSymbols: publicProcedure
    .input(z.object({ q: z.string().trim().min(2).max(40) }))
    .query(async ({ input }) => {
      const u = new URL("https://query1.finance.yahoo.com/v1/finance/search");
      u.searchParams.set("q", input.q);
      u.searchParams.set("quotesCount", "8");
      u.searchParams.set("newsCount", "0");
      u.searchParams.set("enableFuzzyQuery", "false");
      u.searchParams.set("lang", "ko-KR");
      u.searchParams.set("region", "KR");
      const res = await fetch(u.toString(), {
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
      });
      if (!res.ok) {
        const hangul = /[\uac00-\ud7a3]/.test(input.q);
        return {
          items: [] as ReturnType<typeof parseYahooSearchQuotes>,
          error: hangul
            ? "한글 회사명은 Yahoo 검색이 거절합니다. 종목코드(005930)나 영문(samsung)으로 찾아 보세요."
            : `http ${res.status}`,
        };
      }
      const json: unknown = await res.json();
      return { items: parseYahooSearchQuotes(json, 8) };
    }),

  // Yahoo 일 단위 스냅샷. 종목별 최신 1행. DART 재무제표와 별개.
  fundamentals: publicProcedure.query(({ ctx }) => loadLatestFundamentals(ctx.db)),

  kofiaFunds: publicProcedure.query(async ({ ctx }) => {
    const year = Number(new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 4));
    try {
      const res = await fetch(KOFIA_MAIN_URL, {
        headers: { "User-Agent": "Finvesting/0.1 (personal)" },
      });
      if (res.ok) {
        const live = parseKofiaMainHtml(await res.text(), year);
        if (live.deposit != null || live.credit != null) return live;
      }
    } catch { /* DB */ }
    try {
      const rows = await ctx.db.select({
        code: macroIndicators.code,
        date: macroIndicators.date,
        value: macroIndicators.value,
      }).from(macroIndicators)
        .where(inArray(macroIndicators.code, ["KOFIA_INVESTOR_DEPOSIT", "KOFIA_CREDIT", "KOFIA_MARGIN"]))
        .orderBy(desc(macroIndicators.date));
      const latest: Record<string, { date: string; value: number }> = {};
      for (const r of rows) {
        if (latest[r.code]) continue;
        const n = Number(r.value);
        if (!Number.isFinite(n)) continue;
        latest[r.code] = { date: r.date, value: n };
      }
      const deposit = latest.KOFIA_INVESTOR_DEPOSIT?.value ?? null;
      const credit = latest.KOFIA_CREDIT?.value ?? null;
      const margin = latest.KOFIA_MARGIN?.value ?? null;
      return {
        asOf: latest.KOFIA_INVESTOR_DEPOSIT?.date ?? latest.KOFIA_CREDIT?.date ?? null,
        unit: "백만원" as const,
        source: "kofia-main" as const,
        deposit,
        credit,
        margin,
        slices: [
          { id: "deposit" as const, label: "투자자예탁금", millionWon: deposit },
          { id: "credit" as const, label: "신용융자", millionWon: credit },
          { id: "margin" as const, label: "위탁매매 미수금", millionWon: margin },
        ],
      };
    } catch {
      return parseKofiaMainHtml("", year);
    }
  }),

  // 예금은행 광역시도 가계대출 말잔. 시·구 숫자는 ECOS에 없음.
  realtyLoans: publicProcedure.query(async ({ ctx }) => {
    let rows: { code: string; date: string; value: string }[] = [];
    let dbOk = true;
    try {
      rows = await ctx.db.select({
        code: macroIndicators.code,
        date: macroIndicators.date,
        value: macroIndicators.value,
      }).from(macroIndicators)
        .where(inArray(macroIndicators.code, [...realtyLoanMacroCodes(), ...ecosLoanRateMacroCodes()]))
        .orderBy(desc(macroIndicators.date));
    } catch {
      dbOk = false;
      rows = [];
    }
    const byCode = new Map<string, LoanPoint[]>();
    for (const r of rows) {
      const n = Number(r.value);
      if (!Number.isFinite(n)) continue;
      const arr = byCode.get(r.code) ?? [];
      if (arr.length >= 48) continue;
      arr.push({ date: r.date, value: n });
      byCode.set(r.code, arr);
    }
    for (const [k, arr] of byCode) {
      byCode.set(k, [...arr].reverse());
    }

    function pack(metro: RealtyMetroId) {
      const total = byCode.get(ECOS_HHLOAN_CODES[metro]) ?? [];
      const housing = byCode.get(ECOS_HHLOAN_HS_CODES[metro]) ?? [];
      const npl = byCode.get(ECOS_HHNPL_CODES[metro]) ?? [];
      const last = total[total.length - 1];
      const hs = housing[housing.length - 1];
      const np = npl[npl.length - 1];
      const label = REALTY_METROS.find((m) => m.id === metro)?.label ?? metro;
      return {
        id: metro,
        label,
        date: last?.date ?? null,
        latest: last?.value ?? null,
        latestJo: last ? eokToJo(last.value) : null,
        yoy: loanGrowth(total, 12),
        mom: loanGrowth(total, 1),
        housing: hs?.value ?? null,
        housingJo: hs ? eokToJo(hs.value) : null,
        npl: np?.value ?? null,
        nplDate: np?.date ?? null,
        total,
        yoySeries: loanYoySeries(total),
        housingSeries: housing,
      };
    }
    const kr = byCode.get(ECOS_HHLOAN_CODES.kr) ?? [];
    const krLast = kr[kr.length - 1];
    const krVal = krLast?.value ?? null;
    const metros = {} as Record<RealtyMetroId, ReturnType<typeof pack> & {
      shareOfKr: number | null;
      shareSeries: LoanPoint[];
      housingShare: number | null;
    }>;
    for (const m of REALTY_METROS) {
      const row = pack(m.id);
      metros[m.id] = {
        ...row,
        shareOfKr: shareOf(row.latest, krVal),
        shareSeries: alignedShare(row.total, kr),
        housingShare: shareOf(row.housing, row.latest),
      };
    }
    const rank = metroLoanRank(
      REALTY_METROS.map((m) => ({ id: m.id, label: m.label, latest: metros[m.id].latest })),
      krVal,
    );
    const dates = [...REALTY_METROS.map((m) => metros[m.id].date), krLast?.date ?? null]
      .filter((d): d is string => d != null);
    const live: Record<string, { date: string; value: number }> = {};
    for (const code of ecosLoanRateMacroCodes()) {
      const arr = byCode.get(code);
      const last = arr?.[arr.length - 1];
      if (last) live[code] = last;
    }
    return {
      status: !dbOk ? "unavailable" as const : (dates.length ? "ok" as const : "empty" as const),
      grain: "metro" as const,
      unit: "십억원",
      note: "시·구 가계대출은 한국은행 ECOS에 없습니다. 예금은행 광역시도 말잔입니다. 전국 대비 비중이지 가계신용/GDP가 아닙니다.",
      asOf: dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null,
      kr: krLast ? { date: krLast.date, latest: krLast.value, latestJo: eokToJo(krLast.value) } : null,
      rank,
      metros,
      rates: applyLiveRates(realtyRateSnapshot(), live),
    };
  }),
});
