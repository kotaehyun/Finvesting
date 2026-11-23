// 순수 함수만. DB·네트워크 의존 없음 → 웹/모바일/worker/AI 어디서나 재사용.

export type TxnLike = {
  amount: number;
  direction: "in" | "out" | "transfer";
  category: string;
};

export const FIXED_COST_CATEGORIES = new Set([
  "housing", "utilities", "insurance", "subscription", "phone", "loan_repayment",
  "income_tax", "health_insurance",
]);
export const SAVING_CATEGORIES = new Set(["saving", "investment"]);
export const INCOME_CATEGORIES = new Set(["salary", "bonus", "interest", "dividend", "other_income"]);

/**
 * 홈 소비(고정+변동)와 이상 지출이 같이 쓴다.
 * 저축·투자·수입·이체 분류는 소비가 아니다. 그 밖의 출금 분류(미분류 포함)는 소비다.
 */
export function isSpendingCategory(category: string): boolean {
  if (category === "transfer") return false;
  if (INCOME_CATEGORIES.has(category)) return false;
  if (SAVING_CATEGORIES.has(category)) return false;
  return true;
}

export type CashflowSummary = {
  income: number;
  fixedCost: number;
  variableCost: number;
  savingAndInvest: number;
  net: number;
  savingRate: number;     // 저축·투자 / 수입
  spendingRate: number;   // (고정+변동) / 수입
};

export function summarizeCashflow(txns: TxnLike[]): CashflowSummary {
  let income = 0, fixedCost = 0, variableCost = 0, savingAndInvest = 0;
  for (const t of txns) {
    if (t.category === "transfer" || t.direction === "transfer") continue;
    if (t.direction === "in" && INCOME_CATEGORIES.has(t.category)) income += t.amount;
    else if (t.direction === "out") {
      if (SAVING_CATEGORIES.has(t.category)) savingAndInvest += t.amount;
      else if (isSpendingCategory(t.category)) {
        if (FIXED_COST_CATEGORIES.has(t.category)) fixedCost += t.amount;
        else variableCost += t.amount;
      }
    }
  }
  const spent = fixedCost + variableCost;
  return {
    income, fixedCost, variableCost, savingAndInvest,
    net: income - spent - savingAndInvest,
    savingRate: income > 0 ? savingAndInvest / income : 0,
    spendingRate: income > 0 ? spent / income : 0,
  };
}
