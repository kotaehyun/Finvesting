import { describe, expect, it } from "vitest";
import { buildPositions, unrealizedPnl, compareTradesForReplay, type Position } from "./portfolio";

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

  it("소수점 수량 분할 매도 후 전량 매도 시 잔량 0 및 평단 초기화 (0.3 - 0.1 - 0.2)", () => {
    const r = buildPositions([
      { instrumentId: "btc", side: "buy", quantity: 0.3, price: 100_000_000 },
      { instrumentId: "btc", side: "sell", quantity: 0.1, price: 110_000_000 },
      { instrumentId: "btc", side: "sell", quantity: 0.2, price: 120_000_000 },
    ]).get("btc")!;
    expect(r.quantity).toBe(0);
    expect(r.avgCost).toBe(0);
    expect(r.avgFxRate).toBe(1);
    expect(r.realizedPnl).toBe(5_000_000); // 100만 + 400만
  });

  it("8자리 소수점 최소 단위(1 satoshi) 매수 후 전량 매도 및 초과 매도 거절", () => {
    const r = buildPositions([
      { instrumentId: "btc", side: "buy", quantity: 0.00000001, price: 100_000_000 },
      { instrumentId: "btc", side: "sell", quantity: 0.00000001, price: 100_000_000 },
    ]).get("btc")!;
    expect(r.quantity).toBe(0);

    // 보유 0.2에서 0.20000001 매도는 거부되어야 함
    expect(() => buildPositions([
      { instrumentId: "btc", side: "buy", quantity: 0.2, price: 100_000_000 },
      { instrumentId: "btc", side: "sell", quantity: 0.20000001, price: 100_000_000 },
    ])).toThrow(/매도 수량이 보유\(0.2\)보다 많습니다/);
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

describe("compareTradesForReplay", () => {
  it("동일 시각에 매수와 매도가 있으면 매수(buy)가 매도(sell)보다 먼저 정렬된다", () => {
    const sameTime = new Date("2026-09-15T10:00:00Z");
    // 매도 UUID가 매수 UUID보다 사전순으로 앞서더라도 매수가 먼저 와야 함
    const sellTrade = {
      id: "00000000-0000-0000-0000-000000000001",
      instrumentId: "aapl",
      side: "sell" as const,
      quantity: 1,
      price: 150,
      tradedAt: sameTime,
      createdAt: new Date("2026-09-15T10:01:00Z"),
    };
    const buyTrade = {
      id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
      instrumentId: "aapl",
      side: "buy" as const,
      quantity: 1,
      price: 140,
      tradedAt: sameTime,
      createdAt: new Date("2026-09-15T10:00:30Z"),
    };

    const sorted = [sellTrade, buyTrade].sort(compareTradesForReplay);
    expect(sorted[0]!.id).toBe(buyTrade.id);
    expect(sorted[1]!.id).toBe(sellTrade.id);

    // buildPositions 실행 시 매도가 먼저 실행되어 에러가 발생하는 일 없이 정상 0주로 계산
    const positions = buildPositions(sorted);
    expect(positions.get("aapl")?.quantity).toBe(0);
    expect(positions.get("aapl")?.realizedPnl).toBe(10);
  });

  it("동일 시각 동일 side(매수)일 때는 시스템 등록일시(createdAt) 순으로 정렬된다", () => {
    const sameTime = new Date("2026-09-15T10:00:00Z");
    const buy1 = {
      id: "z-id",
      instrumentId: "aapl",
      side: "buy" as const,
      quantity: 1,
      price: 100,
      tradedAt: sameTime,
      createdAt: new Date("2026-09-15T10:00:01Z"),
    };
    const buy2 = {
      id: "a-id",
      instrumentId: "aapl",
      side: "buy" as const,
      quantity: 1,
      price: 120,
      tradedAt: sameTime,
      createdAt: new Date("2026-09-15T10:00:02Z"),
    };

    const sorted = [buy2, buy1].sort(compareTradesForReplay);
    expect(sorted[0]!.id).toBe("z-id");
    expect(sorted[1]!.id).toBe("a-id");
  });
});
