import { db, financialStatements } from "@finvesting/db";
import { ensureInstrument, ensureIdentifier, targetSymbols } from "../lib/instruments.js";

// 미국 SEC EDGAR — 공식, 키 불필요, 단 User-Agent에 연락처 필수(SEC 정책). 초당 10요청 제한.
// companyfacts API: https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json
// EDGAR_TARGETS="AAPL:0000320193,MSFT:0000789019"  (ticker:CIK 10자리)
// TODO: https://www.sec.gov/files/company_tickers.json 으로 ticker→CIK 자동 매핑

const UA = process.env.SEC_USER_AGENT ?? "Finvesting personal-use contact@example.com";

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

type Fact = { end: string; val: number; fy: number; fp: string; form: string };

export async function collectEdgar() {
  const targets = targetSymbols("EDGAR_TARGETS", []).map((t) => { const [ticker, cik] = t.split(":"); return { ticker: ticker!, cik: cik!.padStart(10, "0") }; });
  if (!targets.length) return { skipped: "EDGAR_TARGETS empty" };
  let upserted = 0;
  for (const t of targets) {
    const inst = await ensureInstrument({ symbol: t.ticker, market: "US", name: t.ticker, assetClass: "stock", currency: "USD" });
    await ensureIdentifier(inst.id, "sec", t.cik);
    const res = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${t.cik}.json`, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (!res.ok) { console.warn(`edgar ${t.ticker}: ${res.status}`); continue; }
    const json = (await res.json()) as { facts?: { "us-gaap"?: Record<string, { units: Record<string, Fact[]> }> } };
    const gaap = json.facts?.["us-gaap"] ?? {};

    // (fy, fp, statement) → items
    const groups = new Map<string, { fy: number; fp: string; statement: string; end: string; items: Record<string, number> }>();
    for (const { tag, key, statement } of TAGS) {
      const units = gaap[tag]?.units; if (!units) continue;
      const facts = units["USD"] ?? units["USD/shares"] ?? [];
      for (const f of facts) {
        if (!["10-K", "10-Q"].includes(f.form) || f.fy < new Date().getFullYear() - 3) continue;
        const k = `${f.fy}|${f.fp}|${statement}`;
        const g = groups.get(k) ?? { fy: f.fy, fp: f.fp, statement, end: f.end, items: {} };
        if (!(key in g.items)) g.items[key] = f.val;  // 같은 키에 여러 태그가 있으면 첫 것 유지
        groups.set(k, g);
      }
    }
    for (const g of groups.values()) {
      await db.insert(financialStatements).values({
        instrumentId: inst.id, fiscalYear: g.fy, fiscalPeriod: g.fp, statement: g.statement, consolidated: "CFS", currency: "USD", periodEnd: g.end, items: g.items, source: "edgar",
      }).onConflictDoUpdate({ target: [financialStatements.instrumentId, financialStatements.fiscalYear, financialStatements.fiscalPeriod, financialStatements.statement, financialStatements.consolidated, financialStatements.source], set: { items: g.items, periodEnd: g.end, fetchedAt: new Date() } });
      upserted++;
    }
    await new Promise((r) => setTimeout(r, 150)); // SEC rate limit 배려
  }
  return { upserted };
}
