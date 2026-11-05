import { describe, expect, it } from "vitest";
import {
  formatDividendsContext,
  formatHoldersContext,
  formatOverviewContext,
  parseDartCompanyOverview,
  parseDartDividends,
  parseDartHolders,
  parseDartSegments,
  parseEdgarCompanyOverview,
} from "./company-profile";

describe("기업개황", () => {
  it("DART company.json 정상만 파싱", () => {
    expect(parseDartCompanyOverview({ status: "013" })).toBeNull();
    const o = parseDartCompanyOverview({
      status: "000",
      corp_name: "삼성전자주식회사",
      ceo_nm: "전영현",
      corp_cls: "Y",
      est_dt: "19690113",
      acc_mt: "12",
      hm_url: "www.samsung.com/sec",
    });
    expect(o?.corpName).toBe("삼성전자주식회사");
    expect(o?.corpClass).toBe("유가");
    expect(o?.establishedOn).toBe("1969-01-13");
    expect(o?.fiscalMonth).toBe("12");
  });

  it("EDGAR submissions 이름·주소", () => {
    const o = parseEdgarCompanyOverview({
      name: "Apple Inc.",
      tickers: ["AAPL"],
      exchanges: ["Nasdaq"],
      sic: "3571",
      sicDescription: "Electronic Computers",
      fiscalYearEnd: "0927",
      addresses: { business: { street1: "One Apple Park Way", city: "Cupertino", stateOrCountry: "CA", zipCode: "95014" } },
    });
    expect(o?.corpName).toBe("Apple Inc.");
    expect(o?.industryName).toBe("Electronic Computers");
    expect(o?.fiscalMonth).toBe("09");
    expect(o?.address).toContain("Cupertino");
  });
});

describe("주주·배당·부문", () => {
  it("최대주주 지분 큰 순", () => {
    const rows = parseDartHolders([
      { nm: "B", trmend_posesn_stock_qota_rt: "1.0", trmend_posesn_stock_co: "1" },
      { nm: "A", relate: "본인", trmend_posesn_stock_qota_rt: "20.5", trmend_posesn_stock_co: "100" },
    ]);
    expect(rows.map((r) => r.name)).toEqual(["A", "B"]);
    expect(rows[0]?.ratio).toBe(20.5);
  });

  it("배당 구분을 그대로", () => {
    const rows = parseDartDividends([
      { se: "주당 현금배당금(원)", stock_knd: "보통주", thstrm: "1,446", frmtrm: "1,444", lwfr: "-" },
    ]);
    expect(rows[0]?.label).toBe("주당 현금배당금(원)");
    expect(rows[0]?.current).toBe("1,446");
    expect(rows[0]?.prior2).toBeNull();
  });

  it("부문은 member 매출만", () => {
    const rows = parseDartSegments([
      { sj_div: "IS", account_nm: "매출액", account_detail: "-", thstrm_amount: "100" },
      { sj_div: "IS", account_nm: "매출액", account_detail: "DX [member]", thstrm_amount: "50" },
      { sj_div: "IS", account_nm: "매출액", account_detail: "연결조정 [member]", thstrm_amount: "-1" },
    ]);
    expect(rows).toEqual([{ name: "DX", amount: 50 }]);
  });

  it("컨텍스트 포맷은 수집분만", () => {
    expect(formatOverviewContext(null)).toBeNull();
    expect(formatOverviewContext({
      corpName: "A", corpNameEn: null, stockName: null, ceo: "B", corpClass: null,
      address: null, homepage: null, irUrl: null, phone: null, industryCode: null,
      industryName: null, establishedOn: null, fiscalMonth: null, source: "dart",
    })).toContain("대표 B");
    expect(formatHoldersContext([{ name: "X", relation: null, stockKind: null, shares: null, ratio: 10 }]))
      .toContain("10%");
    expect(formatDividendsContext([{ label: "현금", stockKind: null, current: "1", prior: null, prior2: null }]))
      .toContain("현금: 1");
  });
});
