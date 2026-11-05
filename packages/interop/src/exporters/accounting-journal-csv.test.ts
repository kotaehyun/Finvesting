import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  buildAccountingJournalXlsx,
  exportDouzoneSmartACsv,
  exportSemuSarangCsv,
  exportWehagoCsv,
  type ExportJournalRow,
} from "./accounting-journal-csv";

describe("accounting-journal-csv", () => {
  const sampleRows: ExportJournalRow[] = [
    {
      voucherNo: 1,
      lineNo: 1,
      date: "2026-10-01",
      side: "debit",
      accountCode: "811",
      accountName: "복리후생비",
      counterparty: "스타벅스",
      amount: 4500,
      memo: "커피 음료 결제",
    },
    {
      voucherNo: 1,
      lineNo: 2,
      date: "2026-10-01",
      side: "credit",
      accountCode: "253",
      accountName: "미지급금(카드)",
      counterparty: "현대카드",
      amount: 4500,
      memo: "커피 음료 결제",
    },
  ];

  it("더존 Smart A CSV 생성 및 UTF-8 BOM과 구분코드(3, 4)를 확인한다", () => {
    const csv = exportDouzoneSmartACsv(sampleRows);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("20261001");
    expect(csv).toContain("복리후생비");
    expect(csv).toContain("미지급금(카드)");
    expect(csv).toContain("3"); // 차변
    expect(csv).toContain("4"); // 대변
  });

  it("위하고 WEHAGO CSV 생성 및 차변/대변 텍스트 구분을 확인한다", () => {
    const csv = exportWehagoCsv(sampleRows);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("2026-10-01");
    expect(csv).toContain("차변");
    expect(csv).toContain("대변");
    expect(csv).toContain("합계금액");
  });

  it("세무사랑 Pro CSV 생성 및 월/일 분리 컬럼을 확인한다", () => {
    const csv = exportSemuSarangCsv(sampleRows);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("전표번호");
    expect(csv).toContain("계정코드");
  });

  it("4개 시트 통합 엑셀 워크북을 정상 생성한다", () => {
    const uint8 = buildAccountingJournalXlsx(sampleRows);
    expect(uint8.byteLength).toBeGreaterThan(100);

    const wb = XLSX.read(uint8, { type: "buffer" });
    expect(wb.SheetNames).toEqual([
      "더존_SmartA",
      "위하고_WEHAGO",
      "세무사랑Pro",
      "복식부기_분개장",
    ]);

    const sheet1 = XLSX.utils.sheet_to_json(wb.Sheets["더존_SmartA"]!);
    expect(sheet1).toHaveLength(2);
  });
});
