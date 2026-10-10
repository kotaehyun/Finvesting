/**
 * @file tax.ts
 * 세금 및 연말정산 순수 계산 모듈
 * 
 * 1. 해외주식 양도소득세 (연 250만원 기본공제, 22% 세율, 손익통산, Tax-loss harvesting 절세 시뮬레이션)
 * 2. 금융소득 종합과세 모니터링 (연 2,000만원 기준, 원천징수 15.4%)
 * 3. 근로소득 연말정산 시뮬레이터 (연금저축/IRP, 청약저축, 보험료, 카드소득공제, 결정세액 및 환급/추가납부 계산)
 */

// ==========================================
// 1. 해외주식 양도소득세 (Capital Gains Tax)
// ==========================================

export interface OverseasRealizedTrade {
  id: string;
  symbol: string;
  name: string;
  tradedAt: string; // ISO date string
  quantity: number;
  sellPrice: number; // 원화 환산 1주당 매도가
  buyPrice: number; // 원화 환산 1주당 매수가
  feeAndTax: number; // 원화 수수료 및 제세금
}

export interface OverseasUnrealizedHolding {
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number; // 원화 환산 매수단가
  currentPrice: number; // 원화 환산 현재가
  unrealizedPnl: number; // 평가손익 (원화)
}

export interface CapitalGainsTaxResult {
  year: number;
  totalProceeds: number; // 총 매도금액 (원화)
  totalCost: number; // 총 취득원가 (원화)
  totalFees: number; // 수수료 및 제세금 합계
  netRealizedGain: number; // 통산 실현손익 (순양도차익)
  basicDeduction: number; // 기본공제 (250만원)
  appliedDeduction: number; // 실제 적용된 공제액
  taxableBase: number; // 과세표준
  nationalTax: number; // 양도소득세 (20%)
  localTax: number; // 지방소득세 (2%)
  totalEstimatedTax: number; // 총 납부예상세액 (22%)
  isTaxable: boolean; // 과세 대상 여부
}

export const OVERSEAS_CAPITAL_GAINS_BASIC_DEDUCTION = 2_500_000;
export const OVERSEAS_NATIONAL_TAX_RATE = 0.20;
export const OVERSEAS_LOCAL_TAX_RATE = 0.02;
export const OVERSEAS_TOTAL_TAX_RATE = 0.22;

/**
 * 해외주식 양도소득세 계산 (연간)
 */
export function calculateOverseasCapitalGainsTax(
  trades: OverseasRealizedTrade[],
  year: number,
  basicDeductionLimit: number = OVERSEAS_CAPITAL_GAINS_BASIC_DEDUCTION,
): CapitalGainsTaxResult {
  const yearTrades = trades.filter((t) => {
    const tradeYear = new Date(t.tradedAt).getFullYear();
    return tradeYear === year;
  });

  let totalProceeds = 0;
  let totalCost = 0;
  let totalFees = 0;

  for (const t of yearTrades) {
    const proceeds = t.quantity * t.sellPrice;
    const cost = t.quantity * t.buyPrice;
    totalProceeds += proceeds;
    totalCost += cost;
    totalFees += t.feeAndTax;
  }

  const netRealizedGain = Math.round(totalProceeds - totalCost - totalFees);

  // 기본공제 적용: 실현손익이 양수일 때만 최대 250만원 한도로 차감
  const appliedDeduction = netRealizedGain > 0
    ? Math.min(netRealizedGain, basicDeductionLimit)
    : 0;

  const taxableBase = Math.max(0, netRealizedGain - appliedDeduction);
  const nationalTax = Math.floor(taxableBase * OVERSEAS_NATIONAL_TAX_RATE);
  const localTax = Math.floor(taxableBase * OVERSEAS_LOCAL_TAX_RATE);
  const totalEstimatedTax = nationalTax + localTax;

  return {
    year,
    totalProceeds: Math.round(totalProceeds),
    totalCost: Math.round(totalCost),
    totalFees: Math.round(totalFees),
    netRealizedGain,
    basicDeduction: basicDeductionLimit,
    appliedDeduction,
    taxableBase,
    nationalTax,
    localTax,
    totalEstimatedTax,
    isTaxable: totalEstimatedTax > 0,
  };
}

