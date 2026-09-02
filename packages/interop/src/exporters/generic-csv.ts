import Papa from "papaparse";
import type { LedgerExporter } from "../types";

// 세무사 전달용 범용 장부 CSV (UTF-8 BOM, 엑셀에서 바로 열림)
export const genericCsvExporter: LedgerExporter = {
  id: "generic-csv",
  label: "범용 장부 CSV",
  export(rows) {
    const csv = Papa.unparse(rows.map((r) => ({
      일자: r.date, 계정과목: r.account, 차변: r.debit, 대변: r.credit, 적요: r.description, 거래처: r.counterparty ?? "", 증빙: r.evidence ?? "", 비고: r.memo ?? "",
    })));
    return { data: new TextEncoder().encode("﻿" + csv), ext: "csv" };
  },
};
