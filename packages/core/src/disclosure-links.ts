// 재무제표 화면의 공식 조회 링크. 해설 사이트는 국내만. 본문 저장 금지.
// DART 회사 팝업 URL은 금감원 배너 안내(textCrpNM=회사명 또는 종목코드).
// 미국은 EDGAR. 「재무제표를 읽는 사람들」은 국내 해설이라 해외 종목에 붙이지 않는다.

export const DART_COMPANY_OVERVIEW = "https://dart.fss.or.kr/dsae001/main.do";
export const DART_COMPANY_FILINGS = "https://dart.fss.or.kr/dsab001/main.do";
export const DART_DISCLOSURE_SEARCH = "https://dart.fss.or.kr/dsab007/main.do";
export const OPENDART_FNLTT = "https://opendart.fss.or.kr/disclosureinfo/fnltt/singlindx/main.do";
export const KICPA_HOME = "https://www.kicpa.or.kr";
export const EDGAR_COMPANY_SEARCH = "https://www.sec.gov/edgar/searchedgar/companysearch.html";

export const FS_READING_REF = {
  label: "재무제표를 읽는 사람들",
  url: "https://www.drcr.co.kr/",
} as const;

export type FilingVenue = "dart" | "edgar" | "other";
export type LookupLink = { id: string; label: string; url: string };

const AUDITOR_SITES = [
  { match: /삼일|samil|pwc/i, label: "삼일회계법인", url: "https://www.pwc.com/kr/ko.html" },
  { match: /삼정|kpmg/i, label: "삼정KPMG", url: "https://kpmg.com/kr/ko.html" },
  { match: /안진|딜로이트|deloitte/i, label: "딜로이트안진", url: "https://www.deloitte.com/kr/ko.html" },
  { match: /한영|\bey\b/i, label: "EY한영", url: "https://www.ey.com/ko_kr" },
] as const;

export function dartViewerUrl(rcpNo: string) {
  return `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${encodeURIComponent(rcpNo)}`;
}

export function dartCompanyPopupUrl(query: string) {
  const q = query.trim();
  if (!q) return DART_COMPANY_OVERVIEW;
  return `https://dart.fss.or.kr/html/search/SearchCompanyIR_M.html?textCrpNM=${encodeURIComponent(q)}`;
}

export function auditorSite(name: string | null | undefined): { label: string; url: string } {
  const n = (name ?? "").trim();
  if (n) {
    const hit = AUDITOR_SITES.find((s) => s.match.test(n));
    if (hit) return { label: hit.label, url: hit.url };
  }
  return { label: n || "한국공인회계사회", url: KICPA_HOME };
}

/** 티커·종목코드로 공시 창구. 한글 이름·6자리·.KS/.KQ는 DART. */
export function filingVenueFor(symbolOrQuery: string): FilingVenue {
  const s = symbolOrQuery.trim();
  if (/^\d{6}(\.(KS|KQ))?$/i.test(s) || /\.(KS|KQ)$/i.test(s) || /[\uac00-\ud7a3]/.test(s)) return "dart";
  if (/^[A-Z]{1,5}(\.[A-Z])?$/i.test(s)) return "edgar";
  return "other";
}

export function edgarCompanyUrl(ticker: string): string {
  const t = ticker.trim().replace(/\.(KS|KQ)$/i, "");
  if (!t) return EDGAR_COMPANY_SEARCH;
  return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${encodeURIComponent(t)}&owner=exclude&count=40`;
}

export function yahooFinancialsUrl(symbol: string): string {
  const s = symbol.trim();
  if (!s) return "https://finance.yahoo.com/";
  return `https://finance.yahoo.com/quote/${encodeURIComponent(s)}/financials`;
}

export function lookupServices(query?: string | null): LookupLink[] {
  const q = query?.trim() ?? "";
  if (!q) {
    return [
      { id: "dart-overview", label: "DART 기업개황", url: DART_COMPANY_OVERVIEW },
      { id: "edgar-search", label: "EDGAR 회사검색", url: EDGAR_COMPANY_SEARCH },
      { id: "fs-reading", label: `${FS_READING_REF.label} (국내)`, url: FS_READING_REF.url },
    ];
  }
  const venue = filingVenueFor(q);
  if (venue === "dart") {
    return [
      { id: "dart-overview", label: "DART 기업개황", url: DART_COMPANY_OVERVIEW },
      { id: "dart-company", label: "DART 기업정보 조회", url: dartCompanyPopupUrl(q) },
      { id: "dart-filings", label: "DART 회사별 공시", url: DART_COMPANY_FILINGS },
      { id: "opendart-fnltt", label: "OpenDART 재무정보조회", url: OPENDART_FNLTT },
      { id: "dart-audit-search", label: "DART 감사보고서 검색", url: DART_DISCLOSURE_SEARCH },
      { id: "fs-reading", label: `${FS_READING_REF.label} (국내)`, url: FS_READING_REF.url },
    ];
  }
  if (venue === "edgar") {
    return [
      { id: "edgar-company", label: "EDGAR 회사 공시", url: edgarCompanyUrl(q) },
      { id: "edgar-search", label: "EDGAR 회사검색", url: EDGAR_COMPANY_SEARCH },
      { id: "yahoo-financials", label: "Yahoo 재무", url: yahooFinancialsUrl(q) },
    ];
  }
  return [
    { id: "yahoo-financials", label: "Yahoo 재무", url: yahooFinancialsUrl(q) },
    { id: "edgar-search", label: "EDGAR 회사검색", url: EDGAR_COMPANY_SEARCH },
  ];
}
