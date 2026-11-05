// 연간 임금명세서·연말정산 기초. 월 명세를 고용노동부 예시 칸으로 합친다.
// 홈택스 제출서·부양가족·의료비·카드 공제는 넣지 않는다.

import type { PayEarningDraft } from "./pay-earnings";
import type { PayTrendPoint } from "./pay-trends";
import { incomeTaxBaseFromAnnual, type IncomeTaxBase } from "./payroll";

/** 연 세금합 = 국세 + 지방세(국세의 10%). */
export function splitAnnualWithholdingTax(taxTotal: number) {
  const t = Math.max(0, Math.round(Number(taxTotal) || 0));
  const nationalTax = Math.floor((t * 10) / 11);
  const localTax = t - nationalTax;
  return { nationalTax, localTax };
}

export type YearEndWageSlip = {
  earnings: PayEarningDraft[];
  deductions: Array<{ name: string; amount: number }>;
  payTotal: number;
  deductTotal: number;
  net: number;
};

export function yearEndWageSlip(year: PayTrendPoint): YearEndWageSlip {
  const { nationalTax, localTax } = splitAnnualWithholdingTax(year.tax);
  const earnings: PayEarningDraft[] = [
    { name: "기본급", group: "monthly", amount: year.base },
    { name: "수당", group: "monthly", amount: year.allowance },
    { name: "상여금", group: "irregular", amount: year.bonus },
    { name: "그 밖의 임금", group: "custom", amount: year.other },
  ];
  const deductions = [
    { name: "소득세", amount: nationalTax },
    { name: "지방소득세", amount: localTax },
    { name: "4대보험", amount: year.insurance },
  ];
  const payTotal = earnings.reduce((s, r) => s + r.amount, 0);
  const deductTotal = deductions.reduce((s, d) => s + d.amount, 0);
  return { earnings, deductions, payTotal, deductTotal, net: year.net };
}

export type YearEndSettlement = IncomeTaxBase & {
  prepaidTax: number;
  prepaidInsurance: number;
};

/** 총급여는 12개월 세전 합. 국민연금 연액이 없으면 0. */
export function yearEndSettlement(year: PayTrendPoint, annualPension = 0): YearEndSettlement {
  const base = incomeTaxBaseFromAnnual(year.gross, annualPension);
  return { ...base, prepaidTax: year.tax, prepaidInsurance: year.insurance };
}
