import { describe, expect, it } from "vitest";
import {
  EXEMPT_INCOME_CERT,
  EXEMPT_KINDS,
  EXEMPT_STATUS_FILING,
  IMPORT_VAT,
  ZERO_RATE_EXPORT,
  emptyExportZeroRateLines,
  emptyImportVatLines,
  emptyWorkplaceStatusLines,
  exemptTradeCalendarFor,
  exportZeroRateCsv,
  importVatCsv,
  workplaceStatusCsv,
} from "./exempt-trade";

describe("exempt trade", () => {
  it("2월 10일은 사업장현황신고이고 확인서는 수입금액증명이다", () => {
    expect(EXEMPT_STATUS_FILING.basis).toMatch(/소득세법 제78조/);
    expect(EXEMPT_STATUS_FILING.due).toMatch(/2월 10일/);
    expect(EXEMPT_INCOME_CERT.form).toBe("부가가치세면세사업자수입금액증명");
    expect(EXEMPT_INCOME_CERT.plain).toMatch(/확인서/);
    expect(EXEMPT_INCOME_CERT.plain).toMatch(/발급하지 않음/);
  });

  it("사단·농업은 제26조 문언이고 이름만으로 면세가 아니다", () => {
    const association = EXEMPT_KINDS.find((k) => k.id === "association");
    const farm = EXEMPT_KINDS.find((k) => k.id === "farm");
    expect(association?.basis).toMatch(/제26조 제1항 제18호/);
    expect(association?.not).toMatch(/이름만/);
    expect(farm?.basis).toMatch(/제26조 제1항 제1호/);
    expect(farm?.not).toMatch(/조특법/);
  });

  it("수출은 제21조 영세율, 수입은 제50조 세관이다", () => {
    expect(ZERO_RATE_EXPORT.basis).toMatch(/제21조/);
    expect(ZERO_RATE_EXPORT.plain).toMatch(/면세가 아님/);
    expect(IMPORT_VAT.basis).toMatch(/제50조/);
    expect(IMPORT_VAT.deferral).toMatch(/제50조의2/);
  });

  it("법인은 제78조 달력을 보지 않는다", () => {
    expect(exemptTradeCalendarFor("business").some((r) => r.id === "workplace_status")).toBe(true);
    expect(exemptTradeCalendarFor("corporation").some((r) => r.id === "workplace_status")).toBe(false);
    expect(exemptTradeCalendarFor("corporation").some((r) => r.article.includes("제21조"))).toBe(true);
    expect(exemptTradeCalendarFor("corporation").some((r) => r.article.includes("제50조"))).toBe(true);
  });

  it("시산 CSV는 빈 칸을 0으로 안 채운다", () => {
    const status = emptyWorkplaceStatusLines(2);
    const first = status[0];
    if (!first) throw new Error("row");
    first.industry = "학원";
    const csv = workplaceStatusCsv(status);
    expect(csv).toMatch(/사업장현황신고서/);
    expect(csv).toMatch(/학원,/);
    expect(csv).not.toMatch(/학원,0/);
    expect(csv.split("\n").filter((l) => l.startsWith("학원") || l.includes(",학원,")).length).toBeGreaterThan(0);

    const exports = emptyExportZeroRateLines(2);
    const ex = exports[0];
    if (!ex) throw new Error("ex");
    ex.declarationNo = "E1";
    const exportCsv = exportZeroRateCsv(exports);
    expect(exportCsv).toMatch(/제21조/);
    expect(exportCsv).toMatch(/E1,,/);
    expect(exportCsv).not.toMatch(/E1,,0/);

    const imports = emptyImportVatLines(2);
    const im = imports[0];
    if (!im) throw new Error("im");
    im.declarationNo = "I1";
    const importCsv = importVatCsv(imports);
    expect(importCsv).toMatch(/제50조/);
    expect(importCsv).toMatch(/I1,,,,,/);
    expect(importCsv).not.toMatch(/I1,0/);
  });
});
