import { describe, expect, it } from "vitest";
import { draftPayEarnings, payEarningGroupOf, summarizePayEarnings } from "./pay-earnings";

describe("draftPayEarnings", () => {
  it("고용노동부 예시 칸을 두고 세전은 기본급에 넣는다", () => {
    const rows = draftPayEarnings([], 4_200_000);
    expect(rows.find((r) => r.name === "기본급")).toEqual({ name: "기본급", amount: 4_200_000, group: "monthly" });
    expect(rows.find((r) => r.name === "연장근로수당")?.amount).toBe(0);
    expect(rows.find((r) => r.name === "상여금")?.group).toBe("irregular");
    expect(rows.some((r) => r.name === "성과급")).toBe(true);
  });

  it("저장된 금액은 유지하고 옛 이름 연장수당은 연장근로수당으로 모은다", () => {
    const rows = draftPayEarnings(
      [{ name: "기본급", amount: 3_200_000 }, { name: "연장수당", amount: 379_728 }, { name: "상여금", amount: 600_000 }],
      4_200_000,
    );
    expect(rows.find((r) => r.name === "기본급")?.amount).toBe(3_200_000);
    expect(rows.find((r) => r.name === "연장근로수당")?.amount).toBe(379_728);
    expect(rows.find((r) => r.name === "상여금")?.amount).toBe(600_000);
    expect(rows.find((r) => r.name === "가족수당")?.amount).toBe(0);
  });

  it("목록에 없는 항목은 그 밖의 임금으로 붙인다", () => {
    const rows = draftPayEarnings([{ name: "연구수당", amount: 50_000 }], 0);
    expect(rows.find((r) => r.name === "연구수당")).toEqual({ name: "연구수당", amount: 50_000, group: "custom" });
  });
});

describe("summarizePayEarnings", () => {
  it("기본급·수당·상여·성과를 나눈다", () => {
    const s = summarizePayEarnings([
      { name: "기본급", amount: 3_200_000 },
      { name: "식대", amount: 200_000 },
      { name: "상여금", amount: 400_000 },
      { name: "성과급", amount: 200_000 },
    ]);
    expect(s).toEqual({
      base: 3_200_000, allowance: 200_000, bonus: 600_000, other: 0, gross: 4_000_000,
    });
  });
});

describe("payEarningGroupOf", () => {
  it("상여금은 부정기, 없는 이름은 그 밖의 임금", () => {
    expect(payEarningGroupOf("상여금")).toBe("irregular");
    expect(payEarningGroupOf("연구수당")).toBe("custom");
  });
});
