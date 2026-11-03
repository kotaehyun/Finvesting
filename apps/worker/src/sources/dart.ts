import { db, financialStatements, auditReports } from "@finvesting/db";
import {
  DART_REPORTS,
  dartNeedsCatalog,
  parseDartTarget,
  parseEnvTargets,
  resolveDartTargets,
  statementCollectYears,
  type DartReportSpec,
} from "@finvesting/core";
import { loadDartCorpCatalog } from "../lib/catalogs";
import { ensureInstrument, ensureIdentifier, loadHeldInstruments } from "../lib/instruments";

// 금융감독원 DART Open API — 한국 상장사 재무제표 (공식, 무료 키). https://opendart.fss.or.kr
// 대상 = trades∪watchlist(KRX/KOSDAQ) ∪ DART_TARGETS.
// DART_TARGETS는 `005930` 또는 `005930:00126380:삼성전자`. corp가 없으면 corpCode.xml에서 찾는다.
// 목록에 없는 종목은 skip. 고유번호를 추측하지 않는다.
// 기간: statementCollectYears(기본 5년) × 사업/1분기/반기/3분기. 감사는 사업보고서만.

const ACCOUNT_MAP: Record<string, string> = {
  // DART account_nm → 표준 키 (한국어 계정명 기준, 회사별로 다를 수 있어 보수적으로 매핑)
  "매출액": "revenue", "수익(매출액)": "revenue", "영업수익": "revenue",
  "영업이익": "operating_income", "영업이익(손실)": "operating_income",
  "당기순이익": "net_income", "당기순이익(손실)": "net_income",
  "자산총계": "total_assets", "부채총계": "total_liabilities", "자본총계": "total_equity",
  "영업활동현금흐름": "cfo", "영업활동으로인한현금흐름": "cfo",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function collectDart() {
  const key = process.env.DART_API_KEY?.trim();
  if (!key) return { skipped: "DART_API_KEY not set" };
  const held = await loadHeldInstruments();
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
        const n = await upsertDartFs(key, inst.id, t.stock, t.corp, year, report);
        upserted += n;
        if (report.audit) {
          const a = await upsertDartAudit(key, inst.id, t.corp, year);
          if (a) upserted += a;
        }
        await sleep(120);
      }
    }
  }
  return { upserted, catalog: catalogStatus, unmatched, years };
}

async function upsertDartFs(
  key: string,
  instrumentId: string,
  stock: string,
  corp: string,
  year: number,
  report: DartReportSpec,
) {
  const url = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${key}&corp_code=${corp}&bsns_year=${year}&reprt_code=${report.code}`;
  const res = await fetch(url);
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
  for (const row of json.list ?? []) {
    if (row.fs_div !== "CFS") continue;
    const std = ACCOUNT_MAP[row.account_nm.replace(/\s/g, "")];
    if (!std) continue;
    const stmt = row.sj_div === "BS" ? "balance" : row.sj_div === "CF" ? "cashflow" : "income";
    const raw = (row.thstrm_amount ?? "").replace(/,/g, "").trim();
    const num = Number(raw);
    if (!raw || !Number.isFinite(num)) continue;
    const g = groups.get(stmt) ?? {};
    g[std] = num;
    groups.set(stmt, g);
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
  const res = await fetch(url);
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
