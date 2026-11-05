import { csvToRows, rowsToXlsx, toNumber } from "../parse-file";
import { rowsToDocx } from "../docx";

export type RecurringCostRow = {
  name: string;
  category: string;
  amount: number;
  dayOfMonth?: number;
  memo?: string;
};

const CAT_ALIASES: Record<string, string> = {
  phone: "phone", 휴대폰: "phone", 핸드폰: "phone", 통신: "phone",
  utilities: "utilities", 공과금: "utilities", 전기: "utilities", 가스: "utilities", 수도: "utilities",
  housing: "housing", 주거: "housing", 월세: "housing", 관리비: "housing", 임대: "housing",
  subscription: "subscription", 구독: "subscription",
  insurance: "insurance", 보험: "insurance",
  loan_repayment: "loan_repayment", 대출: "loan_repayment", 대출상환: "loan_repayment",
  misc: "misc", 기타: "misc",
};

export const RECURRING_CSV_HEADER = ["이름", "분류", "금액", "출금일", "메모"] as const;

export function normalizeRecurringCategory(raw: string) {
  const k = raw.trim().toLowerCase();
  return CAT_ALIASES[raw.trim()] ?? CAT_ALIASES[k] ?? (k || "misc");
}

function col(header: string[], row: string[], ...names: string[]) {
  const i = header.findIndex((h) => names.some((n) => h.includes(n)));
  return i >= 0 ? (row[i] ?? "").trim() : "";
}

export function parseRecurringCostRows(rows: string[][]) {
  const headerIdx = rows.findIndex((r) => r.some((c) => /이름|항목|name/i.test(c)) && r.some((c) => /금액|amount/i.test(c)));
  if (headerIdx < 0) {
    return { rows: [] as RecurringCostRow[], skipped: [{ line: 1, reason: "이름·금액 헤더가 없습니다" }] };
  }
  const header = rows[headerIdx]!;
  const out: RecurringCostRow[] = [];
  const skipped: Array<{ line: number; reason: string }> = [];
  rows.slice(headerIdx + 1).forEach((r, i) => {
    const line = headerIdx + 2 + i;
    if (!r.some((c) => c.trim())) return;
    const name = col(header, r, "이름", "항목", "name");
    const amount = toNumber(col(header, r, "금액", "amount"));
    if (!name) { skipped.push({ line, reason: "이름 없음" }); return; }
    if (!(amount > 0)) { skipped.push({ line, reason: "금액이 없습니다" }); return; }
    const dayRaw = col(header, r, "출금일", "일자", "day");
    const day = toNumber(dayRaw);
    out.push({
      name,
      category: normalizeRecurringCategory(col(header, r, "분류", "category")),
      amount,
      dayOfMonth: day >= 1 && day <= 31 ? Math.round(day) : undefined,
      memo: col(header, r, "메모", "memo") || undefined,
    });
  });
  return { rows: out, skipped };
}

export function parseRecurringCostCsv(text: string) {
  return parseRecurringCostRows(csvToRows(text));
}

function recurringTable(rows: RecurringCostRow[]): string[][] {
  return [
    [...RECURRING_CSV_HEADER],
    ...rows.map((r) => [r.name, r.category, String(Math.round(r.amount)), r.dayOfMonth != null ? String(r.dayOfMonth) : "", r.memo ?? ""]),
  ];
}

export function recurringCostsToCsv(rows: RecurringCostRow[]) {
  const lines = [
    RECURRING_CSV_HEADER.join(","),
    ...rows.map((r) => [csvCell(r.name), csvCell(r.category), String(Math.round(r.amount)), r.dayOfMonth ?? "", csvCell(r.memo ?? "")].join(",")),
  ];
  return `\uFEFF${lines.join("\n")}\n`;
}

export function recurringCostsToXlsx(rows: RecurringCostRow[]) {
  return rowsToXlsx(recurringTable(rows), "고정비");
}

export function recurringCostsToDocx(rows: RecurringCostRow[]) {
  return rowsToDocx(recurringTable(rows));
}

function csvCell(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, "\"\"")}"`;
  return s;
}
