import "./lib/env.js";
import { collectDart } from "./sources/dart.js";

async function main() {
  console.log("dart start", new Date().toISOString());
  const result = await collectDart();
  console.log("dart done", JSON.stringify(result));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
