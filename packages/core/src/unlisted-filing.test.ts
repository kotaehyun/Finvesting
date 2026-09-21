import { describe, expect, it } from "vitest";
import { emptyUnlistedCgt, UNLISTED_FILING_CALENDAR, unlistedCgtSheet } from "./unlisted-filing";

describe("unlisted filing", () => {
  it("하반기 양도 예정신고는 다음해 2월 말일", () => {
    const h2 = UNLISTED_FILING_CALENDAR.find((r) => r.id === "cgt_h2");
    expect(h2?.due).toMatch(/2월/);
    expect(h2?.article).toMatch(/제105조/);
  });

  it("양도차익만 두고 세율은 안 곱한다", () => {
    const s = unlistedCgtSheet({ ...emptyUnlistedCgt(), proceeds: 10_000_000, acquisition: 6_000_000, expenses: 500_000 });
    expect(s.gain).toBe(3_500_000);
    expect(s.note).toMatch(/세율/);
  });
});
