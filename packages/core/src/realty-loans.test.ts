import { describe, expect, it } from "vitest";
import {
  alignedShare,
  ecosMetroFromItemName,
  eokToJo,
  isEcosRegionGroup,
  loanGrowth,
  loanYoySeries,
  metroHeightScale,
  metroLoanRank,
  planExtrudeMeters,
  realtyMetroForPlace,
  realtyMetroFromKostatCode,
  shareOf,
} from "./realty-loans";

describe("realty loans", () => {
  it("시·구는 광역시도로만 묶는다", () => {
    expect(realtyMetroForPlace("seoul")).toBe("seoul");
    expect(realtyMetroForPlace("dongtan")).toBe("gyeonggi");
    expect(realtyMetroForPlace("guri")).toBe("gyeonggi");
    expect(realtyMetroForPlace("incheon")).toBe("incheon");
    expect(realtyMetroForPlace("busan")).toBe("busan");
    expect(realtyMetroFromKostatCode("21010")).toBe("busan");
    expect(realtyMetroFromKostatCode("39010")).toBe("jeju");
    expect(ecosMetroFromItemName("서울")).toBe("seoul");
    expect(ecosMetroFromItemName("경기도")).toBe("gyeonggi");
    expect(ecosMetroFromItemName("서울 특별시")).toBe("seoul");
    expect(ecosMetroFromItemName("부산")).toBe("busan");
    expect(ecosMetroFromItemName("전북특별자치도")).toBe("jeonbuk");
    expect(ecosMetroFromItemName("광주")).toBe("gwangju");
    expect(ecosMetroFromItemName("광주시")).toBeNull();
    expect(isEcosRegionGroup("지역코드")).toBe(true);
  });

  it("전년동월·전월 증가율과 조원 환산", () => {
    const pts = [
      { date: "2025-06-01", value: 100 },
      { date: "2025-07-01", value: 102 },
      { date: "2026-06-01", value: 110 },
      { date: "2026-07-01", value: 121 },
    ];
    expect(loanGrowth(pts, 12)).toBeCloseTo(0.186274, 5);
    expect(loanGrowth(pts, 1)).toBeCloseTo(0.1, 5);
    expect(loanYoySeries(pts)).toHaveLength(2);
    expect(eokToJo(966770.6)).toBeCloseTo(966.7706, 4);
    const sc = metroHeightScale({ seoul: 400, gyeonggi: 200, incheon: 100 });
    expect(sc?.seoul).toBe(1);
    expect(sc?.incheon).toBeCloseTo(0.25, 5);
    expect(sc?.busan).toBe(0.2);
    expect(planExtrudeMeters("regulated", 1)).toBe(5300);
    expect(planExtrudeMeters("regulated", null)).toBe(2500);
  });

  it("전국 대비 비중과 시도 순위", () => {
    expect(shareOf(200, 400)).toBeCloseTo(0.5, 8);
    expect(shareOf(10, 0)).toBeNull();
    expect(shareOf(null, 100)).toBeNull();
    const part = [
      { date: "2026-06-01", value: 100 },
      { date: "2026-07-01", value: 120 },
    ];
    const whole = [
      { date: "2026-06-01", value: 400 },
      { date: "2026-07-01", value: 400 },
    ];
    expect(alignedShare(part, whole).map((p: any) => p.value)).toEqual([0.25, 0.3]);
    const rank = metroLoanRank(
      [
        { id: "seoul", label: "서울", latest: 400 },
        { id: "gyeonggi", label: "경기", latest: 500 },
        { id: "incheon", label: "인천", latest: null },
      ],
      2000,
    );
    expect(rank.map((r: any) => r.id)).toEqual(["gyeonggi", "seoul", "incheon"]);
    expect(rank[0]?.rank).toBe(1);
    expect(rank[0]?.shareOfKr).toBeCloseTo(0.25, 8);
    expect(rank[2]?.rank).toBeNull();
  });
});
