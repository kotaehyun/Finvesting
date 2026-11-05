// `/statements` 오른쪽 기업정보. DART·EDGAR 공시 필드만. 없는 칸은 비움.

export type CompanyOverview = {
  corpName: string | null;
  corpNameEn: string | null;
  stockName: string | null;
  ceo: string | null;
  corpClass: string | null;
  address: string | null;
  homepage: string | null;
  irUrl: string | null;
  phone: string | null;
  industryCode: string | null;
  industryName: string | null;
  establishedOn: string | null;
  fiscalMonth: string | null;
  source: string;
};

export type CompanyHolder = {
  name: string;
  relation: string | null;
  stockKind: string | null;
  shares: number | null;
  ratio: number | null;
};

export type CompanyDividendRow = {
  label: string;
  stockKind: string | null;
  current: string | null;
  prior: string | null;
  prior2: string | null;
};

export type CompanySegmentRow = {
  name: string;
  amount: number | null;
};

function text(v: unknown, max = 200): string | null {
  if (typeof v !== "string") return null;
  const s = v.replace(/\s+/g, " ").trim();
  if (!s || s === "-") return null;
  return s.slice(0, max);
}

function ymd(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  const m8 = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m8) return `${m8[1]}-${m8[2]}-${m8[3]}`;
  const m = s.match(/^(\d{4})[.\-](\d{2})[.\-](\d{2})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v !== "string") return null;
  const raw = v.replace(/,/g, "").trim();
  if (!raw || raw === "-") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** 공시 칸 표시용. 숫자·문자열을 그대로 두고 가공하지 않음. */
function cell(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return text(v, 40);
}

const CORP_CLS: Record<string, string> = {
  Y: "유가",
  K: "코스닥",
  N: "코넥스",
  E: "기타",
};

/** OpenDART company.json → 개황. */
export function parseDartCompanyOverview(json: Record<string, unknown>): CompanyOverview | null {
  if (String(json.status ?? "") !== "000") return null;
  const corpName = text(json.corp_name, 120);
  if (!corpName) return null;
  return {
    corpName,
    corpNameEn: text(json.corp_name_eng, 120),
    stockName: text(json.stock_name, 80),
    ceo: text(json.ceo_nm, 80),
    corpClass: CORP_CLS[String(json.corp_cls ?? "")] ?? text(json.corp_cls, 20),
    address: text(json.adres, 200),
    homepage: text(json.hm_url, 200),
    irUrl: text(json.ir_url, 200),
    phone: text(json.phn_no, 40),
    industryCode: text(json.induty_code, 20),
    industryName: null,
    establishedOn: ymd(json.est_dt),
    fiscalMonth: text(json.acc_mt, 4),
    source: "dart",
  };
}

/** SEC submissions JSON → 개황. */
export function parseEdgarCompanyOverview(json: Record<string, unknown>): CompanyOverview | null {
  const name = text(json.name, 120);
  if (!name) return null;
  const addresses = json.addresses as { business?: Record<string, unknown> } | undefined;
  const biz = addresses?.business ?? {};
  const street = [text(biz.street1, 80), text(biz.street2, 80)].filter(Boolean).join(" ");
  const city = [text(biz.city, 40), text(biz.stateOrCountry, 40), text(biz.zipCode, 20)].filter(Boolean).join(" ");
  const address = [street, city].filter(Boolean).join(", ") || null;
  const tickers = Array.isArray(json.tickers) ? json.tickers.map(String) : [];
  const exchanges = Array.isArray(json.exchanges) ? json.exchanges.map(String) : [];
  const fyEnd = text(json.fiscalYearEnd, 8);
  const fiscalMonth = fyEnd && fyEnd.length >= 2 ? fyEnd.slice(0, 2) : null;
  return {
    corpName: name,
    corpNameEn: name,
    stockName: tickers[0] ?? null,
    ceo: null,
    corpClass: exchanges[0] ?? text(json.category, 40),
    address,
    homepage: text(json.website ?? json.investorWebsite, 200),
    irUrl: text(json.investorWebsite, 200),
    phone: text(json.phone, 40),
    industryCode: text(json.sic, 20),
    industryName: text(json.sicDescription, 120),
    establishedOn: null,
    fiscalMonth,
    source: "edgar",
  };
}

/** OpenDART hyslrSttus list → 주주. 기말 지분 있는 행만, 비율 큰 순. */
export function parseDartHolders(list: unknown): CompanyHolder[] {
  if (!Array.isArray(list)) return [];
  const rows: CompanyHolder[] = [];
  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const name = text(r.nm, 80);
    if (!name) continue;
    const shares = num(r.trmend_posesn_stock_co);
    const ratio = num(r.trmend_posesn_stock_qota_rt);
    if (shares == null && ratio == null) continue;
    rows.push({
      name,
      relation: text(r.relate, 40),
      stockKind: text(r.stock_knd, 40),
      shares,
      ratio,
    });
  }
  return rows.sort((a, b) => (b.ratio ?? -1) - (a.ratio ?? -1)).slice(0, 20);
}

