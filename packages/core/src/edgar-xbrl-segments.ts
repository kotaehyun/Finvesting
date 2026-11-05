/**
 * SEC EDGAR 10-K 인스턴스 XBRL에서 제품·영업부문 매출.
 * companyfacts API에는 차원(segment)이 없어 `*_htm.xml`(또는 동등 인스턴스)만 사용.
 */

import type { CompanySegmentRow } from "./company-profile";

function localName(qname: string): string {
  const s = qname.trim();
  const i = s.indexOf(":");
  return i >= 0 ? s.slice(i + 1) : s;
}

export type EdgarFilingRow = {
  form?: string | null;
  accessionNumber?: string | null;
  primaryDocument?: string | null;
  reportDate?: string | null;
  filingDate?: string | null;
};

/** submissions recent 배열들을 행으로. */
export function zipEdgarRecentFilings(recent: {
  form?: string[];
  accessionNumber?: string[];
  primaryDocument?: string[];
  reportDate?: string[];
  filingDate?: string[];
}): EdgarFilingRow[] {
  const n = recent.form?.length ?? 0;
  const out: EdgarFilingRow[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      form: recent.form?.[i] ?? null,
      accessionNumber: recent.accessionNumber?.[i] ?? null,
      primaryDocument: recent.primaryDocument?.[i] ?? null,
      reportDate: recent.reportDate?.[i] ?? null,
      filingDate: recent.filingDate?.[i] ?? null,
    });
  }
  return out;
}

/** 해당 사업연도(결산일 연도) 10-K. 정정(10-K/A)보다 본보고서 우선. */
export function pickEdgarAnnual10K(
  rows: readonly EdgarFilingRow[],
  fiscalYear: number,
): EdgarFilingRow | null {
  const y = String(fiscalYear);
  const matchYear = (row: EdgarFilingRow) => {
    const rd = row.reportDate ?? "";
    if (rd.startsWith(y)) return true;
    const doc = row.primaryDocument ?? "";
    // aapl-20260926.htm → 결산일이 문서명에 있는 경우
    const m = doc.match(/(\d{4})(\d{2})(\d{2})/);
    if (m && m[1] === y) return true;
    return false;
  };
  const annual = rows.filter((r) => (r.form === "10-K" || r.form === "10-K/A") && matchYear(r));
  const primary = annual.find((r) => r.form === "10-K");
  return primary ?? annual[0] ?? null;
}

/** accession `0000320193-26-000026` → 아카이브 폴더 `000032019326000026`. */
export function edgarAccessionPath(accession: string): string {
  return accession.replace(/-/g, "");
}

/** CIK 문자열 → 아카이브 숫자 경로(선행 0 제거). */
export function edgarCikPath(cik: string): string {
  return String(Number.parseInt(cik.replace(/\D/g, ""), 10));
}

/** primaryDocument.htm → 인스턴스 XML 파일명. */
export function edgarInstanceXmlName(primaryDocument: string): string {
  const base = primaryDocument.trim().replace(/\.html?$/i, "");
  return `${base}_htm.xml`;
}

type Ctx = {
  dims: Array<{ axis: string; member: string }>;
  start: string | null;
  end: string | null;
};

function parseContexts(instanceXml: string): Map<string, Ctx> {
  const out = new Map<string, Ctx>();
  const re = /<(?:xbrli:)?context\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/(?:xbrli:)?context>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(instanceXml))) {
    const id = m[1] ?? "";
    const body = m[2] ?? "";
    const dims = [...body.matchAll(/dimension="([^"]+)">([^<]+)</g)].map((x) => ({
      axis: localName(x[1] ?? ""),
      member: (x[2] ?? "").trim(),
    }));
    const end = body.match(/<(?:xbrli:)?endDate>([^<]+)<\/(?:xbrli:)?endDate>/i)?.[1] ?? null;
    const start = body.match(/<(?:xbrli:)?startDate>([^<]+)<\/(?:xbrli:)?startDate>/i)?.[1] ?? null;
    out.set(id, { dims, start, end });
  }
  return out;
}

