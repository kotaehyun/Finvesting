// 평균의 함정. 인구 최빈은 50대, 혼인·출산·신혼 주택은 30대 초반.
// 총조사·혼인·출생·주거실태조사 공표만. 등기정보광장·포털은 긁지 않는다.

export const REALTY_COHORT_LINKS = {
  census: "https://www.korea.kr/briefing/policyBriefingView.do?newsId=156772432",
  censusKdi: "https://eiec.kdi.re.kr/policy/materialView.do?num=284799",
  marry: "https://mods.go.kr/board.es?act=view&bid=204&list_no=444103&mid=a10301010000",
  birth: "https://mods.go.kr/board.es?act=view&bid=204&list_no=446625&mid=a10301010000",
  housing: "https://stat.molit.go.kr/portal/cate/statView.do?hRsId=327",
  rebAge: "https://www.reb.or.kr/reb/cm/cntnts/cntntsView.do?cntntsId=1061&mi=10338&statId=S234220286",
} as const;

/** 2025 인구주택총조사(등록센서스) 연령대 비중 %. 50대가 최빈. */
export const REALTY_AGE_SHARES = [
  { id: "0-9", label: "0–9", share: 5.7, family: false },
  { id: "10s", label: "10대", share: 8.8, family: false },
  { id: "20s", label: "20대", share: 11.7, family: false },
  { id: "30s", label: "30대", share: 13.5, family: true },
  { id: "40s", label: "40대", share: 14.8, family: true },
  { id: "50s", label: "50대", share: 16.7, family: false },
  { id: "60s", label: "60대", share: 15.3, family: false },
  { id: "70s", label: "70대", share: 8.6, family: false },
  { id: "80s", label: "80대", share: 4.1, family: false },
  { id: "90s", label: "90+", share: 0.7, family: false },
] as const;

export const REALTY_CENSUS_2025 = {
  asOf: "2025-11-01",
  published: "2026-07-28",
  source: "국가데이터처 2025년 인구주택총조사",
  people: 51_820_000,
  medianAge: 46.8,
  workShare: 69.2,
  workPeople: 35_870_000,
  oldShare: 20.7,
  childShare: 10.1,
  sudoShare: 50.9,
  single18: 29.6,
  married18: 56.3,
  single30: 54.7,
  single40: 21.9,
  seoulSingle: 37.1,
} as const;

export const REALTY_MARRY_2025 = {
  asOf: "2025",
  published: "2026-03",
  source: "국가데이터처 2025년 혼인·이혼 통계",
  count: 240_000,
  yoyPct: 8.1,
  crude: 4.7,
  firstAgeM: 33.9,
  firstAgeF: 31.6,
  /** 해당 연령 인구 1천 명당. 30대 초반이 남녀 모두 최고. */
  peakBand: "30–34",
  peakM: 53.9,
  peakF: 57.6,
} as const;

export const REALTY_BIRTH_AGE = {
  asOf: "2025",
  source: "국가데이터처 2025년 출생통계",
  mother: 33.8,
  first: 33.2,
  mother35Share: 37.3,
  /** 해당 연령 여자 1천 명당. 30대 초반이 최고. */
  peakBand: "30–34",
  peakRate: 73.1,
  late30Rate: 52.1,
} as const;

export const REALTY_HOUSING_COHORT = {
  asOf: "2024",
  source: "국토교통부 2024년도 주거실태조사",
  youth: "가구주 19–34세",
  newlywed: "혼인 7년 이하",
  youthOwn: 12.2,
  newlywedOwn: 43.9,
  generalOwn: 58.4,
  youthPir: 6.0,
  newlywedPir: 6.0,
  elderPir: 9.1,
  youthRir: 16.0,
  newlywedRir: 17.7,
  firstYears: 7.9,
  newlywedApt: 73.4,
  youthApt: 31.0,
  generalApt: 53.1,
  /** 최근 4년 이내 생애최초 가구주. 국토부 주거실태조사 표를 뉴시스가 인용. 7.9년과 기준이 다름. */
  firstAge: 46.4,
  firstAgeLow: 57.0,
} as const;

export const REALTY_COHORT_SLOTS = [
  {
    id: "buyer-age",
    label: "아파트 매입 연령대",
    need: "부동산원 월별 매입자연령대별. 등기정보광장은 긁지 않습니다.",
  },
  {
    id: "spend-age",
    label: "가구주 연령별 소비",
    need: "가계동향조사 KOSIS. 키·표 확인 전 칸.",
  },
] as const;

export function ageShareOf(id: (typeof REALTY_AGE_SHARES)[number]["id"]): number {
  return REALTY_AGE_SHARES.find((r) => r.id === id)?.share ?? 0;
}

/** 혼인·출산이 몰리는 30–40대 인구 비중. 공식 연령대 합. */
export function familyFormationShare(): number {
  return REALTY_AGE_SHARES.filter((r) => r.family).reduce((s, r) => s + r.share, 0);
}

export function modalAgeShare(): number {
  return Math.max(...REALTY_AGE_SHARES.map((r) => r.share));
}

export function modalAgeLabel(): string {
  const max = modalAgeShare();
  return REALTY_AGE_SHARES.find((r) => r.share === max)?.label ?? "";
}
