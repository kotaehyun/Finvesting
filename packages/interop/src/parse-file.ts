import Papa from "papaparse";
import * as XLSX from "xlsx";
import { docxToRows } from "./docx";

export type TableFileKind = "csv" | "xlsx" | "xls" | "docx" | "doc" | "unknown";

export function detectTableFileKind(filename: string): TableFileKind {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) return "csv";
  if (lower.endsWith(".xlsx")) return "xlsx";
  if (lower.endsWith(".xls")) return "xls";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".doc")) return "doc";
  return "unknown";
}

// CSV/XLSX 파일을 문자열 2차원 배열로. 은행 내보내기는 EUC-KR인 경우가 있어 호출 측에서 디코딩 후 넘긴다.
export function csvToRows(text: string): string[][] {
  const r = Papa.parse<string[]>(text.replace(/^﻿/, ""), { skipEmptyLines: true });
  return r.data.map((row) => row.map((c) => String(c ?? "").trim()));
}

export function xlsxToRows(buf: ArrayBuffer, sheet?: string): string[][] {
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[sheet ?? wb.SheetNames[0]!]!;
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: "" });
  return rows.map((row) => row.map((c) => String(c ?? "").trim())).filter((r) => r.some((c) => c !== ""));
}

/** 헤더 행 위치를 찾는다 — 은행 파일은 상단에 안내문이 있는 경우가 많다. */
export function findHeaderRow(rows: string[][], mustInclude: string[]): number {
  return rows.findIndex((r) => mustInclude.every((k) => r.some((c) => c.includes(k))));
}

export function toNumber(s: string): number {
  const n = Number(String(s).replace(/[,원\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** 빈 칸은 0이 아니라 없음. 잔액 컬럼용. */
export function parseOptionalNumber(s: string): number | undefined {
  const t = String(s).trim();
  if (!t) return undefined;
  const n = Number(t.replace(/[,원\s]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

export function rowsToXlsx(rows: string[][], sheetName = "Sheet1"): Uint8Array {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return new Uint8Array(XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer);
}

/** CSV·엑셀·워드 표를 같은 2차원 배열로. 호출 측이 CSV 텍스트를 디코딩해 넘긴다. */
export function fileToRows(filename: string, buf: Uint8Array, csvText?: string): string[][] {
  const kind = detectTableFileKind(filename);
  if (kind === "doc") throw new Error("구형 .doc는 지원하지 않습니다. Word에서 .docx로 저장하세요");
  if (kind === "xlsx" || kind === "xls") {
    const ab = new ArrayBuffer(buf.byteLength);
    new Uint8Array(ab).set(buf);
    return xlsxToRows(ab);
  }
  if (kind === "docx") return docxToRows(buf);
  return csvToRows(csvText ?? new TextDecoder("utf-8").decode(buf));
}

export function toIsoDate(s: string): string {
  // 2026.09.02 / 2026-09-02 / 20260902 / 2026/09/02 → 2026-09-02
  const m = s.match(/(\d{4})[.\-\/]?(\d{2})[.\-\/]?(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : s;
}
