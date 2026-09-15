// 국세 집계로 본 고가주택 소재 경향. 개인 납세·자산 조회는 세법상 불가.
// 고위공직자를 집계에서 뺄 수 없다. 종부세 고지는 기재부, 표는 국세통계포털(TASIS).

import { shareOf, type RealtyMetroId } from "./realty-loans";

export const REALTY_NTS_CGT = {
  asOf: "2025-06-01",
  published: "2025-11-26",
  source: "기획재정부 2025년도 종합부동산세 고지",
  url: "https://eiec.kdi.re.kr/policy/materialView.do?num=273945",
  yonhap: "https://www.yna.co.kr/view/AKR20251126121900002",
  nts: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7733&mi=40375",
  tasis: "https://tasis.nts.go.kr/",
  transfer: "https://www.data.go.kr/data/15118234/fileData.do",
  luxury: "https://www.data.go.kr/data/15118939/fileData.do",
  housingPeople: 540_000,
  housingTaxEok: 17_000,
  housingYoyPeople: 80_000,
  housingYoyPct: 17.3,
  housingTaxYoyPct: 6.3,
  totalPeople: 629_000,
  totalTaxEok: 53_000,
  totalYoyPct: 14.8,
  totalTaxYoyPct: 6.1,
  landPeople: 110_000,
  personalPeople: 481_000,
  personalYoyPct: 19.9,
  personalTaxEok: 7_718,
  personalTaxYoyPct: 32.5,
  singlePeople: 151_000,
  singleYoyPct: 17.8,
  singleTaxEok: 1_679,
  multiPeople: 330_000,
  multiYoyPct: 20.9,
  multiTaxEok: 6_039,
  corpPeople: 59_000,
  corpPeopleDelta: -146,
  corpYoyPct: -0.2,
  corpTaxEok: 9_000,
  corpTaxDeltaEok: -883,
  corpTaxYoyPct: -8.6,
  /** 개인 1인당 평균 고지세액. 원 */
  avgWon: 1_606_000,
  sudoSharePct: 83.7,
  seoulSharePct: 60.7,
} as const;

export type RealtyNtsMetroRow = {
  id: RealtyMetroId;
  label: string;
  prev: number;
  now: number;
  yoyPct: number;
};

/** 주택분 종부세 과세인원. 기재부가 수치를 밝힌 수도권 3곳만. 나머지 시도는 원문 참고 2. */
export const REALTY_NTS_CGT_METROS: readonly RealtyNtsMetroRow[] = [
  { id: "seoul", label: "서울", prev: 269_000, now: 328_000, yoyPct: 21.0 },
  { id: "gyeonggi", label: "경기", prev: 96_000, now: 113_000, yoyPct: 15.7 },
  { id: "incheon", label: "인천", prev: 9_000, now: 11_000, yoyPct: 19.0 },
];

export const REALTY_NTS_TRANSFER_NOTE =
  "양도소득세·고가주택(12억 초과) 양도는 국세청 TASIS·data.go.kr 표(부동산소재지)에 있습니다. 사이트는 긁지 않아 칸만 둡니다. 물건지이지 납세자 이주가 아닙니다.";

export function ntsCgtDelta(row: RealtyNtsMetroRow): number {
  return row.now - row.prev;
}

export function ntsCgtShare(now: number): number | null {
  return shareOf(now, REALTY_NTS_CGT.housingPeople);
}

export function ntsCgtSudoNow(): number {
  return REALTY_NTS_CGT_METROS.reduce((s, r) => s + r.now, 0);
}

export function ntsCgtSudoDelta(): number {
  return REALTY_NTS_CGT_METROS.reduce((s, r) => s + ntsCgtDelta(r), 0);
}

export function ntsCgtRestDelta(): number {
  return REALTY_NTS_CGT.housingYoyPeople - ntsCgtSudoDelta();
}

export function ntsCgtSeoulOfGrowth(): number | null {
  const seoul = REALTY_NTS_CGT_METROS.find((r) => r.id === "seoul");
  if (!seoul) return null;
  return shareOf(ntsCgtDelta(seoul), REALTY_NTS_CGT.housingYoyPeople);
}

/** 토지분 세액 = 전체 − 주택분. 조 단위 반올림(5.3−1.7). */
export function ntsCgtLandTaxEok(): number {
  return REALTY_NTS_CGT.totalTaxEok - REALTY_NTS_CGT.housingTaxEok;
}

export function ntsCgtCorpPeopleShare(): number | null {
  return shareOf(REALTY_NTS_CGT.corpPeople, REALTY_NTS_CGT.housingPeople);
}

export function ntsCgtCorpTaxShare(): number | null {
  return shareOf(REALTY_NTS_CGT.corpTaxEok, REALTY_NTS_CGT.housingTaxEok);
}

/** 고지세액(억) / 인원 → 원. */
export function ntsCgtWonPerHead(taxEok: number, people: number): number | null {
  if (!Number.isFinite(taxEok) || !Number.isFinite(people) || people === 0) return null;
  return (taxEok * 100_000_000) / people;
}

/** 명 → 만 명. 만 미만은 명. */
export function fmtManPeople(n: number): string {
  const sign = n < 0 ? "−" : "";
  const abs = Math.abs(n);
  if (abs >= 10_000) {
    const man = abs / 10_000;
    const s = Number.isInteger(man) ? String(man) : man.toFixed(1).replace(/\.0$/, "");
    return `${sign}${s}만 명`;
  }
  return `${sign}${abs.toLocaleString("ko-KR")}명`;
}

export function fmtPct(p: number | null, digits = 1): string {
  if (p == null || !Number.isFinite(p)) return "—";
  return `${(p * 100).toFixed(digits)}%`;
}