/** OpenDART alotMatter list → 배당 행. 구분 문자열 그대로. */
export function parseDartDividends(list: unknown): CompanyDividendRow[] {
  if (!Array.isArray(list)) return [];
  const out: CompanyDividendRow[] = [];
  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const label = text(r.se, 80);
    if (!label) continue;
    out.push({
      label,
      stockKind: text(r.stock_knd, 40),
      current: cell(r.thstrm),
      prior: cell(r.frmtrm),
      prior2: cell(r.lwfr),
    });
  }
  return out.slice(0, 40);
}

/**
 * OpenDART fnlttSinglAcntAll 중 매출·member 행만.
 * member가 없거나 합계·조정만이면 빈 배열(추측 부문 금지).
 */
export function parseDartSegments(list: unknown): CompanySegmentRow[] {
  if (!Array.isArray(list)) return [];
  const out: CompanySegmentRow[] = [];
  const seen = new Set<string>();
  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const sj = String(r.sj_div ?? "");
    if (sj !== "IS" && sj !== "CIS") continue;
    const account = text(r.account_nm, 80) ?? "";
    if (!/매출|수익/.test(account)) continue;
    const detail = text(r.account_detail, 200) ?? "";
    if (!/\[member\]/i.test(detail)) continue;
    if (/연결조정|조정|합계|총계|eliminat/i.test(detail)) continue;
    const parts = detail.split("|").map((p) => p.replace(/\s*\[member\]\s*/gi, "").trim()).filter(Boolean);
    const name = parts[parts.length - 1] || detail;
    if (!name || seen.has(name)) continue;
    const amount = num(r.thstrm_amount) ?? num(r.thstrm_add_amount);
    if (amount == null) continue;
    seen.add(name);
    out.push({ name: name.slice(0, 80), amount });
  }
  return out.slice(0, 30);
}

export function formatOverviewLines(o: CompanyOverview): string[] {
  const lines: string[] = [];
  if (o.corpName) lines.push(`법인 ${o.corpName}`);
  if (o.ceo) lines.push(`대표 ${o.ceo}`);
  if (o.corpClass) lines.push(`구분 ${o.corpClass}`);
  if (o.industryName) lines.push(`업종 ${o.industryName}`);
  else if (o.industryCode) lines.push(`업종코드 ${o.industryCode}`);
  if (o.establishedOn) lines.push(`설립 ${o.establishedOn}`);
  if (o.fiscalMonth) lines.push(`결산월 ${o.fiscalMonth}`);
  if (o.address) lines.push(`주소 ${o.address}`);
  if (o.homepage) lines.push(`홈 ${o.homepage}`);
  if (o.phone) lines.push(`전화 ${o.phone}`);
  return lines;
}

/** 챗·읽어주기용. 수집된 행만. */
export function formatOverviewContext(o: CompanyOverview | null | undefined): string | null {
  if (!o) return null;
  const lines = formatOverviewLines(o);
  if (!lines.length) return null;
  return lines.map((l) => `- ${l}`).join("\n");
}

export function formatHoldersContext(rows: CompanyHolder[] | null | undefined): string | null {
  if (!rows?.length) return null;
  return rows.slice(0, 8).map((r) => {
    const bits = [r.name];
    if (r.relation) bits.push(r.relation);
    if (r.ratio != null) bits.push(`${r.ratio}%`);
    if (r.shares != null) bits.push(`${Math.round(r.shares).toLocaleString("ko-KR")}주`);
    return `- ${bits.join(" · ")}`;
  }).join("\n");
}

export function formatDividendsContext(rows: CompanyDividendRow[] | null | undefined): string | null {
  if (!rows?.length) return null;
  return rows.slice(0, 12).map((r) => {
    const label = r.stockKind ? `${r.label} (${r.stockKind})` : r.label;
    return `- ${label}: ${r.current ?? "없음"}`;
  }).join("\n");
}

export function formatSegmentsContext(
  rows: CompanySegmentRow[] | null | undefined,
  currency: string,
): string | null {
  if (!rows?.length) return null;
  const unit = currency === "KRW" ? "원" : ` ${currency}`;
  return rows.slice(0, 12).map((r) => {
    const amt = r.amount != null
      ? `${Math.round(r.amount).toLocaleString("ko-KR")}${unit}`
      : "없음";
    return `- ${r.name}: ${amt}`;
  }).join("\n");
}
