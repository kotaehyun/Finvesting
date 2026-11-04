import { db, companyOverviews, companyYearFacts } from "@finvesting/db";
import {
  dartNeedsCatalog,
  edgarNeedsCatalog,
  parseDartCompanyOverview,
  parseDartDividends,
  parseDartHolders,
  parseDartSegments,
  parseEdgarCompanyOverview,
  parseDartTarget,
  parseEdgarTarget,
  parseEnvTargets,
  resolveDartTargets,
  resolveEdgarTargets,
  statementCollectYears,
  statementLookupHeldRefs,
} from "@finvesting/core";
import { loadDartCorpCatalog, loadSecTickerCatalog } from "../lib/catalogs";
import { ensureIdentifier, ensureInstrument, loadHeldInstruments } from "../lib/instruments";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

      const sRes = await fetch(`https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json?${base}&fs_div=CFS`);
      if (sRes.ok) {
        const json = await sRes.json() as { status: string; message?: string; list?: unknown[] };
        if (json.status === "000") {
          upserted += await upsertYearFact(inst.id, year, "segment", parseDartSegments(json.list), "dart", { status: json.status });
        } else if (json.status !== "013") console.warn(`dart segment ${t.stock} ${year}: ${json.message}`);
      }
      await sleep(120);
    }
  }

  return { upserted, catalog: catalogStatus, unmatched, years: factYears };
}

/** EDGAR: submissions 개황만. 주주·배당·부문 API는 여기 없음. */
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

  let upserted = 0;
  const heldByTicker = new Map(held.map((h) => [h.symbol.trim().toUpperCase(), h]));
  for (const t of targets) {
    const heldRow = heldByTicker.get(t.ticker);
    const market = heldRow && /^(US|NYSE|NASDAQ|AMEX)$/i.test(heldRow.market) ? heldRow.market : "US";
    const inst = await ensureInstrument({ symbol: t.ticker, market, name: t.name, assetClass: "stock", currency: "USD" });
    await ensureIdentifier(inst.id, "sec", t.cik);
    const res = await fetch(`https://data.sec.gov/submissions/CIK${t.cik}.json`, {
      headers: { "User-Agent": ua, Accept: "application/json" },
    });
    if (!res.ok) { console.warn(`edgar submissions ${t.ticker}: ${res.status}`); continue; }
    const json = await res.json() as Record<string, unknown>;
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
    await sleep(150);
  }
  return { upserted, catalog: catalogStatus, unmatched };
}
