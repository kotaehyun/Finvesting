import { describe, it, expect } from "vitest";
import {
  calculateOverseasCapitalGainsTax,
  simulateTaxLossHarvesting,
  aggregateFinancialIncome,
  calculateYearEndTaxSettlement,
  calculateEarnedIncomeDeduction,
  calculateProgressiveTax,
  calculateCardDeduction,
  type OverseasRealizedTrade,
  type OverseasUnrealizedHolding,
  type IncomeRecord,
} from "./tax";

describe("tax.ts - 해외주식 양도소득세", () => {
  const sampleTrades: OverseasRealizedTrade[] = [
    {
      id: "t1",
      symbol: "AAPL",
      name: "Apple Inc.",
      tradedAt: "2026-04-10T09:00:00Z",
      quantity: 10,
      sellPrice: 300_000, // 3,000,000
      buyPrice: 200_000, // 2,000,000 -> gain 1,000,000
      feeAndTax: 10_000,
    },
    {
      id: "t2",
      symbol: "NVDA",
      name: "NVIDIA",
      tradedAt: "2026-06-15T09:00:00Z",
      quantity: 5,
      sellPrice: 1_200_000, // 6,000,000
      buyPrice: 600_000, // 3,000,000 -> gain 3,000,000
      feeAndTax: 20_000,
    },
    {
      id: "t3",
      symbol: "TSLA",
      name: "Tesla Inc.",
      tradedAt: "2026-08-20T09:00:00Z",
      quantity: 10,
      sellPrice: 250_000, // 2,500,000
      buyPrice: 300_000, // 3,000,000 -> loss -500,000
      feeAndTax: 10_000,
    },
  ];

  it("연간 실현손익 통산 및 250만원 기본공제 적용 세액 계산", () => {
    // AAPL: +990,000
    // NVDA: +2,980,000
    // TSLA: -510,000
    // Net Gain = 990,000 + 2,980,000 - 510,000 = 3,460,000
    const res = calculateOverseasCapitalGainsTax(sampleTrades, 2026);

    expect(res.year).toBe(2026);
    expect(res.netRealizedGain).toBe(3_460_000);
    expect(res.basicDeduction).toBe(2_500_000);
    expect(res.appliedDeduction).toBe(2_500_000);
    expect(res.taxableBase).toBe(960_000); // 3,460,000 - 2,500,000

    expect(res.nationalTax).toBe(192_000); // 960,000 * 0.20
    expect(res.localTax).toBe(19_200); // 960,000 * 0.02
    expect(res.totalEstimatedTax).toBe(211_200); // 22%
    expect(res.isTaxable).toBe(true);
  });

  it("실현이익이 250만원 이하일 경우 비과세(0원)", () => {
    const minorTrades: OverseasRealizedTrade[] = [
      {
        id: "t1",
        symbol: "AAPL",
        name: "Apple Inc.",
        tradedAt: "2026-04-10T09:00:00Z",
        quantity: 10,
        sellPrice: 220_000,
        buyPrice: 200_000,
        feeAndTax: 5_000, // gain 195,000
      },
    ];
    const res = calculateOverseasCapitalGainsTax(minorTrades, 2026);
    expect(res.netRealizedGain).toBe(195_000);
    expect(res.appliedDeduction).toBe(195_000);
    expect(res.taxableBase).toBe(0);
    expect(res.totalEstimatedTax).toBe(0);
    expect(res.isTaxable).toBe(false);
  });

  it("실현손실(마이너스)인 경우 공제 0원 및 세액 0원", () => {
    const lossTrades: OverseasRealizedTrade[] = [
      {
        id: "t1",
        symbol: "TSLA",
        name: "Tesla Inc.",
        tradedAt: "2026-05-10T09:00:00Z",
        quantity: 10,
        sellPrice: 150_000,
        buyPrice: 200_000,
        feeAndTax: 5_000, // loss -505,000
      },
    ];
    const res = calculateOverseasCapitalGainsTax(lossTrades, 2026);
    expect(res.netRealizedGain).toBe(-505_000);
    expect(res.appliedDeduction).toBe(0);
    expect(res.taxableBase).toBe(0);
    expect(res.totalEstimatedTax).toBe(0);
  });

  it("절세 시뮬레이터(Tax Loss Harvesting) 작동 확인", () => {
    const taxResult = calculateOverseasCapitalGainsTax(sampleTrades, 2026); // 초과분 960,000원
    const holdings: OverseasUnrealizedHolding[] = [
      {
        symbol: "GOOGL",
        name: "Alphabet Inc.",
        quantity: 10,
        avgBuyPrice: 200_000,
        currentPrice: 150_000,
        unrealizedPnl: -500_000, // 손실 50만
      },
      {
        symbol: "AMZN",
        name: "Amazon.com Inc.",
        quantity: 5,
        avgBuyPrice: 300_000,
        currentPrice: 200_000,
        unrealizedPnl: -500_000, // 손실 50만
      },
      {
        symbol: "MSFT",
        name: "Microsoft",
        quantity: 10,
        avgBuyPrice: 400_000,
        currentPrice: 450_000,
        unrealizedPnl: 500_000, // 수익 50만 (제외)
      },
    ];

    const suggestion = simulateTaxLossHarvesting(taxResult, holdings);
    expect(suggestion.excessGainOverDeduction).toBe(960_000);
    // 손실 보유분 합계는 100만원. 초과분 96만원 손실 매도 권장
    expect(suggestion.recommendedLossToHarvest).toBe(960_000);
    expect(suggestion.estimatedTaxSaved).toBe(211_200); // 960,000 * 0.22
    expect(suggestion.lossHoldings.length).toBe(2);
  });
});

