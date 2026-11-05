/**
 * @file tax-settlement-xlsx.ts
 * 연말정산 및 세무 정산 내역 XLSX 엑셀 파일 생성기
 * 회사/세무대리인 제출 및 개인 보관용 4개 시트 통합 워크북 생성
 */

import * as XLSX from "xlsx";

export interface TaxSettlementWorkbookOptions {
  year: number;
  userName?: string;
  yearEndResult: {
    grossSalary: number;
    earnedIncomeDeduction: number;
    earnedIncomeAmount: number;
    basicDeduction: number;
    pensionInsuranceDeduction: number;
    healthInsuranceDeduction: number;
    housingSavingsDeduction: number;
    cardDeduction: number;
    totalIncomeDeductions: number;
    taxableBase: number;
    calculatedTax: number;
    wageEarnerTaxCredit: number;
    pensionAccountsCredit: number;
    insuranceTaxCredit: number;
    totalTaxCredits: number;
    determinedTax: number;
    prepaidTax: number;
    refundOrPayback: number;
    isRefund: boolean;
  };
  yearEndInput?: {
    housingSubscriptionDeposit?: number;
    creditCardSpent?: number;
    debitCardCashSpent?: number;
    pensionSavingsContribution?: number;
    irpContribution?: number;
    insurancePremiumPaid?: number;
  };
  capitalGains?: {
    totalProceeds: number;
    totalCost: number;
    totalFees: number;
    netRealizedGain: number;
    appliedDeduction: number;
    taxableBase: number;
    nationalTax: number;
    localTax: number;
    totalEstimatedTax: number;
  };
  financialIncome?: {
    totalGross: number;
    dividendGross: number;
    interestGross: number;
    totalWithheldTax: number;
    netReceived: number;
    threshold: number;
    remainingLimit: number;
    utilizationRate: number;
    status: string;
  };
  incomesList?: Array<{
    paidOn: string;
    kind: string;
    name: string;
    gross: number;
    withheldTax: number;
    net: number;
  }>;
  capitalGainsTrades?: Array<{
    tradedAt: string;
    symbol: string;
    name: string;
    quantity: number;
    sellPrice: number;
    buyPrice: number;
    feeAndTax: number;
  }>;
}

const wonStr = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

/**
 * 근로소득 연말정산 및 세무 정산 워크북 생성 (XLSX 바이트 배열 반환)
 */
