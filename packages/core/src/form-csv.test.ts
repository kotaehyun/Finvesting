import { describe, expect, it } from "vitest";
import { closingBalance, formCsv, parseSlotWon } from "./form-csv";
import {
  citEulCsv,
  citGapClosing,
  citGapCsv,
  CIT_FORM_50_GAP,
  CIT_FORM_54,
  emptyCitAmountLine,
  emptyCitEulLines,
  emptyCitGapAmounts,
  emptyShareChangeLines,
  shareChangeCsv,
  shareClosing,
} from "./cit-schedules";
import { journalCsv } from "./biz-journal";
import { emptyUnlistedCgt, unlistedCgtCsv, unlistedCgtSheet } from "./unlisted-filing";

describe("form csv", () => {
  it("빈 칸은 0이 아니다", () => {
    expect(parseSlotWon("")).toBeNull();
    expect(parseSlotWon("1000")).toBe(1000);
    expect(closingBalance(null, 0, 0)).toBeNull();
    expect(closingBalance(100, 20, 5)).toBe(85);
  });

  it("CSV에 시산 주의와 직역이 있다", () => {
    const csv = formCsv(
      { form: "시험", basis: "근거", plain: "쉬운 말" },
      ["가", "나"],
      [["1", ""]],
    );
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toMatch(/시산/);
    expect(csv).toMatch(/홈택스 제출/);
    expect(csv).toMatch(/쉬운 말/);
    expect(csv).toMatch(/1,/);
  });
});

describe("cit schedules", () => {
  it("갑 과목은 서식 문언이다", () => {
    expect(CIT_FORM_50_GAP.rows.map((r) => r.title)).toEqual([
      "자본금",
      "자본잉여금",
      "자본조정",
      "기타포괄손익누계액",
      "이익잉여금",
    ]);
    expect(CIT_FORM_50_GAP.rows.find((r) => r.title === "자본조정")?.code).toBe("15");
    const empty = emptyCitGapAmounts();
    expect(citGapClosing(empty.capital ?? emptyCitAmountLine())).toBeNull();
    const csv = citGapCsv(empty);
    expect(csv).toMatch(/별지 제50호서식\(갑\)/);
    expect(csv).toMatch(/자본금,01,,,,,/);
  });

  it("을·주식변동은 빈 행을 빼다", () => {
    const eul = citEulCsv(emptyCitEulLines(2));
    expect(eul).toMatch(/별지 제50호서식\(을\)/);
    expect(eul).not.toMatch(/eul1/);
    const lines = emptyShareChangeLines(2);
    const first = lines[0];
    if (!first) throw new Error("row");
    first.name = "갑";
    first.opening = 10;
    first.increase = 0;
    first.decrease = 2;
    expect(shareClosing(first)).toBe(8);
    const csv = shareChangeCsv(lines);
    expect(csv).toMatch(/별지 제54호서식/);
    expect(csv).toMatch(/갑/);
    expect(csv).not.toMatch(/sh2/);
    expect(CIT_FORM_54.plain).toMatch(/비상장/);
  });
});

describe("export conservative", () => {
  it("분개 빈 행은 빼고 주석 없는 0은 칸", () => {
    const csv = journalCsv("cash", [
      { id: "j1", date: "", debitAccount: "", debitNote: "", creditAccount: "", creditNote: "", debit: 0, credit: 0, memo: "" },
      { id: "j2", date: "2026-01-01", debitAccount: "보통예금", debitNote: "국민은행", creditAccount: "매출", creditNote: "", debit: 100, credit: 100, memo: "입금" },
    ]);
    expect(csv).toMatch(/보통예금,국민은행,100,매출,,100,입금/);
    expect(csv.split("\n").filter((l) => l.startsWith("2026")).length).toBe(1);
  });

  it("양도 미입력은 금액 칸", () => {
    const input = emptyUnlistedCgt();
    const csv = unlistedCgtCsv(unlistedCgtSheet(input), input);
    expect(csv).toMatch(/양도가액,판 값,/);
    expect(csv).not.toMatch(/양도가액,판 값,0/);
  });
});