export interface TaxLossHarvestingSuggestion {
  currentEstimatedTax: number;
  excessGainOverDeduction: number; // 250만원 초과 이익분
  recommendedLossToHarvest: number; // 세금 0원을 만들기 위해 필요한 손실 매도액
  estimatedTaxSaved: number; // 절감 가능한 예상 세금
  lossHoldings: Array<{
    symbol: string;
    name: string;
    quantity: number;
    unrealizedLoss: number;
    harvestableLoss: number;
  }>;
}

/**
 * 해외주식 절세 시뮬레이터 (Tax Loss Harvesting)
 * 이미 실현된 이익이 250만원을 넘었을 때, 보유 중인 손실 종목을 매도하여 절세할 수 있는 가이드 제공
 */
export function simulateTaxLossHarvesting(
  taxResult: CapitalGainsTaxResult,
  holdings: OverseasUnrealizedHolding[],
): TaxLossHarvestingSuggestion {
  const excessGainOverDeduction = Math.max(
    0,
    taxResult.netRealizedGain - taxResult.basicDeduction,
  );

  const lossHoldings = holdings
    .filter((h) => h.unrealizedPnl < 0)
    .sort((a, b) => a.unrealizedPnl - b.unrealizedPnl) // 손실 큰 순
    .map((h) => ({
      symbol: h.symbol,
      name: h.name,
      quantity: h.quantity,
      unrealizedLoss: Math.abs(Math.round(h.unrealizedPnl)),
      harvestableLoss: Math.min(excessGainOverDeduction, Math.abs(Math.round(h.unrealizedPnl))),
    }));

  const totalAvailableLoss = lossHoldings.reduce((sum, h) => sum + h.unrealizedLoss, 0);
  const recommendedLossToHarvest = Math.min(excessGainOverDeduction, totalAvailableLoss);
  const estimatedTaxSaved = Math.floor(recommendedLossToHarvest * OVERSEAS_TOTAL_TAX_RATE);

  return {
    currentEstimatedTax: taxResult.totalEstimatedTax,
    excessGainOverDeduction,
    recommendedLossToHarvest,
    estimatedTaxSaved,
    lossHoldings,
  };
}


// ==========================================
// 2. 금융소득 종합과세 모니터링 (Dividend & Interest)
// ==========================================

export interface IncomeRecord {
  id: string;
  kind: "dividend" | "interest";
  gross: number; // 세전 수령액
  withheldTax: number; // 원천징수 세액
  paidOn: string; // YYYY-MM-DD
  symbol?: string | null;
  name?: string | null;
}

export interface FinancialIncomeSummary {
  year: number;
  totalGross: number; // 총 금융소득 (세전)
  dividendGross: number; // 배당소득 (세전)
  interestGross: number; // 이자소득 (세전)
  totalWithheldTax: number; // 기납부 원천징수세액
  netReceived: number; // 실수령액 (세후)
  threshold: number; // 2,000만원 기준
  remainingLimit: number; // 종합과세까지 남은 한도
  utilizationRate: number; // 기준 대비 진행률 (0 ~ 1)
  status: "safe" | "caution" | "exceeded"; // 안전 (<75%), 주의 (75%~100%), 초과 (>=100%)
  monthlyGross: Record<string, number>; // "01": amount, "02": amount...
}

export const FINANCIAL_INCOME_TAX_THRESHOLD = 20_000_000; // 2천만원

/**
 * 연간 금융소득(배당+이자) 집계 및 종합과세 기준선 모니터링
 */
