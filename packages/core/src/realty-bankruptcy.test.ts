import { describe, expect, it } from "vitest";
import {
  REALTY_BANKRUPTCY_CAUSES,
  REALTY_INSOLVENCY_STATS,
  insolvencyFiledTotal,
  rehabilitationYoyPct,
} from "./realty-bankruptcy";

describe("realty bankruptcy causes and insolvency stats", () => {
  it("파탄원인은 서울회생법원 중복응답이고 주담대 칸이 없다", () => {
    const ids = REALTY_BANKRUPTCY_CAUSES.map((c) => c.id);
    expect(ids).toEqual(["living", "business", "income", "invest"]);
    const sum = REALTY_BANKRUPTCY_CAUSES.reduce((a, c) => a + c.share, 0);
    expect(sum).toBeGreaterThan(100);
    expect(REALTY_BANKRUPTCY_CAUSES.find((c) => c.id === "living")?.share).toBe(46.65);
    expect(REALTY_BANKRUPTCY_CAUSES.find((c) => c.id === "invest")?.share).toBe(13.55);
  });

  it("2025 법원통계월보 신청 건수를 쓴다", () => {
    expect(REALTY_INSOLVENCY_STATS.rehabilitationFiled).toBe(149_146);
    expect(REALTY_INSOLVENCY_STATS.bankruptcyFiled).toBe(40_908);
    expect(insolvencyFiledTotal()).toBe(190_054);
    expect(rehabilitationYoyPct()).toBeCloseTo(15.17, 1);
    expect(REALTY_INSOLVENCY_STATS.debtAdjustmentSettled).toBe(174_841);
  });
});
