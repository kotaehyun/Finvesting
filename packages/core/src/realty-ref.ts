// 수도권 권역·규제지역·대출 위험. 숫자는 공공데이터 키가 없으면 안 넣는다.
// 과밀억제권역 시 목록은 수도권정비계획법 시행령 별표1 요약. 동·산업단지 제외는 법령 원문.
// 투기과열·조정대상·토허 시·구는 정책브리핑 고시 요약. 지정은 바뀌니 매수 전 원문.
import dataFile from "../data/realty/ref.json";
import { assertDataFile } from "./load-data";

assertDataFile(dataFile as any, "realty/ref.json");


export type RealtyZoneId = "overcrowded" | "growth" | "nature";

export type RealtyZone = {
  id: RealtyZoneId;
  label: string;
  summary: string;
  places: readonly string[];
};

export const REALTY_ZONES: readonly RealtyZone[] = (dataFile as any).exports.REALTY_ZONES;

export type RealtyTone = "info" | "warn" | "danger";

export type RealtyRegulatedPlace = {
  id: string;
  label: string;
  /** 지정 효력일 (정책브리핑) */
  since: "2025-10-16" | "2026-07-01";
};

/** 서울 25구 전역. 10.15 대책, 효력 2025-10-16. */
export const REALTY_REGULATED_SEOUL = (dataFile as any).exports.REALTY_REGULATED_SEOUL as {
  id: string;
  label: string;
  since: "2025-10-16" | "2026-07-01";
  summary: string;
};

/**
 * 경기 규제 시·구. 10.15 대책 12곳 + 2026-06-30 보도 3곳.
 * 수원 권선·화성 전체·용인 처인은 이 목록에 없음.
 */
export const REALTY_REGULATED_GYEONGGI: readonly RealtyRegulatedPlace[] = (dataFile as any).exports.REALTY_REGULATED_GYEONGGI;

export const REALTY_REGULATED_NOTE = (dataFile as any).exports.REALTY_REGULATED_NOTE as string;

export type RealtyLoanRisk = {
  id: string;
  label: string;
  detail: string;
  tone: RealtyTone;
};

/** 금융위 2025-10-15 대출수요 관리 방안 요약. 개인 한도 계산기가 아님. */
export const REALTY_LOAN_RISKS: readonly RealtyLoanRisk[] = (dataFile as any).exports.REALTY_LOAN_RISKS;

export const REALTY_MIND = (dataFile as any).exports.REALTY_MIND as any;

export function realtyRegulatedGyeonggiCount(): number {
  return REALTY_REGULATED_GYEONGGI.length;
}

export function realtyFreshRegulated(): readonly RealtyRegulatedPlace[] {
  return REALTY_REGULATED_GYEONGGI.filter((p) => p.since === "2026-07-01");
}

export const REALTY_REF_LINKS = (dataFile as any).exports.REALTY_REF_LINKS as readonly {
  id: string;
  label: string;
  url: string;
}[];

/** 포털 매물 호수는 안 긁는다. 칸은 국토부 실거래 건수·중위가(키 후). */
export const REALTY_LISTING_TYPES = (dataFile as any).exports.REALTY_LISTING_TYPES as readonly { id: string; label: string; molit: string; need: string }[];

export const REALTY_METRIC_SLOTS = (dataFile as any).exports.REALTY_METRIC_SLOTS as readonly { id: string; label: string; need: string }[];
