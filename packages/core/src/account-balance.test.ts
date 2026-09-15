import { describe, expect, it } from "vitest";
import { pickLatestBalance, shouldApplyImportedBalance } from "./account-balance";

describe("pickLatestBalance", () => {
  it("내림차순 파일에서는 오래된 잔액이 아니라 늦은 날짜를 고른다", () => {
    const r = pickLatestBalance([
      { date: "2026-09-14", balanceAfter: 200_000 },
      { date: "2026-09-01", balanceAfter: 100_000 },
    ]);
    expect(r).toEqual({ date: "2026-09-14", balanceAfter: 200_000 });
  });

  it("오름차순이면 마지막 날짜의 잔액", () => {
    const r = pickLatestBalance([
      { date: "2026-09-01", balanceAfter: 100_000 },
      { date: "2026-09-14", balanceAfter: 200_000 },
    ]);
    expect(r).toEqual({ date: "2026-09-14", balanceAfter: 200_000 });
  });

  it("같은 날 여러 잔액은 시간순으로 늦은 쪽", () => {
    expect(pickLatestBalance([
      { date: "2026-09-14", balanceAfter: 100_000 },
      { date: "2026-09-14", balanceAfter: 200_000 },
    ])).toEqual({ date: "2026-09-14", balanceAfter: 200_000 });
    expect(pickLatestBalance([
      { date: "2026-09-14", balanceAfter: 200_000 },
      { date: "2026-09-14", balanceAfter: 150_000 },
      { date: "2026-09-01", balanceAfter: 50_000 },
    ])).toEqual({ date: "2026-09-14", balanceAfter: 200_000 });
  });

  it("잔액이 없는 행은 건너뛴다", () => {
    expect(pickLatestBalance([
      { date: "2026-09-14", balanceAfter: undefined },
      { date: "2026-09-13", balanceAfter: 10 },
    ])).toEqual({ date: "2026-09-13", balanceAfter: 10 });
    expect(pickLatestBalance([{ date: "2026-09-14" }])).toBeNull();
  });
});

describe("shouldApplyImportedBalance", () => {
  it("기존 거래가 없거나 가져온 날짜가 같거나 더 늦을 때만 반영", () => {
    expect(shouldApplyImportedBalance("2026-07-01", null)).toBe(true);
    expect(shouldApplyImportedBalance("2026-09-14", "2026-09-01")).toBe(true);
    expect(shouldApplyImportedBalance("2026-09-14", "2026-09-14")).toBe(true);
    expect(shouldApplyImportedBalance("2026-07-01", "2026-09-14")).toBe(false);
  });
});
