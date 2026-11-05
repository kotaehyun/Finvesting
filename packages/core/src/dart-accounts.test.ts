import { describe, expect, it } from "vitest";
import {
  dartStatementKind,
  mapDartAccountKey,
  mapDartFsRow,
  normalizeDartAccountNm,
  parseDartAmount,
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
});
