import { pgTable, uuid, text, numeric, date, pgEnum, index, timestamp } from "drizzle-orm/pg-core";
import { users, timestamps } from "./common.js";
import { accounts } from "./accounts.js";

export const assetClass = pgEnum("asset_class", ["stock", "etf", "bond", "crypto", "fund", "other"]);
export const tradeSide = pgEnum("trade_side", ["buy", "sell"]);

// 종목 마스터: 시세·뉴스·보유가 모두 이 테이블을 참조
export const instruments = pgTable("instruments", {
  id: uuid("id").primaryKey().defaultRandom(),
  symbol: text("symbol").notNull(),     // "005930", "AAPL", "BTC"
  market: text("market").notNull(),     // "KRX", "NASDAQ", "UPBIT"
  name: text("name").notNull(),
  assetClass: assetClass("asset_class").notNull(),
  currency: text("currency").notNull().default("KRW"),
  ...timestamps,
}, (t) => [index("instruments_symbol_market_idx").on(t.symbol, t.market)]);

// 체결 내역 (원장). 보유 수량·평단·실현손익은 여기서 계산한다.
export const trades = pgTable("trades", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  accountId: uuid("account_id").notNull().references(() => accounts.id),
  instrumentId: uuid("instrument_id").notNull().references(() => instruments.id),
  side: tradeSide("side").notNull(),
  quantity: numeric("quantity", { precision: 24, scale: 8 }).notNull(),
  price: numeric("price", { precision: 20, scale: 4 }).notNull(),
  fee: numeric("fee", { precision: 20, scale: 4 }).notNull().default("0"),
  tax: numeric("tax", { precision: 20, scale: 4 }).notNull().default("0"),
  fxRate: numeric("fx_rate", { precision: 12, scale: 4 }),   // 해외 자산: 체결 당시 환율
  tradedAt: timestamp("traded_at", { withTimezone: true }).notNull(),
  memo: text("memo"),
  ...timestamps,
}, (t) => [index("trades_user_idx").on(t.userId, t.tradedAt)]);

// 배당·이자 수취 (세금 계산과 현금흐름에 모두 사용)
export const incomes = pgTable("investment_incomes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  accountId: uuid("account_id").notNull().references(() => accounts.id),
  instrumentId: uuid("instrument_id").references(() => instruments.id),
  kind: text("kind").notNull(),           // "dividend" | "interest"
  gross: numeric("gross", { precision: 20, scale: 4 }).notNull(),
  withheldTax: numeric("withheld_tax", { precision: 20, scale: 4 }).notNull().default("0"),
  paidOn: date("paid_on").notNull(),
  ...timestamps,
});

// 투자 노트 (Research 모듈): 매수/매도 근거 기록
export const researchNotes = pgTable("research_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  instrumentId: uuid("instrument_id").references(() => instruments.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  tags: text("tags").array(),
  ...timestamps,
});
