import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { accounts, instruments, trades } from "@finvesting/db";
import { buildPositions } from "@finvesting/core";
import { router, publicProcedure } from "../trpc";
import { latestUsdKrw, loadHoldings, toTradeLike } from "../lib/holdings";

const assetClass = z.enum(["stock", "etf", "bond", "crypto", "fund", "other"]);

export const tradesRouter = router({
  holdings: publicProcedure.query(({ ctx }) => loadHoldings(ctx.db, ctx.userId)),

  list: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50) }).optional())
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.select({
        id: trades.id,
        accountId: trades.accountId,
        instrumentId: trades.instrumentId,
        side: trades.side,
        quantity: trades.quantity,
        price: trades.price,
        fee: trades.fee,
        tax: trades.tax,
        fxRate: trades.fxRate,
        tradedAt: trades.tradedAt,
        memo: trades.memo,
        symbol: instruments.symbol,
        name: instruments.name,
        market: instruments.market,
        currency: instruments.currency,
        assetClass: instruments.assetClass,
        accountName: accounts.name,
        institution: accounts.institution,
        accountType: accounts.type,
      }).from(trades)
        .innerJoin(instruments, eq(trades.instrumentId, instruments.id))
        .innerJoin(accounts, eq(trades.accountId, accounts.id))
        .where(eq(trades.userId, ctx.userId))
        .orderBy(desc(trades.tradedAt))
        .limit(input?.limit ?? 50);
      return rows;
    }),

  ensureInstrument: publicProcedure
    .input(z.object({
      symbol: z.string().min(1).max(32),
      market: z.string().min(1).max(16),
      name: z.string().min(1).max(80),
      assetClass,
      currency: z.string().min(3).max(8).default("KRW"),
    }))
    .mutation(async ({ ctx, input }) => {
      const symbol = input.symbol.trim().toUpperCase();
      const market = input.market.trim().toUpperCase();
      const [found] = await ctx.db.select().from(instruments)
        .where(and(eq(instruments.symbol, symbol), eq(instruments.market, market)));
      if (found) return found;
      const [created] = await ctx.db.insert(instruments).values({
        symbol, market, name: input.name.trim(), assetClass: input.assetClass, currency: input.currency.trim().toUpperCase(),
      }).returning();
      return created!;
    }),

  create: publicProcedure
    .input(z.object({
      accountId: z.string().uuid(),
      instrumentId: z.string().uuid(),
      side: z.enum(["buy", "sell"]),
      quantity: z.number().positive(),
      price: z.number().positive(),
      fee: z.number().min(0).default(0),
      tax: z.number().min(0).default(0),
      fxRate: z.number().positive().optional(),
      tradedAt: z.string().min(1),
      memo: z.string().max(200).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [acct] = await ctx.db.select({ id: accounts.id }).from(accounts)
        .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.userId), eq(accounts.isActive, true)));
      if (!acct) throw new TRPCError({ code: "NOT_FOUND", message: "계좌를 찾을 수 없습니다" });
      const [inst] = await ctx.db.select().from(instruments).where(eq(instruments.id, input.instrumentId));
      if (!inst) throw new TRPCError({ code: "NOT_FOUND", message: "종목을 찾을 수 없습니다" });

      const tradedAt = new Date(input.tradedAt);
      if (Number.isNaN(tradedAt.getTime())) throw new TRPCError({ code: "BAD_REQUEST", message: "체결 시각이 올바르지 않습니다" });

      let fxRate = input.fxRate;
      if (fxRate == null && inst.currency === "USD") {
        const usdkrw = await latestUsdKrw(ctx.db);
        if (usdkrw) fxRate = usdkrw;
      }

      if (input.side === "sell") {
        const existing = await ctx.db.select().from(trades)
          .where(and(eq(trades.userId, ctx.userId), eq(trades.accountId, input.accountId)))
          .orderBy(trades.tradedAt);
        const pos = buildPositions(existing.map(toTradeLike)).get(input.instrumentId);
        const have = pos?.quantity ?? 0;
        if (input.quantity > have) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `매도 수량이 보유(${have})보다 많습니다` });
        }
      }

      const [row] = await ctx.db.insert(trades).values({
        userId: ctx.userId,
        accountId: input.accountId,
        instrumentId: input.instrumentId,
        side: input.side,
        quantity: String(input.quantity),
        price: String(input.price),
        fee: String(input.fee),
        tax: String(input.tax),
        fxRate: fxRate != null ? String(fxRate) : undefined,
        tradedAt,
        memo: input.memo,
      }).returning();
      return row;
    }),

  remove: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db.select({ id: trades.id }).from(trades)
        .where(and(eq(trades.id, input.id), eq(trades.userId, ctx.userId)));
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "체결을 찾을 수 없습니다" });
      await ctx.db.delete(trades).where(eq(trades.id, input.id));
      return { id: input.id };
    }),
});
