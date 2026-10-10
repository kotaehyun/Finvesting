import { describe, expect, it } from "vitest";
import {
  buildJournalEntries,
  resolveCounterAccountCode,
  resolveExpenseAccountCode,
  STANDARD_CHART_OF_ACCOUNTS,
} from "./accounting-journal";

describe("accounting-journal", () => {
  it("계정과목표가 표준 규격에 맞게 등록되어 있다", () => {
    expect(STANDARD_CHART_OF_ACCOUNTS["101"]!.name).toBe("현금");
    expect(STANDARD_CHART_OF_ACCOUNTS["103"]!.name).toBe("보통예금");
    expect(STANDARD_CHART_OF_ACCOUNTS["253"]!.name).toBe("미지급금(카드)");
    expect(STANDARD_CHART_OF_ACCOUNTS["811"]!.name).toBe("복리후생비");
    expect(STANDARD_CHART_OF_ACCOUNTS["904"]!.name).toBe("배당금수익");
  });

  it("지출 카테고리 및 결제수단에 따라 올바른 계정코드를 반환한다", () => {
    expect(resolveExpenseAccountCode("식비").code).toBe("811");
    expect(resolveExpenseAccountCode("대중교통").code).toBe("812");
    expect(resolveExpenseAccountCode("통신비").code).toBe("813");
    expect(resolveExpenseAccountCode("관리비").code).toBe("814");
    expect(resolveExpenseAccountCode("월세").code).toBe("816");
    expect(resolveExpenseAccountCode("알수없는지출").code).toBe("990");

    expect(resolveCounterAccountCode("credit_card").code).toBe("253");
    expect(resolveCounterAccountCode("loan").code).toBe("260");
    expect(resolveCounterAccountCode("checking").code).toBe("103");
  });

  it("카드 지출 거래에 대해 차변(비용)과 대변(미지급금) 분개를 생성하고 대차평형을 이룬다", () => {
    const res = buildJournalEntries({
      transactions: [
        {
          id: "tx-1",
          date: "2026-10-01",
          accountType: "credit_card",
          accountName: "현대카드",
          type: "expense",
          category: "식비",
          merchant: "스타벅스",
          description: "아메리카노",
          amount: 4500,
        },
      ],
    });

    expect(res.totalVouchers).toBe(1);
    expect(res.isAllBalanced).toBe(true);
    expect(res.difference).toBe(0);

    const group = res.entries[0]!;
    expect(group.lines).toHaveLength(2);
    expect(group.lines[0]).toMatchObject({
      side: "debit",
      accountCode: "811",
      accountName: "복리후생비",
      amount: 4500,
    });
    expect(group.lines[1]).toMatchObject({
      side: "credit",
      accountCode: "253",
      accountName: "미지급금(현대카드)",
      counterparty: "현대카드",
      amount: 4500,
    });
  });

  it("배당금 수취 시 보통예금에 증권사/은행명이 붙고 대차평형을 이룬다", () => {
    const res = buildJournalEntries({
      investmentIncomes: [
        {
          id: "div-1",
          date: "2026-10-05",
          ticker: "005930.KS",
          name: "삼성전자",
          incomeType: "dividend",
          institution: "키움증권",
          grossAmount: 100000,
          netAmount: 84600,
          taxAmount: 15400,
        },
      ],
    });

    expect(res.totalVouchers).toBe(1);
    expect(res.isAllBalanced).toBe(true);
    expect(res.debitSum).toBe(100000);
    expect(res.creditSum).toBe(100000);

    const lines = res.entries[0]!.lines;
    expect(lines).toHaveLength(3);
    const depositLine = lines.find((l) => l.accountCode === "103")!;
    expect(depositLine.accountName).toBe("보통예금(키움증권)");
    expect(depositLine.counterparty).toBe("키움증권");
    expect(depositLine.amount).toBe(84600);
    expect(lines.find((l) => l.accountCode === "136")?.counterparty).toBe("국세청(원천:키움증권)");
    expect(lines.find((l) => l.accountCode === "904")?.counterparty).toBe("삼성전자");
  });

  it("주식 매도 시 실현이익이 있는 경우 대변에 원가와 처분이익을 분개한다", () => {
    const res = buildJournalEntries({
      trades: [
        {
          id: "tr-1",
          date: "2026-10-08",
          ticker: "NVDA",
          name: "엔비디아",
          side: "sell",
          institution: "키움증권",
          quantity: 5,
          price: 180,
          totalAmount: 1200000,
          realizedPnl: 300000, // 원가 90만, 이익 30만
        },
      ],
    });

    expect(res.totalVouchers).toBe(1);
    expect(res.isAllBalanced).toBe(true);
    const lines = res.entries[0]!.lines;
    const depositLine = lines.find((l) => l.side === "debit" && l.accountCode === "103")!;
    expect(depositLine.accountName).toBe("보통예금(키움증권)");
    expect(depositLine.counterparty).toBe("키움증권");
    expect(lines.find((l) => l.side === "credit" && l.accountCode === "107")?.amount).toBe(900000);
    expect(lines.find((l) => l.side === "credit" && l.accountCode === "906")?.amount).toBe(300000);
  });

  it("급여 전표 생성 시 보통예금(은행명)과 예수금(원천세/4대보험)이 정상 분개된다", () => {
    const res = buildJournalEntries({
      payrolls: [
        {
          id: "pr-1",
          date: "2026-10-10",
          grossIncome: 4000000,
          netIncome: 3350000,
          nationalPension: 180000,
          healthInsurance: 140000,
          employmentInsurance: 36000,
          incomeTax: 260000,
          localTax: 26000,
          companyName: "핀베스팅",
          receivingBank: "KB국민은행",
        },
      ],
    });

    expect(res.totalVouchers).toBe(1);
    expect(res.isAllBalanced).toBe(true);
    expect(res.debitSum).toBe(4000000);
    expect(res.creditSum).toBe(4000000);

    const lines = res.entries[0]!.lines;
    const salaryDeposit = lines.find((l) => l.accountCode === "103")!;
    expect(salaryDeposit.accountName).toBe("보통예금(KB국민은행)");
    expect(salaryDeposit.counterparty).toBe("KB국민은행");

    const withholdingLine = lines.find((l) => l.accountCode === "254")!;
    expect(withholdingLine.accountName).toBe("예수금(원천세/4대보험)");
    expect(withholdingLine.counterparty).toBe("국세청/국민건강보험공단");
  });
});
