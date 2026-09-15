// 공실·빈집·소득 대비 주택 부담. 급매·개인 압류는 공식 시계열이 없어 칸+원문.
// 상업용 공실은 한국부동산원 임대동향, 빈집은 주택총조사, PIR은 주거실태조사, 지니는 가계금융복지조사.

import { REALTY_METROS, type RealtyMetroId } from "./realty-loans";

export const REALTY_STRESS_LINKS = {
  reb: "https://www.reb.or.kr/reb/na/ntt/selectNttInfo.do?mi=9565&nttSn=111709",
  empty2024: "https://www.korea.kr/briefing/policyBriefingView.do?newsId=156721680",
  empty2025: "https://eiec.kdi.re.kr/policy/materialView.do?num=284799",
  emptyKosis: "https://kosis.kr/visual/eRegionJipyo/themaJipyo/eRegionJipyoThemaJipyoView.do?graphTypeGbn=THEMA&jipyoId=5596_6993&menuThemaId=A_01_04_03&statId=&themaId=A_01_04",
  pir: "https://stat.molit.go.kr/portal/cate/statView.do?hRsId=327",
  gini: "https://www.kostat.go.kr/board.es?act=view&bid=215&list_no=439535&mid=b80501010000",
  auction: "https://www.courtauction.go.kr/",
} as const;

export const REALTY_VACANCY = {
  asOf: "2025-12-31",
  published: "2026-01-29",
  source: "한국부동산원 2025년 4분기 상업용부동산 임대동향조사",
  note: "표본 공실입니다. 자가·무상임대는 공실이 아닙니다. 상가는 주택 공실이 아닙니다.",
} as const;

export const REALTY_EMPTY = {
  asOf: "2024-11-01",
  published: "2025",
  source: "국가데이터처 주택총조사(등록센서스) 미거주 주택",
  kr: 8.0,
  asOf2025: "2025-11-01",
  kr2025: 8.5,
  houses2025: 1_722_000,
  note: "11월 1일 기준 사람이 안 산 집. 신축·이사·수리 등 일시 공실도 포함합니다. 상가 공실과 다릅니다.",
} as const;

export const REALTY_PIR = {
  asOf: "2024",
  source: "국토교통부 2024년도 주거실태조사 자가가구 PIR(중위)",
  kr: 6.3,
  sudo: 8.7,
  metro: 6.3,
  province: 4.0,
  rir: 15.8,
  own: 61.4,
  note: "주택가격 중위 / 연소득 중위. 월급을 하나도 안 쓸 때 집을 사는 데 걸리는 햇수에 가깝습니다. 매수 신호가 아닙니다.",
} as const;

export const REALTY_GINI = {
  asOf: "2024",
  published: "2025-12-04",
  source: "국가데이터처 2025년 가계금융복지조사(2024년 소득)",
  disposable: 0.325,
  prevDisposable: 0.323,
  market: 0.399,
  quintile: 5.78,
  poverty: 15.3,
  avgIncomeMan: 7_427,
  note: "균등화 처분가능소득 지니. 0이면 완전 평등, 1이면 완전 불평등. 부동산 전용 지니가 아닙니다.",
} as const;

export type RealtyStressMetro = {
  id: RealtyMetroId;
  /** 오피스 공실률 %. 세종은 미공표. */
  office: number | null;
  midShop: number;
  smallShop: number;
  retail: number;
  /** 2024 빈집 비율 %. */
  empty: number;
  /** 주거실태조사 자가 PIR. 원문이 밝힌 곳만. */
  pir: number | null;
};

