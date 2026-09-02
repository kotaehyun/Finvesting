import "dotenv/config";
import { collectRssNews } from "./sources/rss.js";
import { collectEcos } from "./sources/ecos.js";
import { collectUpbit } from "./sources/upbit.js";
import { collectFred } from "./sources/fred.js";

// 개발용: 모든 소스 1회 실행
for (const [name, fn] of [["rss", collectRssNews], ["upbit", collectUpbit], ["ecos", collectEcos], ["fred", collectFred]] as const) {
  try { console.log(name, await fn()); } catch (e) { console.error(name, e); }
}
process.exit(0);
