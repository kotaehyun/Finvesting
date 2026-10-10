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

  it("같은 날 여러 잔액은 시간(time) 또는 명시적 정렬에 따라 최신 선택", () => {
    // 1) 시간(time)이 있는 경우: 18:00(800) vs 09:00(900) -> 800 선택
    expect(pickLatestBalance([
      { date: "2026-09-14", time: "18:00:00", balanceAfter: 800 },
      { date: "2026-09-14", time: "09:00:00", balanceAfter: 900 },
    ])).toEqual({ date: "2026-09-14", time: "18:00:00", balanceAfter: 800 });

    // 2) 거래 내역 역산(amount, direction): 900에서 100 출금 후 800 -> 내림차순(최신 800) 감지
    expect(pickLatestBalance([
      { date: "2026-09-14", amount: 100, direction: "out", balanceAfter: 800 },
      { date: "2026-09-14", balanceAfter: 900 },
    ])).toEqual({ date: "2026-09-14", balanceAfter: 800 });

    // 3) Codex 재현 사례: 하루치 파일 내림차순 명시 시 최신 800 선택 (이전 900 선택 버그 방지)
    expect(pickLatestBalance([
      { date: "2026-09-14", balanceAfter: 800 },
      { date: "2026-09-14", balanceAfter: 900 },
    ], "desc")).toEqual({ date: "2026-09-14", balanceAfter: 800 });

    // 4) 다일자 내림차순 파일(첫일 > 말일) 내의 동일 날짜 다수 잔액은 최신 상단(200,000) 선택
    expect(pickLatestBalance([
      { date: "2026-09-14", balanceAfter: 200_000 },
      { date: "2026-09-14", balanceAfter: 150_000 },
      { date: "2026-09-01", balanceAfter: 50_000 },
    ])).toEqual({ date: "2026-09-14", balanceAfter: 200_000 });

    // 5) 시간/금액/정렬 힌트가 전혀 없는 단일 일자의 상이한 잔액은 안전하게 null 반환(오선택 방지)
    expect(pickLatestBalance([
      { date: "2026-09-14", balanceAfter: 800 },
      { date: "2026-09-14", balanceAfter: 900 },
    ])).toBeNull();
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
