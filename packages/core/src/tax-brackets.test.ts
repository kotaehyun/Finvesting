import { describe, expect, it } from "vitest";
import {
  CGT_FLAT_RATES,
  GIFT_DEDUCTIONS,
  IHTA_ART26_BRACKETS,
  ITA_ART55_BRACKETS,
  LTA_ART111_HOUSE_BRACKETS,
  PROGRESSIVE_PLAIN,
  TAX_TABLES,
  TAX_TERMS,
  assessBracketTax,
  findTaxTable,
  pickBracket,
} from "./tax-brackets";

describe("tax-brackets", () => {
  it("국세청 종소세 예시 3,000만은 324만", () => {
    const t = findTaxTable("ita55");
    expect(t).toBeDefined();
    const a = assessBracketTax(30_000_000, t!);
    expect(a.bracket?.rateBp).toBe(1500);
    expect(a.assessed).toBe(3_240_000);
    expect(a.localTax).toBe(324_000);
    expect(a.formula).toMatch(/15%/);
  });

  it("1,400만 이하는 6%", () => {
    const t = findTaxTable("ita55")!;
    expect(assessBracketTax(14_000_000, t).assessed).toBe(840_000);
    expect(pickBracket(14_000_001, ITA_ART55_BRACKETS)?.rateBp).toBe(1500);
  });

  it("증여 2억은 제26조 20% 칸 3,000만", () => {
    const t = findTaxTable("ihta26")!;
    expect(assessBracketTax(200_000_000, t).assessed).toBe(30_000_000);
    expect(assessBracketTax(80_000_000, t).assessed).toBe(8_000_000);
    expect(t.localOnTax).toBe(false);
    expect(IHTA_ART26_BRACKETS).toHaveLength(5);
  });

  it("주택 재산세 과세표준 6천만은 6만", () => {
    const t = findTaxTable("lta111house")!;
    expect(assessBracketTax(60_000_000, t).assessed).toBe(60_000);
    expect(pickBracket(60_000_001, LTA_ART111_HOUSE_BRACKETS)?.rateBp).toBe(15);
  });

  it("종부세 2주택 이하 3억은 0.5%", () => {
    const t = findTaxTable("cret9-2")!;
    expect(assessBracketTax(300_000_000, t).assessed).toBe(1_500_000);
  });

  it("초보 용어와 단기 양도·증여공제 조문이 있다", () => {
    expect(TAX_TERMS.some((x: any) => x.id === "progressive")).toBe(true);
    expect(PROGRESSIVE_PLAIN[3]).toMatch(/324만/);
    expect(CGT_FLAT_RATES.some((r: any) => r.id === "kr_other")).toBe(true);
    expect(GIFT_DEDUCTIONS[0].amount).toMatch(/6억/);
    expect(TAX_TABLES).toHaveLength(5);
  });
});
