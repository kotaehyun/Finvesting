import { describe, expect, it } from "vitest";
import { assertDataFile, isVerifiedBy, type DataFile } from "./load-data";

import bankruptcy from "../data/realty/bankruptcy.json";
import card from "../data/realty/card.json";
import claims from "../data/realty/claims.json";
import cohort from "../data/realty/cohort.json";
import distress from "../data/realty/distress.json";
import loans from "../data/realty/loans.json";
import map from "../data/realty/map.json";
import nts from "../data/realty/nts.json";
import officials from "../data/realty/officials.json";
import pop from "../data/realty/pop.json";
import rates from "../data/realty/rates.json";
import ref from "../data/realty/ref.json";
import stress from "../data/realty/stress.json";
import tenure from "../data/realty/tenure.json";
import wealth from "../data/realty/wealth.json";
import brackets from "../data/tax/brackets.json";
import corpLocal from "../data/tax/corp-local-rate.json";
import payroll from "../data/tax/payroll-rates-2026.json";
import ei from "../data/tax/ei-stability.json";
import civil from "../data/tax/civil-pay-2026.json";

const FILES: { path: string; data: DataFile }[] = [
  { path: "realty/bankruptcy.json", data: bankruptcy as DataFile },
  { path: "realty/card.json", data: card as DataFile },
  { path: "realty/claims.json", data: claims as DataFile },
  { path: "realty/cohort.json", data: cohort as DataFile },
  { path: "realty/distress.json", data: distress as DataFile },
  { path: "realty/loans.json", data: loans as DataFile },
  { path: "realty/map.json", data: map as DataFile },
  { path: "realty/nts.json", data: nts as DataFile },
  { path: "realty/officials.json", data: officials as DataFile },
  { path: "realty/pop.json", data: pop as DataFile },
  { path: "realty/rates.json", data: rates as DataFile },
  { path: "realty/ref.json", data: ref as DataFile },
  { path: "realty/stress.json", data: stress as DataFile },
  { path: "realty/tenure.json", data: tenure as DataFile },
  { path: "realty/wealth.json", data: wealth as DataFile },
  { path: "tax/brackets.json", data: brackets as DataFile },
  { path: "tax/corp-local-rate.json", data: corpLocal as DataFile },
  { path: "tax/payroll-rates-2026.json", data: payroll as DataFile },
  { path: "tax/ei-stability.json", data: ei as DataFile },
  { path: "tax/civil-pay-2026.json", data: civil as DataFile },
];

describe("packages/core/data JSON 스키마", () => {
  it("등록된 데이터 파일이 있다", () => {
    expect(FILES.length).toBe(20);
  });

  it("모든 항목에 sourceUrl·asOf·verifiedBy(허용값)가 있다", () => {
    for (const { path, data } of FILES) {
      expect(() => assertDataFile(data, path)).not.toThrow();
      for (const e of data.entries) {
        expect(e.sourceUrl || data.defaults.sourceUrl, `${path}:${e.id}`).toBeTruthy();
        expect(e.asOf !== undefined || data.defaults.asOf !== undefined).toBe(true);
        const vb = e.verifiedBy ?? data.defaults.verifiedBy;
        expect(isVerifiedBy(vb), `${path}:${e.id} verifiedBy=${vb}`).toBe(true);
      }
    }
  });

  it("미검증 항목 수를 집계한다", () => {
    let unverified = 0;
    let total = 0;
    for (const { data } of FILES) {
      for (const e of data.entries) {
        total += 1;
        if ((e.verifiedBy ?? data.defaults.verifiedBy) === "미검증") unverified += 1;
      }
    }
    expect(total).toBeGreaterThan(0);
    expect(unverified).toBe(total);
  });
});
