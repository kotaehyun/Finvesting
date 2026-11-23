import "./lib/env.js";
import { collectDart } from "./sources/dart.js";

async function main() {
  console.log("dart start", new Date().toISOString());
  const result = await collectDart();
  console.log("dart done", JSON.stringify(result));
  // postgres 풀이 열려 있으면 프로세스가 안 끝난다.
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
