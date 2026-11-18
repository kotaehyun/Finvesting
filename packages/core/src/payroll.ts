// 2026년 직장가입자·근로자 부담분. 원 단위 절사.
// 국세(근로소득세)는 간이세액표·부양가족에 따라 달라 요율로 추정하지 않는다. 명세서 금액을 넣고 지방세는 그 10%.
import dataFile from "../data/tax/payroll-rates-2026.json";
import { assertDataFile, dataSourceLine, requireValue } from "./load-data";

assertDataFile(dataFile, "tax/payroll-rates-2026.json");

export const PAYROLL_RATES_SOURCE = dataSourceLine(dataFile.defaults);

export type NationalPensionBand = {
  id: "h1" | "h2";
  floor: number;
  cap: number;
  from: string;
  to: string;
};

/** 고시 적용월. 달 없으면 2026-07 고시(h2). 고시 밖 달은 null. */
export const NATIONAL_PENSION_BANDS: readonly NationalPensionBand[] = [
  {
    id: "h1",
    floor: requireValue(dataFile, "rates.nationalPensionFloorH1"),
    cap: requireValue(dataFile, "rates.nationalPensionCapH1"),
    from: "2026-01",
    to: "2026-06",
  },
  {
    id: "h2",
    floor: requireValue(dataFile, "rates.nationalPensionFloor"),
    cap: requireValue(dataFile, "rates.nationalPensionCap"),
    from: "2026-07",
    to: "2027-06",
  },
];

export function nationalPensionBand(payMonth?: string): NationalPensionBand | null {
  const ym = payMonth?.slice(0, 7);
  if (ym && /^\d{4}-\d{2}$/.test(ym)) {
    return NATIONAL_PENSION_BANDS.find((b) => ym >= b.from && ym <= b.to) ?? null;
  }
  return NATIONAL_PENSION_BANDS.find((b) => b.id === "h2") ?? null;
}

export const PAYROLL_RATES_2026 = {
  year: requireValue(dataFile, "rates.year"),
  nationalPensionEmployee: requireValue(dataFile, "rates.nationalPensionEmployee"),
  nationalPensionFloor: requireValue(dataFile, "rates.nationalPensionFloor"),
  nationalPensionCap: requireValue(dataFile, "rates.nationalPensionCap"),
  healthInsuranceTotal: requireValue(dataFile, "rates.healthInsuranceTotal"),
  healthInsuranceEmployeeShare: requireValue(dataFile, "rates.healthInsuranceEmployeeShare"),
  longTermCareIncomeRate: requireValue(dataFile, "rates.longTermCareIncomeRate"),
  employmentInsuranceEmployee: requireValue(dataFile, "rates.employmentInsuranceEmployee"),
  localIncomeTaxOnNational: requireValue(dataFile, "rates.localIncomeTaxOnNational"),
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
export const BASIC_PERSONAL_EXEMPTION = requireValue(dataFile, "basicPersonalExemption");

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

export function statutoryWithholding(grossIncome: number, nationalTax = 0, payMonth?: string): StatutoryWithholding {
  const gross = Math.max(0, Number(grossIncome) || 0);
  const band = nationalPensionBand(payMonth);
  // 고시 밖 달은 상·하한을 만들지 않는다. 세전을 그대로 기준소득월액으로 둔다.
  const pensionBase = gross <= 0 ? 0 : band ? Math.min(Math.max(gross, band.floor), band.cap) : gross;
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
