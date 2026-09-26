// 국세 집계로 본 고가주택 소재 경향. 개인 납세·자산 조회는 세법상 불가.
// 고위공직자를 집계에서 뺄 수 없다. 종부세 고지는 기재부, 표는 국세통계포털(TASIS).
import dataFile from "../data/realty/nts.json";
import { assertDefaults } from "./load-data";

assertDefaults(dataFile, "realty/nts.json");


import { shareOf, type RealtyMetroId } from "./realty-loans";

export const REALTY_NTS_CGT = dataFile.REALTY_NTS_CGT;

export type RealtyNtsMetroRow = {
  id: RealtyMetroId;
  label: string;
  prev: number;
  now: number;
  yoyPct: number;
};

/** 주택분 종부세 과세인원. 기재부가 수치를 밝힌 수도권 3곳만. 나머지 시도는 원문 참고 2. */
export const REALTY_NTS_CGT_METROS: readonly RealtyNtsMetroRow[] = dataFile.REALTY_NTS_CGT_METROS as readonly RealtyNtsMetroRow[];

export const REALTY_NTS_TRANSFER_NOTE = dataFile.REALTY_NTS_TRANSFER_NOTE;

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
