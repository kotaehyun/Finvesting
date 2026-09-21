// 시산 CSV. 홈택스 제출·더존 업로드가 아님. 빈 칸은 금액 0이 아님.

export type SlotWon = number | null;

export function parseSlotWon(raw: string): SlotWon {
  const t = raw.replace(/[^\d]/g, "");
  if (t === "") return null;
  const n = Math.floor(Number(t));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function slotWonText(n: SlotWon): string {
  return n == null ? "" : String(n);
}

/** 기초·감소·증가를 다 넣은 뒤에만 기말. 하나라도 칸이면 칸. */
export function closingBalance(opening: SlotWon, decrease: SlotWon, increase: SlotWon): SlotWon {
  if (opening == null || decrease == null || increase == null) return null;
  return opening - decrease + increase;
}

export type FormCsvMeta = {
  form: string;
  basis: string;
  plain: string;
};

const BOM = "\uFEFF";

export function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function formCsv(meta: FormCsvMeta, headers: string[], rows: string[][]): string {
  const lines: string[][] = [
    ["서식", meta.form],
    ["근거", meta.basis],
    ["직역", meta.plain],
    ["주의", "시산. 홈택스 제출·더존 업로드 파일이 아님. 빈 칸은 금액 0이 아님."],
    [],
    headers,
    ...rows,
  ];
  return `${BOM}${lines.map((r) => r.map(csvEscape).join(",")).join("\r\n")}\r\n`;
}

export function slotCsvCell(n: SlotWon): string {
  return n == null ? "" : String(n);
}
