import "dotenv/config";
import cron from "node-cron";
import { collectRssNews } from "./sources/rss.js";
import { collectEcos } from "./sources/ecos.js";
import { collectUpbit } from "./sources/upbit.js";

// 수집 스케줄 (KST). 각 소스는 실패해도 다른 소스에 영향 없음.
const jobs: Array<[string, string, () => Promise<unknown>]> = [
  ["뉴스 RSS",       "*/15 * * * *", collectRssNews],   // 15분마다
  ["업비트 시세",     "*/5 * * * *",  collectUpbit],     // 5분마다
  ["ECOS 거시지표",   "0 9,18 * * *", collectEcos],      // 하루 2회
];

for (const [name, expr, fn] of jobs) {
  cron.schedule(expr, async () => {
    const t0 = Date.now();
    try { const r = await fn(); console.log(`[${name}] ok ${JSON.stringify(r)} ${Date.now() - t0}ms`); }
    catch (e) { console.error(`[${name}] fail`, e); }
  }, { timezone: "Asia/Seoul" });
  console.log(`scheduled ${name} (${expr})`);
}
