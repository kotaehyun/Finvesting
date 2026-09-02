import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// pnpm --filter 실행 시 cwd는 apps/worker. 저장소 루트 .env를 읽는다.
// 이 파일 위치: apps/worker/src/lib → 루트까지 4단계
const here = dirname(fileURLToPath(import.meta.url));
const rootEnv = resolve(here, "../../../../.env");
if (existsSync(rootEnv)) config({ path: rootEnv });
else config(); // 폴백: cwd의 .env

if (!process.env.DATABASE_URL) {
  console.warn(`[env] DATABASE_URL not set. looked for ${rootEnv}`);
}
