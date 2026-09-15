import { describe, expect, it } from "vitest";
import { REALTY_REGULATED_GYEONGGI } from "./realty-ref";
import { REALTY_MAP_POINTS, realtyMapRegulatedIds, realtyPlanFromKostat } from "./realty-map";

describe("realty map", () => {
  it("규제 시·구마다 Nominatim 점이 있다", () => {
    const ids = new Set(realtyMapRegulatedIds());
    expect(ids.has("seoul")).toBe(true);
    for (const p of REALTY_REGULATED_GYEONGGI) {
      expect(ids.has(p.id)).toBe(true);
    }
    expect(REALTY_MAP_POINTS.some((p) => p.label.includes("권선"))).toBe(false);
  });

  it("좌표는 수도권 상자 안에 있다", () => {
    for (const p of REALTY_MAP_POINTS) {
      expect(p.lat).toBeGreaterThan(36.8);
      expect(p.lat).toBeLessThan(38.1);
      expect(p.lng).toBeGreaterThan(126.4);
      expect(p.lng).toBeLessThan(127.8);
    }
    const dongtan = REALTY_MAP_POINTS.find((p) => p.id === "dongtan");
    expect(dongtan?.fresh).toBe(true);
    expect(dongtan?.tone).toBe("danger");
  });

  it("시군구 도면 색은 규제·권선·화성을 구분한다", () => {
    expect(realtyPlanFromKostat("11010", "종로구").id).toBe("seoul");
    expect(realtyPlanFromKostat("31011", "수원시장안구").kind).toBe("regulated");
    expect(realtyPlanFromKostat("31012", "수원시권선구").kind).toBe("overcrowded");
    expect(realtyPlanFromKostat("31240", "화성시").hatch).toBe(true);
    expect(realtyPlanFromKostat("31192", "용인시기흥구").fresh).toBe(true);
    expect(realtyPlanFromKostat("21010", "중구").metro).toBe("busan");
    expect(realtyPlanFromKostat("21010", "중구").kind).toBe("other");
    expect(realtyPlanFromKostat("39010", "제주시").metro).toBe("jeju");
  });
});
