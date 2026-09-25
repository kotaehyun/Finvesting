// 전월세: 점유(주거실태)와 거래(국토부 주택통계). 포털 매물은 안 긁는다.
import dataFile from "../data/realty/tenure.json";
import { assertDefaults } from "./load-data";

assertDefaults(dataFile, "realty/tenure.json");


export const REALTY_TENURE_LINKS = dataFile.REALTY_TENURE_LINKS;

/** 국토부 2024 주거실태조사. 임차=전세+월세(보증부 포함). 전세만의 전국 칸은 원문 표. */
export const REALTY_TENURE = dataFile.REALTY_TENURE;

/** 국토부 2026년 7월 주택통계. 1–7월 누계 전월세 거래 중 월세(보증부·반전세 포함). */
export const REALTY_LEASE_TRADE = dataFile.REALTY_LEASE_TRADE;

export function leaseJulyWolseShare(): number {
  return REALTY_LEASE_TRADE.julyWolse / REALTY_LEASE_TRADE.julyDeals;
}

export function tenureRentShare(): number {
  return REALTY_TENURE.rent;
}
