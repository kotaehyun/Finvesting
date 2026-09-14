import { z } from "zod";
import { and, eq, inArray, notInArray, or, sql } from "drizzle-orm";
import { news, macroIndicators, quotes, instruments } from "@finvesting/db";
import { ANALYST_TITLE_RE, allOpinionSources, worldIndexByYahoo, worldIndexYahooTickers } from "@finvesting/core";
import { createProvider, INVEST_ASSISTANT_SYSTEM, buildContextBlock } from "@finvesting/ai";
import { router, publicProcedure } from "../trpc";
import { loadOverview } from "../lib/overview";
import { loadCoverageSnapshot } from "../lib/insurance-coverage";
import { listStatementInstruments, loadStatementBundle } from "../lib/statements";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

export const chatRouter = router({
  ask: publicProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(8000),
      })).min(1).max(40),
    }))
    .mutation(async ({ ctx, input }) => {
      const overview = await loadOverview(ctx.db, ctx.userId);

      const recentNews = await ctx.db
        .select({ t: news.title, p: news.publisher, s: news.summary })
        .from(news)
        .where(notInArray(news.source, allOpinionSources()))
        .orderBy(sql`${news.publishedAt} DESC NULLS LAST`)
        .limit(15);
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
      const { assets, cashflow, txnCount, month, guide, holdings: h, profile } = overview;
      const stmtInsts = await listStatementInstruments(ctx.db);
      const holdingIds = new Set(h.positions.map((p) => p.instrumentId));
      const stmtTargets = stmtInsts.filter((i) => holdingIds.has(i.id)).slice(0, 3);
      const fallback = stmtTargets.length ? stmtTargets : [];
      const stmtBlocks: string[] = [];
      for (const it of fallback) {
        const b = await loadStatementBundle(ctx.db, it.id);
        if (b?.context) stmtBlocks.push(b.context);
      }
      const holdings = h.positions.length
        ? h.positions.map((p) => {
          const px = p.lastPrice != null ? ` 현재 ${p.lastPrice}` : " 시세 없음";
          const pnl = p.pnlKrw != null ? ` 평가손익 ${won(p.pnlKrw)}` : "";
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
        "재무제표·감사": stmtBlocks.length ? stmtBlocks.join("\n\n") : undefined,
        "최근 뉴스": recentNews.map((n) => `- [${n.p ?? ""}] ${n.t}${n.s ? ` — ${n.s.slice(0, 160)}` : ""}`).join("\n"),
        "오피니언·칼럼": recentOpinions.map((n) => `- [${n.p ?? ""}] ${n.t}${n.s ? ` — ${n.s.slice(0, 160)}` : ""}`).join("\n"),
        "세계 지수": indexLines.length ? indexLines.join("\n") : undefined,
        "거시지표": macro.map((m) => `- ${m.code} ${m.date}: ${m.value}${m.unit ?? ""}`).join("\n"),
      });

      const llm = createProvider();
      const answer = await llm.chat([
        { role: "system", content: INVEST_ASSISTANT_SYSTEM },
        { role: "system", content: context },
        ...input.messages,
      ]);
      return { answer, provider: llm.name };
    }),
});
