import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { db } from "@finvesting/db";

export type Context = { db: typeof db; userId: string };

export function createContext(): Context {
  // 단일 사용자 모드. 서비스화 시 세션/JWT에서 userId를 꺼내도록 교체.
  return { db, userId: process.env.DEFAULT_USER_ID ?? "00000000-0000-0000-0000-000000000001" };
}

const t = initTRPC.context<Context>().create({ transformer: superjson });
export const router = t.router;
export const publicProcedure = t.procedure;
