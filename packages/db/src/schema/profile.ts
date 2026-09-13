import { pgTable, uuid, numeric, integer, jsonb, text, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { users, timestamps } from "./common";

// 배분 가이드 계산에 필요한 본인 재무 프로필
export const financialProfiles = pgTable("financial_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id).unique(),
  monthlyGrossIncome: numeric("monthly_gross_income", { precision: 20, scale: 0 }), // 세전 월 근로소득
  monthlyNetIncome: numeric("monthly_net_income", { precision: 20, scale: 0 }), // 세후 월 근로소득
  monthlyIncomeTax: numeric("monthly_income_tax", { precision: 20, scale: 0 }), // 근로소득세(원천징수)
  monthlyHealthInsurance: numeric("monthly_health_insurance", { precision: 20, scale: 0 }), // 건보료(장기요양 포함 가능)
  monthlyFixedCost: numeric("monthly_fixed_cost", { precision: 20, scale: 0 }), // 세부내역에 안 넣는 기타 고정비
  emergencyFundMonths: integer("emergency_fund_months").notNull().default(6),
  riskTolerance: text("risk_tolerance").notNull().default("moderate"), // conservative|moderate|aggressive
  targetAllocation: jsonb("target_allocation"), // { cash:0.1, deposit:0.3, stock:0.5, crypto:0.1 } 등 사용자 지정
  payEarnings: jsonb("pay_earnings"), // [{ name:"기본급", amount:3200000 }, { name:"식대", amount:200000 }]
  ...timestamps,
});

// 매달 고정으로 빠져나가는 돈 (휴대폰, 공과금, 주거 등)
export const recurringCosts = pgTable("recurring_costs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  category: text("category").notNull(), // phone|utilities|housing|...
  amount: numeric("amount", { precision: 20, scale: 0 }).notNull(),
  dayOfMonth: integer("day_of_month"), // 1~31, 출금일
  memo: text("memo"),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
}, (t) => [index("recurring_costs_user_idx").on(t.userId)]);

// 근로소득세 월별 추이. 프로필 저장 시 해당 월을 갱신하거나 직접 입력.
export const incomeTaxMonths = pgTable("income_tax_months", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  month: text("month").notNull(), // YYYY-MM
  amount: numeric("amount", { precision: 20, scale: 0 }).notNull(),
  ...timestamps,
}, (t) => [uniqueIndex("income_tax_months_user_month_uq").on(t.userId, t.month)]);

// 월별 급여 스냅샷. 연봉 추이(기본급·수당·상여·세금·보험)의 원장.
export const payrollMonths = pgTable("payroll_months", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  month: text("month").notNull(), // YYYY-MM
  baseAmount: numeric("base_amount", { precision: 20, scale: 0 }).notNull().default("0"),
  allowanceAmount: numeric("allowance_amount", { precision: 20, scale: 0 }).notNull().default("0"),
  bonusAmount: numeric("bonus_amount", { precision: 20, scale: 0 }).notNull().default("0"),
  otherAmount: numeric("other_amount", { precision: 20, scale: 0 }).notNull().default("0"),
  grossAmount: numeric("gross_amount", { precision: 20, scale: 0 }).notNull().default("0"),
  taxAmount: numeric("tax_amount", { precision: 20, scale: 0 }).notNull().default("0"),
  insuranceAmount: numeric("insurance_amount", { precision: 20, scale: 0 }).notNull().default("0"),
  netAmount: numeric("net_amount", { precision: 20, scale: 0 }).notNull().default("0"),
  earnings: jsonb("earnings"),
  ...timestamps,
}, (t) => [uniqueIndex("payroll_months_user_month_uq").on(t.userId, t.month)]);
