import { describe, expect, it } from "vitest";
import { emptyGitInput, gitWorksheet, GIT_FILING_CALENDAR } from "./gitax";

describe("gitWorksheet", () => {
  it("과세표준에 세율을 곱하지 않는다", () => {
    const w = gitWorksheet({ ...emptyGitInput(), taxableIncome: 50_000_000 });
    expect(w.incomeTax).toBe(0);
    expect(GIT_FILING_CALENDAR[0]?.due).toMatch(/5\.1/);
  });

  it("넣은 소득세의 10%만 지방세", () => {
    const w = gitWorksheet({ taxableIncome: 0, incomeTax: 1_000_000, prepaid: 200_000 });
    expect(w.localTax).toBe(100_000);
    expect(w.remaining).toBe(900_000);
  });
});
