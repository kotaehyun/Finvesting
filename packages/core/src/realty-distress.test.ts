import { describe, expect, it } from "vitest";
import {
  REALTY_AUCTION,
  REALTY_CRE_NPL,
  REALTY_CRE_YIELD,
  REALTY_EMPTY_BY_TYPE,
  REALTY_HH_NPL,
  REALTY_RTI,
  REALTY_YOUNG_LEVERAGE,
  auctionYoyPct,
  emptyAptShare,
} from "./realty-distress";

describe("realty distress", () => {
  it("아파트 빈집이 전체보다 낮고 부동산업 연체가 평균보다 높다", () => {
    expect(emptyAptShare()).toBe(7.1);
    expect(REALTY_EMPTY_BY_TYPE[0]?.share).toBe(14.9);
    expect(REALTY_HH_NPL.household).toBe(1.05);
    expect(REALTY_HH_NPL.mortgage).toBe(0.44);
    expect(REALTY_CRE_NPL.realEstate).toBe(3.01);
    expect(REALTY_CRE_NPL.realEstate).toBeGreaterThan(REALTY_CRE_NPL.all);
    expect(REALTY_RTI.nonHousing).toBe(1.5);
    expect(REALTY_YOUNG_LEVERAGE.youthShare).toBe(34.9);
    expect(REALTY_AUCTION.filed).toBe(121_261);
    expect(auctionYoyPct()).toBeGreaterThan(0);
    expect(REALTY_CRE_YIELD.officeQ).toBe(1.74);
    expect(REALTY_CRE_YIELD.smallShopQ).toBeLessThan(REALTY_CRE_YIELD.officeQ);
  });
});
