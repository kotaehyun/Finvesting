/**
 * 한국 주요 회계/세무 프로그램 표준 전표 변환 및 내보내기 엔진
 * 1. 더존 Smart A / iCube (더존비즈온 일반전표 업로드 규격)
 * 2. 위하고 WEHAGO (전자전표 일괄 업로드 CSV/XLSX 규격)
 * 3. 세무사랑 Pro / 뉴젠 K-Lep (일반전표 엑셀 업로드 규격)
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ExportJournalRow {
  voucherNo: number;
  lineNo: number;
  date: string; // YYYY-MM-DD
  side: "debit" | "credit";
  accountCode: string;
  accountName: string;
  counterparty: string;
  amount: number;
  memo: string;
}

function formatDateDigits(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

function getMonthDay(dateStr: string): { month: string; day: string } {
  const parts = dateStr.split("-");
  return {
    month: parts[1] || "01",
    day: parts[2] || "01",
  };
}

/**
 * 1. 더존 Smart A 일반전표 엑셀/CSV 업로드 규격
 * 구분: 3(차변), 4(대변)
 */
export function exportDouzoneSmartACsv(rows: ExportJournalRow[]): string {
  const formatted = rows.map((r) => ({
    일자: formatDateDigits(r.date),
    전표번호: r.voucherNo,
    라인: r.lineNo,
    구분: r.side === "debit" ? "3" : "4",
    계정코드: r.accountCode,
    계정과목명: r.accountName,
    거래처코드: "",
    거래처명: r.counterparty || "",
    차변금액: r.side === "debit" ? r.amount : "",
    대변금액: r.side === "credit" ? r.amount : "",
    적요: r.memo || "",
  }));

  const csv = Papa.unparse(formatted);
  return "\uFEFF" + csv;
}

/**
 * 2. 위하고 (WEHAGO) 전자전표 일괄 업로드 규격
 * 구분: 차변, 대변
 */
export function exportWehagoCsv(rows: ExportJournalRow[]): string {
  const formatted = rows.map((r) => ({
    회계일자: r.date,
    전표번호: r.voucherNo,
    순번: r.lineNo,
    전표구분: r.side === "debit" ? "차변" : "대변",
    계정코드: r.accountCode,
    계정과목: r.accountName,
    거래처명: r.counterparty || "",
    공급가액: r.amount,
    부가세: 0,
    합계금액: r.amount,
    적요: r.memo || "",
  }));

  const csv = Papa.unparse(formatted);
  return "\uFEFF" + csv;
}

/**
 * 3. 세무사랑 Pro / 뉴젠 K-Lep 일반전표 업로드 규격
 * 구분: 3(차변), 4(대변)
 */
export function exportSemuSarangCsv(rows: ExportJournalRow[]): string {
  const formatted = rows.map((r) => {
    const { month, day } = getMonthDay(r.date);
    return {
      월: month,
      일: day,
      전표번호: r.voucherNo,
      구분: r.side === "debit" ? "3" : "4",
      계정코드: r.accountCode,
      계정과목: r.accountName,
      거래처: r.counterparty || "",
      금액: r.amount,
      적요: r.memo || "",
    };
  });

  const csv = Papa.unparse(formatted);
  return "\uFEFF" + csv;
}

/**
 * 4. 통합 엑셀 워크북 (.xlsx) 생성
 * 시트 1: 더존_SmartA
 * 시트 2: 위하고_WEHAGO
 * 시트 3: 세무사랑Pro
 * 시트 4: 분개장_전체내역
 */
export function buildAccountingJournalXlsx(rows: ExportJournalRow[]): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Sheet 1: 더존 Smart A
  const douzoneData = rows.map((r) => ({
    일자: formatDateDigits(r.date),
    전표번호: r.voucherNo,
    라인: r.lineNo,
    구분: r.side === "debit" ? "3" : "4",
    계정코드: r.accountCode,
    계정과목명: r.accountName,
    거래처코드: "",
    거래처명: r.counterparty || "",
    차변금액: r.side === "debit" ? r.amount : "",
    대변금액: r.side === "credit" ? r.amount : "",
    적요: r.memo || "",
  }));
  const douzoneSheet = XLSX.utils.json_to_sheet(douzoneData);
  douzoneSheet["!cols"] = [
    { wch: 10 },
    { wch: 8 },
    { wch: 6 },
    { wch: 6 },
    { wch: 10 },
    { wch: 16 },
    { wch: 10 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, douzoneSheet, "더존_SmartA");

  // Sheet 2: 위하고 WEHAGO
  const wehagoData = rows.map((r) => ({
    회계일자: r.date,
    전표번호: r.voucherNo,
    순번: r.lineNo,
    전표구분: r.side === "debit" ? "차변" : "대변",
    계정코드: r.accountCode,
    계정과목: r.accountName,
    거래처명: r.counterparty || "",
    공급가액: r.amount,
    부가세: 0,
    합계금액: r.amount,
    적요: r.memo || "",
  }));
  const wehagoSheet = XLSX.utils.json_to_sheet(wehagoData);
  wehagoSheet["!cols"] = [
    { wch: 12 },
    { wch: 8 },
    { wch: 6 },
    { wch: 8 },
    { wch: 10 },
    { wch: 16 },
    { wch: 20 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wehagoSheet, "위하고_WEHAGO");

  // Sheet 3: 세무사랑 Pro
  const semuData = rows.map((r) => {
    const { month, day } = getMonthDay(r.date);
    return {
      월: month,
      일: day,
      전표번호: r.voucherNo,
      구분: r.side === "debit" ? "3" : "4",
      계정코드: r.accountCode,
      계정과목: r.accountName,
      거래처: r.counterparty || "",
      금액: r.amount,
      적요: r.memo || "",
    };
  });
  const semuSheet = XLSX.utils.json_to_sheet(semuData);
  semuSheet["!cols"] = [
    { wch: 6 },
    { wch: 6 },
    { wch: 8 },
    { wch: 6 },
    { wch: 10 },
    { wch: 16 },
    { wch: 20 },
    { wch: 14 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, semuSheet, "세무사랑Pro");

  // Sheet 4: 복식부기 분개장 요약
  const summaryData = rows.map((r) => ({
    회계일자: r.date,
    전표번호: r.voucherNo,
    구분: r.side === "debit" ? "차변(Debit)" : "대변(Credit)",
    계정코드: r.accountCode,
    계정과목: r.accountName,
    차변금액: r.side === "debit" ? r.amount : 0,
    대변금액: r.side === "credit" ? r.amount : 0,
    거래처: r.counterparty || "",
    적요: r.memo || "",
  }));
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet["!cols"] = [
    { wch: 12 },
    { wch: 8 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, summarySheet, "복식부기_분개장");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new Uint8Array(buf);
}
