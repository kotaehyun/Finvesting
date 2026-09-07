import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { loadOverview } from "../lib/overview";

export const dashboardRouter = router({
  // 첫 화면: 총자산·배분, 이번 달 현금흐름, 권장 배분 vs 현재
  overview: publicProcedure
    .input(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }).optional())
    .query(async ({ ctx, input }) => loadOverview(ctx.db, ctx.userId, input?.month)),
});
