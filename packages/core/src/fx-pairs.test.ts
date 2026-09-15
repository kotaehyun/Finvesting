import { describe, expect, it } from "vitest";
import { FX_PAIRS, displayFx, fxPairByCode, fxYahooTickers } from "./fx-pairs";

describe("fx pairs", () => {
  it("원/달러는 확인된 KRW=X", () => {
    expect(fxYahooTickers()[0]).toBe("KRW=X");
    expect(fxPairByCode("USDKRW")?.yahoo).toBe("KRW=X");
    expect(FX_PAIRS.every((p) => p.href.includes("investing.com"))).toBe(true);
  });

  it("엔은 1엔 저장·100엔 표시", () => {
    const jpy = fxPairByCode("JPYKRW");
    expect(jpy?.scale).toBe(100);
    expect(displayFx(9.31, jpy!)).toBeCloseTo(931, 5);
  });
});
