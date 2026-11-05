import { describe, expect, it } from "vitest";
import {
  REALTY_LISTING_TYPES,
  REALTY_LOAN_RISKS,
  REALTY_METRIC_SLOTS,
  REALTY_MIND,
  REALTY_REF_LINKS,
  REALTY_REGULATED_GYEONGGI,
  REALTY_REGULATED_SEOUL,
  REALTY_ZONES,
  realtyFreshRegulated,
  realtyRegulatedGyeonggiCount,
} from "./realty-ref";

describe("realty ref", () => {
  it("과밀억제권역에 서울이 있고 법령 링크가 있다", () => {
    const z = REALTY_ZONES.find((x: any) => x.id === "overcrowded");
    expect(z?.places.some((p: any) => p.includes("서울"))).toBe(true);
    expect(REALTY_REF_LINKS.some((l: any) => l.url.includes("law.go.kr"))).toBe(true);
  });

  it("규제지역은 서울 전역과 경기 15곳이다", () => {
    expect(REALTY_REGULATED_SEOUL.label).toContain("서울");
    expect(realtyRegulatedGyeonggiCount()).toBe(15);
    const labels = REALTY_REGULATED_GYEONGGI.map((p: any) => p.label);
    expect(labels).toContain("화성 동탄구");
    expect(labels).toContain("용인 기흥구");
    expect(labels).toContain("구리시");
    expect(labels.some((l: any) => l.includes("권선"))).toBe(false);
  });

  it("2026-07-01 추가는 동탄·기흥·구리 세 곳이다", () => {
    const fresh = realtyFreshRegulated();
    expect(fresh).toHaveLength(3);
    expect(fresh.every((p: any) => p.since === "2026-07-01")).toBe(true);
  });

  it("대출규제 위험군에 LTV·한도·DSR이 있고 마인드맵 가지가 셋이다", () => {
    const ids = REALTY_LOAN_RISKS.map((r: any) => r.id);
    expect(ids).toContain("ltv");
    expect(ids).toContain("cap");
    expect(ids).toContain("stress-dsr");
    expect(REALTY_LOAN_RISKS.some((r: any) => r.label.includes("40%"))).toBe(true);
    expect(REALTY_MIND.branches.map((b: any) => b.id)).toEqual(["zones", "regulated", "loan"]);
    expect(REALTY_REF_LINKS.some((l: any) => l.url.includes("fsc.go.kr"))).toBe(true);
  });

  it("유형별 매물 칸은 일곱이고 임대·공급 칸과 겹치지 않는다", () => {
    expect(REALTY_LISTING_TYPES.map((t: any) => t.id)).toEqual([
      "apt", "officetel", "villa", "row", "store", "building", "land",
    ]);
    expect(REALTY_LISTING_TYPES.every((t: any) => t.need.includes("실거래"))).toBe(true);
    expect(REALTY_METRIC_SLOTS.map((s: any) => s.id)).toEqual(["rent", "supply"]);
    expect(REALTY_REF_LINKS.some((l: any) => l.url.includes("data.go.kr"))).toBe(true);
    expect(REALTY_REF_LINKS.some((l: any) => l.url.includes("peti.go.kr"))).toBe(true);
    expect(REALTY_REF_LINKS.some((l: any) => l.url.includes("tasis.nts.go.kr"))).toBe(true);
    expect(REALTY_REF_LINKS.some((l: any) => l.url.includes("cofix"))).toBe(true);
    expect(REALTY_REF_LINKS.some((l: any) => l.url.includes("crefia"))).toBe(true);
  });
});
