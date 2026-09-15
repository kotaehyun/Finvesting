import { describe, expect, it } from "vitest";
import {
  REALTY_NTS_CGT,
  REALTY_NTS_CGT_METROS,
  fmtManPeople,
  ntsCgtDelta,
  ntsCgtRestDelta,
  ntsCgtSeoulOfGrowth,
  ntsCgtShare,
  ntsCgtSudoDelta,
  ntsCgtSudoNow,
  ntsCgtLandTaxEok,
  ntsCgtCorpPeopleShare,
  ntsCgtCorpTaxShare,
} from "./realty-nts";

describe("realty nts", () => {
  it("주택분 종부세 수도권 비중이 보도와 맞는다", () => {
    expect(REALTY_NTS_CGT.housingPeople).toBe(540_000);
    const seoul = REALTY_NTS_CGT_METROS[0]!;
    expect(ntsCgtShare(seoul.now)).toBeCloseTo(0.6074, 3);
    expect(ntsCgtSudoNow()).toBe(452_000);
    expect(ntsCgtShare(ntsCgtSudoNow())).toBeCloseTo(0.837, 3);
    expect(ntsCgtDelta(seoul)).toBe(59_000);
    expect(ntsCgtSudoDelta()).toBe(78_000);
    expect(ntsCgtRestDelta()).toBe(2_000);
    expect(ntsCgtSeoulOfGrowth()).toBeCloseTo(0.7375, 4);
    expect(fmtManPeople(328_000)).toBe("32.8만 명");
    expect(fmtManPeople(80_000)).toBe("8만 명");
    expect(ntsCgtLandTaxEok()).toBe(36_000);
    expect(ntsCgtCorpPeopleShare()).toBeCloseTo(59_000 / 540_000, 5);
    expect(ntsCgtCorpTaxShare()).toBeCloseTo(9_000 / 17_000, 5);
  });
});
