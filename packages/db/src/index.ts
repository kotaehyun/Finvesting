import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

// Next 핫리로드가 모듈을 다시 평가해도 풀을 하나만 유지한다.
const g = globalThis as unknown as { __finvestingSql?: ReturnType<typeof postgres>; __finvestingDb?: ReturnType<typeof drizzle<typeof schema>> };
export const sql = g.__finvestingSql ?? postgres(url, { max: 4 });
export const db = g.__finvestingDb ?? drizzle(sql, { schema });
g.__finvestingSql = sql;
g.__finvestingDb = db;
export type Db = typeof db;
export * from "./schema/index";
