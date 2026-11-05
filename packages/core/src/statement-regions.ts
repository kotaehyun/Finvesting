// `/statements` 지역 칸. 국내·미국만 수집기 있음. 일본·중국·유럽은 id·시장만 예약, active=false.
// 새 지역: STATEMENT_REGIONS에 칸 추가 → active true는 공식 출처·워커 준비 후.

import { filingVenueFor, lookupServices, type LookupLink } from "./disclosure-links";

/** 공시 수집 창구. null = 아직 워커·공식 API 없음. */
export type StatementFilingVenue = "dart" | "edgar" | null;

export type StatementRegionId = "kr" | "us" | "jp" | "cn" | "eu";

export type StatementRegion = {
  id: StatementRegionId;
  title: string;
  /** instruments.market 대문자 매칭 */
  markets: readonly string[];
  venue: StatementFilingVenue;
  currencyDefault: string;
  /** 화면에 칸을 그릴지. 수집기 없으면 false */
  active: boolean;
  emptyHint: string;
  lookupTitle: string;
  lookupHint: string;
  auditEmptyHint: string;
};

export const STATEMENT_REGIONS: readonly StatementRegion[] = [
  {
    id: "kr",
    title: "국내",
    markets: ["KRX", "KOSDAQ"],
    venue: "dart",
    currencyDefault: "KRW",
    active: true,
    emptyHint: "수집된 국내 종목이 없습니다. `DART_API_KEY`·`DART_TARGETS` 후 `run:once`.",
    lookupTitle: "기업정보 조회 · 국내",
    lookupHint:
      "한국 공시는 DART·OpenDART입니다. 「재무제표를 읽는 사람들」은 국내 해설이며 본문은 저장하지 않습니다.",
    auditEmptyHint: "이 연도 감사의견이 없습니다. 위 조회에서 감사보고서를 열거나, DART 수집 후 다시 보세요.",
  },
  {
    id: "us",
    title: "미국",
    markets: ["US", "NYSE", "NASDAQ"],
    venue: "edgar",
    currencyDefault: "USD",
    active: true,
    emptyHint: "수집된 미국 종목이 없습니다. `SEC_USER_AGENT`·`EDGAR_TARGETS` 후 `run:once`.",
    lookupTitle: "기업정보 조회 · EDGAR",
    lookupHint: "미국은 SEC EDGAR입니다. 한국 DART와 국내 해설 사이트는 붙이지 않습니다.",
    auditEmptyHint: "미국 종목(EDGAR)은 감사의견 API가 없습니다. SEC 원문 조회로 확인하세요.",
  },
  {
    id: "jp",
    title: "일본",
    markets: ["TSE", "JPX"],
    venue: null,
    currencyDefault: "JPY",
    active: false,
    emptyHint: "일본 공시 수집기는 아직 없습니다. 공식 출처·워커가 생기면 이 칸을 켭니다.",
    lookupTitle: "기업정보 조회 · 일본",
    lookupHint: "공식 공시 창구·수집기가 정해지면 링크를 둡니다. 추측 출처는 붙이지 않습니다.",
    auditEmptyHint: "일본 감사의견 수집기가 없습니다.",
  },
  {
    id: "cn",
    title: "중국",
    markets: ["SSE", "SZSE", "HKEX"],
    venue: null,
    currencyDefault: "CNY",
    active: false,
    emptyHint: "중국·홍콩 공시 수집기는 아직 없습니다. 공식 출처·워커가 생기면 이 칸을 켭니다.",
    lookupTitle: "기업정보 조회 · 중국",
    lookupHint: "공식 공시 창구·수집기가 정해지면 링크를 둡니다. 추측 출처는 붙이지 않습니다.",
    auditEmptyHint: "중국 감사의견 수집기가 없습니다.",
  },
  {
    id: "eu",
    title: "유럽",
    markets: ["LSE", "XETRA", "EURONEXT", "EPA", "FRA"],
    venue: null,
    currencyDefault: "EUR",
    active: false,
    emptyHint: "유럽 공시 수집기는 아직 없습니다. 공식 출처·워커가 생기면 이 칸을 켭니다.",
    lookupTitle: "기업정보 조회 · 유럽",
    lookupHint: "공식 공시 창구·수집기가 정해지면 링크를 둡니다. 추측 출처는 붙이지 않습니다.",
    auditEmptyHint: "유럽 감사의견 수집기가 없습니다.",
  },
] as const;

export type StatementLookupCompany = {
  symbol: string;
  name: string;
};

