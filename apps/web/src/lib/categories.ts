export const INCOME_CATEGORIES = [
  { id: "salary", label: "급여" },
  { id: "bonus", label: "상여" },
  { id: "interest", label: "이자" },
  { id: "dividend", label: "배당" },
  { id: "other_income", label: "기타수입" },
  { id: "uncategorized", label: "미분류" },
] as const;

export const OUTGO_CATEGORIES = [
  { id: "housing", label: "주거" },
  { id: "utilities", label: "공과금" },
  { id: "phone", label: "휴대폰" },
  { id: "insurance", label: "보험" },
  { id: "health_insurance", label: "건보료" },
  { id: "income_tax", label: "근로소득세" },
  { id: "subscription", label: "구독" },
  { id: "food", label: "식비" },
  { id: "transport", label: "교통" },
  { id: "shopping", label: "쇼핑" },
  { id: "leisure", label: "여가" },
  { id: "health", label: "건강" },
  { id: "education", label: "교육" },
  { id: "misc", label: "기타" },
  { id: "saving", label: "저축" },
  { id: "investment", label: "투자" },
  { id: "loan_repayment", label: "대출상환" },
  { id: "uncategorized", label: "미분류" },
] as const;

const ALL_LABELS: Record<string, string> = Object.fromEntries(
  [...INCOME_CATEGORIES, ...OUTGO_CATEGORIES, { id: "transfer", label: "이체" }].map((c) => [c.id, c.label]),
);

export function categoryLabel(id: string) {
  return ALL_LABELS[id] ?? id;
}

export type TxnCategoryId =
  | (typeof INCOME_CATEGORIES)[number]["id"]
  | (typeof OUTGO_CATEGORIES)[number]["id"]
  | "transfer";

export function categoriesFor(direction: "in" | "out" | "transfer") {
  if (direction === "in") return INCOME_CATEGORIES;
  if (direction === "out") return OUTGO_CATEGORIES;
  return [{ id: "transfer", label: "이체" }] as const;
}
