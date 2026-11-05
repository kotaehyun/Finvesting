import { describe, expect, it } from "vitest";
import {
  auditorSite,
  dartCompanyPopupUrl,
  dartViewerUrl,
  edgarCompanyUrl,
  filingVenueFor,
  lookupServices,
} from "./disclosure-links";

describe("dart URLs", () => {
  it("접수번호로 뷰어를 연다", () => {
    expect(dartViewerUrl("20260315000001")).toContain("rcpNo=20260315000001");
  });

  it("종목코드로 기업정보 팝업을 연다", () => {
    expect(dartCompanyPopupUrl("005930")).toContain("textCrpNM=005930");
  });
});

describe("auditorSite", () => {
  it("4대 법인은 공식 홈으로", () => {
    expect(auditorSite("삼일회계법인").url).toContain("pwc.com/kr");
    expect(auditorSite("삼정회계법인").label).toBe("삼정KPMG");
    expect(auditorSite("딜로이트안진회계법인").url).toContain("deloitte.com/kr");
    expect(auditorSite("한영회계법인").url).toContain("ey.com/ko_kr");
  });

  it("모르면 공인회계사회", () => {
    expect(auditorSite("한울회계법인").url).toBe("https://www.kicpa.or.kr");
    expect(auditorSite(null).url).toBe("https://www.kicpa.or.kr");
  });
});

describe("filingVenueFor", () => {
  it("한글·6자리·KS/KQ는 DART", () => {
    expect(filingVenueFor("삼성전자")).toBe("dart");
    expect(filingVenueFor("005930")).toBe("dart");
    expect(filingVenueFor("005930.KS")).toBe("dart");
    expect(filingVenueFor("035420.KQ")).toBe("dart");
  });

  it("미국 티커는 EDGAR", () => {
    expect(filingVenueFor("AAPL")).toBe("edgar");
    expect(filingVenueFor("BRK.B")).toBe("edgar");
  });

  it("그 외는 other", () => {
    expect(filingVenueFor("BTC-USD")).toBe("other");
  });
});

describe("lookupServices", () => {
  it("한국 조회는 DART와 국내 해설만", () => {
    const ids = lookupServices("삼성전자").map((s) => s.id);
    expect(ids).toContain("dart-overview");
    expect(ids).toContain("opendart-fnltt");
    expect(ids).toContain("fs-reading");
    expect(ids).not.toContain("edgar-company");
    expect(lookupServices("삼성전자").find((s) => s.id === "fs-reading")?.url).toBe("https://www.drcr.co.kr/");
  });

  it("미국 티커는 EDGAR만, 국내 해설 없음", () => {
    const ids = lookupServices("AAPL").map((s) => s.id);
    expect(ids).toContain("edgar-company");
    expect(ids).toContain("edgar-search");
    expect(ids).not.toContain("fs-reading");
    expect(ids).not.toContain("dart-overview");
    expect(lookupServices("AAPL").find((s) => s.id === "edgar-company")?.url).toBe(edgarCompanyUrl("AAPL"));
    expect(edgarCompanyUrl("BRK.B")).toContain("CIK=BRK.B");
  });

  it("빈 조회는 DART·EDGAR·국내 해설을 같이 둔다", () => {
    const ids = lookupServices().map((s) => s.id);
    expect(ids).toEqual(["dart-overview", "edgar-search", "fs-reading"]);
  });
});
