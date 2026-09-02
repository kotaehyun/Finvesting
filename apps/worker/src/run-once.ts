import "dotenv/config";
import { collectRssNews } from "./sources/rss.js";
import { collectEcos } from "./sources/ecos.js";
import { collectUpbit } from "./sources/upbit.js";
import { collectFred } from "./sources/fred.js";
import { collectYahoo } from "./sources/yahoo.js";
import { collectDart } from "./sources/dart.js";
import { collectEdgar } from "./sources/edgar.js";

// 개발용: 모든 소스 1회 실행
for (const [name, fn] of [["rss", collectRssNews], ["upbit", collectUpbit], ["ecos", collectEcos], ["fred", collectFred], ["yahoo", collectYahoo], ["dart", collectDart], ["edgar", collectEdgar]] as const) {
  try { console.log(name, await fn()); } catch (e) { console.error(name, e); }
}
process.exit(0);
