import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ExpoConfig, ConfigContext } from "expo/config";

// Expo CLI는 apps/mobile/.env만 읽는다. 저장소 루트 .env를 먼저 로드해 EXPO_PUBLIC_* 를 채운다.
// (app.config.ts는 CLI 프로세스에서 실행되므로 여기서 process.env에 넣으면 번들 시 인라인된다)
const rootEnv = resolve(__dirname, "../../.env");
if (existsSync(rootEnv)) {
  for (const line of readFileSync(rootEnv, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).split("#")[0]!.trim().replace(/^["']|["']$/g, "");
    if (k.startsWith("EXPO_PUBLIC_") && process.env[k] === undefined) process.env[k] = v;
  }
}

// app.json의 설정을 그대로 쓰고 extra만 덧붙인다.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  extra: { ...config.extra, apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000" },
});
