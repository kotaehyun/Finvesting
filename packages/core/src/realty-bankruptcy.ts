// 개인회생·파산은 법원통계월보 신청 건수, 파탄원인은 서울회생법원 중복응답.
// 주담대 전용 비중·미수금 일별 잔액·면책률은 공표 칸.
import dataFile from "../data/realty/bankruptcy.json";
import { assertDefaults } from "./load-data";

assertDefaults(dataFile, "realty/bankruptcy.json");


export type BankruptcyCause = {
  id: "living" | "income" | "business" | "invest";
  label: string;
  share: number;
  description: string;
};

/** 서울회생법원 2025 상반기 개인파산 파탄원인. 복수 응답이라 합이 100이 아니다. 주담대 항목 없음. */
export const REALTY_BANKRUPTCY_CAUSES: readonly BankruptcyCause[] = dataFile.causes as readonly BankruptcyCause[];

export const REALTY_INSOLVENCY_STATS = dataFile.stats as typeof dataFile.stats;

export const REALTY_INSOLVENCY_LINKS = dataFile.links as typeof dataFile.links;

export const REALTY_INSOLVENCY_SLOTS = dataFile.slots as typeof dataFile.slots;

export function insolvencyFiledTotal(): number {
  return REALTY_INSOLVENCY_STATS.rehabilitationFiled + REALTY_INSOLVENCY_STATS.bankruptcyFiled;
}

export function rehabilitationYoyPct(): number {
  const s = REALTY_INSOLVENCY_STATS;
  return ((s.rehabilitationFiled - s.rehabilitationFiledPrev) / s.rehabilitationFiledPrev) * 100;
}
