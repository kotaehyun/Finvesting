import { describe, expect, it } from "vitest";
import {
  EMPTY_INVEST_STYLE,
  buildInvestAdvice,
  formatInvestStyleContext,
  investStyleScore,
  parseInvestStyle,
  suggestedRiskFromScore,
} from "./invest-style";

describe("parse / score", () => {
  it("빈 객체는 미완료다", () => {
    expect(investStyleScore(parseInvestStyle(null))).toBeNull();
    expect(investStyleScore(parseInvestStyle({ horizon: "lt1" }))).toBeNull();
  });

  it("최저는 보수, 최고는 공격이다", () => {
    expect(investStyleScore({
      horizon: "lt1", experience: "none", lossOk: "lt10", goal: "preserve",
    })).toBe(0);
    expect(suggestedRiskFromScore(0)).toBe("conservative");
    expect(suggestedRiskFromScore(4)).toBe("conservative");
    expect(suggestedRiskFromScore(5)).toBe("moderate");
    expect(suggestedRiskFromScore(8)).toBe("moderate");
    expect(suggestedRiskFromScore(9)).toBe("aggressive");
    expect(investStyleScore({
      horizon: "over10", experience: "active", lossOk: "over30", goal: "speculate",
    })).toBe(12);
  });
});

describe("buildInvestAdvice", () => {
  it("설문과 보유 코인 비중을 짚는다", () => {
    const a = buildInvestAdvice({
      answers: { horizon: "lt1", experience: "none", lossOk: "lt10", goal: "preserve" },
      storedRisk: "aggressive",
      liquid: 7_000_000,
      invested: 3_000_000,
      emergencyFundGap: 1_000_000,
      guideNotes: ["고정비가 소득의 50%를 초과합니다. 변동 소비 상한을 줄였습니다."],
      byClass: [{ assetClass: "crypto", weight: 0.8 }, { assetClass: "stock", weight: 0.2 }],
      hasUsd: true,
      topWeight: 0.8,
      topSymbol: "BTC",
      openCount: 2,
    });
    expect(a.suggestedRisk).toBe("conservative");
    expect(a.mismatch).toBe(true);
    expect(a.bullets.some((b) => b.includes("코인"))).toBe(true);
    expect(a.bullets.some((b) => b.includes("BTC"))).toBe(true);
    expect(a.bullets.some((b) => b.includes("250만원"))).toBe(true);
    expect(formatInvestStyleContext(a)).toContain("보수");
  });

  it("보유가 없으면 종목 조언을 비운다", () => {
    const a = buildInvestAdvice({
      answers: EMPTY_INVEST_STYLE,
      storedRisk: "moderate",
      liquid: 1_000_000,
      invested: 0,
      emergencyFundGap: 0,
      guideNotes: [],
      byClass: [],
      hasUsd: false,
      topWeight: null,
      topSymbol: null,
      openCount: 0,
    });
    expect(a.complete).toBe(false);
    expect(a.bullets.some((b) => b.includes("열린 보유"))).toBe(true);
  });
});
