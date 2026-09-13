import { pgTable, uuid, text, numeric, integer, uniqueIndex, index } from "drizzle-orm/pg-core";
import { users, timestamps } from "./common";
import { accounts } from "./accounts";

// 예·적금 상품. 계좌(accounts)와 따로 두어 상품명·금리·약정을 적는다.
export const savingsPlans = pgTable("savings_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  accountId: uuid("account_id").references(() => accounts.id),
  name: text("name").notNull(), // 상품명
  institution: text("institution"), // 은행
  kind: text("kind").notNull().default("installment"), // installment 적금 | savings 예금
  interestRate: numeric("interest_rate", { precision: 8, scale: 4 }).notNull().default("0"), // 연 %, 예: 3.50
  compounding: text("compounding").notNull().default("simple"), // simple 단리 | compound 월복리
  termMonths: integer("term_months"), // 약정 개월
  monthlyAmount: numeric("monthly_amount", { precision: 20, scale: 0 }), // 적금=월납, 예금=가입원금
  startMonth: text("start_month"), // YYYY-MM
  maturityMonth: text("maturity_month"), // YYYY-MM
  description: text("description"), // 상품내용
  ...timestamps,
}, (t) => [index("savings_plans_user_idx").on(t.userId)]);

// 월별 납입(적금) 또는 입금 내역
export const savingsContributions = pgTable("savings_contributions", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id").notNull().references(() => savingsPlans.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  month: text("month").notNull(), // YYYY-MM
  amount: numeric("amount", { precision: 20, scale: 0 }).notNull(),
  memo: text("memo"),
  ...timestamps,
}, (t) => [
  uniqueIndex("savings_contrib_plan_month_uq").on(t.planId, t.month),
  index("savings_contrib_user_idx").on(t.userId),
]);
