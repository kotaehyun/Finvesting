import { describe, expect, it } from "vitest";
import {
  bisPeriodToDate,
  bisPolCode,
  isPolicyPeriodStale,
  parseBisCbpolJson,
  policyRateTone,
} from "./policy-rates";

describe("policy rates", () => {
  it("코드·톤·기간", () => {
    expect(bisPolCode("kr")).toBe("BIS_POL_KR");
    expect(policyRateTone(37)).toBe("hot");
    expect(policyRateTone(2.75)).toBe("ok");
    expect(policyRateTone(1)).toBe("cool");
    expect(isPolicyPeriodStale("1998-12", new Date("2026-09-14T00:00:00Z"))).toBe(true);
    expect(isPolicyPeriodStale("2026-07", new Date("2026-09-14T00:00:00Z"))).toBe(false);
    expect(bisPeriodToDate("2026-08")).toBe("2026-08-01");
  });

  it("BIS SDMX-JSON에서 국가·값을 읽는다", () => {
    const json = {
      data: {
        structure: {
          dimensions: {
            series: [
              { id: "FREQ", values: [{ id: "M" }] },
              { id: "REF_AREA", values: [{ id: "KR" }, { id: "US" }, { id: "FR" }] },
            ],
            observation: [
              { id: "TIME_PERIOD", values: [{ id: "2026-08" }, { id: "1998-12" }] },
            ],
          },
        },
        dataSets: [{
          series: {
            "0:0": { observations: { "0": ["2.75"] } },
            "0:1": { observations: { "0": ["3.625"] } },
            "0:2": { observations: { "1": ["3"] } },
          },
        }],
      },
    };
    const rows = parseBisCbpolJson(json);
    expect(rows).toEqual([
      { iso2: "KR", period: "2026-08", value: 2.75 },
      { iso2: "US", period: "2026-08", value: 3.625 },
      { iso2: "FR", period: "1998-12", value: 3 },
    ]);
  });
});
