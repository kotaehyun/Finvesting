import { describe, expect, it } from "vitest";
import { filterDuplicateTransactions, dupKey } from "./transactions-filter";

describe("filterDuplicateTransactions", () => {
  it("최초 업로드: 동일 일자·금액·가맹점의 정상 반복 결제 2건을 모두 보존한다", () => {
    const incoming = [
      { date: "2026-09-14", amount: 4500, direction: "out", merchant: "Starbucks", memo: "아메리카노" },
      { date: "2026-09-14", amount: 4500, direction: "out", merchant: "Starbucks", memo: "아메리카노" },
    ];
    const existing: typeof incoming = [];

    const toInsert = filterDuplicateTransactions(incoming, existing);
    expect(toInsert).toHaveLength(2);
    expect(toInsert).toEqual(incoming);
  });

  it("동일 파일 재업로드: 이미 DB에 2건이 있으면 추가 삽입은 0건이다", () => {
    const incoming = [
      { date: "2026-09-14", amount: 4500, direction: "out", merchant: "Starbucks", memo: "아메리카노" },
      { date: "2026-09-14", amount: 4500, direction: "out", merchant: "Starbucks", memo: "아메리카노" },
    ];
    const existing = [
      { date: "2026-09-14", amount: 4500, direction: "out", merchant: "Starbucks", memo: "아메리카노" },
      { date: "2026-09-14", amount: 4500, direction: "out", merchant: "Starbucks", memo: "아메리카노" },
    ];

    const toInsert = filterDuplicateTransactions(incoming, existing);
    expect(toInsert).toHaveLength(0);
  });

  it("추가 거래 발생: DB에 1건이 있고 신규 파일에 2건이 있으면 초과한 1건만 추가한다", () => {
    const incoming = [
      { date: "2026-09-14", amount: 4500, direction: "out", merchant: "Starbucks", memo: "아메리카노" },
      { date: "2026-09-14", amount: 4500, direction: "out", merchant: "Starbucks", memo: "아메리카노" },
    ];
    const existing = [
      { date: "2026-09-14", amount: 4500, direction: "out", merchant: "Starbucks", memo: "아메리카노" },
    ];

    const toInsert = filterDuplicateTransactions(incoming, existing);
    expect(toInsert).toHaveLength(1);
  });

  it("다양한 거래가 섞여 있을 때 고유 거래 및 반복 거래가 올바르게 분류된다", () => {
    const incoming = [
      { date: "2026-09-14", amount: 10000, direction: "in", memo: "입금" },
      { date: "2026-09-14", amount: 4500, direction: "out", merchant: "Starbucks" },
      { date: "2026-09-14", amount: 4500, direction: "out", merchant: "Starbucks" },
      { date: "2026-09-15", amount: 20000, direction: "out", merchant: "Mart" },
    ];
    const existing = [
      { date: "2026-09-14", amount: 10000, direction: "in", memo: "입금" },
      { date: "2026-09-14", amount: 4500, direction: "out", merchant: "Starbucks" },
    ];

    const toInsert = filterDuplicateTransactions(incoming, existing);
    expect(toInsert).toHaveLength(2);
    expect(toInsert).toEqual([
      { date: "2026-09-14", amount: 4500, direction: "out", merchant: "Starbucks" },
      { date: "2026-09-15", amount: 20000, direction: "out", merchant: "Mart" },
    ]);
  });
});