describe("tax.ts - 금융소득 종합과세 모니터링", () => {
  const incomes: IncomeRecord[] = [
    {
      id: "i1",
      kind: "dividend",
      gross: 5_000_000,
      withheldTax: 770_000, // 15.4%
      paidOn: "2026-03-15",
      symbol: "005930",
      name: "삼성전자",
    },
    {
      id: "i2",
      kind: "dividend",
      gross: 3_000_000,
      withheldTax: 462_000,
      paidOn: "2026-06-20",
      symbol: "AAPL",
      name: "Apple Inc.",
    },
    {
      id: "i3",
      kind: "interest",
      gross: 2_000_000,
      withheldTax: 308_000,
      paidOn: "2026-07-01",
      name: "정기예금 이자",
    },
  ];

  it("연간 배당·이자 합산 및 한도 잔여액 계산", () => {
    const summary = aggregateFinancialIncome(incomes, 2026);
    expect(summary.totalGross).toBe(10_000_000);
    expect(summary.dividendGross).toBe(8_000_000);
    expect(summary.interestGross).toBe(2_000_000);
    expect(summary.totalWithheldTax).toBe(1_540_000);
    expect(summary.netReceived).toBe(8_460_000);
    expect(summary.remainingLimit).toBe(10_000_000);
    expect(summary.utilizationRate).toBe(0.5);
    expect(summary.status).toBe("safe");
  });

  it("금융소득 2,000만원 초과 시 exceeded 상태 반환", () => {
    const bigIncomes: IncomeRecord[] = [
      {
        id: "i1",
        kind: "dividend",
        gross: 25_000_000,
        withheldTax: 3_850_000,
        paidOn: "2026-05-10",
      },
    ];
    const summary = aggregateFinancialIncome(bigIncomes, 2026);
    expect(summary.totalGross).toBe(25_000_000);
    expect(summary.remainingLimit).toBe(0);
    expect(summary.status).toBe("exceeded");
  });
});

describe("tax.ts - 근로소득 연말정산 시뮬레이터", () => {
  it("근로소득공제 누진 구간 검증", () => {
    expect(calculateEarnedIncomeDeduction(5_000_000)).toBe(3_500_000);
    expect(calculateEarnedIncomeDeduction(15_000_000)).toBe(7_500_000);
    expect(calculateEarnedIncomeDeduction(50_000_000)).toBe(12_250_000);
  });

  it("종합소득 누진세율 검증", () => {
    expect(calculateProgressiveTax(10_000_000)).toBe(600_000); // 6%
    expect(calculateProgressiveTax(20_000_000)).toBe(840_000 + 6_000_000 * 0.15); // 1,740,000
  });

  it("카드 소득공제 계산 (총급여 25% 초과분에 대해 공제)", () => {
    // 총급여 5,000만원 -> 문턱 1,250만원
    // 신용카드 1,500만원 사용 -> 초과분 250만원 * 15% = 375,000원
    const ded = calculateCardDeduction(50_000_000, 15_000_000, 0);
    expect(ded).toBe(375_000);
  });

  it("연말정산 결정세액 및 환급/추가납부 계산", () => {
    const res = calculateYearEndTaxSettlement({
      grossSalary: 60_000_000, // 연봉 6천만원
      prepaidTax: 3_500_000, // 기납부세액
      prepaidInsurance: 5_400_000, // 4대보험
      pensionSavingsContribution: 4_000_000, // 연금저축 400만원
      irpContribution: 3_000_000, // IRP 300만원 (합계 700만원)
      housingSubscriptionDeposit: 2_400_000, // 주택청약 연 240만원
      insurancePremiumPaid: 1_200_000, // 보장성 보험 연 120만원
      creditCardSpent: 12_000_000,
      debitCardCashSpent: 8_000_000,
    });

    expect(res.grossSalary).toBe(60_000_000);
    expect(res.taxableBase).toBeGreaterThan(0);
    expect(res.calculatedTax).toBeGreaterThan(0);
    expect(res.totalTaxCredits).toBeGreaterThan(0);
    expect(res.pensionAccountsCredit).toBeGreaterThan(0);
    expect(res.insuranceTaxCredit).toBe(132_000); // 100만 한도 * 13.2%
    expect(res.determinedTax).toBeGreaterThan(0);
    // 차감징수세액 = prepaidTax - determinedTax
    expect(res.refundOrPayback).toBe(res.prepaidTax - res.determinedTax);
  });
});
