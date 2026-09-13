import { pgTable, uuid, text, numeric, date, pgEnum, index, jsonb } from "drizzle-orm/pg-core";
import { users, timestamps } from "./common";
import { accounts } from "./accounts";

export const txnDirection = pgEnum("txn_direction", ["in", "out", "transfer"]);

// 소비/수입 분류. 배분 가이드(고정비·변동비·저축·투자)의 입력이 된다.
export const txnCategory = pgEnum("txn_category", [
  "salary", "bonus", "interest", "dividend", "other_income",
  "housing", "utilities", "insurance", "subscription", "phone", // 고정비
  "income_tax", "health_insurance",                             // 공제
  "food", "transport", "shopping", "leisure", "health", "education", "misc", // 변동비
  "saving", "investment", "loan_repayment",                     // 저축·투자·상환
  "transfer", "uncategorized",
]);

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  accountId: uuid("account_id").notNull().references(() => accounts.id),
  date: date("date").notNull(),
  amount: numeric("amount", { precision: 20, scale: 4 }).notNull(), // 항상 양수, 방향은 direction
  direction: txnDirection("direction").notNull(),
  category: txnCategory("category").notNull().default("uncategorized"),
  merchant: text("merchant"),
  memo: text("memo"),
  counterAccountId: uuid("counter_account_id"), // transfer일 때 상대 계좌
  source: text("source"),                       // "csv:kakaobank" 등 업로드 출처
  raw: jsonb("raw"),                            // 원본 행 보존
  ...timestamps,
}, (t) => [
  index("txn_user_date_idx").on(t.userId, t.date),
  index("txn_account_idx").on(t.accountId),
]);
