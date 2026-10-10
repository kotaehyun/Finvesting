import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { loadOverview } from "../lib/overview";
import { loadNetWorthHistory } from "../lib/net-worth-history";

export const dashboardRouter = router({
  // 홈: 현재 순자산, 선택 월 현금흐름, 확인할 일.
  overview: publicProcedure
    .input(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }).optional())
    .query(async ({ ctx, input }) => loadOverview(ctx.db, ctx.userId, input?.month)),

  // 월별 순자산 및 자산/부채 추이 시계열
  netWorthHistory: publicProcedure
    .input(
      z.object({
        count: z.number().int().min(3).max(24).default(6),
        baseMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) =>
      loadNetWorthHistory(ctx.db, ctx.userId, input?.count ?? 6, input?.baseMonth),
    ),
});
