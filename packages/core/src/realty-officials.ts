// 공직자윤리법 재산공개. 사적 자산가·재벌 명단은 공식 공개가 아니라 넣지 않는다.
// 공직윤리시스템·관보를 긁지 않는다. 집계는 인사혁신처 보도, 주택 방향은 관보를 인용한 확인분.

import type { RealtyMetroId } from "./realty-loans";

export const REALTY_OFFICIAL_ASSET = {
  asOf: "2025-12-31",
  published: "2026-03-26",
  source: "정부공직자윤리위원회 2026년 정기 재산변동사항",
  url: "https://www.mpm.go.kr/mpm/comm/newsPress/newsPressRelease/?cntId=4229&mode=view",
  peti: "https://www.peti.go.kr/peOptpListVie.do",
  gwanbo: "https://gwanbo.go.kr/user/search/searchThema.do?tabType=1",
  count: 1903,
  /** 만원. 보도 원문 20억 9,563만 원 */
  avgMan: 209_563,
  prevAvgMan: 194_693,
  deltaMan: 14_870,
  selfMan: 115_212,
  spouseMan: 76_112,
  kinMan: 18_239,
  up: 1449,
  upPct: 76.1,
  down: 454,
  downPct: 23.9,
  /** 만원. 공시가 등 가액변동 */
  appraisalMan: 3926,
  appraisalPct: 26.4,
  /** 만원. 저축·주식 등 순재산 */
  netMan: 10_944,
  netPct: 73.6,
} as const;

export type RealtyOfficialFlow = "capital-away" | "split" | "none";

export type RealtyOfficialHouse = {
  office: string;
  name: string;
  metro: RealtyMetroId;
  metroLabel: string;
  house: string;
  title: "본인·배우자 공동" | "배우자" | "없음";
  flow: RealtyOfficialFlow;
  flowLabel: string;
};

/** 관할 광역이 아닌 서울·경기에 주택이 있는 광역단체장. 관보 2026-03-26, 동·면까지. */
export const REALTY_OFFICIAL_HOUSES: readonly RealtyOfficialHouse[] = [
  {
    office: "강원지사",
    name: "김진태",
    metro: "gangwon",
    metroLabel: "강원",
    house: "서울 강남 대치동 아파트",
    title: "본인·배우자 공동",
    flow: "capital-away",
    flowLabel: "관할 밖 수도권",
  },
  {
    office: "세종시장",
    name: "최민호",
    metro: "sejong",
    metroLabel: "세종",
    house: "서울 마포 신공덕동 아파트 · 세종 연동면 단독",
    title: "본인·배우자 공동",
    flow: "split",
    flowLabel: "관할 + 수도권",
  },
  {
    office: "전남지사",
    name: "김영록",
    metro: "jeonnam",
    metroLabel: "전남",
    house: "서울 용산 용산동5가 아파트",
    title: "본인·배우자 공동",
    flow: "capital-away",
    flowLabel: "관할 밖 수도권",
  },
  {
    office: "경기지사",
    name: "김동연",
    metro: "gyeonggi",
    metroLabel: "경기",
    house: "서울 강남 도곡동 아파트",
    title: "배우자",
    flow: "capital-away",
    flowLabel: "관할 밖 수도권",
  },
  {
    office: "전북지사",
    name: "김관영",
    metro: "jeonbuk",
    metroLabel: "전북",
    house: "경기 성남 분당 백현동 아파트",
    title: "배우자",
    flow: "capital-away",
    flowLabel: "관할 밖 수도권",
  },
  {
    office: "충남지사",
    name: "김태흠",
    metro: "chungnam",
    metroLabel: "충남",
    house: "경기 성남 분당 이매동 단독 · 충남 보령 웅천읍 단독",
    title: "배우자",
    flow: "split",
    flowLabel: "관할 + 수도권",
  },
  {
    office: "경북지사",
    name: "이철우",
    metro: "gyeongbuk",
    metroLabel: "경북",
    house: "무주택",
    title: "없음",
    flow: "none",
    flowLabel: "무주택",
  },
];

export const REALTY_OFFICIAL_METRO_HEADS = 16;

export const REALTY_OFFICIAL_FLOW_ROWS = [
  {
    id: "capital-away",
    label: "관할 밖 수도권만",
    count: 4,
    note: "강원·전남·경기·전북. 소속 광역이 아닌 서울·경기 주택만.",
  },
  {
    id: "split",
    label: "관할 + 수도권 각 1",
    count: 2,
    note: "최민호·김태흠. 보도는 수도권 다주택은 아니라고 함.",
  },
  {
    id: "none",
    label: "무주택",
    count: 1,
    note: "이철우 경북지사.",
  },
  {
    id: "rest",
    label: "나머지 광역단체장",
    count: 9,
    note: "1주택으로 보도. 소재지가 관할인지는 원문(관보)에서만.",
  },
] as const;

export function realtyOfficialCapitalAwayCount(): number {
  return REALTY_OFFICIAL_HOUSES.filter((h) => h.flow === "capital-away" || h.flow === "split").length;
}

export function realtyOfficialSplitCount(): number {
  return REALTY_OFFICIAL_HOUSES.filter((h) => h.flow === "split").length;
}

/** 만원 → 억·만 표기. 음수는 앞에 −. */
export function formatManwon(man: number): string {
  const sign = man < 0 ? "−" : "";
  const n = Math.abs(Math.round(man));
  const eok = Math.floor(n / 10_000);
  const rest = n % 10_000;
  if (eok === 0) return `${sign}${rest.toLocaleString("ko-KR")}만 원`;
  if (rest === 0) return `${sign}${eok.toLocaleString("ko-KR")}억 원`;
  return `${sign}${eok.toLocaleString("ko-KR")}억 ${rest.toLocaleString("ko-KR")}만 원`;
}
