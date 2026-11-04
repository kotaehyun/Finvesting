import { db, financialStatements, auditReports } from "@finvesting/db";
import {
  DART_REPORTS,
  dartNeedsCatalog,
  mapDartFsRow,
  parseDartAmount,
  parseDartTarget,
  parseEnvTargets,
  resolveDartTargets,
  statementCollectYears,
  statementLookupHeldRefs,
  type DartReportSpec,
} from "@finvesting/core";
import { loadDartCorpCatalog } from "../lib/catalogs";
import { ensureInstrument, ensureIdentifier, loadHeldInstruments } from "../lib/instruments";

// 금융감독원 DART Open API — 한국 상장사 재무제표 (공식, 무료 키). https://opendart.fss.or.kr
// 대상 = trades∪watchlist(KRX/KOSDAQ) ∪ DART_TARGETS ∪ `/statements` 국내 섹터.
// DART_TARGETS는 `005930` 또는 `005930:00126380:삼성전자`. corp가 없으면 corpCode.xml에서 찾는다.
// 목록에 없는 종목은 skip. 고유번호를 추측하지 않는다.
// 기간: statementCollectYears(기본 5년) × 사업/1분기/반기/3분기. 감사는 사업보고서만.
// 손익·재무상태: fnlttSinglAcnt (CFS). 현금흐름: fnlttSinglAcntAll (SinglAcnt에 CF 없음).

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** OpenDART 일시 끊김(ECONNRESET 등) 재시도. */
async function dartFetch(url: string, tries = 4): Promise<Response> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fetch(url);
    } catch (e) {
      last = e;
      await sleep(400 * (i + 1));
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}

export async function collectDart() {
  const key = process.env.DART_API_KEY?.trim();
  if (!key) return { skipped: "DART_API_KEY not set" };
  const held = [...(await loadHeldInstruments()), ...statementLookupHeldRefs(["kr"])];
  const env = parseEnvTargets(process.env.DART_TARGETS);
  let catalogStatus: "ok" | "empty" | "unavailable" | "skipped" = "skipped";
  let catalog = new Map<string, { corp: string; name: string }>();
  if (dartNeedsCatalog(held, env)) {
    const loaded = await loadDartCorpCatalog(key);
    catalog = loaded.catalog;
    catalogStatus = loaded.status;
  }
  for (const raw of env) {
    if (!parseDartTarget(raw)) console.warn(`dart skip invalid target: ${raw}`);
  }
  const { targets, unmatched } = resolveDartTargets({ held, env, catalog });
  for (const s of unmatched) console.warn(`dart skip unmatched: ${s}`);
  if (!targets.length) {
    return { skipped: "no dart targets", catalog: catalogStatus, unmatched };
  }

  const years = statementCollectYears();
  let upserted = 0;
  const heldByStock = new Map(held.map((h) => [h.symbol.replace(/\.(KS|KQ)$/i, ""), h]));
  for (const t of targets) {
    const heldRow = heldByStock.get(t.stock);
    const market = heldRow && /^(KRX|KOSDAQ)$/i.test(heldRow.market) ? heldRow.market : "KRX";
    const inst = await ensureInstrument({ symbol: t.stock, market, name: t.name, assetClass: "stock", currency: "KRW" });
    await ensureIdentifier(inst.id, "dart", t.corp);
    for (const year of years) {
      for (const report of DART_REPORTS) {
        try {
          const n = await upsertDartFs(key, inst.id, t.stock, t.corp, year, report);
          upserted += n;
          if (report.audit) {
            const a = await upsertDartAudit(key, inst.id, t.corp, year);
            if (a) upserted += a;
          }
        } catch (e) {
          console.warn(`dart ${t.stock} ${year} ${report.code}:`, e instanceof Error ? e.message : e);
        }
        await sleep(150);
      }
    }
  }
  return { upserted, catalog: catalogStatus, unmatched, years };
}

function absorbDartRows(
  groups: Map<string, Record<string, number>>,
  rows: Array<{
    fs_div?: string;
    sj_div?: string;
    account_nm?: string;
    account_id?: string;
    thstrm_amount?: string;
  }>,
  opts: { requireFsDivCfs: boolean; onlySj?: string },
) {
  for (const row of rows) {
    if (opts.requireFsDivCfs && row.fs_div !== "CFS") continue;
    if (opts.onlySj && row.sj_div !== opts.onlySj) continue;
    const mapped = mapDartFsRow({
      sjDiv: row.sj_div,
      accountNm: row.account_nm,
      accountId: row.account_id,
    });
    if (!mapped) continue;
    const num = parseDartAmount(row.thstrm_amount);
    if (num == null) continue;
    const g = groups.get(mapped.statement) ?? {};
    g[mapped.key] = num;
    groups.set(mapped.statement, g);
  }
}

