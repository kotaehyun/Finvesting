import { describe, expect, it } from "vitest";
import {
  defaultRegionInArea,
  defaultStatementBrowse,
  EMPTY_SECTOR_PREFS,
  instrumentInArea,
  mergeStatementSectors,
  parseCustomCategoryTitle,
  regionsInArea,
  sortHoldingsByInvested,
  statementAreaForRegion,
  toggleSectorSymbol,
  STATEMENT_AREAS,
} from "./statement-browse";

describe("국내·해외 칸", () => {
  it("국내 kr, 해외는 미국+예약 지역", () => {
    expect(STATEMENT_AREAS.map((a) => a.id)).toEqual(["kr", "os"]);
    expect(regionsInArea("kr").map((r) => r.id)).toEqual(["kr"]);
    expect(regionsInArea("os").map((r) => r.id)).toEqual(["us", "jp", "cn", "eu"]);
    expect(defaultRegionInArea("os")).toBe("us");
    expect(statementAreaForRegion("us")).toBe("os");
  });

  it("코인은 국내·해외 재무 칸에 넣지 않음", () => {
    expect(instrumentInArea({ symbol: "BTC", market: "UPBIT" }, "kr")).toBe(false);
    expect(instrumentInArea({ symbol: "BTC", market: "UPBIT" }, "os")).toBe(false);
    expect(instrumentInArea({ symbol: "005930", market: "KRX" }, "kr")).toBe(true);
    expect(instrumentInArea({ symbol: "AAPL", market: "NASDAQ" }, "os")).toBe(true);
    expect(instrumentInArea({ symbol: "AAPL", market: "NASDAQ" }, "kr")).toBe(false);
  });
});

describe("첫 화면 보기", () => {
  it("보유 있으면 보유, 없으면 관심, 둘 다 없으면 기업", () => {
    expect(defaultStatementBrowse({ holdingCount: 2, watchCount: 5 })).toBe("holdings");
    expect(defaultStatementBrowse({ holdingCount: 0, watchCount: 1 })).toBe("watchlist");
    expect(defaultStatementBrowse({ holdingCount: 0, watchCount: 0 })).toBe("companies");
  });

  it("평가액 큰 순. 시세 없으면 원가", () => {
    const rows = sortHoldingsByInvested([
      { symbol: "A", marketValueKrw: 1_000, costKrw: 9_000 },
      { symbol: "B", marketValueKrw: null, costKrw: 8_000 },
      { symbol: "C", marketValueKrw: 50_000, costKrw: 1 },
    ]);
    expect(rows.map((r) => r.symbol)).toEqual(["C", "B", "A"]);
  });
});

describe("카테고리 이름", () => {
  it("공백이면 추가하지 않고, 20자로 자른다", () => {
    expect(parseCustomCategoryTitle("  ")).toBeNull();
    expect(parseCustomCategoryTitle(" 배당주 ")).toBe("배당주");
    expect(parseCustomCategoryTitle("가".repeat(25))?.length).toBe(20);
  });
});

describe("섹터 병합", () => {
  const groups = [
    { id: "bigtech" as const, title: "빅테크", companies: [{ symbol: "005930", name: "삼성전자" }] },
    { id: "semi" as const, title: "반도체", companies: [] },
  ];

  it("숨긴 칸은 빼고, 커스텀을 뒤에 붙인다", () => {
    const rows = mergeStatementSectors(groups, {
      ...EMPTY_SECTOR_PREFS,
      hiddenIds: ["semi"],
      custom: [{ id: "c1", title: "배당주", symbols: ["005930"] }],
    });
    expect(rows.map((r) => r.id)).toEqual(["bigtech", "c1"]);
    expect(rows[1]?.symbols).toEqual(["005930"]);
  });

  it("기본 종목 빼기·넣기는 extra/removed만 쓴다", () => {
    const base = mergeStatementSectors(groups, EMPTY_SECTOR_PREFS)[0]!;
    const removed = toggleSectorSymbol(EMPTY_SECTOR_PREFS, base, "005930", ["005930"]);
    expect(mergeStatementSectors(groups, removed)[0]?.symbols).toEqual([]);
    const added = toggleSectorSymbol(removed, { ...base, symbols: [] }, "000660", ["005930"]);
    expect(mergeStatementSectors(groups, added)[0]?.symbols).toEqual(["000660"]);
  });
});
