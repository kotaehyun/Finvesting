import { describe, expect, it } from "vitest";
import {
  OVERSEAS_STOCK_CGT_DEDUCTION_KRW,
  applyTradeLot,
  cashTxnsToLedgerRows,
  isOverseasEquity,
  overseasStockCgtPreview,
  seoulCalendarYear,
  sumInvestmentIncomes,
  yearEndDeductionSlots,
  type TaxTrade,
} from "./tax-year";

const aapl = (over: Partial<TaxTrade>): TaxTrade => ({
  id: "1",
  instrumentId: "aapl",
  side: "buy",
  quantity: 1,
  price: 100,
  fee: 0,
  tax: 0,
  fxRate: 1300,
  tradedAt: "2026-03-01T00:00:00+09:00",
  market: "NASDAQ",
  symbol: "AAPL",
  currency: "USD",
  assetClass: "stock",
  ...over,
});

describe("해외주식 양도 미리보기", () => {
  it("한국·코인 상장은 해외주식 양도 대상이 아니다", () => {
    expect(isOverseasEquity({ market: "KRX", symbol: "005930.KS", assetClass: "stock" })).toBe(false);
    expect(isOverseasEquity({ market: "UPBIT", symbol: "BTC", assetClass: "crypto" })).toBe(false);
    expect(isOverseasEquity({ market: "NASDAQ", symbol: "AAPL", assetClass: "stock" })).toBe(true);
    expect(isOverseasEquity({ market: "NYSE", symbol: "SPY", assetClass: "etf" })).toBe(true);
  });

  it("서울 달력 연도를 쓴다", () => {
    expect(seoulCalendarYear("2026-01-01T00:30:00+09:00")).toBe(2026);
    expect(seoulCalendarYear("2025-12-31T23:30:00+09:00")).toBe(2025);
  });

  it("차익이 250만 이하면 과세대상 0이다. 세율은 곱하지 않는다", () => {
    const trades = [
      aapl({ id: "b", side: "buy", quantity: 1, price: 100, fxRate: 1000, tradedAt: "2025-06-01T00:00:00+09:00" }),
      aapl({ id: "s", side: "sell", quantity: 1, price: 500, fxRate: 1000, tradedAt: "2026-06-01T00:00:00+09:00" }),
    ];
    const r = overseasStockCgtPreview(trades, 2026);
    expect(r.realizedKrw).toBe(400_000);
    expect(r.deductionKrw).toBe(OVERSEAS_STOCK_CGT_DEDUCTION_KRW);
    expect(r.deductionAppliedKrw).toBe(400_000);
    expect(r.taxableKrw).toBe(0);
    expect(r.sellCount).toBe(1);
  });

  it("차익이 공제보다 크면 과세대상만 남긴다", () => {
    const trades = [
      aapl({ id: "b", side: "buy", quantity: 1, price: 100, fxRate: 10000, tradedAt: "2025-01-01T00:00:00+09:00" }),
      aapl({ id: "s", side: "sell", quantity: 1, price: 400, fxRate: 10000, tradedAt: "2026-08-01T00:00:00+09:00" }),
    ];
    const r = overseasStockCgtPreview(trades, 2026);
    expect(r.realizedKrw).toBe(3_000_000);
    expect(r.deductionAppliedKrw).toBe(2_500_000);
    expect(r.taxableKrw).toBe(500_000);
  });

  it("국내 종목 매도는 합에 넣지 않는다", () => {
    const trades: TaxTrade[] = [
      {
        ...aapl({ id: "b" }),
        instrumentId: "krx",
        symbol: "005930.KS",
        market: "KRX",
        currency: "KRW",
        fxRate: 1,
        price: 70000,
      },
      {
        ...aapl({ id: "s", side: "sell", tradedAt: "2026-08-01T00:00:00+09:00" }),
        instrumentId: "krx",
        symbol: "005930.KS",
        market: "KRX",
        currency: "KRW",
        fxRate: 1,
        price: 80000,
      },
    ];
    const r = overseasStockCgtPreview(trades, 2026);
    expect(r.sellCount).toBe(0);
    expect(r.realizedKrw).toBe(0);
    expect(r.taxableKrw).toBe(0);
  });

  it("손실이면 과세대상 0이고 공제를 쓰지 않는다. 이월은 계산하지 않는다", () => {
    const trades = [
      aapl({ id: "b", price: 200, fxRate: 1000 }),
      aapl({ id: "s", side: "sell", price: 100, fxRate: 1000, tradedAt: "2026-09-01T00:00:00+09:00" }),
    ];
    const r = overseasStockCgtPreview(trades, 2026);
    expect(r.realizedKrw).toBe(-100_000);
    expect(r.deductionAppliedKrw).toBe(0);
    expect(r.taxableKrw).toBe(0);
  });

  it("다른 해 매도는 그 해에만 잡는다", () => {
    const trades = [
      aapl({ id: "b", tradedAt: "2024-01-01T00:00:00+09:00" }),
      aapl({ id: "s1", side: "sell", quantity: 0.5, tradedAt: "2025-06-01T00:00:00+09:00", price: 150, fxRate: 1300 }),
      aapl({ id: "s2", side: "sell", quantity: 0.5, tradedAt: "2026-06-01T00:00:00+09:00", price: 150, fxRate: 1300 }),
    ];
    expect(overseasStockCgtPreview(trades, 2025).sellCount).toBe(1);
    expect(overseasStockCgtPreview(trades, 2026).sellCount).toBe(1);
    expect(overseasStockCgtPreview(trades, 2024).sellCount).toBe(0);
  });

  it("평단법 실현손익은 applyTradeLot과 같다", () => {
    const { sellPnlKrw } = applyTradeLot(
      { quantity: 1, avgCost: 100, avgFxRate: 1300 },
      { instrumentId: "a", side: "sell", quantity: 1, price: 110, fxRate: 1400 },
    );
    expect(sellPnlKrw).toBeCloseTo(110 * 1400 - 100 * 1300);
  });
});

