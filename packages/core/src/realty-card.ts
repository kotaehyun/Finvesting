// 카드 연체·결제성 리볼빙(리빙볼). 개별 카드사 실명 상품은 안 긁는다.
import dataFile from "../data/realty/card.json";
import { assertDefaults } from "./load-data";

assertDefaults(dataFile, "realty/card.json");


export const REALTY_CARD_LINKS = dataFile.links as typeof dataFile.links;

/** 금감원 2026년 상반기 여신전문금융회사 영업실적(잠정). 8개 전업카드사. */
export const REALTY_CARD_NPL = dataFile.npl as typeof dataFile.npl;

/**
 * 여신금융협회 9개 카드사 7월 말 잔액. 리볼빙=결제성 리볼빙 이월.
 * 비율은 카드론+현금서비스+리볼빙 합 대비.
 */
export const REALTY_REVOLVING = dataFile.revolving as typeof dataFile.revolving;

export function revolvingShareOfCardCredit(): number {
  const t = REALTY_REVOLVING.cardLoanEok + REALTY_REVOLVING.cashEok + REALTY_REVOLVING.revolveEok;
  return REALTY_REVOLVING.revolveEok / t;
}

export function cardLoanShareOfCardCredit(): number {
  const t = REALTY_REVOLVING.cardLoanEok + REALTY_REVOLVING.cashEok + REALTY_REVOLVING.revolveEok;
  return REALTY_REVOLVING.cardLoanEok / t;
}

export function eokToJo1(eok: number): number {
  return eok / 10_000;
}
