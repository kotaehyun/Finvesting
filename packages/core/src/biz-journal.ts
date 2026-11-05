// 사업 자금·장부 분개 전표. 차변·대변에 계정과목을 따로 적는다. 원장이 없으면 금액 0. 가계 통장 CSV가 아님.

import { formCsv } from "./form-csv";

export type BizJournalLine = {
  id: string;
  date: string;
  debitAccount: string;
  debitNote: string;
  creditAccount: string;
  creditNote: string;
  debit: number;
  credit: number;
  memo: string;
};

export const BIZ_CASH_ACCOUNTS = [
  "보통예금",
  "당좌예금",
  "현금",
  "매출",
  "매입",
  "인건비",
  "부가세예수금",
  "부가세대급금",
  "차입금",
] as const;

export const BIZ_BOOK_ACCOUNTS = [
  ...BIZ_CASH_ACCOUNTS,
  "자본금",
  "자본잉여금",
  "이익잉여금",
  "자기주식",
  "자기주식처분손실",
  "기타포괄손익누계액",
] as const;

/** 예금계정은 은행별 보조. 은행 이름을 만들지 않는다. */
const BANK_NOTE_ACCOUNT = /보통예금|당좌예금|정기예금|외화예금/;

export function needsBankNote(account: string): boolean {
  return BANK_NOTE_ACCOUNT.test(account.trim());
}

export function accountNotePlaceholder(account: string): string {
  return needsBankNote(account) ? "은행명" : "주석";
}

export function missingBankNote(account: string, note: string, amount: number): boolean {
  return needsBankNote(account) && amount > 0 && note.trim() === "";
}

export function missingAccountName(account: string, amount: number): boolean {
  return amount > 0 && account.trim() === "";
}

/** 자본변동 골격. 잔액은 칸. 상법·일반기업회계기준 계정 이름만. */
export const EQUITY_ACCOUNTS = [
  { id: "capital", label: "자본금", group: "자본금", note: "액면·발행주식. 칸" },
  { id: "capital_surplus", label: "자본잉여금", group: "자본잉여금", note: "주식발행초과금 등. 칸" },
  { id: "retained", label: "이익잉여금", group: "이익잉여금", note: "칸" },
  { id: "treasury", label: "자기주식", group: "자본조정", note: "자본조정. 칸" },
  { id: "treasury_loss", label: "자기주식처분손실", group: "자본조정", note: "자본조정. 칸" },
  { id: "oci", label: "기타포괄손익누계액", group: "기타포괄", note: "칸" },
] as const;

export function emptyBizJournalLine(i: number): BizJournalLine {
  return {
    id: `j${i}`,
    date: "",
    debitAccount: "",
    debitNote: "",
    creditAccount: "",
    creditNote: "",
    debit: 0,
    credit: 0,
    memo: "",
  };
}

export function emptyBizJournal(n = 4): BizJournalLine[] {
  const count = Math.min(20, Math.max(1, Math.floor(n)));
  return Array.from({ length: count }, (_, i) => emptyBizJournalLine(i + 1));
}

export type BizJournalTotals = {
  debit: number;
  credit: number;
  balanced: boolean;
};

export function bizJournalTotals(lines: BizJournalLine[]): BizJournalTotals {
  let debit = 0;
  let credit = 0;
  for (const l of lines) {
    debit += Math.max(0, Math.floor(Number(l.debit) || 0));
    credit += Math.max(0, Math.floor(Number(l.credit) || 0));
  }
  return { debit, credit, balanced: debit === credit };
}

export function amountCell(account: string, note: string, amount: number): string {
  if (!account.trim() && !note.trim() && amount === 0) return "";
  return String(amount);
}

export function journalLineFilled(line: BizJournalLine): boolean {
  return (
    line.date.trim() !== "" ||
    line.debitAccount.trim() !== "" ||
    line.debitNote.trim() !== "" ||
    line.creditAccount.trim() !== "" ||
    line.creditNote.trim() !== "" ||
    line.memo.trim() !== "" ||
    line.debit > 0 ||
    line.credit > 0
  );
}

export const JOURNAL_CSV_HEADERS = [
  "일자",
  "차변계정과목",
  "차변주석",
  "차변",
  "대변계정과목",
  "대변주석",
  "대변",
  "적요",
] as const;

export function journalCsv(kind: "cash" | "books", lines: BizJournalLine[]): string {
  const meta = {
    form: kind === "cash" ? "사업 자금 분개장" : "사업 장부 분개장",
    basis: "복식부기 분개. 더존·홈택스 업로드 양식이 아님",
    plain:
      kind === "cash"
        ? "회사 통장·현금이 오가는 분개. 보통예금이면 주석에 은행명"
        : "모든 거래 분개. 차변 합과 대변 합이 같아야 함",
  };
  const rows = lines.filter(journalLineFilled).map((l) => [
    l.date,
    l.debitAccount,
    l.debitNote,
    amountCell(l.debitAccount, l.debitNote, l.debit),
    l.creditAccount,
    l.creditNote,
    amountCell(l.creditAccount, l.creditNote, l.credit),
    l.memo,
  ]);
  return formCsv(meta, [...JOURNAL_CSV_HEADERS], rows);
}