/** 지역(큰 칸) 안의 하위 카테고리. companies 비어도 메뉴에 두어 확장 가능하게 함. */
export type StatementLookupGroupId =
  | "bigtech"
  | "semi"
  | "platform"
  | "battery"
  | "auto"
  | "finance"
  | "bio"
  | "consumer";

export type StatementLookupGroup = {
  id: StatementLookupGroupId;
  title: string;
  companies: readonly StatementLookupCompany[];
};

/**
 * 지역별 하위 카테고리. 숫자는 없음 — 상장 종목 이름·티커만.
 * 국내·미국 active 지역은 섹터마다 채움. 일본·중국·유럽은 수집기 전이라 칸만.
 */
export const STATEMENT_LOOKUP_GROUPS: Record<
  StatementRegionId,
  readonly StatementLookupGroup[]
> = {
  kr: [
    {
      id: "bigtech",
      title: "빅테크",
      companies: [
        { symbol: "005930", name: "삼성전자" },
        { symbol: "000660", name: "SK하이닉스" },
        { symbol: "035420", name: "NAVER" },
        { symbol: "035720", name: "카카오" },
      ],
    },
    {
      id: "semi",
      title: "반도체",
      companies: [
        { symbol: "005930", name: "삼성전자" },
        { symbol: "000660", name: "SK하이닉스" },
        { symbol: "042700", name: "한미반도체" },
        { symbol: "058470", name: "리노공업" },
        { symbol: "000990", name: "DB하이텍" },
        { symbol: "039030", name: "이오테크닉스" },
      ],
    },
    {
      id: "platform",
      title: "플랫폼·인터넷",
      companies: [
        { symbol: "035420", name: "NAVER" },
        { symbol: "035720", name: "카카오" },
        { symbol: "259960", name: "크래프톤" },
        { symbol: "036570", name: "엔씨소프트" },
        { symbol: "263750", name: "펄어비스" },
        { symbol: "035760", name: "CJ ENM" },
      ],
    },
    {
      id: "battery",
      title: "2차전지",
      companies: [
        { symbol: "373220", name: "LG에너지솔루션" },
        { symbol: "006400", name: "삼성SDI" },
        { symbol: "051910", name: "LG화학" },
        { symbol: "003670", name: "포스코퓨처엠" },
        { symbol: "247540", name: "에코프로비엠" },
        { symbol: "086520", name: "에코프로" },
      ],
    },
    {
      id: "auto",
      title: "자동차·모빌리티",
      companies: [
        { symbol: "005380", name: "현대차" },
        { symbol: "000270", name: "기아" },
        { symbol: "012330", name: "현대모비스" },
        { symbol: "161390", name: "한국타이어앤테크놀로지" },
        { symbol: "204320", name: "만도" },
      ],
    },
    {
      id: "finance",
      title: "금융",
      companies: [
        { symbol: "105560", name: "KB금융" },
        { symbol: "055550", name: "신한지주" },
        { symbol: "086790", name: "하나금융지주" },
        { symbol: "316140", name: "우리금융지주" },
        { symbol: "032830", name: "삼성생명" },
        { symbol: "005830", name: "DB손해보험" },
      ],
    },
    {
      id: "bio",
      title: "바이오·헬스케어",
      companies: [
        { symbol: "207940", name: "삼성바이오로직스" },
        { symbol: "068270", name: "셀트리온" },
        { symbol: "000100", name: "유한양행" },
        { symbol: "326030", name: "SK바이오팜" },
        { symbol: "128940", name: "한미약품" },
      ],
    },
    {
      id: "consumer",
      title: "소비재",
      companies: [
        { symbol: "090430", name: "아모레퍼시픽" },
        { symbol: "051900", name: "LG생활건강" },
        { symbol: "097950", name: "CJ제일제당" },
        { symbol: "271560", name: "오리온" },
        { symbol: "004370", name: "농심" },
        { symbol: "007310", name: "오뚜기" },
      ],
    },
  ],
  us: [
    {
      id: "bigtech",
      title: "빅테크",
      companies: [
        { symbol: "AAPL", name: "Apple" },
        { symbol: "MSFT", name: "Microsoft" },
        { symbol: "GOOGL", name: "Alphabet" },
        { symbol: "AMZN", name: "Amazon" },
        { symbol: "META", name: "Meta" },
        { symbol: "NVDA", name: "NVIDIA" },
        { symbol: "TSLA", name: "Tesla" },
      ],
    },
    {
      id: "semi",
      title: "반도체",
      companies: [
        { symbol: "NVDA", name: "NVIDIA" },
        { symbol: "AMD", name: "AMD" },
        { symbol: "AVGO", name: "Broadcom" },
        { symbol: "INTC", name: "Intel" },
        { symbol: "MU", name: "Micron" },
        { symbol: "QCOM", name: "Qualcomm" },
        { symbol: "TSM", name: "TSMC" },
      ],
    },
    {
      id: "platform",
      title: "클라우드·SW",
      companies: [
        { symbol: "MSFT", name: "Microsoft" },
        { symbol: "ORCL", name: "Oracle" },
        { symbol: "CRM", name: "Salesforce" },
        { symbol: "ADBE", name: "Adobe" },
        { symbol: "NOW", name: "ServiceNow" },
        { symbol: "SNOW", name: "Snowflake" },
      ],
    },
    {
      id: "battery",
      title: "에너지·클린",
      companies: [
        { symbol: "TSLA", name: "Tesla" },
        { symbol: "NEE", name: "NextEra Energy" },
        { symbol: "ENPH", name: "Enphase" },
        { symbol: "FSLR", name: "First Solar" },
        { symbol: "BE", name: "Bloom Energy" },
      ],
    },
    {
      id: "auto",
      title: "자동차·모빌리티",
      companies: [
        { symbol: "TSLA", name: "Tesla" },
        { symbol: "F", name: "Ford" },
        { symbol: "GM", name: "General Motors" },
        { symbol: "RIVN", name: "Rivian" },
        { symbol: "UBER", name: "Uber" },
      ],
    },
    {
      id: "finance",
      title: "금융",
      companies: [
        { symbol: "JPM", name: "JPMorgan" },
        { symbol: "BAC", name: "Bank of America" },
        { symbol: "GS", name: "Goldman Sachs" },
        { symbol: "V", name: "Visa" },
        { symbol: "MA", name: "Mastercard" },
        { symbol: "BLK", name: "BlackRock" },
      ],
    },
    {
      id: "bio",
      title: "바이오·헬스케어",
      companies: [
        { symbol: "LLY", name: "Eli Lilly" },
        { symbol: "UNH", name: "UnitedHealth" },
        { symbol: "JNJ", name: "Johnson & Johnson" },
        { symbol: "MRK", name: "Merck" },
        { symbol: "PFE", name: "Pfizer" },
        { symbol: "ABBV", name: "AbbVie" },
      ],
    },
    {
      id: "consumer",
      title: "소비재·리테일",
      companies: [
        { symbol: "WMT", name: "Walmart" },
        { symbol: "COST", name: "Costco" },
        { symbol: "PG", name: "Procter & Gamble" },
        { symbol: "KO", name: "Coca-Cola" },
        { symbol: "PEP", name: "PepsiCo" },
        { symbol: "NKE", name: "Nike" },
        { symbol: "MCD", name: "McDonald's" },
      ],
    },
  ],
  jp: [
    { id: "bigtech", title: "빅테크", companies: [] },
    { id: "semi", title: "반도체", companies: [] },
    { id: "platform", title: "플랫폼", companies: [] },
    { id: "auto", title: "자동차", companies: [] },
    { id: "finance", title: "금융", companies: [] },
    { id: "bio", title: "바이오", companies: [] },
    { id: "consumer", title: "소비재", companies: [] },
    { id: "battery", title: "소재·에너지", companies: [] },
  ],
  cn: [
    { id: "bigtech", title: "빅테크", companies: [] },
    { id: "semi", title: "반도체", companies: [] },
    { id: "platform", title: "플랫폼", companies: [] },
    { id: "auto", title: "자동차·모빌리티", companies: [] },
    { id: "finance", title: "금융", companies: [] },
    { id: "bio", title: "바이오", companies: [] },
    { id: "consumer", title: "소비재", companies: [] },
    { id: "battery", title: "2차전지", companies: [] },
  ],
  eu: [
    { id: "bigtech", title: "빅테크", companies: [] },
    { id: "semi", title: "반도체", companies: [] },
    { id: "platform", title: "소프트웨어", companies: [] },
    { id: "auto", title: "자동차", companies: [] },
    { id: "finance", title: "금융", companies: [] },
    { id: "bio", title: "바이오·헬스케어", companies: [] },
    { id: "consumer", title: "소비재", companies: [] },
    { id: "battery", title: "에너지", companies: [] },
  ],
};

