import { describe, expect, it } from "vitest";
import {
  collectKosdaqEvidenceFromRaw,
  isKrStockSymbol,
  planKosdaqMarketRepair,
} from "./instrument-market-repair";

describe("instrument-market-repair", () => {
  it("6자리만 국내 종목으로 본다", () => {
    expect(isKrStockSymbol("035420")).toBe(true);
    expect(isKrStockSymbol("AAPL")).toBe(false);
  });

  it("근거가 있으면 KOSDAQ으로 되돌리고 없으면 skip", () => {
    const plan = planKosdaqMarketRepair(
      [
        { id: "1", symbol: "035420", market: "KRX" },
        { id: "2", symbol: "005930", market: "KRX" },
        { id: "3", symbol: "AAPL", market: "NASDAQ" },
      ],
      [{ symbol: "035420", market: "KOSDAQ", reason: "trades.raw" }],
    );
    expect(plan).toEqual([
      {
        action: "restore",
        id: "1",
        symbol: "035420",
        from: "KRX",
        to: "KOSDAQ",
        reason: "trades.raw",
      },
      {
        action: "skip",
        id: "2",
        symbol: "005930",
        reason: "근거 없음(사용자 원장·관심 시장 기록 없음)",
      },
    ]);
  });

  it("raw JSON에서 KOSDAQ만 모은다", () => {
    const ev = collectKosdaqEvidenceFromRaw(
      { rows: [{ symbol: "035420", market: "KOSDAQ" }, { symbol: "005930", market: "KRX" }] },
      "import",
    );
    expect(ev).toEqual([{ symbol: "035420", market: "KOSDAQ", reason: "import" }]);
  });
});
