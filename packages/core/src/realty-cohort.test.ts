import { describe, expect, it } from "vitest";
import {
  REALTY_AGE_SHARES,
  REALTY_BIRTH_AGE,
  REALTY_CENSUS_2025,
  REALTY_HOUSING_COHORT,
  REALTY_MARRY_2025,
  familyFormationShare,
  modalAgeLabel,
  modalAgeShare,
} from "./realty-cohort";

describe("realty cohort", () => {
  it("인구 최빈은 50대이고 혼인 피크는 30대 초반이다", () => {
    const sum = REALTY_AGE_SHARES.reduce((s, r) => s + r.share, 0);
    expect(sum).toBeCloseTo(99.9, 5);
    expect(modalAgeLabel()).toBe("50대");
    expect(modalAgeShare()).toBe(16.7);
    expect(familyFormationShare()).toBeCloseTo(28.3, 5);
    expect(REALTY_CENSUS_2025.medianAge).toBe(46.8);
    expect(REALTY_CENSUS_2025.single30).toBe(54.7);
    expect(REALTY_MARRY_2025.peakBand).toBe("30–34");
    expect(REALTY_MARRY_2025.firstAgeF).toBe(31.6);
    expect(REALTY_BIRTH_AGE.mother).toBe(33.8);
    expect(REALTY_BIRTH_AGE.peakRate).toBe(73.1);
    expect(REALTY_HOUSING_COHORT.youthOwn).toBe(12.2);
    expect(REALTY_HOUSING_COHORT.newlywedPir).toBe(6.0);
  });
});