export function statementLookupGroups(regionId: StatementRegionId): readonly StatementLookupGroup[] {
  return STATEMENT_LOOKUP_GROUPS[regionId] ?? [];
}

/** 하위 카테고리 기업을 한 목록으로(검색·테스트용). */
export function statementLookupCompanies(regionId: StatementRegionId): readonly StatementLookupCompany[] {
  return statementLookupGroups(regionId).flatMap((g) => g.companies);
}

export function statementLookupGroup(
  regionId: StatementRegionId,
  groupId: StatementLookupGroupId,
): StatementLookupGroup | undefined {
  return statementLookupGroups(regionId).find((g) => g.id === groupId);
}

export function statementRegionById(id: StatementRegionId): StatementRegion {
  return STATEMENT_REGIONS.find((r) => r.id === id)!;
}

/** 화면에 그리는 칸만. */
export function activeStatementRegions(): StatementRegion[] {
  return STATEMENT_REGIONS.filter((r) => r.active);
}

/** 아직 칸을 안 켠 지역 제목(안내 문구용). */
export function plannedStatementRegionTitles(): string[] {
  return STATEMENT_REGIONS.filter((r) => !r.active).map((r) => r.title);
}

/**
 * 종목 → 지역. market 우선, 없으면 심볼 창구(dart→kr, edgar→us).
 * 매칭 없으면 null(칸에 넣지 않음).
 */
