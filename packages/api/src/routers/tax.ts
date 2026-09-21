import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { exportTaxLedgerCsv, loadTaxYear } from "../lib/tax";

export const taxRouter = router({
  yearSummary: publicProcedure
    .input(z.object({ year: z.number().int().min(2000).max(2100) }))
    .query(({ ctx, input }) => loadTaxYear(ctx.db, ctx.userId, input.year)),

  exportLedger: publicProcedure
    .input(z.object({ year: z.number().int().min(2000).max(2100) }))
    .mutation(({ ctx, input }) => exportTaxLedgerCsv(ctx.db, ctx.userId, input.year)),
});
