import { z } from "zod";
import { createProvider, STATEMENT_READER_SYSTEM, buildContextBlock } from "@finvesting/ai";
import { router, publicProcedure } from "../trpc";
import { listStatementInstruments, loadStatementBundle } from "../lib/statements";

export const statementsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    try {
      const items = await listStatementInstruments(ctx.db);
      return { status: items.length ? "ok" as const : "empty" as const, items };
    } catch {
      return { status: "unavailable" as const, items: [] };
    }
  }),

  get: publicProcedure
    .input(z.object({
      instrumentId: z.string().uuid(),
      year: z.number().int().min(1990).max(2100).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const bundle = await loadStatementBundle(ctx.db, input.instrumentId, input.year);
      if (!bundle) throw new Error("종목을 찾을 수 없습니다");
      return bundle;
    }),

  explain: publicProcedure
    .input(z.object({
      instrumentId: z.string().uuid(),
      year: z.number().int().min(1990).max(2100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const bundle = await loadStatementBundle(ctx.db, input.instrumentId, input.year);
      if (!bundle) throw new Error("종목을 찾을 수 없습니다");
      if (!bundle.fiscalYear) throw new Error("수집된 재무제표·감사의견이 없습니다. DART 키와 대상을 넣고 worker를 돌리세요.");
      const llm = createProvider();
      const reading = await llm.chat([
        { role: "system", content: STATEMENT_READER_SYSTEM },
        { role: "system", content: buildContextBlock({ "재무제표·감사": bundle.context }) },
        { role: "user", content: "이 종목의 재무제표와 감사의견을 읽어 주세요. 없는 숫자는 없다고 하고, 매수·매도는 단정하지 마세요." },
      ]);
      return { reading, provider: llm.name, fiscalYear: bundle.fiscalYear };
    }),
});
