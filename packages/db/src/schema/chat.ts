import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { users, timestamps } from "./common";

// 투자 봇AI 대화. 시스템 프롬프트와 뉴스 본문은 넣지 않는다.
export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  ...timestamps,
}, (t) => [index("chat_sessions_user_updated_idx").on(t.userId, t.updatedAt)]);

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user | assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("chat_messages_session_idx").on(t.sessionId, t.createdAt)]);
