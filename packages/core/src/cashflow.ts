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
    if (t.direction === "in" && INCOME_CATEGORIES.has(t.category)) income += t.amount;
    else if (t.direction === "out") {
      if (SAVING_CATEGORIES.has(t.category)) savingAndInvest += t.amount;
      else if (FIXED_COST_CATEGORIES.has(t.category)) fixedCost += t.amount;
      else if (t.category !== "transfer") variableCost += t.amount;
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