export function aggregateFinancialIncome(
  incomes: IncomeRecord[],
  year: number,
  threshold: number = FINANCIAL_INCOME_TAX_THRESHOLD,
): FinancialIncomeSummary {
  const yearIncomes = incomes.filter((inc) => {
    return new Date(inc.paidOn).getFullYear() === year;
  });

  let dividendGross = 0;
  let interestGross = 0;
  let totalWithheldTax = 0;
  const monthlyGross: Record<string, number> = {};

  for (let m = 1; m <= 12; m++) {
    monthlyGross[String(m).padStart(2, "0")] = 0;
  }

  for (const inc of yearIncomes) {
    if (inc.kind === "dividend") {
      dividendGross += inc.gross;
    } else {
      interestGross += inc.gross;
    }
    totalWithheldTax += inc.withheldTax;

    const monthKey = inc.paidOn.slice(5, 7);
    if (monthlyGross[monthKey] !== undefined) {
      monthlyGross[monthKey] += inc.gross;
    }
  }

  const totalGross = dividendGross + interestGross;
  const netReceived = totalGross - totalWithheldTax;
  const remainingLimit = Math.max(0, threshold - totalGross);
  const utilizationRate = threshold > 0 ? Math.min(1, totalGross / threshold) : 0;

  let status: "safe" | "caution" | "exceeded" = "safe";
  if (totalGross >= threshold) {
    status = "exceeded";
  } else if (totalGross >= threshold * 0.75) {
    status = "caution";
  }

  return {
    year,
    totalGross: Math.round(totalGross),
    dividendGross: Math.round(dividendGross),
    interestGross: Math.round(interestGross),
    totalWithheldTax: Math.round(totalWithheldTax),
    netReceived: Math.round(netReceived),
    threshold,
    remainingLimit: Math.round(remainingLimit),
    utilizationRate: Number(utilizationRate.toFixed(4)),
    status,
    monthlyGross,
  };
}


// ==========================================
// 3. 근로소득 연말정산 시뮬레이터 (Year-End Tax Settlement)
// ==========================================

export interface YearEndTaxInput {
  grossSalary: number; // 총급여 (연간 세전)
  prepaidTax: number; // 기납부세액 (원천징수 국세+지방세 합계)
  prepaidInsurance: number; // 기납부 4대보험 합계
  pensionSavingsContribution?: number; // 연금저축 납입액 (최대 600만)
  irpContribution?: number; // IRP 납입액 (연금+IRP 합산 최대 900만)
  housingSubscriptionDeposit?: number; // 주택청약 연 납입액 (연 300만 한도, 40% 공제)
  insurancePremiumPaid?: number; // 보장성 보험료 납입액 (연 100만 한도, 12% 세액공제)
  creditCardSpent?: number; // 신용카드 연간 사용액
  debitCardCashSpent?: number; // 체크카드/현금영수증 연간 사용액
  dependentsCount?: number; // 기본공제 대상 부양가족 수 (본인 제외)
}

export interface YearEndTaxResult {
  grossSalary: number;
  earnedIncomeDeduction: number; // 근로소득공제
  earnedIncomeAmount: number; // 근로소득금액 (총급여 - 근로소득공제)
  
  // 종합소득공제
  basicDeduction: number; // 인적공제 (본인 150만 + 부양가족*150만)
  pensionInsuranceDeduction: number; // 국민연금공제
  healthInsuranceDeduction: number; // 건강/고용보험공제
  housingSavingsDeduction: number; // 주택청약 소득공제
  cardDeduction: number; // 신용/체크카드 소득공제
  totalIncomeDeductions: number; // 소득공제 합계
  
  taxableBase: number; // 과세표준
  calculatedTax: number; // 산출세액 (누진세율 적용)
  
  // 세액공제
  wageEarnerTaxCredit: number; // 근로소득 세액공제
  pensionAccountsCredit: number; // 연금계좌 세액공제 (연금저축 + IRP)
  insuranceTaxCredit: number; // 보장성 보험료 세액공제
  totalTaxCredits: number; // 세액공제 합계
  
  determinedTax: number; // 결정세액 (산출세액 - 세액공제)
  prepaidTax: number; // 기납부세액
  refundOrPayback: number; // 차감징수세액 (양수 = 환급 13월의 월급, 음수 = 추가 납부)
  isRefund: boolean;
}

/**
 * 근로소득공제 계산 (소득세법 제47조)
 */
