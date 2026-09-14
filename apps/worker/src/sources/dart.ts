import { db, financialStatements, auditReports } from "@finvesting/db";
import { ensureInstrument, ensureIdentifier, targetSymbols } from "../lib/instruments";

// 금융감독원 DART Open API — 한국 상장사 재무제표 (공식, 무료 키). https://opendart.fss.or.kr
// 필요: DART_API_KEY. 종목코드→corp_code 매핑은 corpCode.xml(zip)에서 얻어야 하나, 여기선 환경변수로 직접 지정.
// DART_TARGETS="005930:00126380:삼성전자,000660:00164779:SK하이닉스"  (stock_code:corp_code:name)
// TODO: corpCode.xml 다운로드·파싱해 자동 매핑 (확인 필요)

const ACCOUNT_MAP: Record<string, string> = {
  // DART account_nm → 표준 키 (한국어 계정명 기준, 회사별로 다를 수 있어 보수적으로 매핑)
  "매출액": "revenue", "수익(매출액)": "revenue", "영업수익": "revenue",
  "영업이익": "operating_income", "영업이익(손실)": "operating_income",
  "당기순이익": "net_income", "당기순이익(손실)": "net_income",
  "자산총계": "total_assets", "부채총계": "total_liabilities", "자본총계": "total_equity",
  "영업활동현금흐름": "cfo", "영업활동으로인한현금흐름": "cfo",
};

export async function collectDart() {
  const key = process.env.DART_API_KEY;
  if (!key) return { skipped: "DART_API_KEY not set" };
  const targets = targetSymbols("DART_TARGETS", []).flatMap((t) => {
    const [stock, corp, name] = t.split(":");
    if (!stock || !corp) { console.warn(`dart skip invalid target: ${t}`); return []; }
    return [{ stock, corp, name: name ?? stock }];
  });
  if (!targets.length) return { skipped: "DART_TARGETS empty or invalid" };

  const year = new Date().getFullYear() - 1; // 직전 사업연도 확정치부터
  let upserted = 0;
  for (const t of targets) {
    const inst = await ensureInstrument({ symbol: t.stock, market: "KRX", name: t.name, assetClass: "stock", currency: "KRW" });
    await ensureIdentifier(inst.id, "dart", t.corp);
    // reprt_code 11011 = 사업보고서, fs_div CFS = 연결
    const url = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${key}&corp_code=${t.corp}&bsns_year=${year}&reprt_code=11011`;
    const res = await fetch(url);
    if (!res.ok) { console.warn(`dart ${t.stock}: ${res.status}`); continue; }
    const json = (await res.json()) as { status: string; message?: string; list?: Array<{ fs_div: string; sj_div: string; account_nm: string; thstrm_amount: string; thstrm_dt?: string }> };
    if (json.status !== "000") { console.warn(`dart ${t.stock}: ${json.message}`); continue; }

    // 재무제표 종류별로 묶기 (sj_div: BS 재무상태표, IS 손익계산서, CIS 포괄손익, CF 현금흐름표)
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
    for (const [statement, items] of groups) {
      await db.insert(financialStatements).values({
        instrumentId: inst.id, fiscalYear: year, fiscalPeriod: "FY", statement, consolidated: "CFS", currency: "KRW", items, source: "dart",
      }).onConflictDoUpdate({ target: [financialStatements.instrumentId, financialStatements.fiscalYear, financialStatements.fiscalPeriod, financialStatements.statement, financialStatements.consolidated, financialStatements.source], set: { items, fetchedAt: new Date() } });
      upserted++;
    }
    const audit = await upsertDartAudit(key, inst.id, t.corp, year);
    if (audit) upserted += audit;
  }
  return { upserted };
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
  if (!res.ok) { console.warn(`dart audit ${corp}: ${res.status}`); return 0; }
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
  if (json.status !== "000") { console.warn(`dart audit ${corp}: ${json.message}`); return 0; }
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
