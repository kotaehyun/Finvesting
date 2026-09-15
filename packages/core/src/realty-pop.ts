// 행정안전부 인구감소지역(2021.10 지정 89) · 관심지역(고시 제2025-78호, 2026-01-01 시행 18).
// 원문: mois.go.kr 인구감소지역 지정. 지정은 고시로 바뀌니 매수 전 원문.
// 합계출산율은 세계은행 SP.DYN.TFRT.IN (키 없음). 시도별·국내이동은 통계청 키 후.

import { REALTY_METROS, type RealtyMetroId } from "./realty-loans";

export type RealtyPopPlace = { metro: RealtyMetroId; label: string };

export const REALTY_POP_DECLINE: readonly RealtyPopPlace[] = [
  { metro: "busan", label: "부산 동구" },
  { metro: "busan", label: "부산 서구" },
  { metro: "busan", label: "부산 영도구" },
  { metro: "daegu", label: "대구 남구" },
  { metro: "daegu", label: "대구 서구" },
  { metro: "daegu", label: "대구 군위군" },
  { metro: "incheon", label: "인천 강화군" },
  { metro: "incheon", label: "인천 옹진군" },
  { metro: "gyeonggi", label: "경기 가평군" },
  { metro: "gyeonggi", label: "경기 연천군" },
  { metro: "gangwon", label: "강원 고성군" },
  { metro: "gangwon", label: "강원 삼척시" },
  { metro: "gangwon", label: "강원 양구군" },
  { metro: "gangwon", label: "강원 양양군" },
  { metro: "gangwon", label: "강원 영월군" },
  { metro: "gangwon", label: "강원 정선군" },
  { metro: "gangwon", label: "강원 철원군" },
  { metro: "gangwon", label: "강원 태백시" },
  { metro: "gangwon", label: "강원 평창군" },
  { metro: "gangwon", label: "강원 홍천군" },
  { metro: "gangwon", label: "강원 화천군" },
  { metro: "gangwon", label: "강원 횡성군" },
  { metro: "chungbuk", label: "충북 괴산군" },
  { metro: "chungbuk", label: "충북 단양군" },
  { metro: "chungbuk", label: "충북 보은군" },
  { metro: "chungbuk", label: "충북 영동군" },
  { metro: "chungbuk", label: "충북 옥천군" },
  { metro: "chungbuk", label: "충북 제천시" },
  { metro: "chungnam", label: "충남 공주시" },
  { metro: "chungnam", label: "충남 금산군" },
  { metro: "chungnam", label: "충남 논산시" },
  { metro: "chungnam", label: "충남 보령시" },
  { metro: "chungnam", label: "충남 부여군" },
  { metro: "chungnam", label: "충남 서천군" },
  { metro: "chungnam", label: "충남 예산군" },
  { metro: "chungnam", label: "충남 청양군" },
  { metro: "chungnam", label: "충남 태안군" },
  { metro: "jeonbuk", label: "전북 고창군" },
  { metro: "jeonbuk", label: "전북 김제시" },
  { metro: "jeonbuk", label: "전북 남원시" },
  { metro: "jeonbuk", label: "전북 무주군" },
  { metro: "jeonbuk", label: "전북 부안군" },
  { metro: "jeonbuk", label: "전북 순창군" },
  { metro: "jeonbuk", label: "전북 임실군" },
  { metro: "jeonbuk", label: "전북 장수군" },
  { metro: "jeonbuk", label: "전북 정읍시" },
  { metro: "jeonbuk", label: "전북 진안군" },
  { metro: "jeonnam", label: "전남 강진군" },
  { metro: "jeonnam", label: "전남 고흥군" },
  { metro: "jeonnam", label: "전남 곡성군" },
  { metro: "jeonnam", label: "전남 구례군" },
  { metro: "jeonnam", label: "전남 담양군" },
  { metro: "jeonnam", label: "전남 보성군" },
  { metro: "jeonnam", label: "전남 신안군" },
  { metro: "jeonnam", label: "전남 영광군" },
  { metro: "jeonnam", label: "전남 영암군" },
  { metro: "jeonnam", label: "전남 완도군" },
  { metro: "jeonnam", label: "전남 장성군" },
  { metro: "jeonnam", label: "전남 장흥군" },
  { metro: "jeonnam", label: "전남 진도군" },
  { metro: "jeonnam", label: "전남 함평군" },
  { metro: "jeonnam", label: "전남 해남군" },
  { metro: "jeonnam", label: "전남 화순군" },
  { metro: "gyeongbuk", label: "경북 고령군" },
  { metro: "gyeongbuk", label: "경북 문경시" },
  { metro: "gyeongbuk", label: "경북 봉화군" },
  { metro: "gyeongbuk", label: "경북 상주시" },
  { metro: "gyeongbuk", label: "경북 성주군" },
  { metro: "gyeongbuk", label: "경북 안동시" },
  { metro: "gyeongbuk", label: "경북 영덕군" },
  { metro: "gyeongbuk", label: "경북 영양군" },
  { metro: "gyeongbuk", label: "경북 영주시" },
  { metro: "gyeongbuk", label: "경북 영천시" },
  { metro: "gyeongbuk", label: "경북 울릉군" },
  { metro: "gyeongbuk", label: "경북 울진군" },
  { metro: "gyeongbuk", label: "경북 의성군" },
  { metro: "gyeongbuk", label: "경북 청도군" },
  { metro: "gyeongbuk", label: "경북 청송군" },
  { metro: "gyeongnam", label: "경남 거창군" },
  { metro: "gyeongnam", label: "경남 고성군" },
  { metro: "gyeongnam", label: "경남 남해군" },
  { metro: "gyeongnam", label: "경남 밀양시" },
  { metro: "gyeongnam", label: "경남 산청군" },
  { metro: "gyeongnam", label: "경남 의령군" },
  { metro: "gyeongnam", label: "경남 창녕군" },
  { metro: "gyeongnam", label: "경남 하동군" },
  { metro: "gyeongnam", label: "경남 함안군" },
  { metro: "gyeongnam", label: "경남 함양군" },
  { metro: "gyeongnam", label: "경남 합천군" },
];

