import { db, macroIndicators } from "@finvesting/db";
import {
  ECB_AREA,
  POLICY_RATE_COUNTRIES,
  bisPeriodToDate,
  bisPolCode,
  isPolicyPeriodStale,
  parseBisCbpolJson,
} from "@finvesting/core";

// BIS 공개 SDMX. 키 없음. 월말 정책금리 WS_CBPOL.
// 확인: 2026-09-14 M.US+KR lastNObservations=1 HTTP 200. 프랑스·독일 국내 시계열은 1998에서 끊김.

export async function collectBisPolicyRates() {
  const areas = [...POLICY_RATE_COUNTRIES.map((c) => c.iso2), ECB_AREA.iso2].join("+");
  const url = `https://stats.bis.org/api/v1/data/WS_CBPOL/M.${areas}/all?lastNObservations=1`;
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.sdmx.data+json;version=1.0.0", "User-Agent": "Finvesting/0.1" },
  });
  if (!res.ok) return { upserted: 0, skippedStale: 0, error: `http ${res.status}` };
  const json: unknown = await res.json();
  const rows = parseBisCbpolJson(json);
  let upserted = 0;
  let skippedStale = 0;
  for (const row of rows) {
    if (isPolicyPeriodStale(row.period)) { skippedStale++; continue; }
    const code = bisPolCode(row.iso2);
    const date = bisPeriodToDate(row.period);
    const value = String(row.value);
    await db.insert(macroIndicators).values({
      code, date, value, unit: "pct", source: "bis",
    }).onConflictDoUpdate({
      target: [macroIndicators.code, macroIndicators.date],
      set: { value, fetchedAt: new Date(), source: "bis" },
    });
    upserted++;
  }
  return { upserted, skippedStale, of: rows.length };
}
