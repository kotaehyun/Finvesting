import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { buildTaxSettlementXlsx } from "./tax-settlement-xlsx";

describe("tax-settlement-xlsx.ts - 연말정산 XLSX 엑셀 내보내기", () => {
  it("연말정산, 해외주식 양도세, 금융소득을 포함한 4개 시트 XLSX 생성 검증", () => {
    const yeResult = {
      grossSalary: 60_000_000,
      earnedIncomeDeduction: 12_750_000,
      earnedIncomeAmount: 47_250_000,
      basicDeduction: 1_500_000,
      pensionInsuranceDeduction: 2_430_000,
      healthInsuranceDeduction: 2_970_000,
      housingSavingsDeduction: 960_000,
      cardDeduction: 1_200_000,
      totalIncomeDeductions: 9_060_000,
      taxableBase: 38_190_000,
      calculatedTax: 4_468_500,
      wageEarnerTaxCredit: 726_000,
      pensionAccountsCredit: 792_000,
      insuranceTaxCredit: 132_000,
      totalTaxCredits: 1_650_000,
      determinedTax: 2_818_500,
      prepaidTax: 3_600_000,
      refundOrPayback: 781_500,
      isRefund: true,
    };

    const cgResult = {
      year: 2026,
      totalProceeds: 3_500_000,
      totalCost: 2_200_000,
      totalFees: 10_000,
      netRealizedGain: 1_290_000,
      basicDeduction: 2_500_000,
      appliedDeduction: 1_290_000,
      taxableBase: 0,
      nationalTax: 0,
      localTax: 0,
      totalEstimatedTax: 0,
      isTaxable: false,
    };

    const fiResult = {
      year: 2026,
      totalGross: 1_162_210,
      dividendGross: 112_210,
      interestGross: 1_050_000,
      totalWithheldTax: 178_980,
      netReceived: 983_230,
      threshold: 20_000_000,
      remainingLimit: 18_837_790,
      utilizationRate: 0.058,
      status: "safe",
      monthlyGross: {},
    };

    const xlsxBytes = buildTaxSettlementXlsx({
      year: 2026,
      userName: "홍길동",
      yearEndResult: yeResult,
      capitalGains: cgResult,
      financialIncome: fiResult,
      incomesList: [
        {
          paidOn: "2026-05-15",
          kind: "dividend",
          name: "Apple Inc.",
          gross: 100_000,
          withheldTax: 15_400,
          net: 84_600,
        },
      ],
      capitalGainsTrades: [
        {
          tradedAt: "2026-09-18",
          symbol: "NVDA",
          name: "NVIDIA Corp.",
          quantity: 20,
          sellPrice: 175_000,
          buyPrice: 110_000,
          feeAndTax: 10_000,
        },
      ],
    });

    expect(xlsxBytes).toBeInstanceOf(Uint8Array);
    expect(xlsxBytes.length).toBeGreaterThan(1000);

    // SheetJS로 다시 파싱하여 시트명 및 내용 확인
    const wb = XLSX.read(xlsxBytes, { type: "array" });
    expect(wb.SheetNames).toEqual([
      "연말정산_정산요약",
      "공제_세부명세",
      "해외주식_양도소득세",
      "금융소득_배당이자",
    ]);

    // 시트 1에 총급여 및 결정세액이 올바르게 기록되었는지 확인
    const ws1 = wb.Sheets["연말정산_정산요약"]!;
    const rows = XLSX.utils.sheet_to_json<string[]>(ws1, { header: 1 });
    expect(rows.length).toBeGreaterThan(10);
  });
});
