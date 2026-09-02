import { pgTable, uuid, text, numeric, date, timestamp, index, jsonb, uniqueIndex, vector } from "drizzle-orm/pg-core";
import { users } from "./common";
import { instruments } from "./investments";

// 시세 (일봉 기준으로 시작, 필요 시 분봉 테이블 추가)
export const quotes = pgTable("market_quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  instrumentId: uuid("instrument_id").notNull().references(() => instruments.id),
  date: date("date").notNull(),
  open: numeric("open", { precision: 20, scale: 4 }),
  high: numeric("high", { precision: 20, scale: 4 }),
  low: numeric("low", { precision: 20, scale: 4 }),
  close: numeric("close", { precision: 20, scale: 4 }).notNull(),
  volume: numeric("volume", { precision: 24, scale: 0 }),
  source: text("source").notNull(),   // "kis" | "upbit" | "yahoo"
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("quotes_instrument_date_uq").on(t.instrumentId, t.date)]);

// 거시 지표: 환율, 기준금리, CPI(물가), 국채금리 등. ECOS 등에서 수집.
export const macroIndicators = pgTable("macro_indicators", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),      // "USDKRW", "BOK_BASE_RATE", "CPI_YOY", "KTB_3Y"
  date: date("date").notNull(),
  value: numeric("value", { precision: 20, scale: 6 }).notNull(),
  unit: text("unit"),
  source: text("source").notNull(),  // "ecos" | "fred" | "crawler:..."
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("macro_code_date_uq").on(t.code, t.date)]);

// 뉴스: 제목·링크·요약만 저장 (본문은 원문 링크로). pgvector 임베딩은 AI 질의응답용.
export const news = pgTable("market_news", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  publisher: text("publisher"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  summary: text("summary"),
  symbols: text("symbols").array(),      // 관련 종목 심볼
  source: text("source").notNull(),      // "rss:hankyung" | "naver" | "crawler:..."
  raw: jsonb("raw"),
  embedding: vector("embedding", { dimensions: 768 }),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("news_url_uq").on(t.url),
  index("news_published_idx").on(t.publishedAt),
]);

// 경제 캘린더 (FOMC, 금통위, CPI 발표, 실적 발표 등)
export const economicEvents = pgTable("economic_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  country: text("country"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  importance: text("importance"),       // "high" | "medium" | "low"
  actual: text("actual"),
  forecast: text("forecast"),
  previous: text("previous"),
  source: text("source").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("events_title_time_uq").on(t.title, t.scheduledAt)]);

// 관심 종목
export const watchlist = pgTable("watchlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  instrumentId: uuid("instrument_id").notNull().references(() => instruments.id),
  note: text("note"),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("watchlist_user_instrument_uq").on(t.userId, t.instrumentId)]);
