/**
 * 09-25 리뷰: tax는 entries만 값 보관, realty는 entries 삭제·exports 승격.
 * 새 숫자는 만들지 않는다.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dataDir = join(import.meta.dirname, "..", "data");

function readJson(rel) {
  return JSON.parse(readFileSync(join(dataDir, rel), "utf8"));
}
function writeJson(rel, obj) {
  writeFileSync(join(dataDir, rel), JSON.stringify(obj, null, 2) + "\n");
  console.log("wrote", rel);
}

// --- tax: drop parallel value objects; keep defaults + entries (+ string companions) ---

{
  const j = readJson("tax/payroll-rates-2026.json");
  writeJson("tax/payroll-rates-2026.json", { defaults: j.defaults, entries: j.entries });
}

{
  const j = readJson("tax/corp-local-rate.json");
  writeJson("tax/corp-local-rate.json", { defaults: j.defaults, entries: j.entries });
}

{
  const j = readJson("tax/ei-stability.json");
  const bandLabels = (j.eiStabilityBands || []).map(({ id, label, decree }) => ({
    id,
    label,
    decree,
  }));
  writeJson("tax/ei-stability.json", {
    defaults: j.defaults,
    industrialAccidentNote: j.industrialAccidentNote,
    minWage2026: { source: j.minWage2026.source },
    bandLabels,
    entries: j.entries,
  });
}

{
  const j = readJson("tax/civil-pay-2026.json");
  writeJson("tax/civil-pay-2026.json", {
    defaults: j.defaults,
    civilPay: j.civilPay,
    grades: j.grades,
    entries: j.entries,
  });
}

{
  const j = readJson("tax/brackets.json");
  function stripNums(brackets) {
    return (brackets || []).map(({ id, rateLabel }) => ({ id, rateLabel }));
  }
  writeJson("tax/brackets.json", {
    defaults: j.defaults,
    bracketLabels: {
      itaArt55: stripNums(j.itaArt55),
      ihtaArt26: stripNums(j.ihtaArt26),
      ltaArt111House: stripNums(j.ltaArt111House),
      cretArt9_2house: stripNums(j.cretArt9_2house),
      cretArt9_3house: stripNums(j.cretArt9_3house),
    },
    taxTablesMeta: j.taxTablesMeta,
    cgtFlatRates: j.cgtFlatRates,
    giftDeductions: j.giftDeductions,
    taxTerms: j.taxTerms,
    progressivePlain: j.progressivePlain,
    taxHelpLinks: j.taxHelpLinks,
    entries: j.entries,
  });
}

// --- realty: remove entries, hoist exports, mark config ---
const CONFIG = new Set(["map.json", "ref.json", "loans.json"]);

for (const name of readdirSync(join(dataDir, "realty"))) {
  if (!name.endsWith(".json")) continue;
  const rel = `realty/${name}`;
  const j = readJson(rel);
  const out = { defaults: j.defaults };
  if (CONFIG.has(name)) out.kind = "config";

  if (j.exports && typeof j.exports === "object") {
    Object.assign(out, j.exports);
  }
  for (const [k, v] of Object.entries(j)) {
    if (k === "defaults" || k === "entries" || k === "exports") continue;
    if (!(k in out)) out[k] = v;
  }

  // entries는 복사하지 않음 (plan B)
  writeJson(rel, out);
}

console.log("migrate done");
