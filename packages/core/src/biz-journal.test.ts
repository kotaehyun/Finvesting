import { describe, expect, it } from "vitest";
import {
  accountNotePlaceholder,
  bizJournalTotals,
  emptyBizJournal,
  EQUITY_ACCOUNTS,
  missingAccountName,
  missingBankNote,
  needsBankNote,
} from "./biz-journal";

describe("bizJournal", () => {
  it("빈 전표는 차대 0으로 맞다", () => {
    const t = bizJournalTotals(emptyBizJournal(4));
    expect(t.debit).toBe(0);
    expect(t.credit).toBe(0);
    expect(t.balanced).toBe(true);
    expect(emptyBizJournal(1)[0]?.debitAccount).toBe("");
    expect(emptyBizJournal(1)[0]?.creditAccount).toBe("");
  });

  it("차대 합이 다르면 불일치", () => {
    const t = bizJournalTotals([
      {
        id: "1",
        date: "2026-01-01",
        debitAccount: "보통예금",
        debitNote: "국민은행",
        creditAccount: "매출",
        creditNote: "",
        debit: 100,
        credit: 80,
        memo: "",
      },
    ]);
    expect(t.debit).toBe(100);
    expect(t.credit).toBe(80);
    expect(t.balanced).toBe(false);
  });

  it("보통예금 주석은 은행명", () => {
    expect(needsBankNote("보통예금")).toBe(true);
    expect(needsBankNote("당좌예금")).toBe(true);
    expect(accountNotePlaceholder("보통예금")).toBe("은행명");
    expect(accountNotePlaceholder("매출")).toBe("주석");
    expect(missingBankNote("보통예금", "", 100)).toBe(true);
    expect(missingBankNote("보통예금", "국민은행", 100)).toBe(false);
    expect(missingBankNote("보통예금", "", 0)).toBe(false);
    expect(missingAccountName("", 100)).toBe(true);
    expect(missingAccountName("매출", 100)).toBe(false);
  });

  it("자본조정 계정이 있다", () => {
    expect(EQUITY_ACCOUNTS.some((a) => a.group === "자본조정")).toBe(true);
    expect(EQUITY_ACCOUNTS.find((a) => a.id === "treasury")?.label).toBe("자기주식");
  });
});
