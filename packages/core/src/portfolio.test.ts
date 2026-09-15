import { describe, expect, it } from "vitest";
import { buildPositions, unrealizedPnl, type Position } from "./portfolio";

const pos = (o: Partial<Position>): Position => ({ instrumentId: "a", quantity: 0, avgCost: 0, avgFxRate: 1, realizedPnl: 0, realizedPnlKrw: 0, ...o });

describe("buildPositions", () => {
  it("매수 수수료를 평단에 포함하고 매도 실현손익에서 수수료를 뺀다", () => {
    const r = buildPositions([
      { instrumentId: "a", side: "buy", quantity: 10, price: 100, fee: 10 },
      { instrumentId: "a", side: "sell", quantity: 5, price: 120, fee: 5 },
    ]).get("a")!;
    expect(r.quantity).toBe(5);
    expect(r.avgCost).toBe(101);
    expect(r.realizedPnl).toBe(90);
    expect(r.realizedPnlKrw).toBe(90); // 원화 자산: fx=1
  });

  it("전량 매도 후 평단·환율을 되돌린다", () => {
    const r = buildPositions([
      { instrumentId: "a", side: "buy", quantity: 2, price: 50 },
      { instrumentId: "a", side: "sell", quantity: 2, price: 60 },
    ]).get("a")!;
    expect(r.quantity).toBe(0);
    expect(r.avgCost).toBe(0);
    expect(r.avgFxRate).toBe(1);
  });

  it("매수가 없는 매도나 보유보다 많은 매도는 오류다", () => {
    expect(() => buildPositions([
      { instrumentId: "a", side: "sell", quantity: 1, price: 100 },
      { instrumentId: "a", side: "buy", quantity: 1, price: 100 },
    ])).toThrow(/매도 수량/);
    expect(() => buildPositions([
      { instrumentId: "a", side: "buy", quantity: 1, price: 100 },
      { instrumentId: "a", side: "sell", quantity: 2, price: 120 },
    ])).toThrow(/매도 수량/);
  });

  it("해외 자산: 매입 환율을 가중평균하고 매도 시 환차손익을 원화 실현손익에 반영한다", () => {
    const r = buildPositions([
      { instrumentId: "aapl", side: "buy", quantity: 1, price: 100, fxRate: 1300 },
      { instrumentId: "aapl", side: "buy", quantity: 1, price: 100, fxRate: 1400 },
      { instrumentId: "aapl", side: "sell", quantity: 1, price: 100, fxRate: 1500 }, // 달러 손익 0, 환차익만
    ]).get("aapl")!;
    expect(r.avgFxRate).toBeCloseTo(1350);
    expect(r.realizedPnl).toBe(0);
    expect(r.realizedPnlKrw).toBeCloseTo(100 * 1500 - 100 * 1350); // 15,000원 환차익
  });
});

describe("unrealizedPnl", () => {
  it("평가손익과 수익률을 계산한다", () => {
    const r = unrealizedPnl(pos({ quantity: 10, avgCost: 100 }), 110);
    expect(r.marketValue).toBe(1100);
    expect(r.pnl).toBe(100);
    expect(r.pnlRate).toBeCloseTo(0.1);
    expect(r.pnlKrw).toBe(100);
  });

  it("현재 환율을 주면 원화 평가손익에 환차손익이 포함된다", () => {
    const r = unrealizedPnl(pos({ quantity: 10, avgCost: 100, avgFxRate: 1300 }), 100, 1400);
    expect(r.pnl).toBe(0);
    expect(r.pnlKrw).toBe(10 * 100 * 1400 - 10 * 100 * 1300);
    expect(r.pnlRateKrw).toBeCloseTo(100 / 1300);
  });
});
