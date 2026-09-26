import { describe, expect, it } from "vitest";
import { assertDataFile, assertDefaults, isVerifiedBy, type DataFile } from "./load-data";

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

const TAX_FILES: { path: string; data: DataFile }[] = [
  { path: "tax/brackets.json", data: brackets as DataFile },
  { path: "tax/corp-local-rate.json", data: corpLocal as DataFile },
  { path: "tax/payroll-rates-2026.json", data: payroll as DataFile },
  { path: "tax/ei-stability.json", data: ei as DataFile },
  { path: "tax/civil-pay-2026.json", data: civil as DataFile },
];

const REALTY_FILES: { path: string; data: DataFile }[] = [
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
];

const CONFIG_PATHS = new Set(["realty/map.json", "realty/ref.json", "realty/loans.json"]);

describe("packages/core/data JSON 스키마", () => {
  it("등록된 데이터 파일이 있다", () => {
    expect(TAX_FILES.length + REALTY_FILES.length).toBe(20);
  });

  it("tax 파일은 entries + sourceUrl·asOf·verifiedBy(패턴)가 있다", () => {
    for (const { path, data } of TAX_FILES) {
      expect(() => assertDataFile(data, path)).not.toThrow();
      expect(Array.isArray(data.entries)).toBe(true);
      for (const e of data.entries!) {
        expect(e.sourceUrl || data.defaults.sourceUrl, `${path}:${e.id}`).toBeTruthy();
        expect(e.asOf !== undefined || data.defaults.asOf !== undefined).toBe(true);
        const vb = e.verifiedBy ?? data.defaults.verifiedBy;
        expect(isVerifiedBy(vb), `${path}:${e.id} verifiedBy=${vb}`).toBe(true);
      }
    }
  });

  it("realty 파일은 defaults만 있고 entries는 없다", () => {
    for (const { path, data } of REALTY_FILES) {
      expect(() => assertDefaults(data, path)).not.toThrow();
      expect(data.entries, path).toBeUndefined();
      if (CONFIG_PATHS.has(path)) {
        expect(data.kind, path).toBe("config");
      }
    }
  });

  it("미검증 항목 수를 집계한다(고정 기대값 없음)", () => {
    let unverified = 0;
    let total = 0;
    for (const { data } of TAX_FILES) {
      for (const e of data.entries ?? []) {
        total += 1;
        if ((e.verifiedBy ?? data.defaults.verifiedBy) === "미검증") unverified += 1;
      }
    }
    // 집계만 — verifiedBy를 올려도 테스트가 깨지지 않게 한다
    console.info(`[data-tables] tax entries total=${total} unverified=${unverified}`);
    expect(total).toBeGreaterThan(0);
  });
});
