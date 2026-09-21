// 사업주 고용보험. 호봉 양식은 공무원보수규정 별표 3 봉급월액. 수당·다른 별표는 칸.

import { formCsv, slotCsvCell } from "./form-csv";

function truncWon(n: number) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

/** 고용노동부 고시 제2025-47호. 2026.1.1~12.31. 주 40시간·월 209시간. */
export const MIN_WAGE_2026 = {
  hourly: 10_320,
  monthly209: 2_156_880,
  source: "고용노동부 고시 제2025-47호",
} as const;

/**
 * 고용산재보험료징수법 시행령 제12조.
 * 실업급여 1.8%는 근로자·사업주 각 0.9%. 고용안정·직능개발은 사업주만.
 */
export const EI_STABILITY_BANDS = [
  { id: "under150", label: "상시 150명 미만", rateBp: 25, decree: "제12조 제1항 제1호 가목" },
  { id: "priority150", label: "150명 이상 우선지원대상기업", rateBp: 45, decree: "나목" },
  { id: "mid", label: "150명 이상 1,000명 미만(우선지원 제외)", rateBp: 65, decree: "다목" },
  { id: "large", label: "1,000명 이상·국가·지자체", rateBp: 85, decree: "라목" },
] as const;

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

export const INDUSTRIAL_ACCIDENT_NOTE =
  "산재보험요율은 업종별 고시입니다. 숫자를 만들지 않습니다.";

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
export const CIVIL_PAY = {
  form: "일반직공무원과 일반직에 준하는 특정직 및 별정직 공무원 등의 봉급표",
  basis: "공무원보수규정 제5조·별표 3",
  revised: "2026. 1. 2.",
  plain: "급·호봉에 적힌 봉급월액. 수당·초임호봉 환산이 아님",
  step: "제13조 승급기간 1년. 근속연수에 1을 더해 호봉을 만들지 않음",
  not: "별표 4~14·수당·민간 취업규칙이 아님. 빈 칸은 그 계급에 그 호봉이 없음",
  href: "https://www.mpm.go.kr/mpm/info/resultPay/bizSalary/2026/",
  source: "인사혁신처 2026년 공무원봉급표",
} as const;

export const CIVIL_PAY_GRADES = [
  { id: 1, label: "1급" },
  { id: 2, label: "2급" },
  { id: 3, label: "3급" },
  { id: 4, label: "4급·6등급" },
  { id: 5, label: "5급·5등급" },
  { id: 6, label: "6급·4등급" },
  { id: 7, label: "7급·3등급" },
  { id: 8, label: "8급·2등급" },
  { id: 9, label: "9급·1등급" },
] as const;

export type CivilPayGradeId = (typeof CIVIL_PAY_GRADES)[number]["id"];

/** 행=호봉 1~32, 열=1급~9급. 없는 칸은 null. 0이 아님. */
export const CIVIL_PAY_TABLE: (number | null)[][] = [
  [4656100, 4191600, 3781700, 3241200, 2896400, 2389500, 2317100, 2162100, 2133000],
  [4819300, 4347100, 3921600, 3373500, 3013400, 2500700, 2367900, 2195700, 2147600],
  [4986600, 4504700, 4065700, 3508000, 3135000, 2615200, 2423800, 2233800, 2168000],
  [5157700, 4663700, 4210800, 3645700, 3261300, 2732400, 2485200, 2276600, 2194000],
  [5333000, 4825100, 4358300, 3785200, 3390900, 2853100, 2567100, 2331700, 2226100],
  [5510400, 4986500, 4507200, 3926200, 3523000, 2977100, 2682600, 2412900, 2264600],
  [5690400, 5150200, 4658000, 4068300, 3657300, 3101500, 2798700, 2519600, 2309900],
  [5871900, 5313600, 4809000, 4211100, 3793200, 3226200, 2915800, 2622400, 2367500],
  [6056100, 5478200, 4961400, 4354500, 3929600, 3351300, 3027100, 2720300, 2456700],
  [6241300, 5642500, 5113600, 4497700, 4066800, 3468700, 3133300, 2813000, 2542700],
  [6426000, 5807700, 5266200, 4642100, 4195300, 3580000, 3233400, 2902700, 2624400],
  [6617100, 5978600, 5424200, 4778100, 4319000, 3689600, 3331900, 2990300, 2705900],
  [6809200, 6150500, 5571200, 4905100, 4436400, 3792700, 3425300, 3074500, 2783900],
  [7001800, 6306200, 5707600, 5023800, 4545900, 3890000, 3514500, 3155100, 2859800],
  [7170100, 6449600, 5833400, 5135500, 4649400, 3983600, 3599900, 3232400, 2932300],
  [7319600, 6581000, 5950500, 5240900, 4746800, 4071300, 3680600, 3307100, 3002300],
  [7452100, 6702000, 6059400, 5338700, 4838400, 4154900, 3758100, 3376800, 3070800],
  [7570100, 6812700, 6160700, 5430100, 4924800, 4234100, 3832100, 3444300, 3134500],
  [7675800, 6914900, 6254300, 5515500, 5006300, 4309100, 3902000, 3509300, 3197300],
  [7770600, 7008100, 6342100, 5595300, 5082700, 4379600, 3968400, 3571100, 3257000],
  [7857800, 7093400, 6423300, 5669800, 5154500, 4447600, 4031800, 3630200, 3313400],
  [7935600, 7171600, 6498500, 5739700, 5222000, 4511500, 4091600, 3686900, 3367600],
  [8001400, 7243100, 6567800, 5805400, 5285600, 4571300, 4149600, 3740800, 3419200],
  [null, 7301700, 6632800, 5867300, 5345200, 4628500, 4204500, 3792900, 3468800],
  [null, 7357600, 6685800, 5923800, 5401500, 4682800, 4256500, 3842300, 3516000],
  [null, null, 6736700, 5971800, 5454500, 4734100, 4306500, 3890300, 3558700],
  [null, null, 6783800, 6015900, 5498400, 4782800, 4348700, 3930200, 3595600],
  [null, null, null, 6058300, 5540700, 4823700, 4388000, 3968700, 3631000],
  [null, null, null, null, 5579500, 4861900, 4426100, 4005100, 3665100],
  [null, null, null, null, 5617200, 4899800, 4462400, 4040300, 3698400],
  [null, null, null, null, null, 4934800, 4496500, 4074600, 3731100],
  [null, null, null, null, null, 4967800, null, null, null],
];

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
