import { describe, expect, it } from "vitest";
import {
  activeStatementRegions,
  lookupServicesForRegion,
  plannedStatementRegionTitles,
  statementLookupCompanies,
  statementLookupGroups,
  statementRegionFor,
  statementRegionForQuery,
  STATEMENT_REGIONS,
  STATEMENT_SIDE_SLOTS,
} from "./statement-regions";

describe("STATEMENT_REGIONS", () => {
  it("활성 칸은 국내·미국만", () => {
    expect(activeStatementRegions().map((r) => r.id)).toEqual(["kr", "us"]);
  });

  it("일본·중국·유럽은 예약만(수집기 없음)", () => {
    expect(plannedStatementRegionTitles()).toEqual(["일본", "중국", "유럽"]);
    for (const id of ["jp", "cn", "eu"] as const) {
      const r = STATEMENT_REGIONS.find((x) => x.id === id)!;
      expect(r.active).toBe(false);
      expect(r.venue).toBeNull();
    }
  });
});

describe("STATEMENT_SIDE_SLOTS", () => {
  it("수집 3칸 + 예약 4칸. 예약은 숫자 없음", () => {
    expect(STATEMENT_SIDE_SLOTS.filter((s) => s.kind === "collected").map((s) => s.id))
      .toEqual(["summary", "ratios", "audit", "overview", "segment", "holders", "dividend"]);
    expect(STATEMENT_SIDE_SLOTS.filter((s) => s.kind === "reserved")).toEqual([]);
    for (const s of STATEMENT_SIDE_SLOTS) {
      if (s.kind === "reserved") expect(s.emptyHint.length).toBeGreaterThan(8);
    }
  });
});

describe("statementRegionFor", () => {
  it("market으로 가른다", () => {
    expect(statementRegionFor({ symbol: "005930", market: "KRX" })?.id).toBe("kr");
    expect(statementRegionFor({ symbol: "AAPL", market: "US" })?.id).toBe("us");
    expect(statementRegionFor({ symbol: "7203.T", market: "TSE" })?.id).toBe("jp");
  });

  it("market 없으면 심볼 창구", () => {
    expect(statementRegionFor({ symbol: "005930", market: "" })?.id).toBe("kr");
    expect(statementRegionFor({ symbol: "MSFT", market: "INDEX" })?.id).toBe("us");
  });

  it("암호·미지원은 null", () => {
    expect(statementRegionFor({ symbol: "BTC-USD", market: "CRYPTO" })).toBeNull();
  });
});

describe("statementRegionForQuery", () => {
  it("심볼로 국내·미국만 추정", () => {
    expect(statementRegionForQuery("삼성전자")?.id).toBe("kr");
    expect(statementRegionForQuery("AAPL")?.id).toBe("us");
    expect(statementRegionForQuery("BTC-USD")).toBeNull();
  });
});

describe("statementLookupGroups", () => {
  it("지역마다 하위 업종 칸을 여러 개 둔다", () => {
    const kr = statementLookupGroups("kr");
    expect(kr.map((g) => g.id)).toEqual([
      "bigtech", "semi", "platform", "battery", "auto", "finance", "bio", "consumer",
    ]);
    expect(statementLookupGroups("us").length).toBe(8);
    expect(statementLookupGroups("jp").length).toBe(8);
  });

  it("국내·미국은 섹터마다 종목이 있다", () => {
    for (const id of ["kr", "us"] as const) {
      for (const g of statementLookupGroups(id)) {
        expect(g.companies.length, `${id}/${g.id}`).toBeGreaterThan(0);
        for (const c of g.companies) {
          expect(c.symbol.length).toBeGreaterThan(0);
          expect(c.name.length).toBeGreaterThan(0);
        }
      }
    }
    expect(statementLookupGroups("kr").find((g) => g.id === "semi")!.companies.map((c) => c.symbol))
      .toContain("042700");
    expect(statementLookupGroups("us").find((g) => g.id === "finance")!.companies.map((c) => c.symbol))
      .toContain("JPM");
  });

  it("statementLookupCompanies는 그룹을 합친다", () => {
    expect(statementLookupCompanies("us").map((c) => c.symbol)).toContain("AAPL");
    expect(statementLookupCompanies("us").map((c) => c.symbol)).toContain("JPM");
    expect(statementLookupCompanies("jp")).toEqual([]);
  });
});

describe("lookupServicesForRegion", () => {
  it("국내는 DART·해설만", () => {
    const kr = STATEMENT_REGIONS.find((r) => r.id === "kr")!;
    const ids = lookupServicesForRegion(kr, "005930").map((s) => s.id);
    expect(ids).toContain("dart-overview");
    expect(ids).toContain("fs-reading");
    expect(ids).not.toContain("edgar-company");
  });

  it("미국은 EDGAR만", () => {
    const us = STATEMENT_REGIONS.find((r) => r.id === "us")!;
    const ids = lookupServicesForRegion(us, "AAPL").map((s) => s.id);
    expect(ids).toContain("edgar-company");
    expect(ids).not.toContain("fs-reading");
  });

  it("venue 없는 지역은 링크 없음", () => {
    const jp = STATEMENT_REGIONS.find((r) => r.id === "jp")!;
    expect(lookupServicesForRegion(jp, "7203")).toEqual([]);
  });
});
