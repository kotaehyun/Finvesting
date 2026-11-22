import { describe, expect, it } from "vitest";
import { detectRepeatMistakes, formatRepeatMistakeContext, type RepeatMistakeTrade } from "./repeat-mistake";

function trade(
  partial: Partial<RepeatMistakeTrade> & Pick<RepeatMistakeTrade, "side" | "tradedAt" | "price">,
): RepeatMistakeTrade {
  return {
    accountId: "a1",
    accountName: "증권",
    instrumentId: "i1",
    symbol: "AAA",
    name: "종목A",
    quantity: 1,
    ...partial,
  };
}

describe("detectRepeatMistakes", () => {
  it("체결이 없으면 empty다", () => {
    expect(detectRepeatMistakes([]).status).toBe("empty");
  });

  it("손실 매도 후 재매수가 2회면 목록에 넣는다", () => {
    const result = detectRepeatMistakes([
      trade({ side: "buy", tradedAt: "2026-01-01", price: 100 }),
      trade({ side: "sell", tradedAt: "2026-02-01", price: 80 }),
      trade({ side: "buy", tradedAt: "2026-03-01", price: 90 }),
      trade({ side: "sell", tradedAt: "2026-04-01", price: 70 }),
      trade({ side: "buy", tradedAt: "2026-05-01", price: 75 }),
    ]);
    expect(result.status).toBe("ok");
    expect(result.patterns).toHaveLength(1);
    expect(result.patterns[0]?.count).toBe(2);
    expect(result.patterns[0]?.symbol).toBe("AAA");
    expect(result.patterns[0]?.lastBuyAt).toBe("2026-05-01");
    expect(result.patterns[0]?.samples[0]?.realizedPnlKrw).toBeLessThan(0);
  });

  it("1회만이면 insufficient다", () => {
    const result = detectRepeatMistakes([
      trade({ side: "buy", tradedAt: "2026-01-01", price: 100 }),
      trade({ side: "sell", tradedAt: "2026-02-01", price: 80 }),
      trade({ side: "buy", tradedAt: "2026-03-01", price: 90 }),
    ]);
    expect(result.status).toBe("insufficient");
    expect(result.patterns).toEqual([]);
  });

  it("이익 매도 뒤 재매수는 세지 않는다", () => {
    const result = detectRepeatMistakes([
      trade({ side: "buy", tradedAt: "2026-01-01", price: 100 }),
      trade({ side: "sell", tradedAt: "2026-02-01", price: 150 }),
      trade({ side: "buy", tradedAt: "2026-03-01", price: 140 }),
      trade({ side: "sell", tradedAt: "2026-04-01", price: 200 }),
      trade({ side: "buy", tradedAt: "2026-05-01", price: 190 }),
    ]);
    expect(result.status).toBe("insufficient");
  });

  it("계좌가 다르면 따로 센다", () => {
    const result = detectRepeatMistakes([
      trade({ accountId: "a1", side: "buy", tradedAt: "2026-01-01", price: 100 }),
      trade({ accountId: "a1", side: "sell", tradedAt: "2026-02-01", price: 80 }),
      trade({ accountId: "a1", side: "buy", tradedAt: "2026-03-01", price: 90 }),
      trade({ accountId: "a2", accountName: "코인", side: "buy", tradedAt: "2026-01-02", price: 100 }),
      trade({ accountId: "a2", accountName: "코인", side: "sell", tradedAt: "2026-02-02", price: 80 }),
      trade({ accountId: "a2", accountName: "코인", side: "buy", tradedAt: "2026-03-02", price: 90 }),
    ]);
    expect(result.status).toBe("insufficient");
  });

  it("같은 계좌에서 종목마다 따로 센다", () => {
    const result = detectRepeatMistakes([
      trade({ instrumentId: "i1", symbol: "AAA", side: "buy", tradedAt: "2026-01-01", price: 100 }),
      trade({ instrumentId: "i1", symbol: "AAA", side: "sell", tradedAt: "2026-02-01", price: 80 }),
      trade({ instrumentId: "i1", symbol: "AAA", side: "buy", tradedAt: "2026-03-01", price: 90 }),
      trade({ instrumentId: "i1", symbol: "AAA", side: "sell", tradedAt: "2026-04-01", price: 70 }),
      trade({ instrumentId: "i1", symbol: "AAA", side: "buy", tradedAt: "2026-05-01", price: 75 }),
      trade({ instrumentId: "i2", symbol: "BBB", name: "종목B", side: "buy", tradedAt: "2026-01-01", price: 50 }),
      trade({ instrumentId: "i2", symbol: "BBB", name: "종목B", side: "sell", tradedAt: "2026-02-01", price: 40 }),
      trade({ instrumentId: "i2", symbol: "BBB", name: "종목B", side: "buy", tradedAt: "2026-03-01", price: 45 }),
    ]);
    expect(result.status).toBe("ok");
    expect(result.patterns.map((p) => p.symbol)).toEqual(["AAA"]);
  });
});

describe("formatRepeatMistakeContext", () => {
  it("횟수와 날짜만 적고 실수라고 단정하지 않는다", () => {
    const text = formatRepeatMistakeContext(detectRepeatMistakes([
      trade({ side: "buy", tradedAt: "2026-01-01", price: 100 }),
      trade({ side: "sell", tradedAt: "2026-02-01", price: 80 }),
      trade({ side: "buy", tradedAt: "2026-03-01", price: 90 }),
      trade({ side: "sell", tradedAt: "2026-04-01", price: 70 }),
      trade({ side: "buy", tradedAt: "2026-05-01", price: 75 }),
    ]));
    expect(text).toContain("AAA (종목A)");
    expect(text).toContain("2회");
    expect(text).toContain("실수라고 단정하지 않습니다");
    expect(text).not.toContain("잘못");
  });
});
