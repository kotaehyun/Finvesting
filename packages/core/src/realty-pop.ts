// 행정안전부 인구감소지역(2021.10 지정 89) · 관심지역(고시 제2025-78호, 2026-01-01 시행 18).
// 원문: mois.go.kr 인구감소지역 지정. 지정은 고시로 바뀌니 매수 전 원문.
// 합계출산율은 세계은행 SP.DYN.TFRT.IN (키 없음). 시도별·국내이동은 통계청 키 후.
import dataFile from "../data/realty/pop.json";
import { assertDataFile } from "./load-data";

assertDataFile(dataFile as any, "realty/pop.json");


import { REALTY_METROS, type RealtyMetroId } from "./realty-loans";

export type RealtyPopPlace = { metro: RealtyMetroId; label: string };

export const REALTY_POP_DECLINE: readonly RealtyPopPlace[] = (dataFile as any).exports.REALTY_POP_DECLINE as any;

export const REALTY_POP_WATCH: readonly RealtyPopPlace[] = (dataFile as any).exports.REALTY_POP_WATCH as any;

export const WB_TFR_STAT = (dataFile as any).exports.WB_TFR_STAT as any;
export const WB_TFR_KR = (dataFile as any).exports.WB_TFR_KR as any;

export function realtyPopDeclineCount(): number {
  return REALTY_POP_DECLINE.length;
}

export function realtyPopWatchCount(): number {
  return REALTY_POP_WATCH.length;
}

export function realtyPopDeclineByMetro(): { id: RealtyMetroId; label: string; places: readonly string[] }[] {
  return REALTY_METROS.map((m) => ({
    id: m.id,
    label: m.label,
    places: REALTY_POP_DECLINE.filter((p) => p.metro === m.id).map((p) => p.label),
  })).filter((r) => r.places.length);
}

export const REALTY_MOVE_NOTE = (dataFile as any).exports.REALTY_MOVE_NOTE as any;

/** 국가데이터처 2025년 출생통계 확정. 정책브리핑 2026-08-26. 세계은행 연간과 값이 다를 수 있음. */
export const REALTY_TFR_KOSTAT = (dataFile as any).exports.REALTY_TFR_KOSTAT as any;

/** 국가데이터처 2025년 국내인구이동통계. 정책브리핑 2026-01-29. 시도 전입·전출 인원은 보도 원문 표가 없어 율·권역만. */
export const REALTY_MOVE_2025 = (dataFile as any).exports.REALTY_MOVE_2025 as any;

export const REALTY_JEONSE_SLOTS = (dataFile as any).exports.REALTY_JEONSE_SLOTS as any;
