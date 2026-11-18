import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, cosineDistance, desc, eq, inArray, isNotNull, notInArray, or, sql } from "drizzle-orm";
import { news, macroIndicators, quotes, instruments, watchlist, chatSessions, chatMessages, type Db } from "@finvesting/db";
import { ANALYST_TITLE_RE, allOpinionSources, formatFundamentalsContext, formatInvestStyleContext, isNewsEmbedVector, NEWS_EMBED_DIM, NEWS_EMBED_MODEL, newsEmbedInput, signedWon, worldIndexByYahoo, worldIndexYahooTickers } from "@finvesting/core";
import { createProvider, INVEST_ASSISTANT_SYSTEM, buildContextBlock, type LlmProvider } from "@finvesting/ai";
import { router, publicProcedure } from "../trpc";
import { loadOverview } from "../lib/overview";
import { loadCoverageSnapshot } from "../lib/insurance-coverage";
import { loadLatestFundamentals } from "../lib/fundamentals";
import { loadInvestAdvice } from "../lib/invest-advice";
import { listStatementInstruments, loadStatementBundle } from "../lib/statements";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

function newsLine(n: { t: string; p: string | null; s: string | null; url?: string | null; publishedAt?: Date | string | null }) {
  const when = n.publishedAt ? String(n.publishedAt).slice(0, 10) : "";
  const link = n.url ? ` ${n.url}` : "";
  return `- [${n.p ?? ""}] ${when} ${n.t}${n.s ? ` — ${n.s.slice(0, 160)}` : ""}${link}`;
}

async function relatedNews(db: Db, llm: LlmProvider, question: string) {
  const [vector] = await llm.embed([newsEmbedInput(question)]);
  if (!isNewsEmbedVector(vector)) return null;
  const rows = await db.select({
    t: news.title,
    p: news.publisher,
    s: news.summary,
    url: news.url,
    publishedAt: news.publishedAt,
  }).from(news)
    .where(and(isNotNull(news.embedding), notInArray(news.source, allOpinionSources())))
    .orderBy(cosineDistance(news.embedding, vector))
    .limit(8);
  return rows.length ? rows : null;
}

const MAX_CHAT_MESSAGES = 40;

const askInput = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(8000),
  })).min(1).max(MAX_CHAT_MESSAGES),
});

const streamInput = z.object({
  sessionId: z.string().uuid().optional(),
  content: z.string().trim().min(1).max(8000),
});

type Turn = { role: "user" | "assistant"; content: string };

function chatTitle(content: string) {
  return content.replace(/\s+/g, " ").trim().slice(0, 40);
}

async function beginTurn(ctx: { db: Db; userId: string }, sessionId: string | undefined, content: string) {
  let id = sessionId;
  if (id) {
    const [owned] = await ctx.db.select({ id: chatSessions.id }).from(chatSessions)
      .where(and(eq(chatSessions.id, id), eq(chatSessions.userId, ctx.userId)));
    if (!owned) throw new TRPCError({ code: "NOT_FOUND", message: "대화를 찾지 못했습니다." });
  }
  const prior = id
    ? await ctx.db.select({ role: chatMessages.role, content: chatMessages.content }).from(chatMessages)
      .where(eq(chatMessages.sessionId, id))
      .orderBy(chatMessages.createdAt)
    : [];
  if (prior.length >= MAX_CHAT_MESSAGES) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "대화는 40개까지입니다." });
  }
  const turns: Turn[] = prior.flatMap((row) =>
    row.role === "user" || row.role === "assistant" ? [{ role: row.role, content: row.content }] : [],
  );
  if (!id) {
    const [created] = await ctx.db.insert(chatSessions).values({
      userId: ctx.userId,
      title: chatTitle(content),
    }).returning({ id: chatSessions.id });
    if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "대화를 만들지 못했습니다." });
    id = created.id;
  } else {
    await ctx.db.update(chatSessions).set({ updatedAt: new Date() }).where(eq(chatSessions.id, id));
  }
  await ctx.db.insert(chatMessages).values({ sessionId: id, role: "user", content });
  turns.push({ role: "user", content });
  return { sessionId: id, turns };
}

async function saveAssistant(ctx: { db: Db; userId: string }, sessionId: string, content: string) {
  if (!content) return;
  await ctx.db.insert(chatMessages).values({ sessionId, role: "assistant", content });
  await ctx.db.update(chatSessions).set({ updatedAt: new Date() })
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, ctx.userId)));
}

