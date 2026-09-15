import { db, macroIndicators } from "@finvesting/db";
import {
  ECOS_HHLOAN_CODES,
  ECOS_HHLOAN_HS_CODES,
  ECOS_HHLOAN_HS_ITEM,
  ECOS_HHLOAN_ITEM,
  ECOS_HHLOAN_STAT,
  ECOS_HHNPL_CODES,
  ECOS_HHNPL_ITEM,
  ECOS_HHNPL_STAT,
  ECOS_LOAN_RATE_NEW_STAT,
  ECOS_LOAN_RATE_OUT_STAT,
  REALTY_METROS,
  ecosMetroFromItemName,
  isEcosRegionGroup,
  matchEcosLoanRateItem,
  type RealtyMetroId,
} from "@finvesting/core";

// 한국은행 ECOS Open API. https://ecos.bok.or.kr 에서 키 발급 후 ECOS_API_KEY 설정.
// 통계코드/항목코드는 ECOS 사이트에서 확인. 아래는 자주 쓰는 것들.
const SERIES: Array<{ code: string; stat: string; item: string; cycle: "D" | "M"; unit: string }> = [
  { code: "USDKRW",        stat: "731Y001", item: "0000001", cycle: "D", unit: "KRW" },   // 원/달러 환율
  { code: "BOK_BASE_RATE", stat: "722Y001", item: "0101000", cycle: "D", unit: "%" },     // 기준금리
  { code: "CPI",           stat: "901Y009", item: "0",       cycle: "M", unit: "index" }, // 소비자물가지수
  { code: "KTB_3Y",        stat: "817Y002", item: "010200000", cycle: "D", unit: "%" },   // 국고채 3년
];

type ItemRow = {
  ITEM_CODE?: string;
  ITEM_NAME?: string;
  CYCLE?: string;
  GRP_NAME?: string;
};

function fmt(d: Date, cycle: "D" | "M") {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return cycle === "D" ? `${y}${m}${day}` : `${y}${m}`;
}

function ymAgo(months: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - months);
  return d;
}

async function upsertMacro(code: string, date: string, value: string, unit: string) {
  await db.insert(macroIndicators).values({ code, date, value, unit, source: "ecos" })
    .onConflictDoUpdate({ target: [macroIndicators.code, macroIndicators.date], set: { value, source: "ecos", fetchedAt: new Date() } });
}

async function ecosJson(url: string): Promise<unknown | null> {
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`ecos http ${res.status}`);
    return null;
  }
  return res.json();
}

async function listItems(key: string, stat: string): Promise<ItemRow[]> {
  const json = await ecosJson(`https://ecos.bok.or.kr/api/StatisticItemList/${key}/json/kr/1/500/${stat}`) as {
    StatisticItemList?: { row?: ItemRow[] };
    RESULT?: { MESSAGE?: string };
  } | null;
  const rows = json?.StatisticItemList?.row ?? [];
  if (!rows.length && json?.RESULT?.MESSAGE) console.warn(`ecos items ${stat}: ${json.RESULT.MESSAGE}`);
  return rows;
}

function regionCodes(rows: ItemRow[]): Partial<Record<RealtyMetroId | "kr", string>> {
  const pick = (list: ItemRow[]) => {
    const out: Partial<Record<RealtyMetroId | "kr", string>> = {};
    for (const r of list) {
      if (r.CYCLE && r.CYCLE !== "M") continue;
      const metro = ecosMetroFromItemName(r.ITEM_NAME ?? "");
      if (!metro || !r.ITEM_CODE || out[metro]) continue;
      out[metro] = r.ITEM_CODE;
    }
    return out;
  };
  const regional = rows.filter((r) => r.GRP_NAME && isEcosRegionGroup(r.GRP_NAME));
  const fromRegion = pick(regional);
  if (Object.keys(fromRegion).length) return fromRegion;
  return pick(rows);
}

function hasItem(rows: ItemRow[], code: string): boolean {
  return rows.some((r) => r.ITEM_CODE === code);
}

async function searchSeries(
  key: string,
  stat: string,
  cycle: "M",
  start: string,
  end: string,
  items: string[],
): Promise<Array<{ TIME: string; DATA_VALUE: string }>> {
  const path = items.map(encodeURIComponent).join("/");
  const json = await ecosJson(
    `https://ecos.bok.or.kr/api/StatisticSearch/${key}/json/kr/1/400/${stat}/${cycle}/${start}/${end}/${path}`,
  ) as {
    StatisticSearch?: { row?: Array<{ TIME: string; DATA_VALUE: string }> };
    RESULT?: { MESSAGE?: string };
  } | null;
  const rows = json?.StatisticSearch?.row ?? [];
  if (!rows.length && json?.RESULT?.MESSAGE) console.warn(`ecos search ${stat}: ${json.RESULT.MESSAGE}`);
  return rows;
}

