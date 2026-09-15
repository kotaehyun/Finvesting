import { describe, expect, it } from "vitest";
import { TA_LESSONS } from "./ta-lessons";

describe("ta lessons", () => {
  it("매매 권유가 아닌 설명만", () => {
    expect(TA_LESSONS.map((l) => l.id)).toEqual(["volume", "ma", "rsi", "macd", "sr", "flow"]);
    expect(TA_LESSONS.every((l) => l.body.length > 40)).toBe(true);
  });
});
