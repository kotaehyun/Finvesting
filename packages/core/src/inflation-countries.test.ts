import { describe, expect, it } from "vitest";
import { INFLATION_COUNTRIES, inflationTone, wbInflCode } from "./inflation-countries";

describe("inflation countries", () => {
  it("한국·미국 코드", () => {
    expect(wbInflCode("kr")).toBe("WB_INFL_KR");
    expect(INFLATION_COUNTRIES.some((c) => c.iso2 === "KR")).toBe(true);
    expect(inflationTone(8)).toBe("hot");
    expect(inflationTone(2)).toBe("ok");
  });
});