const VACANCY: Record<RealtyMetroId, Omit<RealtyStressMetro, "id">> = {
  seoul: { office: 5.1, midShop: 9.1, smallShop: 5.9, retail: 9.3, empty: 3.2, pir: 13.9 },
  busan: { office: 15.3, midShop: 15.4, smallShop: 7.5, retail: 8.8, empty: 9.1, pir: null },
  daegu: { office: 11.0, midShop: 18.1, smallShop: 9.8, retail: 12.1, empty: 7.1, pir: 6.7 },
  incheon: { office: 16.6, midShop: 14.2, smallShop: 11.8, retail: 9.3, empty: 7.4, pir: 6.6 },
  gwangju: { office: 18.9, midShop: 16.2, smallShop: 9.2, retail: 8.5, empty: 7.9, pir: null },
  daejeon: { office: 13.2, midShop: 13.5, smallShop: 8.2, retail: 8.9, empty: 5.6, pir: null },
  ulsan: { office: 14.1, midShop: 17.2, smallShop: 5.8, retail: 20.7, empty: 7.5, pir: null },
  sejong: { office: null, midShop: 24.2, smallShop: 5.7, retail: 13.2, empty: 9.2, pir: 8.2 },
  gyeonggi: { office: 10.8, midShop: 11.3, smallShop: 7.3, retail: 5.6, empty: 5.8, pir: 6.9 },
  gangwon: { office: 24.1, midShop: 15.3, smallShop: 7.8, retail: 16.8, empty: 12.5, pir: null },
  chungbuk: { office: 29.2, midShop: 19.7, smallShop: 9.5, retail: 15.5, empty: 11.0, pir: null },
  chungnam: { office: 12.7, midShop: 15.6, smallShop: 6.7, retail: 11.3, empty: 12.3, pir: null },
  jeonbuk: { office: 17.5, midShop: 18.1, smallShop: 8.5, retail: 17.4, empty: 12.4, pir: null },
  jeonnam: { office: 22.7, midShop: 13.4, smallShop: 11.1, retail: 23.2, empty: 15.0, pir: null },
  gyeongbuk: { office: 24.2, midShop: 19.4, smallShop: 9.8, retail: 27.6, empty: 12.5, pir: null },
  gyeongnam: { office: 16.5, midShop: 17.8, smallShop: 8.8, retail: 12.7, empty: 10.3, pir: null },
  jeju: { office: 4.4, midShop: 11.8, smallShop: 3.2, retail: 17.6, empty: 14.2, pir: null },
};

export const REALTY_STRESS_METROS: readonly RealtyStressMetro[] = REALTY_METROS.map((m) => ({
  id: m.id,
  ...VACANCY[m.id],
}));

export const REALTY_KR_VACANCY = {
  office: 8.7,
  midShop: 13.8,
  smallShop: 8.1,
  retail: 10.4,
} as const;

export const REALTY_CAPITAL_IDS: readonly RealtyMetroId[] = ["seoul", "gyeonggi", "incheon"];

export function realtyStressOf(id: RealtyMetroId): RealtyStressMetro {
  return REALTY_STRESS_METROS.find((r) => r.id === id) ?? REALTY_STRESS_METROS[0]!;
}

export function isCapitalMetro(id: RealtyMetroId): boolean {
  return REALTY_CAPITAL_IDS.includes(id);
}

/** 지역 값 − 전국. 결측이면 없음. */
export function vsKr(part: number | null | undefined, kr: number): number | null {
  if (part == null || !Number.isFinite(part) || !Number.isFinite(kr)) return null;
  return part - kr;
}

/** 지역 PIR / 전국 PIR. 공식 등급이 아니라 상대치. */
export function pirVsNational(pir: number | null | undefined, kr: number = REALTY_PIR.kr): number | null {
  if (pir == null || !Number.isFinite(pir) || !Number.isFinite(kr) || kr === 0) return null;
  return pir / kr;
}

export type IncomeHousingTone = "below" | "elevated" | "high";

/** 전국 PIR 대비. 국토부 등급이 아님. */
export function incomeHousingTone(vs: number | null): IncomeHousingTone | null {
  if (vs == null || !Number.isFinite(vs)) return null;
  if (vs < 1) return "below";
  if (vs < 1.5) return "elevated";
  return "high";
}

export const INCOME_HOUSING_TONE_LABEL: Record<IncomeHousingTone, string> = {
  below: "전국 이하",
  elevated: "전국보다 높음",
  high: "전국 대비 높음",
};

export function fmtRate(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function fmtDeltaPp(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%p`;
}
