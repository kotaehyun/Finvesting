// 예금은행 지역별 가계대출은 시·구가 아니라 광역시도. ECOS 151Y003 말잔(십억원).
// 통계청 2018 시군구 코드 앞 2자리. 항목코드는 이름 매칭, 추측 금지.

export const REALTY_METROS = [
  { id: "seoul", label: "서울", kostat: "11", code: "SE" },
  { id: "busan", label: "부산", kostat: "21", code: "BS" },
  { id: "daegu", label: "대구", kostat: "22", code: "DG" },
  { id: "incheon", label: "인천", kostat: "23", code: "IC" },
  { id: "gwangju", label: "광주", kostat: "24", code: "GJ" },
  { id: "daejeon", label: "대전", kostat: "25", code: "DJ" },
  { id: "ulsan", label: "울산", kostat: "26", code: "US" },
  { id: "sejong", label: "세종", kostat: "29", code: "SJ" },
  { id: "gyeonggi", label: "경기", kostat: "31", code: "GG" },
  { id: "gangwon", label: "강원", kostat: "32", code: "GW" },
  { id: "chungbuk", label: "충북", kostat: "33", code: "CB" },
  { id: "chungnam", label: "충남", kostat: "34", code: "CN" },
  { id: "jeonbuk", label: "전북", kostat: "35", code: "JB" },
  { id: "jeonnam", label: "전남", kostat: "36", code: "JN" },
  { id: "gyeongbuk", label: "경북", kostat: "37", code: "GB" },
  { id: "gyeongnam", label: "경남", kostat: "38", code: "GN" },
  { id: "jeju", label: "제주", kostat: "39", code: "JJ" },
] as const;

export type RealtyMetroId = (typeof REALTY_METROS)[number]["id"];

const METRO_BY_KOSTAT: Record<string, RealtyMetroId> = Object.fromEntries(
  REALTY_METROS.map((m) => [m.kostat, m.id]),
) as Record<string, RealtyMetroId>;

const METRO_IDS = new Set<string>(REALTY_METROS.map((m) => m.id));

export const ECOS_HHLOAN_STAT = "151Y003";
export const ECOS_HHLOAN_ITEM = "1111000"; // 예금은행 가계대출. sample 항목 목록에서 확인
export const ECOS_HHLOAN_HS_ITEM = "11110A0"; // 주택관련대출-예금은행
export const ECOS_HHNPL_STAT = "141Y005";
export const ECOS_HHNPL_ITEM = "R5AB00"; // 가계대출 연체율(전체1M). sample 항목 목록에서 확인

function ecosMetroCodes(prefix: string): Record<RealtyMetroId, string> {
  return Object.fromEntries(REALTY_METROS.map((m) => [m.id, `${prefix}${m.code}`])) as Record<RealtyMetroId, string>;
}

export const ECOS_HHLOAN_CODES = { kr: "ECOS_HHLOAN_KR", ...ecosMetroCodes("ECOS_HHLOAN_") };
export const ECOS_HHLOAN_HS_CODES = ecosMetroCodes("ECOS_HHLOAN_HS_");
export const ECOS_HHNPL_CODES = ecosMetroCodes("ECOS_HHNPL_");

const INCHEON_IDS = new Set(["incheon", "ganghwa", "ongjin"]);

export function realtyMetroFromKostatCode(code: string): RealtyMetroId | null {
  return METRO_BY_KOSTAT[code.slice(0, 2)] ?? null;
}

export function realtyMetroLabel(id: RealtyMetroId): string {
  return REALTY_METROS.find((m) => m.id === id)?.label ?? id;
}

export function realtyMetroForPlace(id: string): RealtyMetroId {
  if (METRO_IDS.has(id)) return id as RealtyMetroId;
  if (id === "seoul" || id.startsWith("seoul")) return "seoul";
  if (INCHEON_IDS.has(id)) return "incheon";
  if (id.startsWith("gyeonggi")) return "gyeonggi";
  if (id.startsWith("other-")) return realtyMetroFromKostatCode(id.slice(6)) ?? "gyeonggi";
  return realtyMetroFromKostatCode(id) ?? "gyeonggi";
}

/** ECOS 지역 항목 이름. 시·구 이름은 매칭하지 않는다. */
export function ecosMetroFromItemName(name: string): RealtyMetroId | "kr" | null {
  const n = name.replace(/\s+/g, "").trim();
  if (n === "전국") return "kr";
  if (n === "서울" || n === "서울특별시" || n === "서울시") return "seoul";
  if (n === "부산" || n === "부산광역시" || n === "부산시") return "busan";
  if (n === "대구" || n === "대구광역시" || n === "대구시") return "daegu";
  if (n === "인천" || n === "인천광역시" || n === "인천시") return "incheon";
  if (n === "광주광역시" || n === "광주") return "gwangju";
  if (n === "대전" || n === "대전광역시" || n === "대전시") return "daejeon";
  if (n === "울산" || n === "울산광역시" || n === "울산시") return "ulsan";
  if (n === "세종" || n === "세종특별자치시" || n === "세종시") return "sejong";
  if (n === "경기" || n === "경기도") return "gyeonggi";
  if (n === "강원" || n === "강원도" || n === "강원특별자치도") return "gangwon";
  if (n === "충북" || n === "충청북도") return "chungbuk";
  if (n === "충남" || n === "충청남도") return "chungnam";
  if (n === "전북" || n === "전라북도" || n === "전북특별자치도") return "jeonbuk";
  if (n === "전남" || n === "전라남도") return "jeonnam";
  if (n === "경북" || n === "경상북도") return "gyeongbuk";
  if (n === "경남" || n === "경상남도") return "gyeongnam";
  if (n === "제주" || n === "제주도" || n === "제주특별자치도") return "jeju";
  return null;
}

