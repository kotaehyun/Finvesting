// 공실 정의·빈집 유형, 상환·경매, 영끌 고위험, 임대업(꼬마·중형 빌딩) 부채, 상권 수익률.
// 포털 급매·민간 경매 유찰률·상권정보시스템 매출은 긁지 않는다.
import dataFile from "../data/realty/distress.json";
import { assertDefaults } from "./load-data";

assertDefaults(dataFile, "realty/distress.json");


export const REALTY_DISTRESS_LINKS = dataFile.REALTY_DISTRESS_LINKS;

/** 부동산원 공실. 자가·무상임대는 공실이 아님. 법인이 채워도 공실률이 내려간다. */
export const REALTY_VACANCY_DEF = dataFile.REALTY_VACANCY_DEF;

/** 2025 주택총조사 유형별 미거주 비중 %. 아파트가 가장 낮음. */
export const REALTY_EMPTY_BY_TYPE = dataFile.REALTY_EMPTY_BY_TYPE as readonly {
  id: string;
  share: number;
  label?: string;
}[];

export const REALTY_HH_NPL = dataFile.REALTY_HH_NPL;

/** 꼬마·중형 빌딩 전용이 아니라 기업 부동산업 대출. */
export const REALTY_CRE_NPL = dataFile.REALTY_CRE_NPL;

export const REALTY_RTI = dataFile.REALTY_RTI;

/** 영끌 공식 명칭은 없음. 한은 고위험가구(DSR>40%·DTA>100%)의 청년 비중. */
export const REALTY_YOUNG_LEVERAGE = dataFile.REALTY_YOUNG_LEVERAGE;

export const REALTY_AUCTION = dataFile.REALTY_AUCTION;

export const REALTY_CRE_YIELD = dataFile.REALTY_CRE_YIELD;

export const REALTY_DISTRESS_SLOTS = dataFile.REALTY_DISTRESS_SLOTS;

export function emptyAptShare(): number {
  return REALTY_EMPTY_BY_TYPE.find((r) => r.id === "apt")?.share ?? 0;
}

export function auctionYoyPct(): number {
  return ((REALTY_AUCTION.filed - REALTY_AUCTION.filed2024) / REALTY_AUCTION.filed2024) * 100;
}
