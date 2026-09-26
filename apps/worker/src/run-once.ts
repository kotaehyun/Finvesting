import "./lib/env.js";
import { collectRssNews } from "./sources/rss";
import { collectEcos } from "./sources/ecos";
import { collectUpbit } from "./sources/upbit";
import { collectFred } from "./sources/fred";
import { collectYahoo } from "./sources/yahoo";
import { collectDart } from "./sources/dart";
import { collectEdgar } from "./sources/edgar";
import { collectWorldBankInflation } from "./sources/worldbank";
import { collectBisPolicyRates } from "./sources/bis";
import { collectKofiaFunds } from "./sources/kofia";

// 개발용: 모든 소스 1회 실행
for (const [name, fn] of [["rss", collectRssNews], ["upbit", collectUpbit], ["ecos", collectEcos], ["fred", collectFred], ["yahoo", collectYahoo], ["dart", collectDart], ["edgar", collectEdgar], ["worldbank", collectWorldBankInflation], ["bis", collectBisPolicyRates], ["kofia", collectKofiaFunds]] as const) {
  try { console.log(name, await fn()); } catch (e) { console.error(name, e); }
}
process.exit(0);
