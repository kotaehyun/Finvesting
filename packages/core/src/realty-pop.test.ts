import { describe, expect, it } from "vitest";
import {
  REALTY_MOVE_2025,
  REALTY_POP_DECLINE,
  REALTY_POP_WATCH,
  REALTY_TFR_KOSTAT,
  realtyPopDeclineByMetro,
  realtyPopDeclineCount,
  realtyPopWatchCount,
} from "./realty-pop";

describe("realty pop", () => {
  it("행안부 인구감소 89 · 관심 18", () => {
    expect(realtyPopDeclineCount()).toBe(89);
    expect(realtyPopWatchCount()).toBe(18);
    expect(REALTY_POP_DECLINE.some((p: any) => p.metro === "seoul")).toBe(false);
    expect(REALTY_POP_DECLINE.some((p: any) => p.label === "경기 가평군")).toBe(true);
    expect(REALTY_POP_WATCH).toHaveLength(18);
    expect(realtyPopDeclineByMetro().every((r: any) => r.places.length)).toBe(true);
  });

  it("출산율·이동은 2025 확정 공표만", () => {
    expect(REALTY_TFR_KOSTAT.national.at(-1)?.tfr).toBe(0.8);
    expect(REALTY_TFR_KOSTAT.metros.find((m: any) => m.id === "seoul")?.tfr).toBe(0.63);
    expect(REALTY_MOVE_2025.regions.reduce((s: any, r: any) => s + r.net, 0)).toBe(3000);
    expect(REALTY_MOVE_2025.sejongNet).toBe(-47);
    expect(REALTY_MOVE_2025.sex.maleRate).toBe(12.4);
    expect(REALTY_MOVE_2025.sex.femaleRate).toBe(11.6);
    expect(REALTY_MOVE_2025.ages.find((a: { id: string }) => a.id === "a25")?.movers).toBe(845);
    expect(REALTY_MOVE_2025.ages.find((a: { id: string }) => a.id === "a20")?.female).toBe(297);
    expect(REALTY_MOVE_2025.reasons.find((r: { id: string }) => r.id === "housing")?.sharePct).toBe(33.7);
    expect(REALTY_MOVE_2025.metroAges).toHaveLength(17);
    expect(REALTY_MOVE_2025.metroAges.find((m: { id: string }) => m.id === "seoul")?.net[2]).toBe(35.9);
    expect(REALTY_MOVE_2025.ageNetBands).toHaveLength(9);
    expect(REALTY_MOVE_2025.withinCapital.moversThou).toBe(2851);
    expect(REALTY_MOVE_2025.withinCapital.nets.reduce((s: number, n: { thou: number }) => s + n.thou, 0)).toBe(0);
    expect(REALTY_MOVE_2025.capitalPairs.find((p: { from: string; to: string }) => p.from === "seoul" && p.to === "incheon")?.outPct).toBe(10);
    expect(REALTY_MOVE_2025.provinceCapital).toHaveLength(14);
    expect(REALTY_MOVE_2025.provinceCapital.reduce((s: number, r: { toCapital: number }) => s + r.toCapital, 0)).toBe(418);
    expect(REALTY_MOVE_2025.provinceCapital.reduce((s: number, r: { fromCapital: number }) => s + r.fromCapital, 0)).toBe(381);
    expect(REALTY_MOVE_2025.provinceCapital.find((r: { id: string }) => r.id === "chungnam")?.fromCapital).toBe(61);
    expect(REALTY_MOVE_2025.localPairs).toHaveLength(10);
    expect(REALTY_MOVE_2025.localPairs.find((p: { from: string }) => p.from === "busan")?.outPct).toBe(36.4);
    expect(REALTY_MOVE_2025.localOne.find((p: { label: string }) => p.label === "전북 전출 중 충남")?.pct).toBe(9.5);
    expect(REALTY_MOVE_2025.localPairs.every((p: { from: string; to: string }) => !["seoul", "incheon", "gyeonggi"].includes(p.from) && !["seoul", "incheon", "gyeonggi"].includes(p.to))).toBe(true);
  });
});
