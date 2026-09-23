// 수도권 시·구 중심점. 좌표는 OSM Nominatim 검색(2026-09-15). 행정 중심이지 필지·동 경계가 아님.
import dataFile from "../data/realty/map.json";
import { assertDataFile } from "./load-data";

assertDataFile(dataFile as any, "realty/map.json");

import {
  realtyMetroFromKostatCode,
  realtyMetroLabel,
  type RealtyMetroId,
} from "./realty-loans";
import {
  REALTY_REGULATED_GYEONGGI,
  type RealtyTone,
} from "./realty-ref";

export type RealtyMapKind = "regulated" | "overcrowded" | "growth" | "nature";

export type RealtyMapPoint = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  kind: RealtyMapKind;
  tone: RealtyTone;
  /** 2026-07-01 추가 규제 */
  fresh?: boolean;
  note: string;
};

const REGULATED_NOTES = (dataFile as any).helpers.REGULATED_NOTES as Record<string, string>;

const REGULATED_COORDS = (dataFile as any).helpers.REGULATED_COORDS as Record<string, readonly [number, number]>;

const CONTEXT = (dataFile as any).helpers.CONTEXT as readonly RealtyMapPoint[];

function regulatedPoint(id: string, label: string, since: "2025-10-16" | "2026-07-01"): RealtyMapPoint {
  const xy = REGULATED_COORDS[id];
  if (!xy) throw new Error(`missing coords: ${id}`);
  const fresh = since === "2026-07-01";
  return {
    id,
    label,
    lat: xy[0],
    lng: xy[1],
    kind: "regulated",
    tone: fresh ? "danger" : "warn",
    fresh,
    note: REGULATED_NOTES[id] ?? `투기과열·조정대상. 효력 ${since}.`,
  };
}

export const REALTY_MAP_POINTS: readonly RealtyMapPoint[] = (dataFile as any).exports.REALTY_MAP_POINTS;

export const REALTY_MAP_VIEW = (dataFile as any).exports.REALTY_MAP_VIEW;

export function realtyMapPoint(id: string): RealtyMapPoint | undefined {
  return REALTY_MAP_POINTS.find((p) => p.id === id);
}

export function realtyMapRegulatedIds(): readonly string[] {
  return REALTY_MAP_POINTS.filter((p) => p.kind === "regulated").map((p) => p.id);
}

export type RealtyPlanKind = RealtyMapKind | "other" | "out";

export type RealtyPlanStyle = {
  id: string;
  label: string;
  short: string;
  kind: RealtyPlanKind;
  tone: RealtyTone | "muted";
  metro: RealtyMetroId;
  fresh?: boolean;
  hatch?: boolean;
  note: string;
};

const GY_PLAN = (dataFile as any).helpers.GY_PLAN as any;

function shortName(name: string): string {
  return name.replace(/^수원시|^성남시|^안양시|^안산시|^고양시|^용인시/, "");
}

/** 통계청 2018 시군구 이름 → 도면 색. 동탄구 면은 원본에 없음. 수도권 밖은 회색. */
export function realtyPlanFromKostat(code: string, name: string): RealtyPlanStyle {
  const metro = realtyMetroFromKostatCode(code);
  if (!metro) {
    return { id: `other-${code}`, label: name, short: name, kind: "other", tone: "muted", metro: "seoul", note: "시도 코드를 모름." };
  }
  if (metro === "seoul") {
    return { id: "seoul", label: `서울 ${name}`, short: name, kind: "regulated", tone: "warn", metro, note: REGULATED_NOTES.seoul! };
  }
  if (metro === "incheon") {
    if (name === "강화군" || name === "옹진군") {
      return { id: name === "강화군" ? "ganghwa" : "ongjin", label: `인천 ${name}`, short: name, kind: "out", tone: "muted", metro, note: "과밀억제권역에서 제외. 규제지역 아님." };
    }
    const n = name === "남구" ? "남구(미추홀)" : name;
    return { id: "incheon", label: `인천 ${n}`, short: n, kind: "overcrowded", tone: "info", metro, note: "과밀억제(강화·옹진·서구 일부 등 제외). 규제지역 목록은 아님." };
  }
  if (metro === "gyeonggi") {
    const hit = GY_PLAN[name];
    if (hit) return { ...hit, short: shortName(name), metro };
    return { id: `gyeonggi-${code}`, label: name, short: name, kind: "other", tone: "muted", metro, note: "이 도면의 규제·권역 목록에 없음." };
  }
  const head = realtyMetroLabel(metro);
  return {
    id: metro,
    label: `${head} ${name}`,
    short: name,
    kind: "other",
    tone: "muted",
    metro,
    note: "수도권 규제·정비권역 밖. 예금은행 가계대출은 광역시도 단위입니다.",
  };
}
