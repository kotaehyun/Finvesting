// 2026년 직장가입자·근로자 부담분. 원 단위 절사.
// 국세(근로소득세)는 간이세액표·부양가족에 따라 달라 요율로 추정하지 않는다. 명세서 금액을 넣고 지방세는 그 10%.

export const PAYROLL_RATES_2026 = {
  year: 2026,
  // 국민연금: 전체 9.5% 중 근로자 4.75%. 기준소득월액 하한 41만·상한 659만 (2026-07~2027-06)
  nationalPensionEmployee: 0.0475,
  nationalPensionFloor: 410_000,
  nationalPensionCap: 6_590_000,
  // 건강보험: 전체 7.19% 중 근로자 50%. 복지부 2025-08-28 건정심
  healthInsuranceTotal: 0.0719,
  healthInsuranceEmployeeShare: 0.5,
  // 장기요양: 소득 대비 0.9448%. 4대보험 연계센터: 건보료 × (0.9448% / 7.19%)
  longTermCareIncomeRate: 0.009448,
  // 고용보험 실업급여 근로자 0.9% (고용안정·직능개발은 사업주)
  employmentInsuranceEmployee: 0.009,
  // 지방소득세 = 소득세(국세)의 10%
  localIncomeTaxOnNational: 0.1,
} as const;

function truncWon(n: number) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

export type StatutoryWithholding = {
  nationalPension: number;
  healthInsurance: number;
  longTermCare: number;
  employmentInsurance: number;
  nationalTax: number;
  localTax: number;
  insuranceTotal: number;
  taxTotal: number;
  withholdTotal: number;
  pensionBase: number;
};

// 소득세법 제47조 근로소득공제. 한도 2,000만. 원 단위 절사.
export const BASIC_PERSONAL_EXEMPTION = 1_500_000; // 본인 기본공제. 부양가족은 아직 없음.

export function earnedIncomeDeduction(annualGross: number): number {
  const g = Math.max(0, Math.floor(Number(annualGross) || 0));
  let d = 0;
  if (g <= 5_000_000) d = truncWon(g * 70 / 100);
  else if (g <= 15_000_000) d = 3_500_000 + truncWon((g - 5_000_000) * 40 / 100);
  else if (g <= 45_000_000) d = 7_500_000 + truncWon((g - 15_000_000) * 15 / 100);
  else if (g <= 100_000_000) d = 12_000_000 + truncWon((g - 45_000_000) * 5 / 100);
  else d = 14_750_000 + truncWon((g - 100_000_000) * 2 / 100);
  return Math.min(Math.min(d, 20_000_000), g);
}

export type IncomeTaxBase = {
  annualGross: number;
  earnedIncomeDeduction: number;
  earnedIncome: number;
  personalExemption: number;
  pensionDeduction: number;
  taxableBase: number;
  monthlyTaxableBase: number;
};

export function emptyIncomeTaxBase(): IncomeTaxBase {
  return {
    annualGross: 0, earnedIncomeDeduction: 0, earnedIncome: 0,
    personalExemption: BASIC_PERSONAL_EXEMPTION, pensionDeduction: 0,
    taxableBase: 0, monthlyTaxableBase: 0,
  };
}

/** 과세표준 ≈ 총급여 − 근로소득공제 − 본인 기본공제 − 국민연금(연). 다른 소득공제는 없음. */
export function incomeTaxBaseFromAnnual(annualGross: number, annualPension = 0): IncomeTaxBase {
  const g = Math.max(0, Math.floor(Number(annualGross) || 0));
  const deduction = earnedIncomeDeduction(g);
  const earnedIncome = Math.max(0, g - deduction);
  const pensionDeduction = Math.max(0, Math.floor(Number(annualPension) || 0));
  const taxableBase = Math.max(0, earnedIncome - BASIC_PERSONAL_EXEMPTION - pensionDeduction);
  return {
    annualGross: g, earnedIncomeDeduction: deduction, earnedIncome,
    personalExemption: BASIC_PERSONAL_EXEMPTION, pensionDeduction,
    taxableBase, monthlyTaxableBase: truncWon(taxableBase / 12),
  };
}

export function incomeTaxBaseFromMonthly(monthlyGross: number, monthlyPension = 0): IncomeTaxBase {
  const monthly = Math.max(0, Math.floor(Number(monthlyGross) || 0));
  const pension = Math.max(0, Math.floor(Number(monthlyPension) || 0));
  return incomeTaxBaseFromAnnual(monthly * 12, pension * 12);
}

export function statutoryWithholding(grossIncome: number, nationalTax = 0): StatutoryWithholding {
  const gross = Math.max(0, Number(grossIncome) || 0);
  const r = PAYROLL_RATES_2026;
  const pensionBase = gross <= 0 ? 0 : Math.min(Math.max(gross, r.nationalPensionFloor), r.nationalPensionCap);
  // 정수 분수로 계산해 0.009 * 3000000 = 26999.999… 같은 부동소수 오차를 피한다.
  const nationalPension = truncWon(pensionBase * 475 / 10_000);
  const healthInsurance = truncWon(gross * 719 / 20_000);
  const longTermCare = truncWon(healthInsurance * 9_448 / 71_900);
  const employmentInsurance = truncWon(gross * 9 / 1_000);
  const tax = Math.max(0, Math.round(Number(nationalTax) || 0));
  const localTax = truncWon(tax / 10);
  const insuranceTotal = nationalPension + healthInsurance + longTermCare + employmentInsurance;
  const taxTotal = tax + localTax;
  return {
    nationalPension, healthInsurance, longTermCare, employmentInsurance,
    nationalTax: tax, localTax, insuranceTotal, taxTotal,
    withholdTotal: insuranceTotal + taxTotal,
    pensionBase,
  };
}
