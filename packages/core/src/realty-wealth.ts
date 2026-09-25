// 고액 자산은 분위·세금 유형으로만. 연예인·임원·사적 자산가 실명은 넣지 않는다.
// 사유재산·과세정보 비밀. 이동은 채널(법인·증여·상속·신탁) 집계.
import dataFile from "../data/realty/wealth.json";
import { assertDefaults } from "./load-data";

assertDefaults(dataFile, "realty/wealth.json");


export type RealtyWealthPut = "in" | "slot" | "never";

export type RealtyWealthMethod = {
  id: string;
  label: string;
  put: RealtyWealthPut;
  putLabel: string;
  how: string;
};

export const REALTY_WEALTH_LINKS = dataFile.REALTY_WEALTH_LINKS;

export const REALTY_WEALTH_PRIVACY = dataFile.REALTY_WEALTH_PRIVACY;

/** 2025 가계금융복지조사. 3월 말. 10분위 평균 순자산은 보도가 원문 표를 인용. */
export const REALTY_WEALTH_SHARE = dataFile.REALTY_WEALTH_SHARE;

export const REALTY_WEALTH_GIFT = dataFile.REALTY_WEALTH_GIFT;

/** 전업 부동산신탁사. 개인 명의신탁·연예인 은닉이 아님. */
export const REALTY_WEALTH_TRUST = dataFile.REALTY_WEALTH_TRUST;

export const REALTY_WEALTH_METHODS: readonly RealtyWealthMethod[] = dataFile.REALTY_WEALTH_METHODS as readonly RealtyWealthMethod[];

export function wealthTopShare(): number {
  return REALTY_WEALTH_SHARE.topShare;
}

export function giftTaxShareOfEstate(): number {
  const t = REALTY_WEALTH_GIFT.inheritTaxEok + REALTY_WEALTH_GIFT.giftTaxEok;
  return REALTY_WEALTH_GIFT.giftTaxEok / t;
}

export function realtyTrustShareOfAll(): number {
  return REALTY_WEALTH_TRUST.realtyJo / REALTY_WEALTH_TRUST.allJo;
}