export function calculateEarnedIncomeDeduction(gross: number): number {
  if (gross <= 0) return 0;
  if (gross <= 5_000_000) return gross * 0.7;
  if (gross <= 15_000_000) return 3_500_000 + (gross - 5_000_000) * 0.4;
  if (gross <= 45_000_000) return 7_500_000 + (gross - 15_000_000) * 0.15;
  if (gross <= 100_000_000) return 12_000_000 + (gross - 45_000_000) * 0.05;
  return 14_750_000 + (gross - 100_000_000) * 0.02;
}

/**
 * 기본세율 누진세액 계산 (소득세법 제55조 종합소득 기본세율)
 */
export function calculateProgressiveTax(taxableBase: number): number {
  if (taxableBase <= 0) return 0;
  if (taxableBase <= 14_000_000) {
    return taxableBase * 0.06;
  }
  if (taxableBase <= 50_000_000) {
    return 840_000 + (taxableBase - 14_000_000) * 0.15;
  }
  if (taxableBase <= 88_000_000) {
    return 6_240_000 + (taxableBase - 50_000_000) * 0.24;
  }
  if (taxableBase <= 150_000_000) {
    return 15_360_000 + (taxableBase - 88_000_000) * 0.35;
  }
  if (taxableBase <= 300_000_000) {
    return 37_060_000 + (taxableBase - 150_000_000) * 0.38;
  }
  if (taxableBase <= 500_000_000) {
    return 94_060_000 + (taxableBase - 300_000_000) * 0.40;
  }
  if (taxableBase <= 1_000_000_000) {
    return 174_060_000 + (taxableBase - 500_000_000) * 0.42;
  }
  return 384_060_000 + (taxableBase - 1_000_000_000) * 0.45;
}

/**
 * 근로소득 세액공제 (소득세법 제59조)
 */
export function calculateWageEarnerTaxCredit(calculatedTax: number, grossSalary: number): number {
  if (calculatedTax <= 0) return 0;
  let credit = 0;
  if (calculatedTax <= 1_300_000) {
    credit = calculatedTax * 0.55;
  } else {
    credit = 715_000 + (calculatedTax - 1_300_000) * 0.30;
  }

  // 한도: 총급여에 따른 한도 적용
  let limit = 740_000;
  if (grossSalary > 70_000_000) {
    limit = Math.max(500_000, 660_000 - (grossSalary - 70_000_000) * 0.5);
  } else if (grossSalary > 33_000_000) {
    limit = Math.max(660_000, 740_000 - (grossSalary - 33_000_000) * 0.008);
  }

  return Math.min(credit, limit);
}

/**
 * 신용카드 등 사용금액 소득공제 (조특법 제126조의2)
 */
export function calculateCardDeduction(
  grossSalary: number,
  creditCardSpent: number = 0,
  debitCardCashSpent: number = 0,
): number {
  const threshold = grossSalary * 0.25;
  const totalSpent = creditCardSpent + debitCardCashSpent;
  if (totalSpent <= threshold) return 0;

  // 신용카드 15%, 체크카드/현금영수증 30%
  // 신용카드를 먼저 문턱값에 채우는 것이 납세자에게 유리
  let remainingThreshold = threshold;
  let credDed = 0;
  if (creditCardSpent >= remainingThreshold) {
    const credAbove = creditCardSpent - remainingThreshold;
    credDed = credAbove * 0.15;
    remainingThreshold = 0;
  } else {
    remainingThreshold -= creditCardSpent;
  }

  const debitAbove = Math.max(0, debitCardCashSpent - remainingThreshold);
  const debDed = debitAbove * 0.30;

  const totalDed = credDed + debDed;
  const limit = grossSalary <= 70_000_000 ? 3_000_000 : 2_500_000;

  return Math.min(totalDed, limit);
}

/**
 * 연말정산 시뮬레이션 계산
 */
