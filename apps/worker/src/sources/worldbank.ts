import { db, macroIndicators } from "@finvesting/db";
import { INFLATION_COUNTRIES, wbInflCode } from "@finvesting/core";

// 세계은행 Open Data. 키 없음. 연간 CPI 상승률 FP.CPI.TOTL.ZG (이미 %).
// 최신 연도가 비어 있으면(미국 2025 등) 그 이전 연도를 쓴다.

const INDICATOR = "FP.CPI.TOTL.ZG";

type WbRow = {
  countryiso3code?: string;
  country?: { id?: string; value?: string };
  date?: string;
  value?: number | null;
};

export async function collectWorldBankInflation() {
  const ids = INFLATION_COUNTRIES.map((c) => c.iso2).join(";");
  const url = `https://api.worldbank.org/v2/country/${ids}/indicator/${INDICATOR}?format=json&mrv=5&per_page=200`;
  const res = await fetch(url);
  if (!res.ok) return { upserted: 0, error: `http ${res.status}` };
  const json = (await res.json()) as unknown;
  const rows = Array.isArray(json) && Array.isArray(json[1]) ? json[1] as WbRow[] : [];
  const best = new Map<string, { year: string; value: number }>();
  for (const r of rows) {
    const iso2 = (r.country?.id ?? "").toUpperCase();
    const year = r.date ?? "";
    const value = r.value;
    if (!iso2 || !year || typeof value !== "number" || !Number.isFinite(value)) continue;
    const prev = best.get(iso2);
    if (!prev || year > prev.year) best.set(iso2, { year, value });
  }
  let upserted = 0;
  for (const c of INFLATION_COUNTRIES) {
    const hit = best.get(c.iso2);
    if (!hit) continue;
    const code = wbInflCode(c.iso2);
    const date = `${hit.year}-01-01`;
    const value = String(hit.value);
    await db.insert(macroIndicators).values({
      code, date, value, unit: "pct", source: "worldbank",
    }).onConflictDoUpdate({
      target: [macroIndicators.code, macroIndicators.date],
      set: { value, fetchedAt: new Date(), source: "worldbank" },
    });
    upserted++;
  }
  return { upserted, of: INFLATION_COUNTRIES.length };
}
