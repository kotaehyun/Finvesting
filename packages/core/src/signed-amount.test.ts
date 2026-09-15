import { describe, expect, it } from "vitest";
import { pnlTone, signedPct, signedWon } from "./signed-amount";

describe("signed amount", () => {
  it("양수는 +와 상승", () => {
    expect(signedWon(7382.4)).toBe("+7,382원");
    expect(pnlTone(7382.4)).toBe("up");
    expect(signedPct(0.123)).toBe("+12.3%");
  });

  it("음수는 −와 하락", () => {
    expect(signedWon(-1500.2)).toBe("-1,500원");
    expect(pnlTone(-1500.2)).toBe("down");
    expect(signedPct(-0.041)).toBe("-4.1%");
  });

  it("0은 기호 없이 보합", () => {
    expect(signedWon(0.4)).toBe("0원");
    expect(pnlTone(-0.4)).toBe("flat");
    expect(signedPct(0)).toBe("0.0%");
  });
});
