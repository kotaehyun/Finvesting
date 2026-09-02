import "./lib/env.js";
import cron from "node-cron";
import { collectRssNews } from "./sources/rss.js";
import { collectEcos } from "./sources/ecos.js";
import { collectUpbit } from "./sources/upbit.js";
import { collectFred } from "./sources/fred.js";
import { collectYahoo } from "./sources/yahoo.js";
import { collectDart } from "./sources/dart.js";
import { collectEdgar } from "./sources/edgar.js";

// 수집 스케줄 (KST). 각 소스는 실패해도 다른 소스에 영향 없음.
const jobs: Array<[string, string, () => Promise<unknown>]> = [
  ["뉴스 RSS",       "*/15 * * * *", collectRssNews],   // 15분마다
  ["업비트 시세",     "*/5 * * * *",  collectUpbit],     // 5분마다
  ["ECOS 거시지표",   "0 9,18 * * *", collectEcos],      // 하루 2회
  ["FRED 미국지표",   "0 7,19 * * *", collectFred],      // 하루 2회 (미국 장 마감 후 반영)
  ["Yahoo 미국시세",  "*/30 * * * *", collectYahoo],     // 30분마다
  ["DART 재무제표",   "0 3 * * 1",    collectDart],      // 매주 월 03시
  ["EDGAR 재무제표",  "0 4 * * 1",    collectEdgar],     // 매주 월 04시
];

async function run(name: string, fn: () => Promise<unknown>) {
  const t0 = Date.now();
  try { const r = await fn(); console.log(`[${name}] ok ${JSON.stringify(r)} ${Date.now() - t0}ms`); }
  catch (e) { console.error(`[${name}] fail`, e); }
}

for (const [name, expr, fn] of jobs) {
  cron.schedule(expr, () => run(name, fn), { timezone: "Asia/Seoul" });
  console.log(`scheduled ${name} (${expr})`);
}

// 기동 시 즉시 1회 수집 (기본 켜짐). 끄려면 WORKER_RUN_ON_START=false
if ((process.env.WORKER_RUN_ON_START ?? "true") !== "false") {
  (async () => { for (const [name, , fn] of jobs) await run(name, fn); })();
}
