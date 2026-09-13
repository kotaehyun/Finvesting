import { pgTable, uuid, text, numeric, boolean, index } from "drizzle-orm/pg-core";
import { users, timestamps } from "./common";

// 민영 보험 증권. 4대보험(급여 공제)과 별개. 보장액은 가입 합산용.
export const insurancePolicies = pgTable("insurance_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  insurer: text("insurer"),
  kind: text("kind").notNull().default("other"), // life|health|cancer|critical|accident|disability|property|other
  monthlyPremium: numeric("monthly_premium", { precision: 20, scale: 0 }).notNull().default("0"),
  deathAmount: numeric("death_amount", { precision: 20, scale: 0 }).notNull().default("0"),
  medicalCovered: boolean("medical_covered").notNull().default(false),
  cancerAmount: numeric("cancer_amount", { precision: 20, scale: 0 }).notNull().default("0"),
  brainAmount: numeric("brain_amount", { precision: 20, scale: 0 }).notNull().default("0"),
  heartAmount: numeric("heart_amount", { precision: 20, scale: 0 }).notNull().default("0"),
  accidentAmount: numeric("accident_amount", { precision: 20, scale: 0 }).notNull().default("0"),
  disabilityAmount: numeric("disability_amount", { precision: 20, scale: 0 }).notNull().default("0"),
  startMonth: text("start_month"), // YYYY-MM
  endMonth: text("end_month"), // YYYY-MM
  memo: text("memo"),
  ...timestamps,
}, (t) => [index("insurance_policies_user_idx").on(t.userId)]);
