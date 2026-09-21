// 근로자 연말정산 공제 창. 홈택스 간소화가 없으면 칸. 세액공제율을 곱하지 않는다.

import { BASIC_PERSONAL_EXEMPTION, earnedIncomeDeduction } from "./payroll";
import type { DataSlotStatus } from "./tax-year";

export const YEAR_END_PANES = [
  { id: "earned", label: "근로·기본" },
  { id: "family", label: "가족·자녀" },
  { id: "insurance", label: "보험료" },
  { id: "medical", label: "의료비" },
  { id: "education", label: "교육비" },
  { id: "donation", label: "기부금" },
  { id: "housing", label: "주택자금" },
  { id: "card", label: "카드·현금" },
] as const;

export type YearEndPaneId = (typeof YEAR_END_PANES)[number]["id"];

export type DeductionField = {
  id: string;
  pane: YearEndPaneId;
  label: string;
  kind: "amount" | "count" | "yesno";
  amount: number | null;
  status: DataSlotStatus;
  note: string;
};

export function yearEndDeductionFields(input: {
  annualGross: number;
  annualPension: number;
}): DeductionField[] {
  const g = Math.max(0, Math.floor(Number(input.annualGross) || 0));
  const pension = Math.max(0, Math.floor(Number(input.annualPension) || 0));
  const payrollOk = g > 0;
  const empty = (id: string, pane: YearEndPaneId, label: string, note: string, kind: DeductionField["kind"] = "amount"): DeductionField => ({
    id, pane, label, kind, amount: null, status: "empty", note,
  });
  return [
    {
      id: "earned_income",
      pane: "earned",
      label: "근로소득공제",
      kind: "amount",
      amount: payrollOk ? earnedIncomeDeduction(g) : null,
      status: payrollOk ? "collected" : "empty",
      note: payrollOk ? "소득세법 제47조. 급여상세 연 합" : "해당 연 급여 스냅샷이 없습니다",
    },
    {
      id: "basic_self",
      pane: "earned",
      label: "본인 기본공제",
      kind: "amount",
      amount: payrollOk ? BASIC_PERSONAL_EXEMPTION : null,
      status: payrollOk ? "collected" : "empty",
      note: payrollOk ? "본인 150만원. 세액공제율을 곱하지 않음" : "해당 연 급여 스냅샷이 없습니다",
    },
    {
      id: "pension",
      pane: "insurance",
      label: "국민연금 보험료",
      kind: "amount",
      amount: payrollOk ? pension : null,
      status: payrollOk ? (pension > 0 ? "collected" : "empty") : "empty",
      note: pension > 0 ? "급여상세에 있는 국민연금만" : "국민연금 칸이 없거나 0원. 4대보험 합으로 추정하지 않음",
    },
    empty("health_ins", "insurance", "건강보험료", "급여 건보 칸·간소화가 없습니다"),
    empty("ei_ins", "insurance", "고용보험료", "근로자 부담분만. 추정하지 않음"),
    empty("spouse", "family", "배우자 유무", "기본공제 대상 여부. 금액을 만들지 않음", "yesno"),
    empty("children_count", "family", "자녀 수", "자녀세액공제 인원 칸. 1명당 세액을 곱하지 않음", "count"),
    empty("dependents", "family", "부양가족 수", "본인·배우자·자녀 외. 공제액을 만들지 않음", "count"),
    empty("medical", "medical", "의료비", "홈택스 간소화 자료가 없습니다"),
    empty("education", "education", "교육비", "본인·자녀 교육비 칸. 공제율을 곱하지 않음"),
    empty("donation_designated", "donation", "특례기부금", "기부금영수증 칸. 세액공제율을 곱하지 않음"),
    empty("donation_general", "donation", "일반기부금", "기부금영수증 칸. 세액공제율을 곱하지 않음"),
    empty("housing", "housing", "주택자금", "주택임차·장기주택저당 칸. 한도를 만들지 않음"),
    empty("card", "card", "신용카드등 사용액", "홈택스 간소화 자료가 없습니다"),
  ];
}