export const REALTY_POP_WATCH: readonly RealtyPopPlace[] = [
  { metro: "daejeon", label: "대전 동구" },
  { metro: "incheon", label: "인천 동구" },
  { metro: "busan", label: "부산 중구" },
  { metro: "busan", label: "부산 금정구" },
  { metro: "gwangju", label: "광주 동구" },
  { metro: "gyeongnam", label: "경남 통영시" },
  { metro: "gangwon", label: "강원 강릉시" },
  { metro: "gangwon", label: "강원 동해시" },
  { metro: "daejeon", label: "대전 중구" },
  { metro: "gyeongbuk", label: "경북 경주시" },
  { metro: "gyeongnam", label: "경남 사천시" },
  { metro: "gyeongbuk", label: "경북 김천시" },
  { metro: "daejeon", label: "대전 대덕구" },
  { metro: "gangwon", label: "강원 인제군" },
  { metro: "jeonbuk", label: "전북 익산시" },
  { metro: "gyeonggi", label: "경기 동두천시" },
  { metro: "gangwon", label: "강원 속초시" },
  { metro: "gyeonggi", label: "경기 포천시" },
];

export const WB_TFR_STAT = "SP.DYN.TFRT.IN";
export const WB_TFR_KR = "WB_TFR_KR";

export function realtyPopDeclineCount(): number {
  return REALTY_POP_DECLINE.length;
}

export function realtyPopWatchCount(): number {
  return REALTY_POP_WATCH.length;
}

export function realtyPopDeclineByMetro(): { id: RealtyMetroId; label: string; places: readonly string[] }[] {
  return REALTY_METROS.map((m) => ({
    id: m.id,
    label: m.label,
    places: REALTY_POP_DECLINE.filter((p) => p.metro === m.id).map((p) => p.label),
  })).filter((r) => r.places.length);
}

export const REALTY_MOVE_NOTE =
  "시도 순이동(전입−전출)은 통계청 국내인구이동통계입니다. 세계은행 순이동은 국가 단위라 시·도와 다릅니다.";

/** 국가데이터처 2025년 출생통계 확정. 정책브리핑 2026-08-26. 세계은행 연간과 값이 다를 수 있음. */
export const REALTY_TFR_KOSTAT = {
  asOf: "2025",
  published: "2026-08-26",
  source: "국가데이터처 2025년 출생통계 확정",
  url: "https://www.korea.kr/news/policyNewsView.do?newsId=148970652",
  births: 254_341,
  national: [
    { year: 2023, tfr: 0.72 },
    { year: 2024, tfr: 0.75 },
    { year: 2025, tfr: 0.8 },
  ],
  metros: [
    { id: "jeonnam" as const, label: "전남", tfr: 1.09 },
    { id: "sejong" as const, label: "세종", tfr: 1.06 },
    { id: "chungbuk" as const, label: "충북", tfr: 0.96 },
    { id: "gwangju" as const, label: "광주", tfr: 0.76 },
    { id: "busan" as const, label: "부산", tfr: 0.74 },
    { id: "seoul" as const, label: "서울", tfr: 0.63 },
  ],
} as const;

/** 국가데이터처 2025년 국내인구이동통계. 정책브리핑 2026-01-29. 시도 전입·전출 인원은 보도 원문 표가 없어 율·권역만. */
export const REALTY_MOVE_2025 = {
  asOf: "2025",
  published: "2026-01-29",
  source: "국가데이터처 2025년 국내인구이동통계",
  url: "https://www.korea.kr/news/policyNewsView.do?newsId=156741997",
  movers: 6_118_000,
  ratePct: 12.0,
  housingSharePct: 33.7,
  seoulFromGgPct: 53.8,
  seoulToGgPct: 59.5,
  sejongNet: -47,
  regions: [
    { id: "sudo", label: "수도권", net: 38_000 },
    { id: "jungbu", label: "중부권", net: 20_000 },
    { id: "honam", label: "호남권", net: -16_000 },
    { id: "yeongnam", label: "영남권", net: -39_000 },
  ],
  rates: [
    { id: "incheon" as const, label: "인천", rate: 1.1 },
    { id: "chungbuk" as const, label: "충북", rate: 0.7 },
    { id: "chungnam" as const, label: "충남", rate: 0.4 },
    { id: "ulsan" as const, label: "울산", rate: -0.5 },
    { id: "jeju" as const, label: "제주", rate: -0.6 },
    { id: "gwangju" as const, label: "광주", rate: -1.0 },
  ],
} as const;

export const REALTY_JEONSE_SLOTS = [
  {
    id: "share",
    label: "전세자금대출 비중",
    need: "가계대출 대비 전세자금. ECOS·금감원 통계코드 확인 후. 지금은 칸만.",
  },
  {
    id: "hug",
    label: "전세보증사고",
    need: "주택도시보증공사(HUG) 공개통계. 사이트를 긁지 않습니다.",
  },
  {
    id: "rule",
    label: "전세대출 규제",
    need: "금융위 10.15: 1주택자 수도권·규제지역 전세대출은 DSR. 전세대출 있으면 투기과열 3억 초과 아파트 취득 제한.",
  },
] as const;
