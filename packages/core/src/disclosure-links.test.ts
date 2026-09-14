import { describe, expect, it } from "vitest";
import { auditorSite, dartCompanyPopupUrl, dartViewerUrl, lookupServices } from "./disclosure-links";

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

describe("lookupServices", () => {
  it("기업개황·재무조회·읽어주는 사이트를 같이 준다", () => {
    const ids = lookupServices("삼성전자").map((s) => s.id);
    expect(ids).toContain("dart-overview");
    expect(ids).toContain("opendart-fnltt");
    expect(ids).toContain("fs-reading");
    expect(lookupServices("삼성전자").find((s) => s.id === "fs-reading")?.url).toBe("https://www.drcr.co.kr/");
  });
});
