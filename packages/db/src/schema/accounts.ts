import { pgTable, uuid, text, numeric, boolean, pgEnum, index } from "drizzle-orm/pg-core";
import { users, timestamps } from "./common.js";

// 계좌 유형: 자산 배분 계산의 기준이 된다.
export const accountType = pgEnum("account_type", [
  "checking",   // 입출금
  "savings",    // 예금
  "installment",// 적금
  "brokerage",  // 증권
  "crypto",     // 코인 거래소
  "card",       // 신용/체크카드 (부채성)
  "cash",
  "pension",    // 연금/IRP/ISA 등
  "loan",       // 대출
]);

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),          // "카카오뱅크 입출금"
  institution: text("institution"),      // "카카오뱅크"
  type: accountType("type").notNull(),
  currency: text("currency").notNull().default("KRW"),
  balance: numeric("balance", { precision: 20, scale: 4 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
}, (t) => [index("accounts_user_idx").on(t.userId)]);
