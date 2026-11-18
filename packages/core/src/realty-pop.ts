// 행정안전부 인구감소지역(2021.10 지정 89) · 관심지역(고시 제2025-78호, 2026-01-01 시행 18).
// 원문: mois.go.kr 인구감소지역 지정. 지정은 고시로 바뀌니 매수 전 원문.
// 합계출산율은 세계은행 SP.DYN.TFRT.IN (키 없음). 시도별·국내이동은 통계청 키 후.
import dataFile from "../data/realty/pop.json";
import { assertDefaults } from "./load-data";

assertDefaults(dataFile, "realty/pop.json");


import { REALTY_METROS, type RealtyMetroId } from "./realty-loans";

export type RealtyPopPlace = { metro: RealtyMetroId; label: string };

export const REALTY_POP_DECLINE: readonly RealtyPopPlace[] = dataFile.REALTY_POP_DECLINE as readonly RealtyPopPlace[];

export const REALTY_POP_WATCH: readonly RealtyPopPlace[] = dataFile.REALTY_POP_WATCH as readonly RealtyPopPlace[];

export const WB_TFR_STAT = dataFile.WB_TFR_STAT;
export const WB_TFR_KR = dataFile.WB_TFR_KR;

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

export const REALTY_MOVE_NOTE = dataFile.REALTY_MOVE_NOTE;

/** 국가데이터처 2025년 출생통계 확정. 정책브리핑 2026-08-26. 세계은행 연간과 값이 다를 수 있음. */
export const REALTY_TFR_KOSTAT = dataFile.REALTY_TFR_KOSTAT;

/** 국가데이터처 2025년 국내인구이동 보도자료. 연령·성별은 전국(표 2·표 6). 시도 연령 순이동은 표 4. 수도권 안은 표 5의 서울·인천·경기. 지방끼리는 표 5의 3대 전입·전출 가운데 수도권 밖 이웃만. 지방과 수도권 전체는 표 12. */
export const REALTY_MOVE_2025 = dataFile.REALTY_MOVE_2025;

export const REALTY_JEONSE_SLOTS = dataFile.REALTY_JEONSE_SLOTS;
