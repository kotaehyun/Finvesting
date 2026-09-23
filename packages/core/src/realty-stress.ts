// 공실·빈집·소득 대비 주택 부담. 급매·개인 압류는 공식 시계열이 없어 칸+원문.
// 상업용 공실은 한국부동산원 임대동향, 빈집은 주택총조사, PIR은 주거실태조사, 지니는 가계금융복지조사.
import dataFile from "../data/realty/stress.json";
import { assertDataFile } from "./load-data";

assertDataFile(dataFile as any, "realty/stress.json");


import { REALTY_METROS, type RealtyMetroId } from "./realty-loans";

export const REALTY_STRESS_LINKS = (dataFile as any).exports.REALTY_STRESS_LINKS;

export const REALTY_VACANCY = (dataFile as any).exports.REALTY_VACANCY;

export const REALTY_EMPTY = (dataFile as any).exports.REALTY_EMPTY;

export const REALTY_PIR = (dataFile as any).exports.REALTY_PIR;

export const REALTY_GINI = (dataFile as any).exports.REALTY_GINI;

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


export const REALTY_STRESS_METROS: readonly RealtyStressMetro[] = (dataFile as any).exports.REALTY_STRESS_METROS;

export const REALTY_KR_VACANCY = (dataFile as any).exports.REALTY_KR_VACANCY;

export const REALTY_CAPITAL_IDS: readonly RealtyMetroId[] = (dataFile as any).exports.REALTY_CAPITAL_IDS;

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

export const INCOME_HOUSING_TONE_LABEL: Record<IncomeHousingTone, string> = (dataFile as any).exports.INCOME_HOUSING_TONE_LABEL;

export function fmtRate(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function fmtDeltaPp(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%p`;
}
