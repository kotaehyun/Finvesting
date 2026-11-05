import { describe, expect, it } from "vitest";
import { REALTY_CLAIM_MIX, REALTY_CLAIMS, realtyClaimsForTitle } from "./realty-claims";

describe("realty claims", () => {
  it("5:5는 공식 목표가 아니다", () => {
    expect(REALTY_CLAIM_MIX.apt).toBe(5);
    expect(REALTY_CLAIM_MIX.other).toBe(5);
    expect(REALTY_CLAIM_MIX.note).toContain("공식 목표");
  });

  it("제목 키워드만 매칭한다", () => {
    expect(realtyClaimsForTitle("서울 공급 부족 재건축")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "supply-short" }),
        expect.objectContaining({ id: "rebuild" }),
      ]),
    );
    expect(realtyClaimsForTitle("고위공직자 재산공개").some((c: any) => c.id === "elite-seoul")).toBe(true);
    expect(realtyClaimsForTitle("종부세 서울").some((c: any) => c.id === "elite-seoul")).toBe(true);
    expect(realtyClaimsForTitle("법인 명의 투기").some((c: any) => c.id === "corp-name")).toBe(true);
    expect(realtyClaimsForTitle("연예인 증여 자산가").some((c: any) => c.id === "corp-name")).toBe(true);
    expect(realtyClaimsForTitle("전국 평균 30대 신혼").some((c: any) => c.id === "avg-trap")).toBe(true);
    expect(realtyClaimsForTitle("영끌 청년 DSR").some((c: any) => c.id === "young-leverage")).toBe(true);
    expect(realtyClaimsForTitle("꼬마빌딩 상가 부채").some((c: any) => c.id === "small-bldg")).toBe(true);
    expect(realtyClaimsForTitle("전세 월세 거래").some((c: any) => c.id === "jeonse-safe")).toBe(true);
    expect(REALTY_CLAIMS).toHaveLength(13);
    expect(REALTY_CLAIMS.every((c: any) => (c.facts?.length ?? 0) > 0)).toBe(true);
    expect(REALTY_CLAIMS.find((c: any) => c.id === "avg-trap")?.facts?.length).toBe(3);
  });
});
