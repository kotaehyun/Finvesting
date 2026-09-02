import { db, macroIndicators } from "@finvesting/db";

// 미국 세인트루이스 연준 FRED API. https://fred.stlouisfed.org/docs/api/api_key.html 에서 무료 키 발급 → FRED_API_KEY
// 시리즈 ID는 FRED 사이트에서 확인. 아래는 해외주식·환율 판단에 자주 쓰는 것들.
const SERIES: Array<{ code: string; id: string; unit: string }> = [
  { code: "US_FED_FUNDS",   id: "FEDFUNDS",   unit: "%" },      // 연방기금금리 (월)
  { code: "US_CPI",        id: "CPIAUCSL",   unit: "index" },  // 미국 CPI (월)
  { code: "US_10Y",        id: "DGS10",      unit: "%" },      // 미 국채 10년 (일)
  { code: "US_2Y",         id: "DGS2",       unit: "%" },      // 미 국채 2년 (일)
  { code: "DXY_BROAD",     id: "DTWEXBGS",   unit: "index" },  // 달러 인덱스(광의) (일)
  { code: "US_UNEMPLOYMENT", id: "UNRATE",   unit: "%" },      // 실업률 (월)
  { code: "VIX",           id: "VIXCLS",     unit: "index" },  // VIX (일)
];

export async function collectFred() {
  const key = process.env.FRED_API_KEY;
  if (!key) return { skipped: "FRED_API_KEY not set" };
  const start = new Date(); start.setDate(start.getDate() - 60);
  const from = start.toISOString().slice(0, 10);
  let upserted = 0;
  for (const s of SERIES) {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s.id}&api_key=${key}&file_type=json&observation_start=${from}`;
    const res = await fetch(url);
    if (!res.ok) { console.warn(`fred ${s.code}: ${res.status}`); continue; }
    const json = (await res.json()) as { observations?: Array<{ date: string; value: string }> };
    for (const o of json.observations ?? []) {
      if (o.value === ".") continue; // 휴장일 등 결측
      await db.insert(macroIndicators).values({ code: s.code, date: o.date, value: o.value, unit: s.unit, source: "fred" })
        .onConflictDoUpdate({ target: [macroIndicators.code, macroIndicators.date], set: { value: o.value, fetchedAt: new Date() } });
      upserted++;
    }
  }
  return { upserted };
}
