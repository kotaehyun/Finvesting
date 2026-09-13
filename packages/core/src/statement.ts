import { emptyIncomeTaxBase, incomeTaxBaseFromMonthly, statutoryWithholding } from "./payroll";

// 보통예금·급여전표: 차변=들어오는 것(지급·입금), 대변=나가는 것(공제·출금).

export type LedgerLine = {
  side: "debit" | "credit";
  label: string;
  amount: number;
  source: "planned" | "actual";
  category?: string;
};

export type Ledger = {
  credits: LedgerLine[];
  debits: LedgerLine[];
  creditTotal: number;
  debitTotal: number;
  net: number; // 차변 − 대변 (보통예금 증가. 급여전표는 0)
};

export type PayrollInput = {
  grossIncome: number;
  nationalPension?: number;
  healthInsurance: number;
  longTermCare?: number;
  employmentInsurance?: number;
  nationalTax?: number;
  localTax?: number;
  incomeTax?: number; // 하위 호환: 국세
  netIncome?: number;
  earnings?: Array<{ label: string; amount: number }>; // 기본급·수당. 없으면 세전을 기본급
};

function line(side: LedgerLine["side"], label: string, amount: number, source: LedgerLine["source"], category?: string): LedgerLine | null {
  if (!(amount > 0)) return null;
  return { side, label, amount, source, category };
}

function pack(credits: Array<LedgerLine | null>, debits: Array<LedgerLine | null>): Ledger {
  const c = credits.filter((x): x is LedgerLine => x != null);
  const d = debits.filter((x): x is LedgerLine => x != null);
  const creditTotal = c.reduce((s, x) => s + x.amount, 0);
  const debitTotal = d.reduce((s, x) => s + x.amount, 0);
  return { credits: c, debits: d, creditTotal, debitTotal, net: debitTotal - creditTotal };
}

/** 차변=기본급·수당, 대변=보험·세금·보통예금(실수령). 합은 세전. */
export function buildPayrollLedger(i: PayrollInput): Ledger {
  const nationalTax = i.nationalTax ?? i.incomeTax ?? 0;
  const withhold = Math.max(0, i.nationalPension ?? 0)
    + Math.max(0, i.healthInsurance)
    + Math.max(0, i.longTermCare ?? 0)
    + Math.max(0, i.employmentInsurance ?? 0)
    + Math.max(0, nationalTax)
    + Math.max(0, i.localTax ?? 0);
  const given = (i.earnings ?? []).filter((e) => e.amount > 0);
  const givenSum = given.reduce((s, e) => s + e.amount, 0);
  const gross = i.grossIncome > 0 ? i.grossIncome : (givenSum || Math.max(0, (i.netIncome ?? 0) + withhold));
  const net = Math.max(0, gross - withhold);
  const earnings = given.length
    ? (givenSum < gross ? [...given, { label: "기타수당", amount: gross - givenSum }] : given)
    : (gross > 0 ? [{ label: "기본급", amount: gross }] : []);
  return pack(
    [
      line("credit", "국민연금", i.nationalPension ?? 0, "planned", "national_pension"),
      line("credit", "건강보험", i.healthInsurance, "planned", "health_insurance"),
      line("credit", "장기요양보험", i.longTermCare ?? 0, "planned", "long_term_care"),
      line("credit", "고용보험", i.employmentInsurance ?? 0, "planned", "employment_insurance"),
      line("credit", "소득세", nationalTax, "planned", "income_tax"),
      line("credit", "지방소득세", i.localTax ?? 0, "planned", "local_tax"),
      line("credit", "보통예금(실수령)", net, "planned", "salary"),
    ],
    earnings.map((e) => line("debit", e.label, e.amount, "planned", "salary")),
  );
}

export type MonthlyStatementInput = {
  netIncome: number;
  otherCredits: Array<{ label: string; amount: number; source?: LedgerLine["source"]; category?: string }>;
  recurring: Array<{ label: string; amount: number; category?: string }>;
  otherFixed: number;
  actualDebits: Array<{ label: string; amount: number; category?: string }>;
};

/** 보통예금: 차변=입금(실수령·이자·배당), 대변=출금(고정·실거래) */
export function buildMonthlyLedger(i: MonthlyStatementInput): Ledger {
  return pack(
    [
      ...i.recurring.map((x) => line("credit", x.label, x.amount, "planned", x.category)),
      line("credit", "기타 고정비", i.otherFixed, "planned", "misc"),
      ...i.actualDebits.map((x) => line("credit", x.label, x.amount, "actual", x.category)),
    ],
    [
      line("debit", "보통예금(급여실수령)", i.netIncome, "planned", "salary"),
      ...i.otherCredits.map((x) => line("debit", x.label, x.amount, x.source ?? "actual", x.category)),
    ],
  );
}

export function resolvePay(p: { monthlyGrossIncome?: number | string | null; monthlyNetIncome?: number | string | null; monthlyIncomeTax?: number | string | null; monthlyHealthInsurance?: number | string | null }) {
  const tax = Number(p.monthlyIncomeTax ?? 0);
  const healthOverride = Number(p.monthlyHealthInsurance ?? 0);
  const grossIn = Number(p.monthlyGrossIncome ?? 0);
  const netIn = Number(p.monthlyNetIncome ?? 0);

  if (grossIn > 0) {
    const w = statutoryWithholding(grossIn, tax);
    const net = netIn > 0 ? netIn : Math.max(0, grossIn - w.withholdTotal);
    return {
      gross: grossIn,
      net,
      tax: w.nationalTax,
      health: w.healthInsurance + w.longTermCare,
      ...w,
      taxBase: incomeTaxBaseFromMonthly(grossIn, w.nationalPension),
    };
  }

  const net = netIn > 0 ? netIn : 0;
  const gross = net > 0 ? net + tax + healthOverride : 0;
  return {
    gross, net, tax, health: healthOverride,
    nationalPension: 0, healthInsurance: healthOverride, longTermCare: 0, employmentInsurance: 0,
    nationalTax: tax, localTax: 0, insuranceTotal: healthOverride, taxTotal: tax,
    withholdTotal: tax + healthOverride, pensionBase: 0,
    taxBase: gross > 0 ? incomeTaxBaseFromMonthly(gross, 0) : emptyIncomeTaxBase(),
  };
}

export type TaxPoint = { month: string; amount: number; source: "manual" | "actual" };

/** 수동 입력과 거래 합을 월별로 합친다. 같은 달은 수동이 있으면 수동을 쓴다. */
export function mergeTaxTrend(manual: Array<{ month: string; amount: number }>, actual: Array<{ month: string; amount: number }>): TaxPoint[] {
  const map = new Map<string, TaxPoint>();
  for (const a of actual) {
    if (a.amount > 0) map.set(a.month, { month: a.month, amount: a.amount, source: "actual" });
  }
  for (const m of manual) {
    if (m.amount > 0) map.set(m.month, { month: m.month, amount: m.amount, source: "manual" });
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}