export function calculateYearEndTaxSettlement(input: YearEndTaxInput): YearEndTaxResult {
  const {
    grossSalary,
    prepaidTax,
    prepaidInsurance,
    pensionSavingsContribution = 0,
    irpContribution = 0,
    housingSubscriptionDeposit = 0,
    insurancePremiumPaid = 0,
    creditCardSpent = 0,
    debitCardCashSpent = 0,
    dependentsCount = 0,
  } = input;

  // 1. 근로소득공제
  const earnedIncomeDeduction = Math.round(calculateEarnedIncomeDeduction(grossSalary));
  const earnedIncomeAmount = Math.max(0, grossSalary - earnedIncomeDeduction);

  // 2. 소득공제
  // 인적공제 (본인 150만원 + 부양가족 1인당 150만원)
  const basicDeduction = (1 + Math.max(0, dependentsCount)) * 1_500_000;
  
  // 4대보험: 국민연금(약 45% 추정) + 건보/고용(약 55% 추정) - 전체 공제 대상
  const pensionInsuranceDeduction = Math.round(prepaidInsurance * 0.45);
  const healthInsuranceDeduction = prepaidInsurance - pensionInsuranceDeduction;

  // 주택청약공제: 연 납입액(최대 300만원 한도)의 40% (총급여 7천만원 이하)
  const eligibleHousing = grossSalary <= 70_000_000 ? Math.min(housingSubscriptionDeposit, 3_000_000) : 0;
  const housingSavingsDeduction = Math.round(eligibleHousing * 0.4);

  // 카드 소득공제
  const cardDeduction = Math.round(calculateCardDeduction(grossSalary, creditCardSpent, debitCardCashSpent));

  const totalIncomeDeductions =
    basicDeduction +
    pensionInsuranceDeduction +
    healthInsuranceDeduction +
    housingSavingsDeduction +
    cardDeduction;

  // 3. 과세표준
  const taxableBase = Math.max(0, earnedIncomeAmount - totalIncomeDeductions);

  // 4. 산출세액 (지방소득세 10% 포함하여 종합 부담세액으로 산출)
  const nationalTaxCalculated = calculateProgressiveTax(taxableBase);
  const calculatedTax = Math.round(nationalTaxCalculated * 1.1); // 지방소득세 10% 포함

  // 5. 세액공제
  // 근로소득 세액공제 (국세 기준 한도 * 1.1)
  const wageEarnerTaxCredit = Math.round(
    calculateWageEarnerTaxCredit(nationalTaxCalculated, grossSalary) * 1.1,
  );

  // 연금계좌 세액공제: 연금저축 최대 600만, IRP 합산 최대 900만
  const cappedPension = Math.min(pensionSavingsContribution, 6_000_000);
  const eligiblePensionTotal = Math.min(cappedPension + irpContribution, 9_000_000);
  // 총급여 5,500만원 이하 16.5%, 초과 13.2%
  const pensionCreditRate = grossSalary <= 55_000_000 ? 0.165 : 0.132;
  const pensionAccountsCredit = Math.round(eligiblePensionTotal * pensionCreditRate);

  // 보장성 보험료 세액공제: 연 납입액 최대 100만 한도, 12% (지방세 포함 13.2%)
  const eligibleInsurance = Math.min(insurancePremiumPaid, 1_000_000);
  const insuranceTaxCredit = Math.round(eligibleInsurance * 0.132);

  const totalTaxCredits = wageEarnerTaxCredit + pensionAccountsCredit + insuranceTaxCredit;

  // 6. 결정세액
  const determinedTax = Math.max(0, calculatedTax - totalTaxCredits);

  // 7. 차감징수세액 (기납부세액 - 결정세액)
  // 양수면 환급, 음수면 추가납부
  const refundOrPayback = Math.round(prepaidTax - determinedTax);

  return {
    grossSalary,
    earnedIncomeDeduction,
    earnedIncomeAmount,
    basicDeduction,
    pensionInsuranceDeduction,
    healthInsuranceDeduction,
    housingSavingsDeduction,
    cardDeduction,
    totalIncomeDeductions,
    taxableBase,
    calculatedTax,
    wageEarnerTaxCredit,
    pensionAccountsCredit,
    insuranceTaxCredit,
    totalTaxCredits,
    determinedTax,
    prepaidTax,
    refundOrPayback,
    isRefund: refundOrPayback >= 0,
  };
}
