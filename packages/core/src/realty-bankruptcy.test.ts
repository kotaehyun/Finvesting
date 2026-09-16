import { describe, expect, it } from "vitest";
import { REALTY_BANKRUPTCY_CAUSES, REALTY_INSOLVENCY_STATS } from "./realty-bankruptcy";

describe("realty bankruptcy causes and insolvency stats", () => {
  it("파산 및 채무불이행 주요 원인에 생활대금, 주담대, 주식미수금이 포함된다", () => {
    const ids = REALTY_BANKRUPTCY_CAUSES.map((c) => c.id);
    expect(ids).toContain("living");
    expect(ids).toContain("mortgage");
    expect(ids).toContain("investment");
    expect(ids).toContain("business");

    const living = REALTY_BANKRUPTCY_CAUSES.find((c) => c.id === "living");
    expect(living?.share).toBeGreaterThan(40); // 생활대금 파산이 1위

    const mortgage = REALTY_BANKRUPTCY_CAUSES.find((c) => c.id === "mortgage");
    expect(mortgage?.share).toBeGreaterThan(20); // 주담대 부담

    const investment = REALTY_BANKRUPTCY_CAUSES.find((c) => c.id === "investment");
    expect(investment?.youthShare).toBeGreaterThan(30); // 2030 청년층 주식/미수금 비중 높음
  });

  it("사법연감 도산 신청 및 주식 미수금 지표가 유효하다", () => {
    expect(REALTY_INSOLVENCY_STATS.rehabilitationFiled).toBeGreaterThan(100_000);
    expect(REALTY_INSOLVENCY_STATS.bankruptcyFiled).toBeGreaterThan(30_000);
    expect(REALTY_INSOLVENCY_STATS.stockMarginReceivablesEok).toBeGreaterThan(0);
    expect(REALTY_INSOLVENCY_STATS.stockDailyForcedSaleEok).toBeGreaterThan(0);
  });
});
