import { pgTable, uuid, text, numeric, date, integer, jsonb, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { instruments } from "./investments";

// 재무제표 원본 (기간 단위). 항목은 jsonb로 유연하게 보관하고, 자주 쓰는 값은 fundamentals 스냅샷에 정규화.
// source: "dart"(한국 금감원) | "edgar"(미국 SEC) | "yahoo"
export const financialStatements = pgTable("financial_statements", {
  id: uuid("id").primaryKey().defaultRandom(),
  instrumentId: uuid("instrument_id").notNull().references(() => instruments.id),
  fiscalYear: integer("fiscal_year").notNull(),
  fiscalPeriod: text("fiscal_period").notNull(),   // "FY" | "Q1" | "Q2" | "Q3" | "Q4" | "H1"
  statement: text("statement").notNull(),          // "income" | "balance" | "cashflow"
  consolidated: text("consolidated").notNull().default("CFS"), // CFS 연결 | OFS 별도
  currency: text("currency").notNull().default("KRW"),
  periodEnd: date("period_end"),
  items: jsonb("items").notNull(),                 // { revenue: 123, operating_income: 45, net_income: 30, ... } 표준화 키
  raw: jsonb("raw"),                               // 원본 응답 보존
  source: text("source").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("fs_uq").on(t.instrumentId, t.fiscalYear, t.fiscalPeriod, t.statement, t.consolidated, t.source),
  index("fs_instrument_idx").on(t.instrumentId),
]);

// 펀더멘털 스냅샷 (일 단위): 시총, PER, PBR, EPS, ROE, 배당수익률 등. 스크리너·챗봇 컨텍스트용.
export const fundamentals = pgTable("instrument_fundamentals", {
  id: uuid("id").primaryKey().defaultRandom(),
  instrumentId: uuid("instrument_id").notNull().references(() => instruments.id),
  date: date("date").notNull(),
  marketCap: numeric("market_cap", { precision: 24, scale: 0 }),
  per: numeric("per", { precision: 12, scale: 4 }),
  forwardPer: numeric("forward_per", { precision: 12, scale: 4 }),
  pbr: numeric("pbr", { precision: 12, scale: 4 }),
  eps: numeric("eps", { precision: 20, scale: 4 }),
  roe: numeric("roe", { precision: 10, scale: 4 }),
  dividendYield: numeric("dividend_yield", { precision: 10, scale: 4 }),
  revenueTtm: numeric("revenue_ttm", { precision: 24, scale: 0 }),
  netIncomeTtm: numeric("net_income_ttm", { precision: 24, scale: 0 }),
  debtToEquity: numeric("debt_to_equity", { precision: 12, scale: 4 }),
  beta: numeric("beta", { precision: 8, scale: 4 }),
  extra: jsonb("extra"),                           // 소스별 추가 지표 (finviz 스타일 등)
  source: text("source").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("fund_uq").on(t.instrumentId, t.date, t.source)]);

// 외부 식별자 매핑: DART 고유번호, SEC CIK, 야후 티커 등
export const instrumentIdentifiers = pgTable("instrument_identifiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  instrumentId: uuid("instrument_id").notNull().references(() => instruments.id),
  provider: text("provider").notNull(),  // "dart" | "sec" | "yahoo" | "kis"
  externalId: text("external_id").notNull(), // corp_code / CIK / ticker
}, (t) => [uniqueIndex("ident_uq").on(t.provider, t.externalId), index("ident_instrument_idx").on(t.instrumentId)]);
