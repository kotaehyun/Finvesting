import type { NextConfig } from "next";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Next는 기본적으로 apps/web/.env만 읽는다. setup.md의 저장소 루트 .env를 먼저 로드.
const rootEnv = resolve(process.cwd(), "../../.env");
if (existsSync(rootEnv)) {
  for (const line of readFileSync(rootEnv, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    const quoted = (v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"));
    v = quoted ? v.slice(1, -1) : v.split("#")[0]!.trim();
    if (k && process.env[k] === undefined) process.env[k] = v;
  }
}

const config: NextConfig = {
  transpilePackages: ["@finvesting/api", "@finvesting/core", "@finvesting/db", "@finvesting/ai", "@finvesting/interop"],
};
export default config;
