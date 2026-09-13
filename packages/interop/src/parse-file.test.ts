import { describe, expect, it } from "vitest";
import { fileToRows, rowsToXlsx, toIsoDate, toNumber } from "./parse-file";
import { docxToRows, rowsToDocx } from "./docx";
import { genericBankImporter } from "./importers/generic-bank";
import { parseRecurringCostRows, recurringCostsToDocx, recurringCostsToXlsx } from "./importers/recurring-costs";

describe("toIsoDate", () => {
  it("여러 구분자를 YYYY-MM-DD로 맞춘다", () => {
    expect(toIsoDate("2026.09.02")).toBe("2026-09-02");
    expect(toIsoDate("2026-09-02")).toBe("2026-09-02");
    expect(toIsoDate("20260902")).toBe("2026-09-02");
    expect(toIsoDate("2026/09/02")).toBe("2026-09-02");
  });
});

describe("toNumber", () => {
  it("쉼표·원을 제거한다", () => {
    expect(toNumber("1,234원")).toBe(1234);
  });
});

describe("genericBankImporter", () => {
  it("안내문 다음의 헤더를 찾아 입출금을 파싱한다", () => {
    const rows = [
      ["조회기간", "2026-09-01"],
      ["거래일", "입금", "출금", "내용", "잔액"],
      ["2026.09.01", "1000000", "", "급여", "1000000"],
      ["2026.09.02", "", "12,000원", "점심", "988000"],
    ];
    expect(genericBankImporter.detect(rows[1]!, rows)).toBe(true);
    const r = genericBankImporter.parse(rows);
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0]).toMatchObject({ direction: "in", amount: 1_000_000, date: "2026-09-01" });
    expect(r.rows[1]).toMatchObject({ direction: "out", amount: 12_000, date: "2026-09-02" });
  });
});

describe("xlsx / docx 표 변환", () => {
  const table = [
    ["이름", "분류", "금액", "출금일", "메모"],
    ["휴대폰", "휴대폰", "55000", "15", ""],
  ];

  it("엑셀로 썼다 다시 읽는다", () => {
    const bin = rowsToXlsx(table, "고정비");
    const rows = fileToRows("fixed.xlsx", bin);
    expect(rows[0]).toEqual(table[0]);
    expect(rows[1]?.[0]).toBe("휴대폰");
    expect(parseRecurringCostRows(rows).rows[0]).toMatchObject({ name: "휴대폰", amount: 55000, category: "phone" });
  });

  it("워드 표로 썼다 다시 읽는다", () => {
    const bin = rowsToDocx(table);
    const rows = docxToRows(bin);
    expect(rows).toEqual(table);
  });

  it("고정비 엑셀·워드 내보내기를 다시 파싱한다", () => {
    const src = [{ name: "월세", category: "housing", amount: 500000, dayOfMonth: 1, memo: "관리비 별도" }];
    expect(parseRecurringCostRows(fileToRows("a.xlsx", recurringCostsToXlsx(src))).rows).toEqual(src);
    expect(parseRecurringCostRows(fileToRows("a.docx", recurringCostsToDocx(src))).rows).toEqual(src);
  });
});
