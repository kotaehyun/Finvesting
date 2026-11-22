// 2026년 직장가입자·근로자 부담분. 원 단위 절사.
// 국세(근로소득세)는 간이세액표·부양가족에 따라 달라 요율로 추정하지 않는다. 명세서 금액을 넣고 지방세는 그 10%.
import dataFile from "../data/tax/payroll-rates-2026.json";
import { assertDataFile, dataSourceLine, mergeEntry, requireValue } from "./load-data";

assertDataFile(dataFile, "tax/payroll-rates-2026.json");

/** 급여 요율 항목. 국민연금 상·하한 구간과 별도로 달마다 유효 기간을 본다. */
const PAYROLL_RATE_PERIOD_IDS = [
  "rates.nationalPensionEmployee",
  "rates.healthInsuranceTotal",
  "rates.healthInsuranceEmployeeShare",
  "rates.longTermCareIncomeRate",
  "rates.employmentInsuranceEmployee",
] as const;

/** payMonth(YYYY-MM)가 요율 entry의 effectiveFrom~To 안인지. 하나라도 밖이면 false. */
export function payrollRatesCoverPayMonth(
  payMonth: string,
  file: typeof dataFile = dataFile,
): boolean {
  const ym = payMonth.slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(ym)) return false;
  const day = `${ym}-01`;
  const entries = file.entries;
  if (!Array.isArray(entries)) return false;
  for (const id of PAYROLL_RATE_PERIOD_IDS) {
    const hit = entries.find((e) => e.id === id);
    if (!hit) return false;
    const full = mergeEntry(file.defaults, hit);
    if (!full.effectiveFrom || !full.effectiveTo) return false;
    if (day < full.effectiveFrom || day > full.effectiveTo) return false;
  }
  return true;
}

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
  status: "ok" | "unavailable";
  nationalPension: number | null;
  healthInsurance: number | null;
  longTermCare: number | null;
  employmentInsurance: number | null;
  nationalTax: number | null;
  localTax: number | null;
  insuranceTotal: number | null;
  taxTotal: number | null;
  withholdTotal: number | null;
  pensionBase: number | null;
};

export type PayrollRateInput = {
  nationalPensionEmployee: number;
  healthInsuranceTotal: number;
  healthInsuranceEmployeeShare: number;
  longTermCareIncomeRate: number;
  employmentInsuranceEmployee: number;
};

/** 소수 요율을 정수 분수로. 0.0475 → 19/400. 과학적 표기면 null. */
export function rateFraction(rate: number): { num: number; den: number } | null {
  if (!Number.isFinite(rate)) return null;
  const m = String(rate).match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  const den = 10 ** (m[3]?.length ?? 0);
  const num = sign * Number(`${m[2]}${m[3] ?? ""}`);
  const g = gcd(Math.abs(num), den);
  return { num: num / g, den: den / g };
}

function gcd(a: number, b: number): number {
  let x = a;
  let y = b;
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function applyFraction(base: number, frac: { num: number; den: number } | null): number | null {
  if (!frac || frac.den === 0) return null;
  return truncWon(base * frac.num / frac.den);
}

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

const JSON_RATES: PayrollRateInput = {
  nationalPensionEmployee: PAYROLL_RATES_2026.nationalPensionEmployee,
  healthInsuranceTotal: PAYROLL_RATES_2026.healthInsuranceTotal,
  healthInsuranceEmployeeShare: PAYROLL_RATES_2026.healthInsuranceEmployeeShare,
  longTermCareIncomeRate: PAYROLL_RATES_2026.longTermCareIncomeRate,
  employmentInsuranceEmployee: PAYROLL_RATES_2026.employmentInsuranceEmployee,
};

function unavailableWithholding(): StatutoryWithholding {
  return {
    status: "unavailable",
    nationalPension: null, healthInsurance: null, longTermCare: null, employmentInsurance: null,
    nationalTax: null, localTax: null, insuranceTotal: null, taxTotal: null,
    withholdTotal: null, pensionBase: null,
  };
}

export function statutoryWithholding(
  grossIncome: number,
  nationalTax = 0,
  payMonth?: string,
  rates: PayrollRateInput = JSON_RATES,
): StatutoryWithholding {
  const gross = Math.max(0, Number(grossIncome) || 0);
  if (payMonth && !nationalPensionBand(payMonth)) return unavailableWithholding();
  if (payMonth && !payrollRatesCoverPayMonth(payMonth)) return unavailableWithholding();
  const band = nationalPensionBand(payMonth);
  const pensionBase = gross <= 0 || !band ? 0 : Math.min(Math.max(gross, band.floor), band.cap);
  const pensionFrac = rateFraction(rates.nationalPensionEmployee);
  const healthTotal = rateFraction(rates.healthInsuranceTotal);
  const healthShare = rateFraction(rates.healthInsuranceEmployeeShare);
  const healthReduced = healthTotal && healthShare
    ? (() => {
      const num = healthTotal.num * healthShare.num;
      const den = healthTotal.den * healthShare.den;
      const g = gcd(Math.abs(num), den);
      return { num: num / g, den: den / g };
    })()
    : null;
  const nationalPension = applyFraction(pensionBase, pensionFrac);
  const healthInsurance = applyFraction(gross, healthReduced);
  const ltc = rateFraction(rates.longTermCareIncomeRate);
  const longTermCare = healthInsurance != null && ltc && healthTotal && healthTotal.num !== 0
    ? truncWon(healthInsurance * ltc.num * healthTotal.den / (ltc.den * healthTotal.num))
    : null;
  const employmentInsurance = applyFraction(gross, rateFraction(rates.employmentInsuranceEmployee));
  if (nationalPension == null || healthInsurance == null || longTermCare == null || employmentInsurance == null) {
    return unavailableWithholding();
  }
  const tax = Math.max(0, Math.round(Number(nationalTax) || 0));
  const localTax = truncWon(tax / 10);
  const insuranceTotal = nationalPension + healthInsurance + longTermCare + employmentInsurance;
  const taxTotal = tax + localTax;
  return {
    status: "ok",
    nationalPension, healthInsurance, longTermCare, employmentInsurance,
    nationalTax: tax, localTax, insuranceTotal, taxTotal,
    withholdTotal: insuranceTotal + taxTotal,
    pensionBase,
  };
}