export function statementRegionFor(input: {
  symbol: string;
  market: string;
}): StatementRegion | null {
  const m = input.market.trim().toUpperCase();
  const byMarket = STATEMENT_REGIONS.find((r) => r.markets.includes(m));
  if (byMarket) return byMarket;
  const venue = filingVenueFor(input.symbol);
  if (venue === "dart") return statementRegionById("kr");
  if (venue === "edgar") return statementRegionById("us");
  return null;
}

/** 검색어만으로 지역 추정(목록 miss 시 조회 링크용). */
export function statementRegionForQuery(query: string): StatementRegion | null {
  const q = query.trim();
  if (!q) return null;
  const venue = filingVenueFor(q);
  if (venue === "dart") return statementRegionById("kr");
  if (venue === "edgar") return statementRegionById("us");
  return null;
}

/** `/statements` 오른쪽 속성 칸. collected는 수집분이 있을 때만 숫자. reserved는 칸만. */
export type StatementSideSlotId =
  | "summary"
  | "ratios"
  | "audit"
  | "overview"
  | "segment"
  | "holders"
  | "dividend";

export type StatementSideSlot = {
  id: StatementSideSlotId;
  title: string;
  kind: "collected" | "reserved";
  emptyHint: string;
};

export const STATEMENT_SIDE_SLOTS: readonly StatementSideSlot[] = [
  { id: "summary", title: "종목", kind: "collected", emptyHint: "종목을 고르면 이름·심볼·연도·출처가 나옵니다." },
  { id: "ratios", title: "비율", kind: "collected", emptyHint: "수집된 손익·재무 숫자로만 계산합니다." },
  { id: "audit", title: "감사", kind: "collected", emptyHint: "이 연도 감사의견이 없습니다." },
  { id: "overview", title: "기업개황", kind: "collected", emptyHint: "기업개황 수집분이 없습니다. worker `dart-profile` / `edgar-profile` 후 다시 보세요." },
  { id: "segment", title: "사업부문", kind: "collected", emptyHint: "연결 영업부문 매출 XBRL이 없거나 미국 종목입니다. 공시 원문을 보세요." },
  { id: "holders", title: "주주", kind: "collected", emptyHint: "최대주주 수집분이 없습니다. 국내는 DART 사업보고서, 미국은 별도 API 없음." },
  { id: "dividend", title: "배당", kind: "collected", emptyHint: "배당 공시 수집분이 없습니다. 국내는 DART alotMatter." },
];

export function statementSideSlots() {
  return STATEMENT_SIDE_SLOTS;
}

/** 지역 칸에 맞는 공식 조회 링크만. venue 없으면 빈 배열. */
export function lookupServicesForRegion(
  region: StatementRegion,
  query?: string | null,
): LookupLink[] {
  if (!region.venue) return [];
  const raw = lookupServices(query);
  if (region.venue === "edgar") {
    const links = raw.filter((s) => s.id.startsWith("edgar") || s.id === "yahoo-financials");
    return links.length
      ? links
      : lookupServices(undefined).filter((s) => s.id.startsWith("edgar"));
  }
  const links = raw.filter((s) => !s.id.startsWith("edgar") && s.id !== "yahoo-financials");
  return links.length
    ? links
    : lookupServices(undefined).filter((s) => !s.id.startsWith("edgar"));
}
