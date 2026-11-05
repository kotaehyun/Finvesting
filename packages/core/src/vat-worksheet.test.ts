import { describe, expect, it } from "vitest";
import { emptyVatInput, vatFilingRows, VAT_FILING_CALENDAR, vatWorksheet } from "./vat-worksheet";

describe("vatWorksheet", () => {
  it("일반과세 1,000만 공급가액은 매출세액 100만", () => {
    const w = vatWorksheet({ ...emptyVatInput(), taxableSupply: 10_000_000 });
    expect(w.outputVat).toBe(1_000_000);
    expect(w.payable).toBe(1_000_000);
  });

  it("영세율·면세 공급은 매출세액에 안 넣는다", () => {
    const w = vatWorksheet({
      ...emptyVatInput(),
      taxableSupply: 0,
      zeroRateSupply: 5_000_000,
      exemptSupply: 2_000_000,
    });
    expect(w.outputVat).toBe(0);
    expect(w.zeroRateSupply).toBe(5_000_000);
    expect(w.exemptSupply).toBe(2_000_000);
  });

  it("매입세액·기납부를 빼 차감납부한다", () => {
    const w = vatWorksheet({
      ...emptyVatInput(),
      taxableSupply: 10_000_000,
      inputVat: 300_000,
      prepaid: 200_000,
    });
    expect(w.payable).toBe(700_000);
    expect(w.remaining).toBe(500_000);
  });

  it("간이과세는 부가가치율 없이 매출·납부세액을 만들지 않는다", () => {
    const w = vatWorksheet({
      ...emptyVatInput(),
      taxpayer: "simplified",
      taxableSupply: 10_000_000,
      inputVat: 300_000,
    });
    expect(w.outputVat).toBe(0);
    expect(w.payable).toBe(0);
    expect(w.inputVat).toBe(300_000);
    expect(w.note).toMatch(/부가가치율/);
  });

  it("면세는 매출·납부세액 0", () => {
    const w = vatWorksheet({ ...emptyVatInput(), taxpayer: "exempt", taxableSupply: 10_000_000, inputVat: 1 });
    expect(w.outputVat).toBe(0);
    expect(w.payable).toBe(0);
    expect(w.note).toMatch(/면세/);
  });

  it("법인이 간이를 골라도 일반과세 10%로 돌린다", () => {
    const w = vatWorksheet({
      ...emptyVatInput(),
      entity: "corporation",
      taxpayer: "simplified",
      taxableSupply: 10_000_000,
    });
    expect(w.taxpayer).toBe("general");
    expect(w.outputVat).toBe(1_000_000);
    expect(w.note).toMatch(/간이과세 없음/);
  });

  it("개인 면세는 2월 10일 현황신고가 달력에 있다", () => {
    expect(VAT_FILING_CALENDAR.some((r) => r.id === "exempt_status" && r.due.includes("2.10"))).toBe(true);
    expect(vatFilingRows("individual").some((r) => r.id === "exempt_status")).toBe(true);
    expect(vatFilingRows("corporation").some((r) => r.id === "exempt_status")).toBe(false);
    expect(vatFilingRows("corporation").some((r) => r.id.startsWith("simplified"))).toBe(false);
  });
});
