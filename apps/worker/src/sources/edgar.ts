import { db, financialStatements } from "@finvesting/db";
import {
  edgarMinFiscalYear,
  edgarNeedsCatalog,
  heldInstrumentKey,
  indexHeldPreferFirst,
  parseEdgarTarget,
  pickEdgarFact,
  parseEnvTargets,
  resolveEdgarTargets,
  statementLookupHeldRefs,
} from "@finvesting/core";
import { loadSecTickerCatalog } from "../lib/catalogs";
import { ensureInstrument, ensureIdentifier, loadHeldInstruments } from "../lib/instruments";

// 미국 SEC EDGAR — 공식, 키 불필요, 단 User-Agent에 연락처 필수(SEC 정책). 초당 10요청 제한.
// 대상 = trades∪watchlist(US/NYSE/NASDAQ/AMEX) ∪ EDGAR_TARGETS ∪ `/statements` 미국 섹터.
// EDGAR_TARGETS는 `AAPL` 또는 `AAPL:0000320193`. CIK가 없으면 company_tickers.json에서 찾는다.
// 목록에 없는 티커는 skip. CIK를 추측하지 않는다.

const UA = process.env.SEC_USER_AGENT?.trim();

// us-gaap 태그 → 표준 키
const TAGS: Array<{ tag: string; key: string; statement: "income" | "balance" | "cashflow" }> = [
  { tag: "Revenues", key: "revenue", statement: "income" },
  { tag: "RevenueFromContractWithCustomerExcludingAssessedTax", key: "revenue", statement: "income" },
  { tag: "OperatingIncomeLoss", key: "operating_income", statement: "income" },
  { tag: "NetIncomeLoss", key: "net_income", statement: "income" },
  { tag: "EarningsPerShareDiluted", key: "eps_diluted", statement: "income" },
  { tag: "Assets", key: "total_assets", statement: "balance" },
  { tag: "Liabilities", key: "total_liabilities", statement: "balance" },
  { tag: "StockholdersEquity", key: "total_equity", statement: "balance" },
  { tag: "NetCashProvidedByUsedInOperatingActivities", key: "cfo", statement: "cashflow" },
];

type Fact = { start?: string; end: string; val: number; fy: number; fp: string; form: string };

export async function collectEdgar() {
  if (!UA) return { skipped: "SEC_USER_AGENT not set" };
  const held = [...(await loadHeldInstruments()), ...statementLookupHeldRefs(["us"])];
  const env = parseEnvTargets(process.env.EDGAR_TARGETS);
  let catalogStatus: "ok" | "empty" | "unavailable" | "skipped" = "skipped";
  let catalog = new Map<string, { cik: string; title: string }>();
  if (edgarNeedsCatalog(held, env)) {
    const loaded = await loadSecTickerCatalog(UA);
    catalog = loaded.catalog;
    catalogStatus = loaded.status;
  }
  for (const raw of env) {
    if (!parseEdgarTarget(raw)) console.warn(`edgar skip invalid target: ${raw}`);
  }
  const { targets, unmatched } = resolveEdgarTargets({ held, env, catalog });
  for (const s of unmatched) console.warn(`edgar skip unmatched: ${s}`);
  if (!targets.length) {
    return { skipped: "no edgar targets", catalog: catalogStatus, unmatched };
  }
  let upserted = 0;
  const heldByTicker = indexHeldPreferFirst(held, (h) => heldInstrumentKey(h.symbol));
  for (const t of targets) {
    const heldRow = heldByTicker.get(t.ticker);
    const market = heldRow && /^(US|NYSE|NASDAQ|AMEX)$/i.test(heldRow.market) ? heldRow.market : "US";
    const inst = await ensureInstrument({ symbol: t.ticker, market, name: t.name, assetClass: "stock", currency: "USD" });
    await ensureIdentifier(inst.id, "sec", t.cik);
    const res = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${t.cik}.json`, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (!res.ok) { console.warn(`edgar ${t.ticker}: ${res.status}`); continue; }
    const json = (await res.json()) as { facts?: { "us-gaap"?: Record<string, { units: Record<string, Fact[]> }> } };
    const gaap = json.facts?.["us-gaap"] ?? {};

    // (fy, fp, statement) → 항목별 후보. 손익·현금흐름은 누적 개월이 맞는 fact만 남긴다.
    const groups = new Map<string, {
      fy: number;
      fp: string;
      statement: "income" | "balance" | "cashflow";
      facts: Map<string, Fact[]>;
    }>();
    for (const { tag, key, statement } of TAGS) {
      const units = gaap[tag]?.units; if (!units) continue;
      const facts = units["USD"] ?? units["USD/shares"] ?? [];
      for (const f of facts) {
        if (!["10-K", "10-Q"].includes(f.form) || f.fy < edgarMinFiscalYear()) continue;
        const k = `${f.fy}|${f.fp}|${statement}`;
        const g = groups.get(k) ?? { fy: f.fy, fp: f.fp, statement, facts: new Map() };
        const list = g.facts.get(key) ?? [];
        list.push(f);
        g.facts.set(key, list);
        groups.set(k, g);
      }
    }
    for (const g of groups.values()) {
      const items: Record<string, number> = {};
      let end = "";
      for (const [key, facts] of g.facts) {
        const picked = pickEdgarFact(g.statement, g.fp, facts);
        if (!picked) {
          console.warn(`edgar skip ${t.ticker} ${g.fy} ${g.fp} ${g.statement} ${key}: duration mismatch`);
          continue;
        }
        items[key] = picked.val;
        if (picked.end > end) end = picked.end;
      }
      if (!Object.keys(items).length || !end) continue;
      await db.insert(financialStatements).values({
        instrumentId: inst.id, fiscalYear: g.fy, fiscalPeriod: g.fp, statement: g.statement, consolidated: "CFS", currency: "USD", periodEnd: end, items, source: "edgar",
      }).onConflictDoUpdate({ target: [financialStatements.instrumentId, financialStatements.fiscalYear, financialStatements.fiscalPeriod, financialStatements.statement, financialStatements.consolidated, financialStatements.source], set: { items, periodEnd: end, fetchedAt: new Date() } });
      upserted++;
    }
    await new Promise((r) => setTimeout(r, 150)); // SEC rate limit 배려
  }
  return { upserted, catalog: catalogStatus, unmatched };
}
