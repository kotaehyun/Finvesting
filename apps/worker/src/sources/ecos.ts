import { db, macroIndicators } from "@finvesting/db";

// 한국은행 ECOS Open API. https://ecos.bok.or.kr 에서 키 발급 후 ECOS_API_KEY 설정.
// 통계코드/항목코드는 ECOS 사이트에서 확인. 아래는 자주 쓰는 것들.
const SERIES: Array<{ code: string; stat: string; item: string; cycle: "D" | "M"; unit: string }> = [
  { code: "USDKRW",        stat: "731Y001", item: "0000001", cycle: "D", unit: "KRW" },   // 원/달러 환율
  { code: "BOK_BASE_RATE", stat: "722Y001", item: "0101000", cycle: "D", unit: "%" },     // 기준금리
  { code: "CPI",           stat: "901Y009", item: "0",       cycle: "M", unit: "index" }, // 소비자물가지수
  { code: "KTB_3Y",        stat: "817Y002", item: "010200000", cycle: "D", unit: "%" },   // 국고채 3년
];

function fmt(d: Date, cycle: "D" | "M") {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return cycle === "D" ? `${y}${m}${day}` : `${y}${m}`;
}

export async function collectEcos() {
  const key = process.env.ECOS_API_KEY;
  if (!key) return { skipped: "ECOS_API_KEY not set" };
  const end = new Date(); const start = new Date(); start.setDate(end.getDate() - 40);
  let upserted = 0;
  for (const s of SERIES) {
    const url = `https://ecos.bok.or.kr/api/StatisticSearch/${key}/json/kr/1/100/${s.stat}/${s.cycle}/${fmt(start, s.cycle)}/${fmt(end, s.cycle)}/${s.item}`;
    const res = await fetch(url);
    if (!res.ok) { console.warn(`ecos ${s.code}: ${res.status}`); continue; }
    const json = (await res.json()) as { StatisticSearch?: { row?: Array<{ TIME: string; DATA_VALUE: string }> } };
    for (const row of json.StatisticSearch?.row ?? []) {
      const t = row.TIME;
      const date = t.length === 8 ? `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}` : `${t.slice(0, 4)}-${t.slice(4, 6)}-01`;
      await db.insert(macroIndicators).values({ code: s.code, date, value: row.DATA_VALUE, unit: s.unit, source: "ecos" })
        .onConflictDoUpdate({ target: [macroIndicators.code, macroIndicators.date], set: { value: row.DATA_VALUE, fetchedAt: new Date() } });
      upserted++;
    }
  }
  return { upserted };
}
