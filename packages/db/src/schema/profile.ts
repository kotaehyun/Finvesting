import { pgTable, uuid, numeric, integer, jsonb, text } from "drizzle-orm/pg-core";
import { users, timestamps } from "./common";

// 배분 가이드 계산에 필요한 본인 재무 프로필
export const financialProfiles = pgTable("financial_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id).unique(),
  monthlyNetIncome: numeric("monthly_net_income", { precision: 20, scale: 0 }), // 세후 월 근로소득
  monthlyFixedCost: numeric("monthly_fixed_cost", { precision: 20, scale: 0 }), // 주거·보험 등 고정비
  emergencyFundMonths: integer("emergency_fund_months").notNull().default(6),
  riskTolerance: text("risk_tolerance").notNull().default("moderate"), // conservative|moderate|aggressive
  targetAllocation: jsonb("target_allocation"), // { cash:0.1, deposit:0.3, stock:0.5, crypto:0.1 } 등 사용자 지정
  ...timestamps,
});
