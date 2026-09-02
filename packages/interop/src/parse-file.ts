import Papa from "papaparse";
import * as XLSX from "xlsx";

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

export function toIsoDate(s: string): string {
  // 2026.09.02 / 2026-09-02 / 20260902 / 2026/09/02 → 2026-09-02
  const m = s.match(/(\d{4})[.\-\/]?(\d{2})[.\-\/]?(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : s;
}