const PRODUCT_AXES = new Set(["ProductOrServiceAxis", "ProductOrServiceGroupAxis"]);
const SEGMENT_AXES = new Set([
  "StatementBusinessSegmentsAxis",
  "OperatingSegmentsAxis",
  "SegmentAxis",
]);

/** 합계·총액 멤버는 세분 행이 있을 때 제외. */
function isAggregateMember(memberLocal: string): boolean {
  return /^(Product|ProductsAndServices|OperatingSegments|CorporateAndOther|AllOther|Total)Member$/i.test(memberLocal)
    || memberLocal === "SegmentGeographicalDomainsMember";
}

function humanizeMember(qname: string): string {
  const n = localName(qname).replace(/Member$/i, "");
  const spaced = n
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/And/g, " and ")
    .replace(/([a-z])and([A-Z])/g, "$1 and $2")
    .replace(/\s+/g, " ")
    .trim();
  return (spaced || n).slice(0, 80);
}

function pickEndDate(candidates: string[], fiscalYear: number): string | null {
  const uniq = [...new Set(candidates.filter(Boolean))];
  const inYear = uniq.filter((d) => d.startsWith(`${fiscalYear}-`)).sort();
  if (inYear.length) return inYear[inYear.length - 1]!;
  const next = uniq.filter((d) => d.startsWith(`${fiscalYear + 1}-`)).sort();
  if (next.length) return next[0]!;
  return uniq.sort().at(-1) ?? null;
}

function collectAxisRows(
  hits: Array<{ amount: number; member: string; end: string; axis: string }>,
  axes: Set<string>,
  end: string,
): CompanySegmentRow[] {
  const byMember = new Map<string, number>();
  for (const h of hits) {
    if (h.end !== end) continue;
    if (!axes.has(h.axis)) continue;
    byMember.set(h.member, h.amount);
  }
  if (!byMember.size) return [];
  const locals = [...byMember.keys()].map(localName);
  const hasDetail = locals.some((n) => !isAggregateMember(n));
  const rows: CompanySegmentRow[] = [];
  const seen = new Set<string>();
  for (const [member, amount] of byMember) {
    const loc = localName(member);
    if (hasDetail && isAggregateMember(loc)) continue;
    const name = humanizeMember(member);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    rows.push({ name, amount });
  }
  rows.sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  return rows.slice(0, 30);
}

/**
 * 단일 차원 매출만. 제품축 우선, 없으면 지역·영업부문 축.
 * 합계 멤버·다차원 컨텍스트는 제외.
 */
export function parseEdgarXbrlSegments(input: {
  instanceXml: string;
  fiscalYear: number;
}): CompanySegmentRow[] {
  const ctxs = parseContexts(input.instanceXml);
  type Hit = { amount: number; member: string; end: string; axis: string };
  const hits: Hit[] = [];
  const revRe =
    /<(?:us-gaap:)?(RevenueFromContractWithCustomerExcludingAssessedTax|RevenueFromContractWithCustomerIncludingAssessedTax|SalesRevenueNet|Revenues)\s+([^>]*?)>([-0-9.,]+)<\/(?:us-gaap:)?\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = revRe.exec(input.instanceXml))) {
    const attrs = m[2] ?? "";
    const raw = (m[3] ?? "").replace(/,/g, "").trim();
    const amount = Number(raw);
    if (!Number.isFinite(amount)) continue;
    const ctxId = attrs.match(/contextRef="([^"]+)"/i)?.[1];
    if (!ctxId) continue;
    const ctx = ctxs.get(ctxId);
    if (!ctx?.end || ctx.dims.length !== 1) continue;
    const dim = ctx.dims[0]!;
    if (!PRODUCT_AXES.has(dim.axis) && !SEGMENT_AXES.has(dim.axis)) continue;
    hits.push({ amount, member: dim.member, end: ctx.end, axis: dim.axis });
  }
  const end = pickEndDate(hits.map((h) => h.end), input.fiscalYear);
  if (!end) return [];
  const product = collectAxisRows(hits, PRODUCT_AXES, end);
  if (product.length) return product;
  return collectAxisRows(hits, SEGMENT_AXES, end);
}
