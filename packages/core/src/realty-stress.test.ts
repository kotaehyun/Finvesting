import { describe, expect, it } from "vitest";
import {
  REALTY_EMPTY,
  REALTY_GINI,
  REALTY_KR_VACANCY,
  REALTY_PIR,
  REALTY_STRESS_METROS,
  fmtRate,
  incomeHousingTone,
  pirVsNational,
  realtyStressOf,
  vsKr,
} from "./realty-stress";

describe("realty stress", () => {
  it("공실·빈집·PIR 스냅샷이 보도와 맞는다", () => {
    expect(REALTY_STRESS_METROS).toHaveLength(17);
    expect(REALTY_KR_VACANCY.office).toBe(8.7);
    expect(REALTY_KR_VACANCY.midShop).toBe(13.8);
    expect(realtyStressOf("seoul").office).toBe(5.1);
    expect(realtyStressOf("gwangju").office).toBe(18.9);
    expect(realtyStressOf("sejong").office).toBeNull();
    expect(realtyStressOf("jeonnam").empty).toBe(15.0);
    expect(REALTY_EMPTY.kr).toBe(8.0);
    expect(REALTY_EMPTY.kr2025).toBe(8.5);
    expect(vsKr(5.1, 8.7)).toBeCloseTo(-3.6, 5);
    expect(REALTY_PIR.kr).toBe(6.3);
    expect(REALTY_PIR.sudo).toBe(8.7);
    expect(pirVsNational(13.9)).toBeCloseTo(13.9 / 6.3, 5);
    expect(incomeHousingTone(pirVsNational(13.9))).toBe("high");
    expect(incomeHousingTone(pirVsNational(8.7))).toBe("elevated");
    expect(incomeHousingTone(pirVsNational(4.0))).toBe("below");
    expect(REALTY_GINI.disposable).toBe(0.325);
    expect(fmtRate(8.7)).toBe("8.7%");
  });
});
