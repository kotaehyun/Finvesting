import { describe, expect, it } from "vitest";
import {
  REALTY_BASE_RATE,
  REALTY_BOK_AVG,
  REALTY_COFIX,
  applyLiveRates,
  ecosLoanRateMacroCodes,
  formatRate,
  formatRateDelta,
  matchEcosLoanRateItem,
  realtyRateSnapshot,
} from "./realty-rates";

describe("realty rates", () => {
  it("한은 7월 가중평균과 COFIX 8월을 표로 두고 항목코드는 이름으로만 맞춘다", () => {
    expect(REALTY_BASE_RATE.rate).toBe(3);
    expect(REALTY_BOK_AVG.newMort).toBe(4.48);
    expect(REALTY_BOK_AVG.newJeonse).toBe(4.19);
    expect(REALTY_COFIX.fresh).toBe(3.18);
    expect(REALTY_COFIX.out).toBe(3.05);
    const rows = realtyRateSnapshot();
    expect(rows.find((r) => r.id === "newMort")?.label).toBe("주택담보대출");
    expect(matchEcosLoanRateItem("121Y006", "주택담보대출")?.code).toBe("ECOS_LOAN_NEW_MORT");
    expect(matchEcosLoanRateItem("121Y006", "서울")).toBeNull();
    expect(ecosLoanRateMacroCodes()).toContain("BOK_BASE_RATE");
    expect(formatRate(4.48)).toBe("4.48%");
    expect(formatRateDelta(-0.04)).toBe("-0.04%p");
    const live = applyLiveRates(rows, {
      BOK_BASE_RATE: { date: "2026-08-27", value: 3 },
      KTB_3Y: { date: "2026-09-14", value: 2.91 },
    });
    expect(live.find((r) => r.id === "ktb")?.rate).toBe(2.91);
    expect(applyLiveRates(rows, { ECOS_LOAN_NEW_MORT: { date: "2026-06-01", value: 9 } }).find((r) => r.id === "newMort")?.rate).toBe(4.48);
  });
});
