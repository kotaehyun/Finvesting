import { describe, expect, it } from "vitest";
import { buildMonthlyLedger, buildPayrollLedger, mergeTaxTrend, resolvePay } from "./statement";

describe("buildPayrollLedger", () => {
  it("차변은 기본급·수당, 대변은 보험·세금·보통예금", () => {
    const l = buildPayrollLedger({
      grossIncome: 4_000_000, incomeTax: 250_000, healthInsurance: 150_000,
      earnings: [{ label: "기본급", amount: 3_200_000 }, { label: "식대", amount: 800_000 }],
    });
    expect(l.debitTotal).toBe(4_000_000);
    expect(l.creditTotal).toBe(4_000_000);
    expect(l.net).toBe(0);
    expect(l.debits.map((d) => d.label)).toEqual(["기본급", "식대"]);
    expect(l.credits.find((c) => c.label === "보통예금(실수령)")?.amount).toBe(3_600_000);
    expect(l.credits.find((c) => c.label === "소득세")?.amount).toBe(250_000);
  });

  it("지급 항목이 없으면 세전을 기본급으로 차변에 둔다", () => {
    const l = buildPayrollLedger({
      grossIncome: 4_000_000, incomeTax: 250_000, healthInsurance: 150_000,
    });
    expect(l.debits.map((d) => d.label)).toEqual(["기본급"]);
    expect(l.debitTotal).toBe(4_000_000);
    expect(l.credits.find((c) => c.label === "보통예금(실수령)")?.amount).toBe(3_600_000);
  });

  it("저장된 세후가 있어도 대변 실수령은 세전−공제라 차대변이 같다", () => {
    const l = buildPayrollLedger({
      grossIncome: 4_200_000,
      nationalPension: 199_500,
      healthInsurance: 150_990,
      longTermCare: 19_840,
      employmentInsurance: 37_800,
      nationalTax: 250_000,
      localTax: 25_000,
      netIncome: 3_810_000,
    });
    expect(l.debitTotal).toBe(4_200_000);
    expect(l.creditTotal).toBe(4_200_000);
    expect(l.net).toBe(0);
    expect(l.credits.find((c) => c.label === "보통예금(실수령)")?.amount).toBe(3_516_870);
  });
});

describe("buildMonthlyLedger", () => {
  it("입금은 차변, 출금은 대변. 여유는 차변−대변", () => {
    const l = buildMonthlyLedger({
      netIncome: 3_500_000,
      otherCredits: [{ label: "이자", amount: 10_000 }],
      recurring: [{ label: "휴대폰", amount: 55_000, category: "phone" }],
      otherFixed: 100_000,
      actualDebits: [{ label: "식비", amount: 200_000 }],
    });
    expect(l.debitTotal).toBe(3_510_000);
    expect(l.creditTotal).toBe(355_000);
    expect(l.net).toBe(3_155_000);
  });
});

describe("resolvePay", () => {
  it("세전이 없으면 세후를 그대로 쓴다", () => {
    const p = resolvePay({ monthlyNetIncome: 340, monthlyIncomeTax: 40, monthlyHealthInsurance: 20 });
    expect(p.net).toBe(340);
    expect(p.gross).toBe(400);
  });
});

describe("mergeTaxTrend", () => {
  it("같은 달은 수동 입력을 우선한다", () => {
    const t = mergeTaxTrend(
      [{ month: "2026-08", amount: 200 }],
      [{ month: "2026-08", amount: 180 }, { month: "2026-07", amount: 190 }],
    );
    expect(t).toEqual([
      { month: "2026-07", amount: 190, source: "actual" },
      { month: "2026-08", amount: 200, source: "manual" },
    ]);
  });
});
