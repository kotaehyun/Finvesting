// 사업주 고용보험. 호봉 양식은 공무원보수규정 별표 3 봉급월액. 수당·다른 별표는 칸.
import eiFile from "../data/tax/ei-stability.json";
import civilFile from "../data/tax/civil-pay-2026.json";
import { assertDataFile, dataSourceLine, optionalValue, requireValue } from "./load-data";
import { formCsv, slotCsvCell } from "./form-csv";

assertDataFile(eiFile, "tax/ei-stability.json");
assertDataFile(civilFile, "tax/civil-pay-2026.json");

export const EI_STABILITY_SOURCE = dataSourceLine(eiFile.defaults);
export const CIVIL_PAY_SOURCE = dataSourceLine(civilFile.defaults);

function truncWon(n: number) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

/** 고용노동부 고시 제2025-47호. 2026.1.1~12.31. 주 40시간·월 209시간. */
export const MIN_WAGE_2026 = {
  hourly: requireValue(eiFile, "minWage2026.hourly"),
  monthly209: requireValue(eiFile, "minWage2026.monthly209"),
  source: eiFile.minWage2026.source,
} as const;

type BandLabel = { id: "under150" | "priority150" | "mid" | "large"; label: string; decree: string };

/**
 * 고용산재보험료징수법 시행령 제12조.
 * 실업급여 1.8%는 근로자·사업주 각 0.9%. 고용안정·직능개발은 사업주만.
 */
export const EI_STABILITY_BANDS = (eiFile.bandLabels as BandLabel[]).map((b, i) => ({
  id: b.id,
  label: b.label,
  rateBp: requireValue(eiFile, `eiStabilityBands[${i}].rateBp`),
  decree: b.decree,
}));

export type EiStabilityBandId = (typeof EI_STABILITY_BANDS)[number]["id"];

export function eiStabilityRate(band: EiStabilityBandId): number {
  const hit = EI_STABILITY_BANDS.find((b) => b.id === band);
  return hit ? hit.rateBp / 10_000 : 0;
}

export type EmployerEi = {
  unemploymentEmployee: number;
  unemploymentEmployer: number;
  stabilityEmployer: number;
  employerTotal: number;
  employeeTotal: number;
};

export const INDUSTRIAL_ACCIDENT_NOTE = eiFile.industrialAccidentNote;

export function employerEmploymentInsurance(monthlyWage: number, band: EiStabilityBandId): EmployerEi {
  const w = Math.max(0, Math.floor(Number(monthlyWage) || 0));
  const unemploymentEmployee = truncWon(w * 9 / 1_000);
  const unemploymentEmployer = truncWon(w * 9 / 1_000);
  const bandRow = EI_STABILITY_BANDS.find((b) => b.id === band);
  const stabilityEmployer = truncWon(w * (bandRow?.rateBp ?? 0) / 10_000);
  return {
    unemploymentEmployee,
    unemploymentEmployer,
    stabilityEmployer,
    employerTotal: unemploymentEmployer + stabilityEmployer,
    employeeTotal: unemploymentEmployee,
  };
}

/** 공무원보수규정 제5조·별표 3. 인사혁신처 2026년 봉급표. 수당을 더하지 않음. */
export const CIVIL_PAY = civilFile.civilPay;

export const CIVIL_PAY_GRADES = civilFile.grades as readonly { id: number; label: string }[];

export type CivilPayGradeId = (typeof CIVIL_PAY_GRADES)[number]["id"];

function rebuildCivilTable(): (number | null)[][] {
  const grades = CIVIL_PAY_GRADES.length; // 9
  const steps = 32;
  const table: (number | null)[][] = [];
  for (let s = 1; s <= steps; s++) {
    const row: (number | null)[] = [];
    for (let g = 1; g <= grades; g++) {
      row.push(optionalValue(civilFile, `grade${g}_step${s}`));
    }
    table.push(row);
  }
  return table;
}

/** 행=호봉 1~32, 열=1급~9급. 없는 칸은 null. 0이 아님. */
export const CIVIL_PAY_TABLE: (number | null)[][] = rebuildCivilTable();

export function civilPayAmount(grade: number, step: number): number | null {
  const g = Math.floor(Number(grade) || 0);
  const s = Math.floor(Number(step) || 0);
  if (g < 1 || g > 9 || s < 1 || s > CIVIL_PAY_TABLE.length) return null;
  return CIVIL_PAY_TABLE[s - 1]?.[g - 1] ?? null;
}

export function civilPayCsv(): string {
  return formCsv(
    { form: CIVIL_PAY.form, basis: CIVIL_PAY.basis, plain: CIVIL_PAY.plain },
    ["호봉", ...CIVIL_PAY_GRADES.map((g) => g.label)],
    CIVIL_PAY_TABLE.map((row, i) => [String(i + 1), ...row.map((n) => slotCsvCell(n))]),
  );
}

export function belowMinWage(basePay: number): boolean {
  const p = Math.floor(Number(basePay) || 0);
  return p > 0 && p < MIN_WAGE_2026.monthly209;
}
