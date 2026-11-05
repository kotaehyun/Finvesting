import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// pnpm --filter 실행 시 cwd는 apps/worker. 저장소 루트 .env를 읽는다.
function findEnv(start: string) {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    const p = resolve(dir, ".env");
    if (existsSync(p)) return p;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const here = dirname(fileURLToPath(import.meta.url));
const rootEnv = findEnv(here) ?? findEnv(process.cwd());
if (rootEnv) config({ path: rootEnv });
else config();

if (!process.env.DATABASE_URL) {
  console.warn("[env] DATABASE_URL not set");
}
