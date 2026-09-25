// 평균의 함정. 인구 최빈은 50대, 혼인·출산·신혼 주택은 30대 초반.
// 총조사·혼인·출생·주거실태조사 공표만. 등기정보광장·포털은 긁지 않는다.
import dataFile from "../data/realty/cohort.json";
import { assertDefaults } from "./load-data";

assertDefaults(dataFile, "realty/cohort.json");


export const REALTY_COHORT_LINKS = dataFile.REALTY_COHORT_LINKS;

/** 2025 인구주택총조사(등록센서스) 연령대 비중 %. 50대가 최빈. */
export const REALTY_AGE_SHARES = dataFile.REALTY_AGE_SHARES as readonly {
  id: string;
  label: string;
  share: number;
  family?: boolean;
}[];

export const REALTY_CENSUS_2025 = dataFile.REALTY_CENSUS_2025;

export const REALTY_MARRY_2025 = dataFile.REALTY_MARRY_2025;

export const REALTY_BIRTH_AGE = dataFile.REALTY_BIRTH_AGE;

export const REALTY_HOUSING_COHORT = dataFile.REALTY_HOUSING_COHORT;

export const REALTY_COHORT_SLOTS = dataFile.REALTY_COHORT_SLOTS;

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
