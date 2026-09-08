import { z } from "zod";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { news, macroIndicators, trades, instruments } from "@finvesting/db";
import { buildPositions } from "@finvesting/core";
import { createProvider, INVEST_ASSISTANT_SYSTEM, buildContextBlock } from "@finvesting/ai";
import { router, publicProcedure } from "../trpc";
import { loadOverview } from "../lib/overview";

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
        .orderBy(sql`${news.publishedAt} DESC NULLS LAST`)
        .limit(15);

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

      const tradeRows = await ctx.db.select().from(trades)
        .where(eq(trades.userId, ctx.userId))
        .orderBy(asc(trades.tradedAt));
      const open = [...buildPositions(tradeRows.map((t) => ({
        instrumentId: t.instrumentId,
        side: t.side,
        quantity: Number(t.quantity),
        price: Number(t.price),
        fee: Number(t.fee),
        tax: Number(t.tax),
        fxRate: t.fxRate != null ? Number(t.fxRate) : undefined,
      }))).values()].filter((p) => p.quantity > 0);

      let holdings: string | undefined;
      if (open.length) {
        const insts = await ctx.db.select({ id: instruments.id, symbol: instruments.symbol, name: instruments.name, currency: instruments.currency })
          .from(instruments).where(inArray(instruments.id, open.map((p) => p.instrumentId)));
        const label = new Map(insts.map((i) => [i.id, `${i.symbol} ${i.name}`]));
        holdings = open.map((p) => `- ${label.get(p.instrumentId) ?? p.instrumentId}: ${p.quantity}주 평단 ${p.avgCost}`).join("\n");
      }

      const { assets, cashflow, txnCount, month } = overview;
      const context = buildContextBlock({
        "자산 현황": assets.accountCount
          ? `${month} 순자산 ${won(assets.net)} (유동 ${won(assets.liquid)} · 투자 ${won(assets.invested)} · 부채 ${won(assets.debt)})`
          : undefined,
        "이번 달 현금흐름": txnCount
          ? `수입 ${won(cashflow.income)} · 고정 ${won(cashflow.fixedCost)} · 변동 ${won(cashflow.variableCost)} · 저축·투자 ${won(cashflow.savingAndInvest)}`
          : undefined,
        "보유 종목": holdings,
        "최근 뉴스": recentNews.map((n) => `- [${n.p ?? ""}] ${n.t}${n.s ? ` — ${n.s.slice(0, 160)}` : ""}`).join("\n"),
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
