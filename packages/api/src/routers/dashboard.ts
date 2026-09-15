import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { loadOverview } from "../lib/overview";

export const dashboardRouter = router({
  // 홈: 현재 순자산, 선택 월 현금흐름, 확인할 일. 월말 순자산 스냅샷은 없음.
  overview: publicProcedure
    .input(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }).optional())
    .query(async ({ ctx, input }) => loadOverview(ctx.db, ctx.userId, input?.month)),
});
