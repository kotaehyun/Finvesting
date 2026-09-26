import { describe, expect, it } from "vitest";
import { YEAR_END_PANES, yearEndDeductionFields } from "./year-end-deductions";

describe("yearEndDeductionFields", () => {
  it("기부금·자녀 창이 있고 금액은 칸", () => {
    expect(YEAR_END_PANES.some((p) => p.id === "donation")).toBe(true);
    expect(YEAR_END_PANES.some((p) => p.id === "family")).toBe(true);
    const slots = yearEndDeductionFields({ annualGross: 50_400_000, annualPension: 0 });
    const donation = slots.find((s) => s.id === "donation_general");
    const children = slots.find((s) => s.id === "children_count");
    expect(donation?.status).toBe("empty");
    expect(donation?.amount).toBeNull();
    expect(children?.kind).toBe("count");
    expect(children?.amount).toBeNull();
    expect(slots.find((s) => s.id === "earned_income")?.status).toBe("collected");
  });
});
