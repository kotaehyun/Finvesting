/**
 * OpenDART `fnlttXbrl` 인스턴스에서 연결·영업부문 매출.
 * SinglAcntAll에는 부문매출이 없음(계정표만). 주석 XBRL의 OperatingSegments + Revenue만.
 */

import type { CompanySegmentRow } from "./company-profile";

function localName(qname: string): string {
  const s = qname.trim();
  const i = s.indexOf(":");
  return i >= 0 ? s.slice(i + 1) : s;
}

/** lab-ko.xml → 요소 localName → 표시 라벨(`[구성요소]` 없는 쪽 우선). */
export function parseDartXbrlKoLabels(labKoXml: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /id="Label_label_(entity\d+_([^"]+?))(?:_ko(?:_\d+)?)"[^>]*>([^<]+)</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(labKoXml))) {
    const key = m[2] ?? "";
    const label = (m[3] ?? "").replace(/\s+/g, " ").trim();
    if (!key || !label) continue;
    const prefer = label.replace(/\s*\[구성요소\]\s*$/, "").trim() || label;
    const prev = out.get(key);
    if (!prev) {
      out.set(key, prefer);
      continue;
    }
    const prevBare = !prev.includes("[구성요소]");
    const nextBare = !prefer.includes("[구성요소]");
    if ((!prevBare && nextBare) || (prevBare === nextBare && prefer.length < prev.length)) {
      out.set(key, prefer);
    }
  }
  return out;
}

/** 공시검색 list 행에서 해당 사업연도 사업보고서 접수번호. */
export function pickDartAnnualReceipt(
  rows: readonly { report_nm?: string | null; rcept_no?: string | null }[],
  fiscalYear: number,
): string | null {
  const exact = new RegExp(`사업보고서\\s*\\(${fiscalYear}\\.`);
  for (const row of rows) {
    const nm = row.report_nm ?? "";
    const no = (row.rcept_no ?? "").trim();
    if (no && exact.test(nm)) return no;
  }
  for (const row of rows) {
    const nm = row.report_nm ?? "";
    const no = (row.rcept_no ?? "").trim();
    if (no && nm.includes("사업보고서") && nm.includes(String(fiscalYear))) return no;
  }
  return null;
}

type Ctx = {
  members: string[];
  start: string | null;
  end: string | null;
};

function parseContexts(instanceXml: string): Map<string, Ctx> {
  const out = new Map<string, Ctx>();
  const re = /<xbrli:context id="([^"]+)">([\s\S]*?)<\/xbrli:context>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(instanceXml))) {
    const id = m[1] ?? "";
    const body = m[2] ?? "";
    const members = [...body.matchAll(/<xbrldi:explicitMember[^>]*>([^<]+)<\/xbrldi:explicitMember>/g)].map((x) => x[1]!.trim());
    const end = body.match(/<xbrli:endDate>([^<]+)<\/xbrli:endDate>/)?.[1] ?? null;
    const start = body.match(/<xbrli:startDate>([^<]+)<\/xbrli:startDate>/)?.[1] ?? null;
    out.set(id, { members, start, end });
  }
  return out;
}

/** 영업부문·제품/서비스 세분화 멤버. CGU·영업권 축은 제외. */
function isSegmentRevenueMember(qname: string): boolean {
  const n = localName(qname);
  if (n === "MaterialReconcilingItemsMember") return false;
  if (n === "OperatingSegmentsMember" || n === "SegmentsMember") return false;
  if (/CashGeneratingUnits|Goodwill|IntangibleAssetsWithIndefinite/i.test(n)) return false;
  if (n.includes("OfOperatingSegmentsMember")) return true;
  // 하이닉스 등: SegmentsAxis + 제품유형 (DRAM/NAND…)
  if (n.includes("OfSegmentsMember")) return true;
  return false;
}

function labelForMember(qname: string, labels: Map<string, string>): string {
  const n = localName(qname);
  if (labels.has(n)) return labels.get(n)!;
  for (const [k, v] of labels) {
    if (k.endsWith(n) || k.includes(n)) return v;
  }
  // DxDivisionMemberOfOperatingSegments... → DxDivision
  const short = n.replace(/MemberOfOperatingSegmentsMemberOfDisclosureOfOperatingSegmentsTableOfMember$/i, "")
    .replace(/Member$/i, "");
  return short || n;
}

function pickEndDate(candidates: string[], fiscalYear: number): string | null {
  const uniq = [...new Set(candidates.filter(Boolean))];
  const prefer = `${fiscalYear}-12-31`;
  if (uniq.includes(prefer)) return prefer;
  const inYear = uniq.filter((d) => d.startsWith(`${fiscalYear}-`)).sort();
  if (inYear.length) return inYear[inYear.length - 1]!;
  const next = uniq.filter((d) => d.startsWith(`${fiscalYear + 1}-`)).sort();
  if (next.length) return next[0]!;
  return uniq.sort().at(-1) ?? null;
}

/**
 * 연결(Consolidated) · 영업부문 축 · Revenue 숫자만.
 * 조정·별도·본문 저장 없음.
 */
export function parseDartXbrlOperatingSegments(input: {
  instanceXml: string;
  labKoXml?: string | null;
  fiscalYear: number;
}): CompanySegmentRow[] {
  const labels = input.labKoXml ? parseDartXbrlKoLabels(input.labKoXml) : new Map<string, string>();
  const ctxs = parseContexts(input.instanceXml);
  type Hit = { amount: number; member: string; end: string };
  const hits: Hit[] = [];
  const revRe = /<(?:[^:>]+:)?Revenue(?:FromContractWithCustomerExcludingAssessedTax)?(?:\s[^>]*)?\scontextRef="([^"]+)"[^>]*>([^<]+)</g;
  let m: RegExpExecArray | null;
  while ((m = revRe.exec(input.instanceXml))) {
    const ctxId = m[1] ?? "";
    const raw = (m[2] ?? "").replace(/,/g, "").trim();
    const amount = Number(raw);
    if (!Number.isFinite(amount)) continue;
    const ctx = ctxs.get(ctxId);
    if (!ctx?.end) continue;
    const joined = ctx.members.join("|");
    if (!joined.includes("ConsolidatedMember")) continue;
    if (joined.includes("SeparateMember")) continue;
    if (!ctx.members.some(isSegmentRevenueMember)) continue;
    const member = ctx.members.find(isSegmentRevenueMember);
    if (!member) continue;
    hits.push({ amount, member, end: ctx.end });
  }
  const end = pickEndDate(hits.map((h) => h.end), input.fiscalYear);
  if (!end) return [];
  const byMember = new Map<string, number>();
  for (const h of hits) {
    if (h.end !== end) continue;
    byMember.set(h.member, h.amount);
  }
  const rows: CompanySegmentRow[] = [];
  const seen = new Set<string>();
  for (const [member, amount] of byMember) {
    const name = labelForMember(member, labels).slice(0, 80);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    rows.push({ name, amount });
  }
  rows.sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  return rows.slice(0, 30);
}
