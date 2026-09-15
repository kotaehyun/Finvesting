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
    expect(REALTY_POP_DECLINE.some((p) => p.metro === "seoul")).toBe(false);
    expect(REALTY_POP_DECLINE.some((p) => p.label === "경기 가평군")).toBe(true);
    expect(REALTY_POP_WATCH).toHaveLength(18);
    expect(realtyPopDeclineByMetro().every((r) => r.places.length)).toBe(true);
  });

  it("출산율·이동은 2025 확정 공표만", () => {
    expect(REALTY_TFR_KOSTAT.national.at(-1)?.tfr).toBe(0.8);
    expect(REALTY_TFR_KOSTAT.metros.find((m) => m.id === "seoul")?.tfr).toBe(0.63);
    expect(REALTY_MOVE_2025.regions.reduce((s, r) => s + r.net, 0)).toBe(3000);
    expect(REALTY_MOVE_2025.sejongNet).toBe(-47);
  });
});
