import { describe, expect, it } from "vitest";
import {
  parseDartXbrlKoLabels,
  parseDartXbrlOperatingSegments,
  pickDartAnnualReceipt,
} from "./dart-xbrl-segments";

describe("pickDartAnnualReceipt", () => {
  it("사업보고서 (연도.월) 접수번호를 고른다", () => {
    expect(pickDartAnnualReceipt([
      { report_nm: "분기보고서 (2024.09)", rcept_no: "1" },
      { report_nm: "사업보고서 (2024.12)", rcept_no: "20250311001085" },
    ], 2024)).toBe("20250311001085");
  });
});

describe("parseDartXbrlOperatingSegments", () => {
  const lab = `
<link:label id="Label_label_entity00126380_DxDivisionMemberOfOperatingSegmentsMemberOfDisclosureOfOperatingSegmentsTableOfMember_ko">DX 부문 [구성요소]</link:label>
<link:label id="Label_label_entity00126380_DxDivisionMemberOfOperatingSegmentsMemberOfDisclosureOfOperatingSegmentsTableOfMember_ko_1">DX 부문</link:label>
<link:label id="Label_label_entity00126380_DsDivisionMemberOfOperatingSegmentsMemberOfDisclosureOfOperatingSegmentsTableOfMember_ko_1">DS부문</link:label>
`;

  it("한글 라벨은 구성요소 없는 쪽", () => {
    const m = parseDartXbrlKoLabels(lab);
    expect(m.get("DxDivisionMemberOfOperatingSegmentsMemberOfDisclosureOfOperatingSegmentsTableOfMember")).toBe("DX 부문");
  });

  it("연결·영업부문 Revenue만", () => {
    const instance = `
<xbrli:context id="c_dx"><xbrli:startDate>2024-01-01</xbrli:startDate><xbrli:endDate>2024-12-31</xbrli:endDate>
<xbrldi:explicitMember dimension="a">ifrs-full:ConsolidatedMember</xbrldi:explicitMember>
<xbrldi:explicitMember dimension="b">entity00126380:DxDivisionMemberOfOperatingSegmentsMemberOfDisclosureOfOperatingSegmentsTableOfMember</xbrldi:explicitMember>
</xbrli:context>
<xbrli:context id="c_ds"><xbrli:startDate>2024-01-01</xbrli:startDate><xbrli:endDate>2024-12-31</xbrli:endDate>
<xbrldi:explicitMember dimension="a">ifrs-full:ConsolidatedMember</xbrldi:explicitMember>
<xbrldi:explicitMember dimension="b">entity00126380:DsDivisionMemberOfOperatingSegmentsMemberOfDisclosureOfOperatingSegmentsTableOfMember</xbrldi:explicitMember>
</xbrli:context>
<xbrli:context id="c_adj"><xbrli:endDate>2024-12-31</xbrli:endDate>
<xbrldi:explicitMember dimension="a">ifrs-full:ConsolidatedMember</xbrldi:explicitMember>
<xbrldi:explicitMember dimension="b">ifrs-full:MaterialReconcilingItemsMember</xbrldi:explicitMember>
</xbrli:context>
<ifrs-full:Revenue contextRef="c_dx">174887683000000</ifrs-full:Revenue>
<ifrs-full:Revenue contextRef="c_ds">111065950000000</ifrs-full:Revenue>
<ifrs-full:Revenue contextRef="c_adj">-100</ifrs-full:Revenue>
`;
    const rows = parseDartXbrlOperatingSegments({ instanceXml: instance, labKoXml: lab, fiscalYear: 2024 });
    expect(rows).toEqual([
      { name: "DX 부문", amount: 174887683000000 },
      { name: "DS부문", amount: 111065950000000 },
    ]);
  });

  it("SegmentsAxis 제품 세분화도 인식", () => {
    const instance = `
<xbrli:context id="c_dram"><xbrli:endDate>2024-12-31</xbrli:endDate>
<xbrldi:explicitMember dimension="a">ifrs-full:ConsolidatedMember</xbrldi:explicitMember>
<xbrldi:explicitMember dimension="b">entity00164779:DramMemberOfSegmentsMemberOfDisclosureOfRevenueFromContractsWithCustomersByProductAndServiceTypesAbstractAbstractTableOfMember</xbrldi:explicitMember>
</xbrli:context>
<ifrs-full:Revenue contextRef="c_dram">44731664000000</ifrs-full:Revenue>
`;
    const lab = `<link:label id="Label_label_entity00164779_DramMemberOfSegmentsMemberOfDisclosureOfRevenueFromContractsWithCustomersByProductAndServiceTypesAbstractAbstractTableOfMember_ko_1">DRAM</link:label>`;
    expect(parseDartXbrlOperatingSegments({ instanceXml: instance, labKoXml: lab, fiscalYear: 2024 }))
      .toEqual([{ name: "DRAM", amount: 44731664000000 }]);
  });
});
