import { z } from "zod";
import { and, eq, gte, lte } from "drizzle-orm";
import { accounts, transactions, financialProfiles } from "@finvesting/db";
import { summarizeCashflow, monthlyBudgetGuide } from "@finvesting/core";
import { router, publicProcedure } from "../trpc";

export const dashboardRouter = router({
  // 첫 화면: 총자산·배분, 이번 달 현금흐름, 권장 배분 vs 현재
  overview: publicProcedure
    .input(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }).optional())
    .query(async ({ ctx, input }) => {
      // 기본 월은 UTC가 아니라 KST. to를 31일로 고정하면 2·4·6·9·11월에 Postgres date 오류가 난다.
      const month = input?.month ?? new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 7);
      const [y, m] = month.split("-").map(Number) as [number, number];
      const from = `${month}-01`;
      const to = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;

      const accts = await ctx.db.select().from(accounts).where(and(eq(accounts.userId, ctx.userId), eq(accounts.isActive, true)));
      const txns = await ctx.db.select().from(transactions)
        .where(and(eq(transactions.userId, ctx.userId), gte(transactions.date, from), lte(transactions.date, to)));
      const [profile] = await ctx.db.select().from(financialProfiles).where(eq(financialProfiles.userId, ctx.userId));

      const byType: Record<string, number> = {};
      for (const a of accts) byType[a.type] = (byType[a.type] ?? 0) + Number(a.balance);
      const liquid = (byType.cash ?? 0) + (byType.checking ?? 0) + (byType.savings ?? 0) + (byType.installment ?? 0);
      const invested = (byType.brokerage ?? 0) + (byType.crypto ?? 0) + (byType.pension ?? 0);
      const debt = (byType.card ?? 0) + (byType.loan ?? 0);

      const cashflow = summarizeCashflow(txns.map((t) => ({ amount: Number(t.amount), direction: t.direction, category: t.category })));

      const guide = profile
        ? monthlyBudgetGuide({
            monthlyNetIncome: Number(profile.monthlyNetIncome ?? 0),
            monthlyFixedCost: Number(profile.monthlyFixedCost ?? 0),
            liquidAssets: liquid,
            investedAssets: invested,
            emergencyFundMonths: profile.emergencyFundMonths,
            riskTolerance: profile.riskTolerance as "conservative" | "moderate" | "aggressive",
          })
        : null;

      return { month, assets: { byType, liquid, invested, debt, net: liquid + invested - debt }, cashflow, guide };
    }),
});
