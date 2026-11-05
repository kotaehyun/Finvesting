import { describe, expect, it } from "vitest";
import {
  edgarAccessionPath,
  edgarCikPath,
  edgarInstanceXmlName,
  parseEdgarXbrlSegments,
  pickEdgarAnnual10K,
  zipEdgarRecentFilings,
} from "./edgar-xbrl-segments";

describe("edgar path helpers", () => {
  it("accession·CIK·인스턴스 파일명", () => {
    expect(edgarAccessionPath("0000320193-26-000026")).toBe("000032019326000026");
    expect(edgarCikPath("0000320193")).toBe("320193");
    expect(edgarInstanceXmlName("aapl-20260926.htm")).toBe("aapl-20260926_htm.xml");
  });
});

describe("pickEdgarAnnual10K", () => {
  it("reportDate 연도의 10-K를 고른다", () => {
    const rows = zipEdgarRecentFilings({
      form: ["10-Q", "10-K/A", "10-K", "10-K"],
      accessionNumber: ["a", "b", "c", "d"],
      primaryDocument: ["q.htm", "a.htm", "aapl-20260926.htm", "old.htm"],
      reportDate: ["2026-06-27", "2026-09-26", "2026-09-26", "2025-09-27"],
      filingDate: ["2026-08-01", "2026-11-04", "2026-11-03", "2025-11-01"],
    });
    const hit = pickEdgarAnnual10K(rows, 2026);
    expect(hit?.accessionNumber).toBe("c");
    expect(hit?.form).toBe("10-K");
  });
});

describe("parseEdgarXbrlSegments", () => {
  it("ProductOrService 단일 차원 매출(합계 Product 제외)", () => {
    const instance = `
<context id="c-iphone">
  <entity><segment>
    <xbrldi:explicitMember dimension="srt:ProductOrServiceAxis">aapl:IPhoneMember</xbrldi:explicitMember>
  </segment></entity>
  <period><startDate>2025-09-28</startDate><endDate>2026-09-26</endDate></period>
</context>
<context id="c-svc">
  <entity><segment>
    <xbrldi:explicitMember dimension="srt:ProductOrServiceAxis">us-gaap:ServiceMember</xbrldi:explicitMember>
  </segment></entity>
  <period><startDate>2025-09-28</startDate><endDate>2026-09-26</endDate></period>
</context>
<context id="c-prod">
  <entity><segment>
    <xbrldi:explicitMember dimension="srt:ProductOrServiceAxis">us-gaap:ProductMember</xbrldi:explicitMember>
  </segment></entity>
  <period><startDate>2025-09-28</startDate><endDate>2026-09-26</endDate></period>
</context>
<context id="c-geo">
  <entity><segment>
    <xbrldi:explicitMember dimension="us-gaap:StatementBusinessSegmentsAxis">aapl:AmericasSegmentMember</xbrldi:explicitMember>
  </segment></entity>
  <period><startDate>2025-09-28</startDate><endDate>2026-09-26</endDate></period>
</context>
<us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax contextRef="c-iphone" unitRef="usd" decimals="-6">254098000000</us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax>
<us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax contextRef="c-svc" unitRef="usd" decimals="-6">123301000000</us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax>
<us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax contextRef="c-prod" unitRef="usd" decimals="-6">355533000000</us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax>
<us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax contextRef="c-geo" unitRef="usd" decimals="-6">178000000000</us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax>
`;
    const rows = parseEdgarXbrlSegments({ instanceXml: instance, fiscalYear: 2026 });
    expect(rows).toEqual([
      { name: "IPhone", amount: 254098000000 },
      { name: "Service", amount: 123301000000 },
    ]);
  });

  it("제품축 없으면 지역·영업부문 축", () => {
    const instance = `
<context id="c-am">
  <entity><segment>
    <xbrldi:explicitMember dimension="us-gaap:StatementBusinessSegmentsAxis">aapl:AmericasSegmentMember</xbrldi:explicitMember>
  </segment></entity>
  <period><endDate>2025-09-27</endDate><startDate>2024-09-29</startDate></period>
</context>
<us-gaap:SalesRevenueNet contextRef="c-am">167045000000</us-gaap:SalesRevenueNet>
`;
    expect(parseEdgarXbrlSegments({ instanceXml: instance, fiscalYear: 2025 })).toEqual([
      { name: "Americas Segment", amount: 167045000000 },
    ]);
  });
});
