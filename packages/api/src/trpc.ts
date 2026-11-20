import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { cookieValue, readSession, SESSION_COOKIE } from "@finvesting/core";
import { db } from "@finvesting/db";

export type Context = { db: typeof db; userId: string };

function defaultUserId(): string {
  return process.env.DEFAULT_USER_ID?.trim() || "00000000-0000-0000-0000-000000000001";
}

/** 비밀번호가 없으면 로컬 단일 사용자. 있으면 쿠키의 사용자만 통과한다. */
export async function createContext(opts?: { req?: Request }): Promise<Context> {
  const userId = defaultUserId();
  const password = process.env.APP_PASSWORD?.trim() ?? "";
  if (!password) return { db, userId };
  const secret = process.env.SESSION_SECRET?.trim() ?? "";
  if (!secret) {
    console.warn("APP_PASSWORD is set but SESSION_SECRET is missing");
    throw new TRPCError({ code: "UNAUTHORIZED", message: "로그인이 필요합니다." });
  }
  const token = cookieValue(opts?.req?.headers.get("cookie"), SESSION_COOKIE);
  const sessionUser = token ? await readSession(token, secret) : null;
  if (sessionUser !== userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "로그인이 필요합니다." });
  }
  return { db, userId };
}

const t = initTRPC.context<Context>().create({ transformer: superjson });
export const router = t.router;
export const publicProcedure = t.procedure;
