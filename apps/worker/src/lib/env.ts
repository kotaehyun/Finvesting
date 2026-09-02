import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// pnpm --filter 실행 시 cwd는 apps/worker. setup.md의 저장소 루트 .env를 읽는다.
const rootEnv = resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env");
if (existsSync(rootEnv)) config({ path: rootEnv });
else config();
