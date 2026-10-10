import { describe, it, expect } from "vitest";
import { parseHometaxJson, parseHometaxRows } from "./hometax";

describe("hometax.ts - 국세청 연말정산 간소화 파서", () => {
  it("홈택스 표준 전자문서 JSON 파싱 테스트", () => {
    const mockHometaxJson = JSON.stringify({
      doc: {
        docType: "HOMETAX_SIMPLIFIED",
        attYr: "2026",
        man: [
          {
            name: "홍길동",
            form: [
              { formCd: "P102Y", formNm: "연금저축", tradeNm: "KB증권", amt: 4000000 },
              { formCd: "P101M", formNm: "퇴직연금(IRP)", tradeNm: "미래에셋증권", amt: 3000000 },
              { formCd: "J301Y", formNm: "주택청약종합저축", tradeNm: "국민은행", amt: 2400000 },
              { formCd: "A102Y", formNm: "보장성보험", tradeNm: "삼성생명", amt: 1200000 },
              { formCd: "G107Y", formNm: "신용카드", tradeNm: "현대카드", amt: 15000000 },
              { formCd: "G207Y", formNm: "직불·체크카드", tradeNm: "토스뱅크", amt: 8000000 },
              { formCd: "G307Y", formNm: "현금영수증", tradeNm: "국세청", amt: 1200000 },
            ],
          },
        ],
      },
    });

    const parsed = parseHometaxJson(mockHometaxJson);
    expect(parsed.year).toBe(2026);
    expect(parsed.userName).toBe("홍길동");
    expect(parsed.pensionSavingsContribution).toBe(4_000_000);
    expect(parsed.irpContribution).toBe(3_000_000);
    expect(parsed.housingSubscriptionDeposit).toBe(2_400_000);
    expect(parsed.insurancePremiumPaid).toBe(1_200_000);
    expect(parsed.creditCardSpent).toBe(15_000_000);
    // 체크카드 + 현금영수증 합산: 800만 + 120만 = 920만
    expect(parsed.debitCardCashSpent).toBe(9_200_000);
    expect(parsed.items.length).toBe(7);
  });

  it("홈택스 간소화 CSV 테이블 행 파싱 테스트", () => {
    const mockRows = [
      ["서식코드", "공제항목", "상호/기관", "금액"],
      ["P102", "연금저축계좌", "키움증권", "3,500,000원"],
      ["J301", "주택청약", "우리은행", "1,800,000"],
      ["A102", "보장성 보험료", "DB손해보험", "960,000"],
      ["G107", "신용카드 등", "신한카드", "18,500,000"],
      ["G207", "체크카드", "카카오뱅크", "6,200,000"],
    ];

    const parsed = parseHometaxRows(mockRows);
    expect(parsed.pensionSavingsContribution).toBe(3_500_000);
    expect(parsed.housingSubscriptionDeposit).toBe(1_800_000);
    expect(parsed.insurancePremiumPaid).toBe(960_000);
    expect(parsed.creditCardSpent).toBe(18_500_000);
    expect(parsed.debitCardCashSpent).toBe(6_200_000);
    expect(parsed.items.length).toBe(5);
  });
});
