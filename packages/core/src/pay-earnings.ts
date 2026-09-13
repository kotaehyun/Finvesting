// 근로기준법 시행령 제27조의2 · 고용노동부 임금명세서 작성 예시
// (찾기쉬운 생활법령정보 / 2021.11.19. 시행 개정 근로기준법 설명자료).
// 금액 0은 저장하지 않고 화면 칸만 둔다.

export const PAY_EARNING_GROUP_LABEL = {
  monthly: "매월지급",
  irregular: "격월 또는 부정기 지급",
  custom: "그 밖의 임금",
} as const;

export type PayEarningGroup = keyof typeof PAY_EARNING_GROUP_LABEL;

export const PAY_EARNING_PRESETS: ReadonlyArray<{ name: string; group: Exclude<PayEarningGroup, "custom"> }> = [
  { name: "기본급", group: "monthly" },
  { name: "연장근로수당", group: "monthly" },
  { name: "야간근로수당", group: "monthly" },
  { name: "휴일근로수당", group: "monthly" },
  { name: "가족수당", group: "monthly" },
  { name: "식대", group: "monthly" },
  { name: "직급수당", group: "monthly" },
  { name: "상여금", group: "irregular" },
  { name: "성과급", group: "irregular" },
];

/** 고용노동부 예시 공제란. 소득세·4대보험. 지방소득세는 국세의 10%라 같이 둔다. */
export const PAY_DEDUCTION_PRESETS = [
  { id: "nationalTax", name: "소득세" },
  { id: "localTax", name: "지방소득세" },
  { id: "nationalPension", name: "국민연금" },
  { id: "employmentInsurance", name: "고용보험" },
  { id: "healthInsurance", name: "건강보험" },
  { id: "longTermCare", name: "장기요양보험" },
] as const;

const NAME_ALIASES: Record<string, string> = {
  연장수당: "연장근로수당",
  야간수당: "야간근로수당",
  휴일수당: "휴일근로수당",
  상여: "상여금",
};

export type PayEarningDraft = { name: string; amount: number; group: PayEarningGroup };

export function canonicalPayEarningName(name: string) {
  const t = name.trim();
  return NAME_ALIASES[t] ?? t;
}

export function payEarningGroupOf(name: string): PayEarningGroup {
  const n = canonicalPayEarningName(name);
  return PAY_EARNING_PRESETS.find((p) => p.name === n)?.group ?? "custom";
}

/** 기본 항목을 항상 채우고, 저장된 금액·직접입력 항목을 합친다. 저장된 지급이 없으면 세전을 기본급에 넣는다. */
export function draftPayEarnings(
  saved: Array<{ name: string; amount: number }>,
  fallbackGross = 0,
): PayEarningDraft[] {
  const byName = new Map<string, number>();
  for (const s of saved) {
    const name = canonicalPayEarningName(s.name);
    if (!name || !(s.amount > 0)) continue;
    byName.set(name, (byName.get(name) ?? 0) + s.amount);
  }
  const rows: PayEarningDraft[] = PAY_EARNING_PRESETS.map((p) => ({
    name: p.name,
    amount: byName.get(p.name) ?? 0,
    group: p.group,
  }));
  const presetNames = new Set(PAY_EARNING_PRESETS.map((p) => p.name));
  for (const [name, amount] of byName) {
    if (presetNames.has(name)) continue;
    rows.push({ name, amount, group: "custom" });
  }
  if (fallbackGross > 0 && !rows.some((r) => r.amount > 0)) {
    const base = rows.find((r) => r.name === "기본급");
    if (base) base.amount = fallbackGross;
  }
  return rows;
}

export type PayEarningSummary = {
  base: number;
  allowance: number;
  bonus: number;
  other: number;
  gross: number;
};

/** 기본급 / 각종 수당 / 상여·성과 / 그 밖의 임금 */
export function summarizePayEarnings(rows: Array<{ name: string; amount: number }>): PayEarningSummary {
  let base = 0, allowance = 0, bonus = 0, other = 0;
  for (const r of rows) {
    if (!(r.amount > 0)) continue;
    const name = canonicalPayEarningName(r.name);
    const g = payEarningGroupOf(name);
    if (name === "기본급") base += r.amount;
    else if (g === "irregular") bonus += r.amount;
    else if (g === "custom") other += r.amount;
    else allowance += r.amount;
  }
  return { base, allowance, bonus, other, gross: base + allowance + bonus + other };
}
