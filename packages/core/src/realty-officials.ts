// 공직자윤리법 재산공개. 사적 자산가·재벌 명단은 공식 공개가 아니라 넣지 않는다.
// 공직윤리시스템·관보를 긁지 않는다. 집계는 인사혁신처 보도, 주택 방향은 관보를 인용한 확인분.
import dataFile from "../data/realty/officials.json";
import { assertDataFile } from "./load-data";

assertDataFile(dataFile as any, "realty/officials.json");


import type { RealtyMetroId } from "./realty-loans";

export const REALTY_OFFICIAL_ASSET = (dataFile as any).exports.REALTY_OFFICIAL_ASSET as any;

export type RealtyOfficialFlow = "capital-away" | "split" | "none";

export type RealtyOfficialHouse = {
  office: string;
  name: string;
  metro: RealtyMetroId;
  metroLabel: string;
  house: string;
  title: "본인·배우자 공동" | "배우자" | "없음";
  flow: RealtyOfficialFlow;
  flowLabel: string;
};

/** 관할 광역이 아닌 서울·경기에 주택이 있는 광역단체장. 관보 2026-03-26, 동·면까지. */
export const REALTY_OFFICIAL_HOUSES: readonly RealtyOfficialHouse[] = (dataFile as any).exports.REALTY_OFFICIAL_HOUSES as any;

export const REALTY_OFFICIAL_METRO_HEADS = (dataFile as any).exports.REALTY_OFFICIAL_METRO_HEADS as any;

export const REALTY_OFFICIAL_FLOW_ROWS = (dataFile as any).exports.REALTY_OFFICIAL_FLOW_ROWS as any;

export function realtyOfficialCapitalAwayCount(): number {
  return REALTY_OFFICIAL_HOUSES.filter((h) => h.flow === "capital-away" || h.flow === "split").length;
}

export function realtyOfficialSplitCount(): number {
  return REALTY_OFFICIAL_HOUSES.filter((h) => h.flow === "split").length;
}

/** 만원 → 억·만 표기. 음수는 앞에 −. */
export function formatManwon(man: number): string {
  const sign = man < 0 ? "−" : "";
  const n = Math.abs(Math.round(man));
  const eok = Math.floor(n / 10_000);
  const rest = n % 10_000;
  if (eok === 0) return `${sign}${rest.toLocaleString("ko-KR")}만 원`;
  if (rest === 0) return `${sign}${eok.toLocaleString("ko-KR")}억 원`;
  return `${sign}${eok.toLocaleString("ko-KR")}억 ${rest.toLocaleString("ko-KR")}만 원`;
}