async function askMessages(
  ctx: { db: Db; userId: string },
  llm: LlmProvider,
  turns: Array<{ role: "user" | "assistant"; content: string }>,
) {
      const overview = await loadOverview(ctx.db, ctx.userId);

      const question = [...turns].reverse().find((m) => m.role === "user")?.content ?? "";
      let newsHeading = "최근 뉴스";
      let newsBody = "질문 임베딩 검색 없음. 최근 기사.";
      try {
        const related = await relatedNews(ctx.db, llm, question);
        if (related) {
          newsHeading = "질문 관련 뉴스";
          newsBody = `임베딩 ${NEWS_EMBED_MODEL} ${NEWS_EMBED_DIM}. 제목·요약만. 본문 없음.\n${related.map(newsLine).join("\n")}`;
        }
      } catch {
        newsBody = "질문 임베딩 검색 실패. 최근 기사.";
      }
      if (!newsBody.includes("\n- [")) {
        const recentNews = await ctx.db
          .select({ t: news.title, p: news.publisher, s: news.summary, url: news.url, publishedAt: news.publishedAt })
          .from(news)
          .where(notInArray(news.source, allOpinionSources()))
          .orderBy(sql`${news.publishedAt} DESC NULLS LAST`)
          .limit(15);
        newsBody = `${newsBody}\n${recentNews.map(newsLine).join("\n")}`;
      }
      const recentOpinions = await ctx.db
        .select({ t: news.title, p: news.publisher, s: news.summary })
        .from(news)
        .where(or(inArray(news.source, allOpinionSources()), sql`${news.title} ~ ${ANALYST_TITLE_RE.source}`))
        .orderBy(sql`${news.publishedAt} DESC NULLS LAST`)
        .limit(8);
      const indexInsts = await ctx.db.select({
        id: instruments.id,
        symbol: instruments.symbol,
        name: instruments.name,
        currency: instruments.currency,
      }).from(instruments).where(inArray(instruments.symbol, worldIndexYahooTickers()));
      const indexLines: string[] = [];
      for (const inst of indexInsts) {
        const [q] = await ctx.db.select({ date: quotes.date, close: quotes.close })
          .from(quotes).where(eq(quotes.instrumentId, inst.id)).orderBy(sql`${quotes.date} DESC`).limit(1);
        if (!q) continue;
        const meta = worldIndexByYahoo(inst.symbol);
        indexLines.push(`- ${meta?.label ?? inst.name} ${inst.symbol} ${q.date}: ${q.close} ${inst.currency}`);
      }

      const latest = ctx.db
        .select({
          code: macroIndicators.code,
          maxDate: sql<string>`max(${macroIndicators.date})`.as("max_date"),
        })
        .from(macroIndicators)
        .groupBy(macroIndicators.code)
        .as("macro_latest");
      const macro = await ctx.db
        .select({
          code: macroIndicators.code,
          date: macroIndicators.date,
          value: macroIndicators.value,
          unit: macroIndicators.unit,
        })
        .from(macroIndicators)
        .innerJoin(latest, and(eq(macroIndicators.code, latest.code), eq(macroIndicators.date, latest.maxDate)));

      const coverage = await loadCoverageSnapshot(ctx.db, ctx.userId);
      const investAdvice = await loadInvestAdvice(ctx.db, ctx.userId, Promise.resolve(overview));
      const { assets, cashflow, txnCount, month, guide, holdings: h, profile } = overview;
      const fundBoard = await loadLatestFundamentals(ctx.db);
      const fundById = new Map((fundBoard.status === "ok" ? fundBoard.items : []).map((r) => [r.instrumentId, r]));
      const fundBlocks = h.positions
        .map((p) => fundById.get(p.instrumentId))
        .filter((r): r is NonNullable<typeof r> => Boolean(r))
        .slice(0, 5)
        .map(formatFundamentalsContext);
      let stmtInsts: Awaited<ReturnType<typeof listStatementInstruments>> = [];
      try {
        stmtInsts = await listStatementInstruments(ctx.db);
      } catch {
        stmtInsts = [];
      }
      const holdingIds = new Set(h.positions.map((p) => p.instrumentId));
      const watchRows = await ctx.db.select({ instrumentId: watchlist.instrumentId })
        .from(watchlist)
        .where(eq(watchlist.userId, ctx.userId));
      const interestedIds = new Set([...holdingIds, ...watchRows.map((r) => r.instrumentId)]);
      // 보유·관심에 재무 수집분이 있으면 최대 3종. 개황·주주·배당은 bundle.context에 포함.
      const stmtTargets = stmtInsts.filter((i) => interestedIds.has(i.id)).slice(0, 3);
      const stmtBlocks: string[] = [];
      for (const it of stmtTargets) {
        const b = await loadStatementBundle(ctx.db, it.id);
        if (b?.context) stmtBlocks.push(b.context);
      }
      const holdings = h.positions.length
        ? h.positions.map((p) => {
          const px = p.lastPrice != null ? ` 현재 ${p.lastPrice}` : " 시세 없음";
          const pnl = p.pnlKrw != null ? ` 평가손익 ${signedWon(p.pnlKrw)}` : "";
          const acct = p.accountName ? `${p.accountName} · ` : "";
          return `- ${acct}${p.symbol} ${p.name}: ${p.quantity} ${p.currency} 평단 ${p.avgCost}${px}${pnl}`;
        }).join("\n")
        : undefined;
      const context = buildContextBlock({
        "자산 현황": assets.accountCount
          ? `${month} 순자산 ${won(assets.net)} (유동 ${won(assets.liquid)} · 투자 ${won(assets.invested)}=보유평가+예수금 · 부채 ${won(assets.debt)})`
          : undefined,
        "이번 달 현금흐름": txnCount
          ? `수입 ${won(cashflow.income)} · 고정 ${won(cashflow.fixedCost)} · 변동 ${won(cashflow.variableCost)} · 저축·투자 ${won(cashflow.savingAndInvest)}`
          : undefined,
        "월 배분 가이드": guide
          ? `필수 ${won(guide.needs)} · 여가 ${won(guide.wants)} · 저축·투자 ${won(guide.saveAndInvest)} (예적금 ${won(guide.ofWhichDeposit)} / 투자 ${won(guide.ofWhichInvest)})`
          : undefined,
        "공제·고정비": profile && (profile.monthlyIncomeTax > 0 || profile.monthlyHealthInsurance > 0 || profile.recurringSum > 0)
          ? `근로소득세 ${won(profile.monthlyIncomeTax)} · 건보료 ${won(profile.monthlyHealthInsurance)} · 고정 세부 ${won(profile.recurringSum)}`
          : undefined,
        "보유 종목": holdings,
        "보험 보장": coverage.policies.length || coverage.annualIncome > 0
          ? coverage.contextHept
          : undefined,
        "투자성향·조언": formatInvestStyleContext(investAdvice),
        "재무제표·기업정보": stmtBlocks.length ? stmtBlocks.join("\n\n") : undefined,
        "펀더멘털": fundBlocks.length ? fundBlocks.join("\n\n") : undefined,
        [newsHeading]: newsBody,
        "오피니언·칼럼": recentOpinions.map((n) => `- [${n.p ?? ""}] ${n.t}${n.s ? ` — ${n.s.slice(0, 160)}` : ""}`).join("\n"),
        "세계 지수": indexLines.length ? indexLines.join("\n") : undefined,
        "거시지표": macro.map((m) => `- ${m.code} ${m.date}: ${m.value}${m.unit ?? ""}`).join("\n"),
      });

      return [
        { role: "system" as const, content: INVEST_ASSISTANT_SYSTEM },
        { role: "system" as const, content: context },
        ...turns,
      ];
}

