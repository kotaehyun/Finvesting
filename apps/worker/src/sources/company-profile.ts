import { db, companyOverviews, companyYearFacts } from "@finvesting/db";
import {
  dartNeedsCatalog,
  edgarNeedsCatalog,
  parseDartCompanyOverview,
  parseDartDividends,
  parseDartHolders,
  parseDartXbrlOperatingSegments,
  parseEdgarCompanyOverview,
  parseEdgarXbrlSegments,
  parseDartTarget,
  parseEdgarTarget,
  parseEnvTargets,
  pickDartAnnualReceipt,
  pickEdgarAnnual10K,
  edgarAccessionPath,
  edgarCikPath,
  edgarInstanceXmlName,
  zipEdgarRecentFilings,
  resolveDartTargets,
  resolveEdgarTargets,
  statementCollectYears,
  statementLookupHeldRefs,
} from "@finvesting/core";
import { loadDartCorpCatalog, loadSecTickerCatalog } from "../lib/catalogs";
import { ensureIdentifier, ensureInstrument, loadHeldInstruments } from "../lib/instruments";
import { readZipFileBySuffix } from "../lib/zip";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

/** 사업보고서 접수번호 → fnlttXbrl ZIP → 영업부문 매출. */
async function collectDartSegmentsFromXbrl(
  key: string,
  corp: string,
  stock: string,
  year: number,
): Promise<{ rows: ReturnType<typeof parseDartXbrlOperatingSegments>; raw: unknown }> {
  const bgn = `${year}0101`;
  const end = `${year + 1}0630`;
  const listUrl = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${key}&corp_code=${corp}&bgn_de=${bgn}&end_de=${end}&pblntf_ty=A&page_count=100`;
  const listRes = await dartFetch(listUrl);
  if (!listRes.ok) return { rows: [], raw: { listHttp: listRes.status } };
  const listJson = await listRes.json() as { status: string; message?: string; list?: Array<{ report_nm?: string; rcept_no?: string }> };
  if (listJson.status !== "000") {
    return { rows: [], raw: { listStatus: listJson.status, message: listJson.message } };
  }
  const rcept = pickDartAnnualReceipt(listJson.list ?? [], year);
  if (!rcept) return { rows: [], raw: { list: "no annual receipt" } };
  await sleep(150);
  const xUrl = `https://opendart.fss.or.kr/api/fnlttXbrl.xml?crtfc_key=${key}&rcept_no=${rcept}&reprt_code=11011`;
  const xRes = await dartFetch(xUrl);
  if (!xRes.ok) return { rows: [], raw: { rcept, xbrlHttp: xRes.status } };
  const buf = Buffer.from(await xRes.arrayBuffer());
  if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b) {
    // JSON 오류 메시지일 수 있음
    let msg: unknown = { rcept, notZip: true };
    try { msg = { rcept, ...(JSON.parse(buf.toString("utf8")) as object) }; } catch { /* ignore */ }
    return { rows: [], raw: msg };
  }
  const instance = readZipFileBySuffix(buf, ".xbrl");
  const labKo = readZipFileBySuffix(buf, "lab-ko.xml");
  if (!instance) return { rows: [], raw: { rcept, missing: "xbrl" } };
  const rows = parseDartXbrlOperatingSegments({
    instanceXml: instance.toString("utf8"),
    labKoXml: labKo?.toString("utf8") ?? null,
    fiscalYear: year,
  });
  return { rows, raw: { rcept, source: "fnlttXbrl", n: rows.length, stock } };
}

async function upsertOverview(
  instrumentId: string,
  source: string,
  overview: NonNullable<ReturnType<typeof parseDartCompanyOverview>>,
  raw: unknown,
) {
  await db.insert(companyOverviews).values({
    instrumentId,
    source,
    corpName: overview.corpName,
    corpNameEn: overview.corpNameEn,
    stockName: overview.stockName,
    ceo: overview.ceo,
    corpClass: overview.corpClass,
    address: overview.address,
    homepage: overview.homepage,
    irUrl: overview.irUrl,
    phone: overview.phone,
    industryCode: overview.industryCode,
    industryName: overview.industryName,
    establishedOn: overview.establishedOn,
    fiscalMonth: overview.fiscalMonth,
    items: overview,
    raw,
  }).onConflictDoUpdate({
    target: [companyOverviews.instrumentId, companyOverviews.source],
    set: {
      corpName: overview.corpName,
      corpNameEn: overview.corpNameEn,
      stockName: overview.stockName,
      ceo: overview.ceo,
      corpClass: overview.corpClass,
      address: overview.address,
      homepage: overview.homepage,
      irUrl: overview.irUrl,
      phone: overview.phone,
      industryCode: overview.industryCode,
      industryName: overview.industryName,
      establishedOn: overview.establishedOn,
      fiscalMonth: overview.fiscalMonth,
      items: overview,
      raw,
      fetchedAt: new Date(),
    },
  });
}