export function buildTaxSettlementXlsx(opts: TaxSettlementWorkbookOptions): Uint8Array {
  const wb = XLSX.utils.book_new();
  const { year, userName = "근로자", yearEndResult: ye, capitalGains: cg, financialIncome: fi } = opts;

  // ========================================================
  // 시트 1: 연말정산_정산요약
  // ========================================================
  const s1Rows: (string | number)[][] = [
    [`[${year}년도] 근로소득 원천징수영수증 및 연말정산 세액계산서`],
    [`성명: ${userName}`, `조회연도: ${year}년`, `작성일: ${new Date().toISOString().slice(0, 10)}`],
    [],
    ["항목 구분", "세부 내역", "금액 (원)", "비고"],
    ["1. 총급여액", "연간 지급받은 총 근로소득", ye.grossSalary, "비과세소득 제외"],
    ["(-) 근로소득공제", "소득세법 제47조에 따른 공제", -ye.earnedIncomeDeduction, "구간별 누진공제"],
    ["= 근로소득금액", "총급여 - 근로소득공제", ye.earnedIncomeAmount, ""],
    [],
    ["2. 소득공제", "기본 인적공제", ye.basicDeduction, `본인 + 부양가족`],
    ["소득공제", "국민연금보험료 공제", ye.pensionInsuranceDeduction, "전액 공제"],
    ["소득공제", "건강·고용보험료 공제", ye.healthInsuranceDeduction, "전액 공제"],
    ["소득공제", "주택청약종합저축 공제", ye.housingSavingsDeduction, "납입액(연 300만 한도)의 40%"],
    ["소득공제", "신용·체크카드 사용액 공제", ye.cardDeduction, "총급여 25% 초과 사용분"],
    ["소득공제 합계", "종합소득공제 총액", -ye.totalIncomeDeductions, ""],
    [],
    ["= 과세표준", "근로소득금액 - 소득공제 합계", ye.taxableBase, ""],
    ["3. 산출세액", "기본 누진세율 적용 (지방세 10% 포함)", ye.calculatedTax, "소득세법 제55조"],
    [],
    ["4. 세액공제", "근로소득 세액공제", ye.wageEarnerTaxCredit, "소득세법 제59조"],
    ["세액공제", "연금계좌(연금저축+IRP) 세액공제", ye.pensionAccountsCredit, "연 최대 900만 한도 (16.5%/13.2%)"],
    ["세액공제", "보장성 보험료 세액공제", ye.insuranceTaxCredit, "연 100만 한도 13.2%"],
    ["세액공제 합계", "세액공제 총액", -ye.totalTaxCredits, ""],
    [],
    ["= 최종 결정세액", "산출세액 - 세액공제 합계", ye.determinedTax, "납부해야 할 최종 세액"],
    ["(-) 기납부세액", "매월 급여 원천징수 세액 합계", ye.prepaidTax, "이미 납부한 세금"],
    [],
    [
      ye.isRefund ? "★ 차감징수세액 (환급액)" : "★ 차감징수세액 (추가납부)",
      ye.isRefund ? "13월의 월급 환급 예정액" : "추가 징수 예정액",
      ye.refundOrPayback,
      ye.isRefund ? "환급" : "추가납부",
    ],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(s1Rows);
  XLSX.utils.book_append_sheet(wb, ws1, "연말정산_정산요약");

  // ========================================================
  // 시트 2: 소득_세액공제_상세
  // ========================================================
  const s2Rows: (string | number)[][] = [
    [`[${year}년도] 소득·세액공제 세부 명세서`],
    [],
    ["공제 분류", "공제 항목", "지출/납입 금액 (원)", "법정 한도", "공제율", "반영 공제액 (원)"],
    ["소득공제", "기본인적공제", ye.basicDeduction, "1인당 150만원", "100%", ye.basicDeduction],
    ["소득공제", "국민연금보험료", ye.pensionInsuranceDeduction, "전액", "100%", ye.pensionInsuranceDeduction],
    ["소득공제", "건강/고용보험료", ye.healthInsuranceDeduction, "전액", "100%", ye.healthInsuranceDeduction],
    ["소득공제", "주택청약종합저축", opts.yearEndInput?.housingSubscriptionDeposit ?? 0, "연 300만원", "40%", ye.housingSavingsDeduction],
    ["소득공제", "신용카드", opts.yearEndInput?.creditCardSpent ?? 0, "총급여 25% 초과분", "15%", "-"],
    ["소득공제", "체크카드/현금영수증", opts.yearEndInput?.debitCardCashSpent ?? 0, "총급여 25% 초과분", "30%", "-"],
    ["소득공제", "카드류 공제 합계", (opts.yearEndInput?.creditCardSpent ?? 0) + (opts.yearEndInput?.debitCardCashSpent ?? 0), "최대 300만원", "-", ye.cardDeduction],
    [],
    ["세액공제", "근로소득 세액공제", "-", "산출세액 기준", "55% / 30%", ye.wageEarnerTaxCredit],
    ["세액공제", "연금저축 납입액", opts.yearEndInput?.pensionSavingsContribution ?? 0, "연 600만원", "16.5% / 13.2%", "-"],
    ["세액공제", "퇴직연금(IRP) 납입액", opts.yearEndInput?.irpContribution ?? 0, "합산 900만원", "16.5% / 13.2%", "-"],
    ["세액공제", "연금계좌 공제 합계", (opts.yearEndInput?.pensionSavingsContribution ?? 0) + (opts.yearEndInput?.irpContribution ?? 0), "연 900만원", "16.5% / 13.2%", ye.pensionAccountsCredit],
    ["세액공제", "보장성 보험료", opts.yearEndInput?.insurancePremiumPaid ?? 0, "연 100만원", "13.2%", ye.insuranceTaxCredit],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(s2Rows);
  XLSX.utils.book_append_sheet(wb, ws2, "공제_세부명세");

  // ========================================================
  // 시트 3: 해외주식_양도소득세
  // ========================================================
  if (cg) {
    const s3Rows: (string | number)[][] = [
      [`[${year}년도] 해외주식 양도소득세 계산서`],
      [],
      ["항목", "금액 (원)", "산출 근거 및 설명"],
      ["총 매도 가액", cg.totalProceeds, "해외주식 매도 대금 원화 환산 합계"],
      ["(-) 총 취득 가액", cg.totalCost, "매수 원가 원화 환산 합계"],
      ["(-) 매매 수수료 및 제세금", cg.totalFees, "증권사 수수료 및 현지 제세금 합계"],
      ["= 순 양도차익 (실현손익)", cg.netRealizedGain, "총매도가 - 총취득가 - 제비용"],
      ["(-) 연간 기본공제", cg.appliedDeduction, "연 250만원 한도"],
      ["= 과세표준", cg.taxableBase, "순양도차익 - 기본공제"],
      ["양도소득세 (국세 20%)", cg.nationalTax, "과세표준 × 20%"],
      ["지방소득세 (지방세 2%)", cg.localTax, "과세표준 × 2%"],
      ["총 납부예상세액 (22%)", cg.totalEstimatedTax, "양도소득세 + 지방소득세"],
      [],
      ["[실현 매도 체결 목록]"],
      ["체결일시", "종목명", "심볼", "매도수량", "매도가(원화)", "매수가(원화)", "수수료/제세금", "실현손익(원화)"],
    ];

    if (opts.capitalGainsTrades && opts.capitalGainsTrades.length > 0) {
      for (const t of opts.capitalGainsTrades) {
        const gain = t.quantity * t.sellPrice - t.quantity * t.buyPrice - t.feeAndTax;
        s3Rows.push([
          t.tradedAt.slice(0, 10),
          t.name,
          t.symbol,
          t.quantity,
          Math.round(t.sellPrice),
          Math.round(t.buyPrice),
          Math.round(t.feeAndTax),
          Math.round(gain),
        ]);
      }
    } else {
      s3Rows.push(["-", "실현 매도 내역 없음", "-", 0, 0, 0, 0, 0]);
    }

    const ws3 = XLSX.utils.aoa_to_sheet(s3Rows);
    XLSX.utils.book_append_sheet(wb, ws3, "해외주식_양도소득세");
  }

  // ========================================================
  // 시트 4: 금융소득_배당이자
  // ========================================================
  if (fi) {
    const s4Rows: (string | number)[][] = [
      [`[${year}년도] 금융소득 (배당·이자) 종합과세 모니터링 명세서`],
      [],
      ["구분", "금액 (원)", "비고"],
      ["총 금융소득 (세전)", fi.totalGross, "2,000만원 기준 종합과세 대상 판정 기준"],
      ["· 배당소득 (세전)", fi.dividendGross, ""],
      ["· 이자소득 (세전)", fi.interestGross, ""],
      ["기납부 원천징수세 (15.4%)", fi.totalWithheldTax, "소득세 14% + 지방소득세 1.4%"],
      ["실수령액 (세후)", fi.netReceived, "세전금액 - 원천징수세"],
      ["종합과세 기준 한도", fi.threshold, "연 20,000,000원"],
      ["종합과세 잔여 한도", fi.remainingLimit, "초과 시 타 소득과 합산 누진과세"],
      ["한도 소진율", `${(fi.utilizationRate * 100).toFixed(1)}%`, fi.status === "safe" ? "안전 (분리과세)" : "종합과세 주의"],
      [],
      ["[수취 상세 내역]"],
      ["수취일자", "구분", "종목/상품명", "세전 금액 (원)", "원천징수세 (15.4%)", "실수령액 (원)"],
    ];

    if (opts.incomesList && opts.incomesList.length > 0) {
      for (const inc of opts.incomesList) {
        s4Rows.push([
          inc.paidOn,
          inc.kind === "dividend" ? "배당소득" : "이자소득",
          inc.name,
          inc.gross,
          inc.withheldTax,
          inc.net,
        ]);
      }
    } else {
      s4Rows.push(["-", "-", "수취 내역 없음", 0, 0, 0]);
    }

    const ws4 = XLSX.utils.aoa_to_sheet(s4Rows);
    XLSX.utils.book_append_sheet(wb, ws4, "금융소득_배당이자");
  }

  return new Uint8Array(XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer);
}
