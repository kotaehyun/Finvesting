import { describe, expect, it } from "vitest";
import { TAX_EXPERT_FIRST, TAX_INTERPRET_RULES, TAX_SCREEN_CAUTION } from "./tax-caution";

describe("tax-caution", () => {
  it("절세 자문이 아니고 애매하면 근로소득이다", () => {
    expect(TAX_SCREEN_CAUTION).toMatch(/절세 자문/);
    expect(TAX_SCREEN_CAUTION).toMatch(/제20조/);
    expect(TAX_INTERPRET_RULES.some((r) => r.id === "doubt")).toBe(true);
    expect(TAX_INTERPRET_RULES.some((r) => r.id === "no_lecture")).toBe(true);
    expect(TAX_EXPERT_FIRST).toMatch(/세무사/);
    expect(TAX_EXPERT_FIRST).toMatch(/126/);
  });
});
