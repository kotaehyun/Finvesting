import { describe, expect, it } from "vitest";
import {
  REALTY_WEALTH_GIFT,
  REALTY_WEALTH_METHODS,
  REALTY_WEALTH_SHARE,
  REALTY_WEALTH_TRUST,
  giftTaxShareOfEstate,
  realtyTrustShareOfAll,
} from "./realty-wealth";

describe("realty wealth", () => {
  it("실명 채널은 없고 상위 10%·증여·신탁은 집계만 둔다", () => {
    expect(REALTY_WEALTH_SHARE.topShare).toBe(46.1);
    expect(REALTY_WEALTH_SHARE.realShare).toBe(75.8);
    expect(REALTY_WEALTH_GIFT.inheritPeople).toBe(22_524);
    expect(REALTY_WEALTH_TRUST.realtyJo).toBe(457.5);
    expect(giftTaxShareOfEstate()).toBeCloseTo(54_828 / (89_345 + 54_828), 5);
    expect(realtyTrustShareOfAll()).toBeCloseTo(457.5 / 1_516.5, 5);
    expect(REALTY_WEALTH_METHODS.find((m) => m.id === "celeb")?.put).toBe("never");
    expect(REALTY_WEALTH_METHODS.find((m) => m.id === "exec")?.put).toBe("slot");
    expect(REALTY_WEALTH_METHODS.find((m) => m.id === "gift")?.put).toBe("in");
  });
});
