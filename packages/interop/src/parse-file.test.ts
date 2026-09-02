import { describe, expect, it } from "vitest";
import { toIsoDate, toNumber } from "./parse-file.js";
import { genericBankImporter } from "./importers/generic-bank.js";

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