export const chatRouter = router({
  ask: publicProcedure
    .input(askInput)
    .mutation(async ({ ctx, input }) => {
      const llm = createProvider();
      const messages = await askMessages(ctx, llm, input.messages);
      const answer = await llm.chat(messages);
      return { answer, provider: llm.name };
    }),
  sessions: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select({
      id: chatSessions.id,
      title: chatSessions.title,
      updatedAt: chatSessions.updatedAt,
    }).from(chatSessions)
      .where(eq(chatSessions.userId, ctx.userId))
      .orderBy(desc(chatSessions.updatedAt))
      .limit(20);
  }),
  thread: publicProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [owned] = await ctx.db.select({ id: chatSessions.id }).from(chatSessions)
        .where(and(eq(chatSessions.id, input.sessionId), eq(chatSessions.userId, ctx.userId)));
      if (!owned) throw new TRPCError({ code: "NOT_FOUND", message: "대화를 찾지 못했습니다." });
      const rows = await ctx.db.select({
        role: chatMessages.role,
        content: chatMessages.content,
      }).from(chatMessages)
        .where(eq(chatMessages.sessionId, owned.id))
        .orderBy(chatMessages.createdAt);
      const messages: Turn[] = rows.flatMap((row) =>
        row.role === "user" || row.role === "assistant" ? [{ role: row.role, content: row.content }] : [],
      );
      return { messages };
    }),
  /** 같은 컨텍스트. 토큰이 오는 대로 델타만 보낸다. 사용자·답은 세션에 남긴다. */
  askStream: publicProcedure
    .input(streamInput)
    .mutation(async function* ({ ctx, input, signal }) {
      const { sessionId, turns } = await beginTurn(ctx, input.sessionId, input.content);
      let acc = "";
      try {
        yield { delta: "", sessionId };
        const llm = createProvider();
        const messages = await askMessages(ctx, llm, turns);
        if (!llm.chatStream) {
          acc = await llm.chat(messages);
          yield { delta: acc, sessionId };
          return;
        }
        for await (const delta of llm.chatStream(messages, { signal })) {
          if (!delta) continue;
          acc += delta;
          yield { delta, sessionId };
        }
      } finally {
        await saveAssistant(ctx, sessionId, acc);
      }
    }),
});