async function upsertDartFs(
  key: string,
  instrumentId: string,
  stock: string,
  corp: string,
  year: number,
  report: DartReportSpec,
) {
  const base = `crtfc_key=${key}&corp_code=${corp}&bsns_year=${year}&reprt_code=${report.code}`;
  const url = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?${base}`;
  const res = await dartFetch(url);
  if (!res.ok) { console.warn(`dart ${stock} ${year} ${report.code}: ${res.status}`); return 0; }
  const json = (await res.json()) as {
    status: string;
    message?: string;
    list?: Array<{ fs_div: string; sj_div: string; account_nm: string; thstrm_amount: string; thstrm_dt?: string }>;
  };
  // 미제출·해당없음은 흔함. 경고만 남기고 skip.
  if (json.status !== "000") {
    if (json.status !== "013") console.warn(`dart ${stock} ${year} ${report.code}: ${json.message}`);
    return 0;
  }

  const groups = new Map<string, Record<string, number>>();
  absorbDartRows(groups, json.list ?? [], { requireFsDivCfs: true });

  // SinglAcnt에는 CF가 없음 → 전체표에서 영업현금흐름만.
  await sleep(150);
  const allUrl = `https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json?${base}&fs_div=CFS`;
  const allRes = await dartFetch(allUrl);
  if (allRes.ok) {
    const allJson = (await allRes.json()) as {
      status: string;
      message?: string;
      list?: Array<{
        sj_div?: string;
        account_nm?: string;
        account_id?: string;
        thstrm_amount?: string;
      }>;
    };
    if (allJson.status === "000") {
      absorbDartRows(groups, allJson.list ?? [], { requireFsDivCfs: false, onlySj: "CF" });
    } else if (allJson.status !== "013") {
      console.warn(`dart CF ${stock} ${year} ${report.code}: ${allJson.message}`);
    }
  } else {
    console.warn(`dart CF ${stock} ${year} ${report.code}: ${allRes.status}`);
  }

  let n = 0;
  for (const [statement, items] of groups) {
    await db.insert(financialStatements).values({
      instrumentId,
      fiscalYear: year,
      fiscalPeriod: report.period,
      statement,
      consolidated: "CFS",
      currency: "KRW",
      items,
      source: "dart",
    }).onConflictDoUpdate({
      target: [
        financialStatements.instrumentId,
        financialStatements.fiscalYear,
        financialStatements.fiscalPeriod,
        financialStatements.statement,
        financialStatements.consolidated,
        financialStatements.source,
      ],
      set: { items, fetchedAt: new Date() },
    });
    n++;
  }
  return n;
}

function dartText(v: unknown, max = 4000) {
  if (typeof v !== "string") return null;
  const s = v.replace(/\s+/g, " ").trim();
  if (!s || s === "-") return null;
  return s.slice(0, max);
}

function dartDate(v: unknown) {
  if (typeof v !== "string") return null;
  const m = v.trim().match(/^(\d{4})[.\-](\d{2})[.\-](\d{2})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

// 회계감사인·감사의견. 본문은 저장하지 않음. https://opendart.fss.or.kr/api/accnutAdtorNmNdAdtOpinion.json
async function upsertDartAudit(key: string, instrumentId: string, corp: string, year: number) {
  const url = `https://opendart.fss.or.kr/api/accnutAdtorNmNdAdtOpinion.json?crtfc_key=${key}&corp_code=${corp}&bsns_year=${year}&reprt_code=11011`;
  const res = await dartFetch(url);
  if (!res.ok) { console.warn(`dart audit ${corp} ${year}: ${res.status}`); return 0; }
  const json = (await res.json()) as {
    status: string;
    message?: string;
    list?: Array<{
      bsns_year?: string;
      adtor?: string;
      adt_opinion?: string;
      emphs_matter?: string;
      core_adt_matter?: string;
      adt_reprt_spcmnt_matter?: string;
      rcept_no?: string;
      stlm_dt?: string;
    }>;
  };
  if (json.status !== "000") {
    if (json.status !== "013") console.warn(`dart audit ${corp} ${year}: ${json.message}`);
    return 0;
  }
  const row = json.list?.[0];
  if (!row) return 0;
  await db.insert(auditReports).values({
    instrumentId,
    fiscalYear: year,
    reportCode: "11011",
    auditor: dartText(row.adtor, 80),
    opinion: dartText(row.adt_opinion, 80),
    emphasis: dartText(row.emphs_matter) ?? dartText(row.adt_reprt_spcmnt_matter),
    keyAuditMatters: dartText(row.core_adt_matter),
    receiptNo: dartText(row.rcept_no, 20),
    settledOn: dartDate(row.stlm_dt),
    source: "dart",
    raw: { bsns_year: row.bsns_year, rcept_no: row.rcept_no },
  }).onConflictDoUpdate({
    target: [auditReports.instrumentId, auditReports.fiscalYear, auditReports.reportCode, auditReports.source],
    set: {
      auditor: dartText(row.adtor, 80),
      opinion: dartText(row.adt_opinion, 80),
      emphasis: dartText(row.emphs_matter) ?? dartText(row.adt_reprt_spcmnt_matter),
      keyAuditMatters: dartText(row.core_adt_matter),
      receiptNo: dartText(row.rcept_no, 20),
      settledOn: dartDate(row.stlm_dt),
      raw: { bsns_year: row.bsns_year, rcept_no: row.rcept_no },
      fetchedAt: new Date(),
    },
  });
  return 1;
}
