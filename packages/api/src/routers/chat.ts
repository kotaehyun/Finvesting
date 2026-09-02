import { z } from "zod";
import { desc } from "drizzle-orm";
import { news, macroIndicators } from "@finvesting/db";
import { createProvider, INVEST_ASSISTANT_SYSTEM, buildContextBlock } from "@finvesting/ai";
import { router, publicProcedure } from "../trpc";

// 투자 판단용 챗봇: 최근 뉴스·거시지표를 컨텍스트로 주입해 로컬 LLM에 질의.
// TODO: 보유 종목·현금흐름 컨텍스트, pgvector 유사 뉴스 검색(RAG) 추가
export const chatRouter = router({
  ask: publicProcedure
    .input(z.object({
      messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
    }))
    .mutation(async ({ ctx, input }) => {
      const recentNews = await ctx.db.select({ t: news.title, p: news.publisher, d: news.publishedAt })
        .from(news).orderBy(desc(news.publishedAt)).limit(15);
      const macro = await ctx.db.select().from(macroIndicators).orderBy(desc(macroIndicators.date)).limit(20);

      const context = buildContextBlock({
        "최근 뉴스": recentNews.map((n) => `- [${n.p ?? ""}] ${n.t}`).join("\n"),
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
