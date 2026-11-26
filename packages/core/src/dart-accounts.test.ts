import { describe, expect, it } from "vitest";
import {
  dartStatementKind,
  mapDartAccountKey,
  dartReportedAmount,
  mapDartFsRow,
  normalizeDartAccountNm,
  parseDartAmount,
  shouldDeleteStaleDartIncome,
} from "./dart-accounts";

describe("dart-accounts", () => {
  it("계정명 공백을 정규화한다", () => {
    expect(normalizeDartAccountNm("영업활동 현금흐름")).toBe("영업활동현금흐름");
  });

  it("sj_div → statement", () => {
    expect(dartStatementKind("CF")).toBe("cashflow");
    expect(dartStatementKind("BS")).toBe("balance");
    expect(dartStatementKind("IS")).toBe("income");
    expect(dartStatementKind("CIS")).toBe("income");
    expect(dartStatementKind("SCE")).toBeNull();
  });

  it("영업활동현금흐름은 account_id 우선", () => {
    expect(mapDartAccountKey({
      accountId: "ifrs-full_CashFlowsFromUsedInOperatingActivities",
      accountNm: "영업활동현금흐름",
    })).toBe("cfo");
  });

  it("영업에서 창출된 현금흐름은 cfo가 아니다", () => {
    expect(mapDartAccountKey({
      accountId: "ifrs-full_CashFlowsFromUsedInOperations",
      accountNm: "영업에서 창출된 현금흐름",
    })).toBeNull();
  });

  it("계정명만으로도 cfo 매핑", () => {
    expect(mapDartAccountKey({ accountNm: "영업활동으로 인한 현금흐름" })).toBe("cfo");
  });

  it("금액 파싱", () => {
    expect(parseDartAmount("72,982,621,000,000")).toBe(72_982_621_000_000);
    expect(parseDartAmount("-")).toBeNull();
    expect(parseDartAmount("")).toBeNull();
  });

  it("반기·3분기 손익은 누적 칸만 쓰고, 없으면 비운다", () => {
    expect(dartReportedAmount({
      statement: "income",
      period: "H1",
      thstrmAmount: "1",
      thstrmAddAmount: "2",
    })).toBe(2);
    expect(dartReportedAmount({
      statement: "income",
      period: "Q3",
      thstrmAmount: "3",
      thstrmAddAmount: null,
    })).toBeNull();
    expect(dartReportedAmount({
      statement: "income",
      period: "Q1",
      thstrmAmount: "4",
      thstrmAddAmount: "4",
    })).toBe(4);
    expect(dartReportedAmount({
      statement: "income",
      period: "FY",
      thstrmAmount: "5",
      thstrmAddAmount: "9",
    })).toBe(5);
    expect(dartReportedAmount({
      statement: "balance",
      period: "H1",
      thstrmAmount: "6",
      thstrmAddAmount: "7",
    })).toBe(6);
    expect(dartReportedAmount({
      statement: "cashflow",
      period: "Q3",
      thstrmAmount: "8",
      thstrmAddAmount: "9",
    })).toBe(8);
  });

  it("CF의 당기순이익 행은 cashflow에 넣지 않는다", () => {
    expect(mapDartFsRow({
      sjDiv: "CF",
      accountNm: "당기순이익",
    })).toBeNull();
    expect(mapDartFsRow({
      sjDiv: "CF",
      accountId: "ifrs-full_CashFlowsFromUsedInOperatingActivities",
      accountNm: "영업활동현금흐름",
    })).toEqual({ statement: "cashflow", key: "cfo" });
  });

  it("반기·3분기 손익 칸이 비면 옛 행을 지운다", () => {
    expect(shouldDeleteStaleDartIncome({ period: "H1", incomeItemCount: 0 })).toBe(true);
    expect(shouldDeleteStaleDartIncome({ period: "Q3", incomeItemCount: 0 })).toBe(true);
    expect(shouldDeleteStaleDartIncome({ period: "H1", incomeItemCount: 1 })).toBe(false);
    expect(shouldDeleteStaleDartIncome({ period: "Q1", incomeItemCount: 0 })).toBe(false);
    expect(shouldDeleteStaleDartIncome({ period: "FY", incomeItemCount: 0 })).toBe(false);
  });
});