async function storeRows(code: string, unit: string, rows: Array<{ TIME: string; DATA_VALUE: string }>) {
  let n = 0;
  for (const row of rows) {
    const t = row.TIME;
    if (!t || row.DATA_VALUE == null || row.DATA_VALUE === "") continue;
    const date = t.length === 8 ? `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}` : `${t.slice(0, 4)}-${t.slice(4, 6)}-01`;
    await upsertMacro(code, date, row.DATA_VALUE, unit);
    n++;
  }
  return n;
}

/** 예금은행 지역별 가계대출(151Y003). 지역 항목코드는 목록에서 이름 매칭. 시·구 코드 추측 금지. */
async function collectEcosHhLoans(key: string) {
  const start = fmt(ymAgo(40), "M");
  const end = fmt(new Date(), "M");
  let upserted = 0;
  const loanItems = await listItems(key, ECOS_HHLOAN_STAT);
  const regions = regionCodes(loanItems);
  const needed: Array<RealtyMetroId | "kr"> = ["kr", ...REALTY_METROS.map((m) => m.id)];
  const missing = needed.filter((id) => !regions[id]);
  if (missing.length) console.warn(`ecos hhloan: region names not in item list: ${missing.join(",")}`);
  if (!hasItem(loanItems, ECOS_HHLOAN_ITEM)) {
    console.warn("ecos hhloan: account item 1111000 not in list");
  } else {
    for (const [metro, region] of Object.entries(regions) as Array<[RealtyMetroId | "kr", string]>) {
      const code = ECOS_HHLOAN_CODES[metro];
      if (!code || !region) continue;
      upserted += await storeRows(code, "십억원", await searchSeries(key, ECOS_HHLOAN_STAT, "M", start, end, [ECOS_HHLOAN_ITEM, region]));
    }
    if (hasItem(loanItems, ECOS_HHLOAN_HS_ITEM)) {
      for (const m of REALTY_METROS) {
        const region = regions[m.id];
        if (!region) continue;
        upserted += await storeRows(ECOS_HHLOAN_HS_CODES[m.id], "십억원", await searchSeries(key, ECOS_HHLOAN_STAT, "M", start, end, [ECOS_HHLOAN_HS_ITEM, region]));
      }
    }
  }

  const nplItems = await listItems(key, ECOS_HHNPL_STAT);
  const nplRegions = regionCodes(nplItems);
  const nplMetros = REALTY_METROS.filter((m) => nplRegions[m.id]);
  if (!hasItem(nplItems, ECOS_HHNPL_ITEM)) {
    console.warn("ecos hhnpl: item R5AB00 not in list — skip");
  } else if (!nplMetros.length) {
    console.warn("ecos hhnpl: no metro region in item list — skip (시·구 아님)");
  } else {
    for (const m of nplMetros) {
      const region = nplRegions[m.id];
      if (!region) continue;
      upserted += await storeRows(ECOS_HHNPL_CODES[m.id], "%", await searchSeries(key, ECOS_HHNPL_STAT, "M", start, end, [ECOS_HHNPL_ITEM, region]));
    }
  }
  return { upserted, regions: Object.keys(regions), nplRegions: Object.keys(nplRegions) };
}

/** 예금은행 가중평균 대출금리. 항목코드는 목록 이름만. */
async function collectEcosLoanRates(key: string) {
  const start = fmt(ymAgo(24), "M");
  const end = fmt(new Date(), "M");
  let upserted = 0;
  const seen = new Set<string>();
  for (const stat of [ECOS_LOAN_RATE_NEW_STAT, ECOS_LOAN_RATE_OUT_STAT]) {
    const items = await listItems(key, stat);
    for (const row of items) {
      if (row.CYCLE && row.CYCLE !== "M") continue;
      const spec = matchEcosLoanRateItem(stat, row.ITEM_NAME ?? "");
      if (!spec || !row.ITEM_CODE || seen.has(spec.code)) continue;
      seen.add(spec.code);
      upserted += await storeRows(spec.code, "%", await searchSeries(key, stat, "M", start, end, [row.ITEM_CODE]));
    }
  }
  return { upserted, codes: [...seen] };
}

export async function collectEcos() {
  const key = process.env.ECOS_API_KEY;
  if (!key) return { skipped: "ECOS_API_KEY not set" };
  const end = new Date(); const start = new Date(); start.setDate(end.getDate() - 40);
  let upserted = 0;
  for (const s of SERIES) {
    const json = await ecosJson(
      `https://ecos.bok.or.kr/api/StatisticSearch/${key}/json/kr/1/100/${s.stat}/${s.cycle}/${fmt(start, s.cycle)}/${fmt(end, s.cycle)}/${s.item}`,
    ) as { StatisticSearch?: { row?: Array<{ TIME: string; DATA_VALUE: string }> } } | null;
    upserted += await storeRows(s.code, s.unit, json?.StatisticSearch?.row ?? []);
  }
  const loans = await collectEcosHhLoans(key);
  const rates = await collectEcosLoanRates(key);
  return { upserted: upserted + loans.upserted + rates.upserted, loans, rates };
}