describe("배당·이자·공제 칸·장부", () => {
  it("해당 연 배당·이자만 합치고 세율을 곱하지 않는다", () => {
    const r = sumInvestmentIncomes([
      { kind: "dividend", gross: 100, withheldTax: 15.4, paidOn: "2026-03-01" },
      { kind: "interest", gross: 50, withheldTax: 7, paidOn: "2026-04-01" },
      { kind: "dividend", gross: 999, withheldTax: 1, paidOn: "2025-03-01" },
    ], 2026);
    expect(r.rowCount).toBe(2);
    expect(r.dividendGross).toBe(100);
    expect(r.dividendWithheld).toBe(15.4);
    expect(r.interestGross).toBe(50);
  });

  it("급여가 있으면 근로소득공제·본인공제만 채우고 의료비·카드는 칸이다", () => {
    const slots = yearEndDeductionSlots({ annualGross: 50_400_000, annualPension: 0 });
    const earned = slots.find((s) => s.id === "earned_income");
    const medical = slots.find((s) => s.id === "medical");
    expect(earned?.status).toBe("collected");
    expect(earned?.amount).toBeGreaterThan(0);
    expect(medical?.status).toBe("empty");
    expect(medical?.amount).toBeNull();
  });

  it("입금은 차변, 출금은 대변이다", () => {
    const rows = cashTxnsToLedgerRows([
      { date: "2026-01-15", amount: 1000, direction: "in", category: "salary", memo: "급여" },
      { date: "2026-01-16", amount: 400, direction: "out", category: "food", merchant: "식당" },
    ]);
    expect(rows[0]).toMatchObject({ debit: 1000, credit: 0, account: "급여" });
    expect(rows[1]).toMatchObject({ debit: 0, credit: 400, account: "식비", counterparty: "식당" });
  });
});