async function upsertYearFact(
  instrumentId: string,
  fiscalYear: number,
  kind: "holders" | "dividend" | "segment",
  items: unknown[],
  source: string,
  raw: unknown,
) {
  if (!items.length) return 0;
  await db.insert(companyYearFacts).values({
    instrumentId,
    fiscalYear,
    reportCode: "11011",
    kind,
    items,
    source,
    raw,
  }).onConflictDoUpdate({
    target: [
      companyYearFacts.instrumentId,
      companyYearFacts.fiscalYear,
      companyYearFacts.reportCode,
      companyYearFacts.kind,
      companyYearFacts.source,
    ],
    set: { items, raw, fetchedAt: new Date() },
  });
  return 1;
}

/** DART: 기업개황 + (사업연도) 최대주주·배당·부문매출. */
export async function collectDartCompanyProfile() {
  const key = process.env.DART_API_KEY?.trim();
  if (!key) return { skipped: "DART_API_KEY not set" };
  const held = [...(await loadHeldInstruments()), ...statementLookupHeldRefs(["kr"])];
  const env = parseEnvTargets(process.env.DART_TARGETS);
  let catalog = new Map<string, { corp: string; name: string }>();
  let catalogStatus: "ok" | "empty" | "unavailable" | "skipped" = "skipped";
  if (dartNeedsCatalog(held, env)) {
    const loaded = await loadDartCorpCatalog(key);
    catalog = loaded.catalog;
    catalogStatus = loaded.status;
  }
  for (const raw of env) {
    if (!parseDartTarget(raw)) console.warn(`dart-profile skip invalid: ${raw}`);
  }
  const { targets, unmatched } = resolveDartTargets({ held, env, catalog });
  for (const s of unmatched) console.warn(`dart-profile unmatched: ${s}`);
  if (!targets.length) return { skipped: "no dart targets", catalog: catalogStatus, unmatched };

  // 개황은 연도 무관 1회. 주주·배당·부문은 확정 사업연도(올해 제외 최근 3년).
  const factYears = statementCollectYears().filter((y) => y < new Date().getFullYear()).slice(0, 3);
  let upserted = 0;
  const heldByStock = new Map(held.map((h) => [h.symbol.replace(/\.(KS|KQ)$/i, ""), h]));

  for (const t of targets) {
    const heldRow = heldByStock.get(t.stock);
    const market = heldRow && /^(KRX|KOSDAQ)$/i.test(heldRow.market) ? heldRow.market : "KRX";
    const inst = await ensureInstrument({ symbol: t.stock, market, name: t.name, assetClass: "stock", currency: "KRW" });
    await ensureIdentifier(inst.id, "dart", t.corp);

    const ovRes = await fetch(`https://opendart.fss.or.kr/api/company.json?crtfc_key=${key}&corp_code=${t.corp}`);
    if (ovRes.ok) {
      const json = await ovRes.json() as Record<string, unknown>;
      const overview = parseDartCompanyOverview(json);
      if (overview) {
        await upsertOverview(inst.id, "dart", overview, { status: json.status });
        upserted++;
      } else if (json.status !== "013") {
        console.warn(`dart company ${t.stock}: ${json.message}`);
      }
    }
    await sleep(120);

    for (const year of factYears) {
      const base = `crtfc_key=${key}&corp_code=${t.corp}&bsns_year=${year}&reprt_code=11011`;

      const hRes = await fetch(`https://opendart.fss.or.kr/api/hyslrSttus.json?${base}`);
      if (hRes.ok) {
        const json = await hRes.json() as { status: string; message?: string; list?: unknown[] };
        if (json.status === "000") {
          upserted += await upsertYearFact(inst.id, year, "holders", parseDartHolders(json.list), "dart", { status: json.status, n: json.list?.length });
        } else if (json.status !== "013") console.warn(`dart holders ${t.stock} ${year}: ${json.message}`);
      }
      await sleep(120);

      const dRes = await fetch(`https://opendart.fss.or.kr/api/alotMatter.json?${base}`);
      if (dRes.ok) {
        const json = await dRes.json() as { status: string; message?: string; list?: unknown[] };
        if (json.status === "000") {
          upserted += await upsertYearFact(inst.id, year, "dividend", parseDartDividends(json.list), "dart", { status: json.status, n: json.list?.length });
        } else if (json.status !== "013") console.warn(`dart dividend ${t.stock} ${year}: ${json.message}`);
      }
      await sleep(120);

      try {
        const seg = await collectDartSegmentsFromXbrl(key, t.corp, t.stock, year);
        upserted += await upsertYearFact(inst.id, year, "segment", seg.rows, "dart", seg.raw);
        if (!seg.rows.length) {
          console.warn(`dart segment ${t.stock} ${year}: empty`, seg.raw);
        }
      } catch (e) {
        console.warn(`dart segment ${t.stock} ${year}:`, e instanceof Error ? e.message : e);
      }
      await sleep(150);
    }
  }

  return { upserted, catalog: catalogStatus, unmatched, years: factYears };
}

async function edgarFetch(url: string, ua: string, tries = 4): Promise<Response> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fetch(url, { headers: { "User-Agent": ua, Accept: "*/*" } });
    } catch (e) {
      last = e;
      await sleep(400 * (i + 1));
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}