export function realtyLoanMacroCodes(): string[] {
  return [
    ...Object.values(ECOS_HHLOAN_CODES),
    ...Object.values(ECOS_HHLOAN_HS_CODES),
    ...Object.values(ECOS_HHNPL_CODES),
  ];
}

export function isEcosRegionGroup(name: string): boolean {
  return /지역/.test(name);
}

/** 말잔이 있는 광역시도만 0~1. 시·구 높이가 아니라 시도 비율. */
export function metroHeightScale(latest: Partial<Record<RealtyMetroId, number | null>>): Record<RealtyMetroId, number> | null {
  const vals = REALTY_METROS.map((m) => latest[m.id]).filter((n): n is number => n != null && n > 0);
  if (!vals.length) return null;
  const max = Math.max(...vals);
  const out = {} as Record<RealtyMetroId, number>;
  for (const m of REALTY_METROS) {
    const n = latest[m.id];
    out[m.id] = n != null && n > 0 ? Math.max(0.2, n / max) : 0.2;
  }
  return out;
}

const KIND_H: Record<string, number> = {
  regulated: 2500,
  overcrowded: 1600,
  growth: 1000,
  nature: 700,
  out: 400,
  other: 400,
};

/** MapLibre fill-extrusion 높이(미터). 데이터 없으면 규제 구분. 시도 스케일이면 구가 같은 높이. */
export function planExtrudeMeters(kind: string, metroScale: number | null | undefined): number {
  if (metroScale != null && Number.isFinite(metroScale)) {
    return Math.round(800 + metroScale * 4500);
  }
  return KIND_H[kind] ?? 400;
}

export type LoanPoint = { date: string; value: number };

function shiftYm(date: string, months: number): string {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7));
  const t = y * 12 + (m - 1) + months;
  const ny = Math.floor(t / 12);
  const nm = (t % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}-01`;
}

export function loanGrowth(points: readonly LoanPoint[], monthsBack: number): number | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1];
  if (!last) return null;
  const want = shiftYm(last.date, -monthsBack);
  const prev = sorted.find((p) => p.date === want) ?? sorted.find((p) => p.date.slice(0, 7) === want.slice(0, 7));
  if (!prev || prev.value === 0) return null;
  return (last.value - prev.value) / prev.value;
}

export function loanYoySeries(points: readonly LoanPoint[]): LoanPoint[] {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const byYm = new Map(sorted.map((p) => [p.date.slice(0, 7), p]));
  const out: LoanPoint[] = [];
  for (const p of sorted) {
    const prev = byYm.get(shiftYm(p.date, -12).slice(0, 7));
    if (!prev || prev.value === 0) continue;
    out.push({ date: p.date, value: (p.value - prev.value) / prev.value });
  }
  return out;
}

/** ECOS 십억원 → 조원 */
export function eokToJo(eok: number): number {
  return eok / 1000;
}

/** 부분/전체. 0·결측이면 비율 없음. 가계신용/GDP가 아님. */
export function shareOf(part: number | null | undefined, whole: number | null | undefined): number | null {
  if (part == null || whole == null || !Number.isFinite(part) || !Number.isFinite(whole) || whole === 0) return null;
  return part / whole;
}

/** 같은 연월 말잔으로 전국 대비 비중 시계열. */
export function alignedShare(part: readonly LoanPoint[], whole: readonly LoanPoint[]): LoanPoint[] {
  const w = new Map(whole.map((p) => [p.date.slice(0, 7), p.value]));
  const out: LoanPoint[] = [];
  for (const p of [...part].sort((a, b) => a.date.localeCompare(b.date))) {
    const t = w.get(p.date.slice(0, 7));
    if (t == null || t === 0) continue;
    out.push({ date: p.date, value: p.value / t });
  }
  return out;
}

export type MetroLoanRankRow = {
  id: RealtyMetroId;
  label: string;
  latest: number | null;
  shareOfKr: number | null;
  rank: number | null;
};

/** 말잔이 큰 시도가 앞. 없는 값은 뒤로. */
export function metroLoanRank(
  rows: readonly { id: RealtyMetroId; label: string; latest: number | null }[],
  kr: number | null,
): MetroLoanRankRow[] {
  const ranked = [...rows]
    .filter((r) => r.latest != null && r.latest > 0)
    .sort((a, b) => (b.latest ?? 0) - (a.latest ?? 0));
  const rankOf = new Map(ranked.map((r, i) => [r.id, i + 1]));
  return [...rows]
    .map((r) => ({
      id: r.id,
      label: r.label,
      latest: r.latest,
      shareOfKr: shareOf(r.latest, kr),
      rank: rankOf.get(r.id) ?? null,
    }))
    .sort((a, b) => {
      if (a.rank != null && b.rank != null) return a.rank - b.rank;
      if (a.rank != null) return -1;
      if (b.rank != null) return 1;
      return a.label.localeCompare(b.label, "ko");
    });
}
