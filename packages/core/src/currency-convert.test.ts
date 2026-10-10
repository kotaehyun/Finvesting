import { describe, expect, it } from "vitest";
import { convertAccountBalances } from "./currency-convert";

describe("convertAccountBalances", () => {
  it("원화 전용 계좌는 1:1로 원화 유형별 합계에 반영된다", () => {
    const accts = [
      { type: "checking", currency: "KRW", balance: 1_000_000 },
      { type: "savings", currency: "KRW", balance: 2_000_000 },
    ];
    const r = convertAccountBalances(accts, {});
    expect(r.byTypeKrw).toEqual({ checking: 1_000_000, savings: 2_000_000 });
    expect(r.byCurrency).toEqual({ KRW: 3_000_000 });
    expect(r.unconvertedCount).toBe(0);
    expect(r.isFxComplete).toBe(true);
  });

  it("USD 계좌는 환율(USDKRW)을 적용하여 원화로 환산 합산된다 (USD 1,000 != 1,000원)", () => {
    const accts = [
      { type: "checking", currency: "KRW", balance: 5_000_000 },
      { type: "brokerage", currency: "USD", balance: 1_000 },
    ];
    // 환율 1,350원
    const r = convertAccountBalances(accts, { USD: 1350 });
    expect(r.byTypeKrw.checking).toBe(5_000_000);
    expect(r.byTypeKrw.brokerage).toBe(1_350_000); // 1,000 * 1,350
    expect(r.byCurrency).toEqual({ KRW: 5_000_000, USD: 1_000 });
    expect(r.unconvertedCount).toBe(0);
    expect(r.isFxComplete).toBe(true);
  });

  it("환율 정보가 누락된 외화 계좌는 1:1로 왜곡 합산하지 않고 미환산으로 분류한다", () => {
    const accts = [
      { type: "checking", currency: "KRW", balance: 5_000_000 },
      { type: "brokerage", currency: "USD", balance: 1_000 },
      { type: "checking", currency: "EUR", balance: 500 },
    ];
    // 환율 없음
    const r = convertAccountBalances(accts, { USD: null, EUR: undefined });
    expect(r.byTypeKrw.checking).toBe(5_000_000);
    expect(r.byTypeKrw.brokerage).toBeUndefined(); // 1,000원으로 잘못 더해지지 않음
    expect(r.byCurrency).toEqual({ KRW: 5_000_000, USD: 1_000, EUR: 500 });
    expect(r.unconvertedCount).toBe(2);
    expect(r.unconvertedCurrencies).toContain("USD");
    expect(r.unconvertedCurrencies).toContain("EUR");
    expect(r.isFxComplete).toBe(false);
  });

  it("외화 부채(대출, 카드)도 환율이 정확히 적용되어 원화 부채로 환산된다", () => {
    const accts = [
      { type: "card", currency: "USD", balance: 100 },
      { type: "loan", currency: "KRW", balance: 10_000_000 },
    ];
    const r = convertAccountBalances(accts, { USD: 1400 });
    expect(r.byTypeKrw.card).toBe(140_000); // 100 * 1400
    expect(r.byTypeKrw.loan).toBe(10_000_000);
  });
});
