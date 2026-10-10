import { describe, it, expect } from "vitest";
import {
  buildFinancialTimeline,
  filterTimelineEvents,
  calculateTimelineSummary,
  groupTimelineByDate,
  TimelineInputs,
} from "./timeline";

describe("Financial Timeline Core Pure Functions", () => {
  const sampleInputs: TimelineInputs = {
    transactions: [
      {
        id: "txn-1",
        date: "2026-09-20",
        time: "12:30:00",
        amount: "15000",
        direction: "out",
        category: "food",
        merchant: "스타벅스 강남점",
        accountName: "신한 입출금",
      },
      {
        id: "txn-2",
        date: "2026-09-25",
        time: "09:30:00",
        amount: "3500000",
        direction: "in",
        category: "salary",
        merchant: "(주)핀베스팅 급여",
        accountName: "신한 입출금",
      },
      {
        id: "txn-3",
        date: "2026-09-21",
        time: "15:00:00",
        amount: "500000",
        direction: "transfer",
        category: "transfer",
        memo: "투자 예수금 이체",
        accountName: "신한 입출금",
      },
    ],
    trades: [
      {
        id: "tr-1",
        tradedAt: "2026-09-22T10:00:00.000Z",
        side: "buy",
        quantity: "10",
        price: "70000",
        symbol: "005930",
        name: "삼성전자",
        currency: "KRW",
        accountName: "키움증권",
      },
      {
        id: "tr-2",
        tradedAt: "2026-09-23T14:30:00.000Z",
        side: "buy",
        quantity: "2",
        price: "150",
        fxRate: "1350",
        symbol: "AAPL",
        name: "Apple Inc.",
        currency: "USD",
        accountName: "토스증권",
      },
    ],
    incomes: [
      {
        id: "inc-1",
        paidOn: "2026-09-18",
        kind: "dividend",
        gross: "36100",
        withheldTax: "5550",
        symbol: "005930",
        name: "삼성전자",
        accountName: "키움증권",
      },
    ],
    savings: [
      {
        id: "sav-1",
        month: "2026-09",
        amount: "300000",
        planName: "청년도약계좌",
        institution: "KB국민은행",
      },
    ],
    payrolls: [
      {
        id: "pay-1",
        month: "2026-09",
        grossAmount: "4200000",
        netAmount: "3500000",
        taxAmount: "350000",
        insuranceAmount: "350000",
      },
    ],
  };

  it("여러 소스의 데이터를 통합하고 시간순(최신순)으로 정렬해야 한다", () => {
    const events = buildFinancialTimeline(sampleInputs);

    expect(events.length).toBe(8);

    // 날짜/타임스탬프 내림차순인지 검증
    for (let i = 0; i < events.length - 1; i++) {
      expect(events[i]!.timestamp).toBeGreaterThanOrEqual(events[i + 1]!.timestamp);
    }

    // 외화 주식 체결 환산 검증: AAPL 2주 * $150 * 1350원 = 405,000원
    const aaplTrade = events.find((e) => e.sourceId === "tr-2");
    expect(aaplTrade).toBeDefined();
    expect(aaplTrade?.amount).toBe(405000);
    expect(aaplTrade?.originalAmount).toBe(300);
    expect(aaplTrade?.currency).toBe("USD");
    expect(aaplTrade?.direction).toBe("out");
  });

  it("급여명세는 이중 합산을 방지하기 위해 neutral 방향이어야 하고 통장 급여 입금과 공존해야 한다", () => {
    const events = buildFinancialTimeline(sampleInputs);
    const payrollEv = events.find((e) => e.sourceType === "payroll");
    const salaryTxn = events.find((e) => e.sourceId === "txn-2");

    expect(payrollEv).toBeDefined();
    expect(payrollEv?.direction).toBe("neutral"); // 중립 (이중 합산 방지)
    expect(payrollEv?.type).toBe("payroll_statement");

    expect(salaryTxn).toBeDefined();
    expect(salaryTxn?.direction).toBe("in");
    expect(salaryTxn?.amount).toBe(3500000);

    const summary = calculateTimelineSummary(events);
    // 총 유입(totalIn)에는 실제 통장 입금(3,500,000) + 배당금(36,100)만 포함되어야 함 (3,536,100)
    // 급여명세의 3,500,000원이 추가로 중복 합산되지 않아야 함!
    expect(summary.totalIn).toBe(3536100);
  });

  it("유형 및 월, 검색어 필터링이 정상 동작해야 한다", () => {
    const events = buildFinancialTimeline(sampleInputs);

    // 1. 유형 필터 (투자 매매만)
    const tradeOnly = filterTimelineEvents(events, { typeGroup: "trade" });
    expect(tradeOnly.length).toBe(2);
    expect(tradeOnly.every((e) => e.sourceType === "trade")).toBe(true);

    // 2. 키워드 검색 ("삼성")
    const searchSamsung = filterTimelineEvents(events, { keyword: "삼성" });
    expect(searchSamsung.length).toBe(2); // 삼성전자 매수 1건, 배당금 1건

    // 3. 월 필터 ("2026-09")
    const septEvents = filterTimelineEvents(events, { month: "2026-09" });
    expect(septEvents.length).toBe(8);

    // 4. 없는 월 필터 ("2026-08")
    const augEvents = filterTimelineEvents(events, { month: "2026-08" });
    expect(augEvents.length).toBe(0);
  });

  it("일자별 그룹핑 및 소계가 정확히 산출되어야 한다", () => {
    const events = buildFinancialTimeline(sampleInputs);
    const groups = groupTimelineByDate(events);

    expect(groups.length).toBeGreaterThan(0);
    // 날짜 내림차순 정렬 확인
    for (let i = 0; i < groups.length - 1; i++) {
      expect(groups[i]!.date >= groups[i + 1]!.date).toBe(true);
    }

    // 2026-09-25 그룹 (급여 입금 + 적금 납입 + 급여명세)
    const group25 = groups.find((g) => g.date === "2026-09-25");
    expect(group25).toBeDefined();
    expect(group25?.subtotalIn).toBe(3500000);
    expect(group25?.subtotalOut).toBe(300000); // 적금 납입 300,000
    expect(group25?.dayOfWeek).toBe("금");
  });

  it("요약 통계(Summary) 계산이 정확해야 한다", () => {
    const events = buildFinancialTimeline(sampleInputs);
    const summary = calculateTimelineSummary(events);

    // totalIn: 통장 급여(3,500,000) + 배당(36,100) = 3,536,100
    expect(summary.totalIn).toBe(3536100);
    // totalOut: 스타벅스(15,000) + 삼성전자 매수(700,000) + 애플 매수(405,000) + 적금(300,000) = 1,420,000
    expect(summary.totalOut).toBe(1420000);
    expect(summary.netFlow).toBe(3536100 - 1420000);
    expect(summary.totalInvested).toBe(1105000); // 700,000 + 405,000
    expect(summary.totalDividends).toBe(36100);
    expect(summary.eventCount).toBe(8);
  });
});
