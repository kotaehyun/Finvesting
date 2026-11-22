import { describe, expect, it } from "vitest";
import { explainHoldingRisk, formatRiskExplainContext } from "./risk-explain";

const btc = {
  symbol: "BTC",
  assetClass: "crypto",
  currency: "KRW",
  quantity: 1,
  marketValueKrw: 100_000,
};

describe("explainHoldingRisk", () => {
  it("보유가 없으면 비중을 말하지 않는다", () => {
    const result = explainHoldingRisk({ positions: [] });
    expect(result.status).toBe("empty");
    expect(result.lines[0]).toBe("보유 종목이 없습니다.");
    expect(result.lines.at(-1)).toBe("가격 변동폭은 계산하지 않습니다.");
  });

  it("시세가 없으면 비중을 계산하지 않는다", () => {
    const result = explainHoldingRisk({
      positions: [{ ...btc, marketValueKrw: null }],
    });
    expect(result.status).toBe("unpriced");
    expect(result.lines[0]).toBe("시세가 없어 비중을 계산하지 않습니다.");
    expect(result.lines[1]).toBe("시세 없는 종목 1개입니다.");
  });

  it("한 종목 100%와 중립 성향의 코인을 경험 규칙으로 적는다", () => {
    const result = explainHoldingRisk({ positions: [btc], riskTolerance: "moderate" });
    expect(result.status).toBe("ok");
    expect(result.lines).toContain("시세가 있는 평가액 가운데 가장 큰 종목은 BTC이고, 비중은 100.0%입니다.");
    expect(result.lines).toContain("한 종목이 40% 이상입니다. 투자성향과 같은 경험 규칙이며, 공식 위험 지표가 아닙니다.");
    expect(result.lines).toContain("자산군은 코인 100.0%입니다.");
    expect(result.lines).toContain("통화는 KRW 100.0%입니다.");
    expect(result.lines).toContain("해외 통화 보유는 없습니다.");
    expect(result.lines).toContain("코인이 100.0%이고 성향은 중립입니다. 투자성향과 같은 경험 규칙으로 20% 이상입니다.");
  });

  it("40% 미만이면 집중 문장을 넣지 않는다", () => {
    const result = explainHoldingRisk({
      positions: [
        { symbol: "A", assetClass: "stock", currency: "KRW", quantity: 1, marketValueKrw: 30 },
        { symbol: "B", assetClass: "etf", currency: "KRW", quantity: 1, marketValueKrw: 35 },
        { symbol: "C", assetClass: "stock", currency: "KRW", quantity: 1, marketValueKrw: 35 },
      ],
    });
    expect(result.lines.some((line) => line.includes("한 종목이 40%"))).toBe(false);
    expect(result.lines[0]).toBe("시세가 있는 평가액 가운데 가장 큰 종목은 B이고, 비중은 35.0%입니다.");
  });

  it("공격 성향이면 코인 20% 문장을 넣지 않는다", () => {
    const result = explainHoldingRisk({ positions: [btc], riskTolerance: "aggressive" });
    expect(result.lines.some((line) => line.includes("20%"))).toBe(false);
  });

  it("달러는 있는 환율만 적는다", () => {
    const result = explainHoldingRisk({
      positions: [{ symbol: "AAPL", assetClass: "stock", currency: "USD", quantity: 1, marketValueKrw: 50 }],
      usdkrw: 1350.5,
    });
    expect(result.lines).toContain("미국 달러 비중은 100.0%입니다. 원화 평가에 쓴 원/달러는 1350.5입니다. 환율이 바뀌면 원화 평가가 바뀝니다.");
  });

  it("같은 종목은 계좌를 합쳐 한 종목으로 본다", () => {
    const result = explainHoldingRisk({
      positions: [
        { symbol: "A", assetClass: "stock", currency: "KRW", quantity: 1, marketValueKrw: 60 },
        { symbol: "A", assetClass: "stock", currency: "KRW", quantity: 1, marketValueKrw: 40 },
      ],
    });
    expect(result.lines[0]).toBe("시세가 있는 평가액 가운데 가장 큰 종목은 A이고, 비중은 100.0%입니다.");
  });
});

describe("formatRiskExplainContext", () => {
  it("문장마다 줄을 붙인다", () => {
    const text = formatRiskExplainContext(explainHoldingRisk({ positions: [] }));
    expect(text.startsWith("- 보유 종목이 없습니다.")).toBe(true);
  });
});
