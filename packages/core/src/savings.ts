// 예·적금 만기 추정. 세전, 중도해지·우대금리 조건은 넣지 않는다.

export type SavingsProjection = {
  principal: number;
  interest: number;
  maturity: number;
};

function rate(annualPercent: number) {
  return Math.max(0, Number(annualPercent) || 0) / 100;
}

function months(n: number) {
  return Math.max(0, Math.floor(Number(n) || 0));
}

function won(n: number) {
  return Math.round(Math.max(0, n));
}

/** YYYY-MM에 개월을 더한다. */
export function addMonths(month: string, count: number): string {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return month;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1 + count, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** 정기적금 단리. 이자 = 월납 × 연리 × n(n+1)/2 / 12 */
export function installmentSimpleInterest(monthlyAmount: number, annualRatePercent: number, termMonths: number): SavingsProjection {
  const pmt = Math.max(0, monthlyAmount);
  const n = months(termMonths);
  const principal = won(pmt * n);
  const interest = won(pmt * rate(annualRatePercent) * n * (n + 1) / 2 / 12);
  return { principal, interest, maturity: principal + interest };
}

/** 월납 월복리 적금. 기말납 연금: PMT × ((1+r)^n − 1) / r, r=연리/12 */
export function installmentCompoundInterest(monthlyAmount: number, annualRatePercent: number, termMonths: number): SavingsProjection {
  const pmt = Math.max(0, monthlyAmount);
  const n = months(termMonths);
  const principal = won(pmt * n);
  const r = rate(annualRatePercent) / 12;
  const fv = r > 0 ? pmt * (Math.pow(1 + r, n) - 1) / r : pmt * n;
  const maturity = won(fv);
  return { principal, interest: Math.max(0, maturity - principal), maturity };
}

/** 예금 단리. 이자 = 원금 × 연리 × 개월/12 */
export function depositSimpleInterest(principalIn: number, annualRatePercent: number, termMonths: number): SavingsProjection {
  const principal = won(principalIn);
  const interest = won(principal * rate(annualRatePercent) * months(termMonths) / 12);
  return { principal, interest, maturity: principal + interest };
}

/** 예금 월복리. FV = P × (1+r)^n, r=연리/12 */
export function depositCompoundInterest(principalIn: number, annualRatePercent: number, termMonths: number): SavingsProjection {
  const principal = won(principalIn);
  const n = months(termMonths);
  const r = rate(annualRatePercent) / 12;
  const maturity = won(principal * Math.pow(1 + r, n));
  return { principal, interest: Math.max(0, maturity - principal), maturity };
}

export function projectSavings(i: {
  kind: "installment" | "savings";
  compounding: "simple" | "compound";
  monthlyAmount: number;
  interestRate: number;
  termMonths: number;
}): SavingsProjection {
  if (i.kind === "savings") {
    return i.compounding === "compound"
      ? depositCompoundInterest(i.monthlyAmount, i.interestRate, i.termMonths)
      : depositSimpleInterest(i.monthlyAmount, i.interestRate, i.termMonths);
  }
  return i.compounding === "compound"
    ? installmentCompoundInterest(i.monthlyAmount, i.interestRate, i.termMonths)
    : installmentSimpleInterest(i.monthlyAmount, i.interestRate, i.termMonths);
}