/** submissions 10-K → 아카이브 `*_htm.xml` → 제품/영업부문 매출. */
async function collectEdgarSegmentsFrom10K(
  ua: string,
  cik: string,
  ticker: string,
  year: number,
  filings: ReturnType<typeof zipEdgarRecentFilings>,
): Promise<{ rows: ReturnType<typeof parseEdgarXbrlSegments>; raw: unknown }> {
  const filing = pickEdgarAnnual10K(filings, year);
  if (!filing?.accessionNumber || !filing.primaryDocument) {
    return { rows: [], raw: { year, no10k: true } };
  }
  const acc = edgarAccessionPath(filing.accessionNumber);
  const cikPath = edgarCikPath(cik);
  const xmlName = edgarInstanceXmlName(filing.primaryDocument);
  const url = `https://www.sec.gov/Archives/edgar/data/${cikPath}/${acc}/${xmlName}`;
  await sleep(200);
  const res = await edgarFetch(url, ua);
  if (!res.ok) return { rows: [], raw: { year, accession: filing.accessionNumber, xmlHttp: res.status, xmlName } };
  const xml = await res.text();
  if (!xml.includes("context") && !xml.includes("Context")) {
    return { rows: [], raw: { year, accession: filing.accessionNumber, notXml: true } };
  }
  const rows = parseEdgarXbrlSegments({ instanceXml: xml, fiscalYear: year });
  return {
    rows,
    raw: {
      year,
      accession: filing.accessionNumber,
      reportDate: filing.reportDate,
      source: "10-K htm.xml",
      n: rows.length,
      ticker,
    },
  };
}

/** EDGAR: submissions 개황 + 10-K XBRL 부문매출. 주주·배당 단일 API는 없음. */
export async function collectEdgarCompanyProfile() {
  const ua = process.env.SEC_USER_AGENT?.trim();
  if (!ua) return { skipped: "SEC_USER_AGENT not set" };
  const held = [...(await loadHeldInstruments()), ...statementLookupHeldRefs(["us"])];
  const env = parseEnvTargets(process.env.EDGAR_TARGETS);
  let catalog = new Map<string, { cik: string; title: string }>();
  let catalogStatus: "ok" | "empty" | "unavailable" | "skipped" = "skipped";
  if (edgarNeedsCatalog(held, env)) {
    const loaded = await loadSecTickerCatalog(ua);
    catalog = loaded.catalog;
    catalogStatus = loaded.status;
  }
  for (const raw of env) {
    if (!parseEdgarTarget(raw)) console.warn(`edgar-profile skip invalid: ${raw}`);
  }
  const { targets, unmatched } = resolveEdgarTargets({ held, env, catalog });
  for (const s of unmatched) console.warn(`edgar-profile unmatched: ${s}`);
  if (!targets.length) return { skipped: "no edgar targets", catalog: catalogStatus, unmatched };

  // 미국은 결산월이 달라 올해 10-K가 이미 있을 수 있음 → 최근 3개 연도 시도
  const factYears = statementCollectYears().slice(0, 3);
  let upserted = 0;
  const heldByTicker = new Map(held.map((h) => [h.symbol.trim().toUpperCase(), h]));
  for (const t of targets) {
    const heldRow = heldByTicker.get(t.ticker);
    const market = heldRow && /^(US|NYSE|NASDAQ|AMEX)$/i.test(heldRow.market) ? heldRow.market : "US";
    const inst = await ensureInstrument({ symbol: t.ticker, market, name: t.name, assetClass: "stock", currency: "USD" });
    await ensureIdentifier(inst.id, "sec", t.cik);
    const res = await edgarFetch(`https://data.sec.gov/submissions/CIK${t.cik}.json`, ua);
    if (!res.ok) { console.warn(`edgar submissions ${t.ticker}: ${res.status}`); continue; }
    const json = await res.json() as Record<string, unknown> & {
      filings?: { recent?: Parameters<typeof zipEdgarRecentFilings>[0] };
    };
    const overview = parseEdgarCompanyOverview(json);
    if (overview) {
      await upsertOverview(inst.id, "edgar", overview, {
        cik: t.cik,
        tickers: json.tickers,
        exchanges: json.exchanges,
        sic: json.sic,
      });
      upserted++;
    }
    const filings = zipEdgarRecentFilings(json.filings?.recent ?? {});
    for (const year of factYears) {
      try {
        const seg = await collectEdgarSegmentsFrom10K(ua, t.cik, t.ticker, year, filings);
        upserted += await upsertYearFact(inst.id, year, "segment", seg.rows, "edgar", seg.raw);
        if (!seg.rows.length) {
          console.warn(`edgar segment ${t.ticker} ${year}: empty`, seg.raw);
        }
      } catch (e) {
        console.warn(`edgar segment ${t.ticker} ${year}:`, e instanceof Error ? e.message : e);
      }
      await sleep(200);
    }
    await sleep(150);
  }
  return { upserted, catalog: catalogStatus, unmatched, years: factYears };
}
