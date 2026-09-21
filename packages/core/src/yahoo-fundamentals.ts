// Yahoo 펀더멘털 표시·챗 컨텍스트. 숫자는 호출 측이 넣은 스냅샷만 쓴다.
// 단위는 2026-09-14 AAPL quote + quoteSummary(financialData, defaultKeyStatistics), SPY quote로 확인.
// dividendYield 0.33 → 0.33%(퍼센트 숫자). trailingAnnualDividendYield 0.0032 → 비율.
// returnOnEquity 1.4875 → 148.75%(비율). debtToEquity 78.445 → D/E×100.
// ytdReturn 13.07 → 13.07%. netExpenseRatio 0.0945 → 0.0945%.

export const FUNDAMENTAL_FIELDS = [
  { id: "marketCap", label: "Market cap", kind: "money" },
  { id: "per", label: "P/E", kind: "multiple" },
  { id: "forwardPer", label: "Fwd P/E", kind: "multiple" },
  { id: "pbr", label: "P/B", kind: "multiple" },
  { id: "eps", label: "EPS", kind: "eps" },
  { id: "roe", label: "ROE", kind: "roe" },
  { id: "dividendYield", label: "Div. yield", kind: "yieldPct" },
  { id: "revenueTtm", label: "TTM revenue", kind: "money" },
  { id: "netIncomeTtm", label: "TTM net income", kind: "money" },
  { id: "debtToEquity", label: "D/E", kind: "de" },
  { id: "beta", label: "Beta", kind: "multiple" },
] as const;

export type FundamentalFieldId = (typeof FUNDAMENTAL_FIELDS)[number]["id"];

export type FundamentalExtra = {
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  averageVolume?: number;
  ytdReturn?: number;
  netExpenseRatio?: number;
  netAssets?: number;
  quoteType?: string;
};

export type FundamentalSnapshot = {
  symbol: string;
  name: string;
  currency: string;
  date: string;
  source: string;
  marketCap: number | null;
  per: number | null;
  forwardPer: number | null;
  pbr: number | null;
  eps: number | null;
  roe: number | null;
  dividendYield: number | null;
  revenueTtm: number | null;
  netIncomeTtm: number | null;
  debtToEquity: number | null;
  beta: number | null;
  extra: FundamentalExtra;
};

export type FundamentalBoardRow = FundamentalSnapshot & {
  instrumentId: string;
  market: string;
  assetClass: string;
  lastPrice: number | null;
  lastPriceDate: string | null;
  lastPriceSource: string | null;
};

export type DataLoadStatus = "ok" | "empty" | "unavailable";

export type FundamentalsBoard = {
  status: DataLoadStatus;
  items: FundamentalBoardRow[];
};

export const MONEY_FUNDAMENTAL_SORT_KEYS = ["marketCap", "revenueTtm", "netIncomeTtm", "eps"] as const;

export function isMoneyFundamentalSortKey(key: string): boolean {
  return (MONEY_FUNDAMENTAL_SORT_KEYS as readonly string[]).includes(key);
}

/** 조회 q와 종목 심볼을 같은 키로. 005930.KS와 005930은 같다. */
export function instrumentQueryKey(symbol: string): string {
  const s = symbol.trim();
  if (!s) return "";
  return (extractKoreanCode(s) ?? s).toUpperCase();
}

export function matchInstrumentQuery<T extends { symbol: string }>(items: T[], q: string): T | undefined {
  const key = instrumentQueryKey(q);
  if (!key) return undefined;
  return items.find((i) => instrumentQueryKey(i.symbol) === key);
}

export function fiftyTwoWeekGauge(row: {
  extra: Pick<FundamentalExtra, "fiftyTwoWeekLow" | "fiftyTwoWeekHigh">;
  lastPrice: number | null;
}): number | null {
  return fiftyTwoWeekPosition(row.extra.fiftyTwoWeekLow, row.extra.fiftyTwoWeekHigh, row.lastPrice ?? undefined);
}

export function isKoreanSymbol(symbol: string): boolean {
  const s = symbol.trim().toUpperCase();
  return s.endsWith(".KS") || s.endsWith(".KQ") || /^\d{6}$/.test(s);
}

export function extractKoreanCode(symbol: string): string | null {
  const s = symbol.trim().toUpperCase();
  const match = s.match(/^(\d{6})(\.(KS|KQ))?$/);
  return match?.[1] ?? null;
}

export function statementsUrl(symbol: string): string {
  const code = extractKoreanCode(symbol);
  const q = code ?? symbol.trim();
  return `/statements?q=${encodeURIComponent(q)}`;
}

export type MarketRegion = "all" | "us" | "kr";

export function marketRegionFor(symbol: string, market?: string): "us" | "kr" | "other" {
  const m = market?.toUpperCase();
  if (isKoreanSymbol(symbol) || m === "KRX" || m === "KOSDAQ") return "kr";
  if (m === "US" || m === "NASDAQ" || m === "NYSE" || !symbol.includes(".")) return "us";
  return "other";
}

export type FundamentalSignal = {
  id: string;
  label: string;
  tone: "positive" | "info" | "warn" | "accent";
};

export function evaluateFundamentalSignals(
  row: Pick<FundamentalSnapshot, "pbr" | "per" | "roe" | "dividendYield" | "debtToEquity">,
): FundamentalSignal[] {
  const signals: FundamentalSignal[] = [];
  if (row.pbr != null && row.pbr > 0 && row.pbr < 1.0) {
    signals.push({ id: "low_pbr", label: "저PBR <1.0", tone: "accent" });
  }
  if (row.roe != null && row.roe >= 0.15) {
    signals.push({ id: "high_roe", label: "우량ROE ≥15%", tone: "positive" });
  }
  if (row.dividendYield != null && row.dividendYield >= 4.0) {
    signals.push({ id: "high_div", label: "고배당 ≥4%", tone: "info" });
  }
  if (row.debtToEquity != null && row.debtToEquity > 200) {
    signals.push({ id: "high_debt", label: "부채주의 >200%", tone: "warn" });
  }
  return signals;
}

export function fiftyTwoWeekPosition(low?: number, high?: number, current?: number): number | null {
  if (low == null || high == null || current == null) return null;
  if (high <= low) return null;
  const pos = ((current - low) / (high - low)) * 100;
  return Math.min(100, Math.max(0, Math.round(pos)));
}

export function yahooSavesFundamentals(assetClass: string, quoteType?: string | null): boolean {
  const qt = (quoteType ?? "").toUpperCase();
  if (qt === "EQUITY" || qt === "ETF") return true;
  if (qt) return false;
  const ac = assetClass.trim().toLowerCase();
  return ac === "stock" || ac === "etf";
}

export const NAVER_STOCK_HOME = "https://stock.naver.com/market/stock/kr";
export const YAHOO_HOME = "https://finance.yahoo.com/";
export const KAKAOPAYSEC_HOME = "https://kakaopaysec.com/";

export type FundamentalLookup = {
  id: string;
  label: string;
  url: string;
  primary: boolean;
};

/** 국내 펀더멘털 조회는 네이버 증권. 해외는 Yahoo. 공시(DART/EDGAR)는 재무제표 화면. */
export function yahooQuoteUrl(symbol: string) {
  const s = symbol.trim();
  if (!s) return YAHOO_HOME;
  return `https://finance.yahoo.com/quote/${encodeURIComponent(s)}`;
}

export function yahooKeyStatisticsUrl(symbol: string) {
  const s = symbol.trim();
  if (!s) return YAHOO_HOME;
  return `https://finance.yahoo.com/quote/${encodeURIComponent(s)}/key-statistics`;
}

export function naverQuoteUrl(symbol: string): string | null {
  const code = extractKoreanCode(symbol);
  if (!code) return null;
  return `https://stock.naver.com/domestic/stock/${code}/price`;
}

export function fundamentalLookups(symbol: string, market?: string): FundamentalLookup[] {
  const region = marketRegionFor(symbol, market);
  if (region === "kr") {
    const naver = naverQuoteUrl(symbol) ?? NAVER_STOCK_HOME;
    return [
      { id: "naver", label: "네이버", url: naver, primary: true },
      { id: "kakaopaysec", label: "카카오페이증권", url: KAKAOPAYSEC_HOME, primary: false },
    ];
  }
  return [
    { id: "yahoo", label: "Yahoo", url: yahooQuoteUrl(symbol), primary: true },
    { id: "yahoo-stats", label: "Yahoo 통계", url: yahooKeyStatisticsUrl(symbol), primary: false },
  ];
}

export function fundamentalVenueLookups(region: MarketRegion): FundamentalLookup[] {
  if (region === "kr") {
    return [
      { id: "naver-home", label: "네이버 증권 (국내)", url: NAVER_STOCK_HOME, primary: true },
      { id: "kakaopaysec", label: "카카오페이증권", url: KAKAOPAYSEC_HOME, primary: false },
    ];
  }
  if (region === "us") {
    return [{ id: "yahoo-home", label: "Yahoo Finance (해외)", url: YAHOO_HOME, primary: true }];
  }
  return [
    { id: "naver-home", label: "네이버 증권 (국내)", url: NAVER_STOCK_HOME, primary: true },
    { id: "kakaopaysec", label: "카카오페이증권", url: KAKAOPAYSEC_HOME, primary: false },
    { id: "yahoo-home", label: "Yahoo Finance (해외)", url: YAHOO_HOME, primary: false },
  ];
}

function asNum(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export function parseFundamentalExtra(raw: unknown): FundamentalExtra {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const extra: FundamentalExtra = {};
  const high = asNum(o.fiftyTwoWeekHigh);
  const low = asNum(o.fiftyTwoWeekLow);
  const vol = asNum(o.averageVolume);
  const ytd = asNum(o.ytdReturn);
  const er = asNum(o.netExpenseRatio);
  const na = asNum(o.netAssets);
  if (high != null) extra.fiftyTwoWeekHigh = high;
  if (low != null) extra.fiftyTwoWeekLow = low;
  if (vol != null) extra.averageVolume = vol;
  if (ytd != null) extra.ytdReturn = ytd;
  if (er != null) extra.netExpenseRatio = er;
  if (na != null) extra.netAssets = na;
  if (typeof o.quoteType === "string" && o.quoteType) extra.quoteType = o.quoteType;
  return extra;
}

export function formatCompactMoney(n: number, currency: string): string {
  const abs = Math.abs(n);
  if (currency === "KRW") {
    if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}조원`;
    if (abs >= 1e8) return `${(n / 1e8).toFixed(1)}억원`;
    return `${Math.round(n).toLocaleString("ko-KR")}원`;
  }
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T ${currency}`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B ${currency}`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M ${currency}`;
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${currency}`;
}

export function formatFundamentalValue(
  id: FundamentalFieldId,
  n: number,
  currency: string,
): string {
  const field = FUNDAMENTAL_FIELDS.find((f) => f.id === id);
  switch (field?.kind) {
    case "money":
      return formatCompactMoney(n, currency);
    case "roe":
      return `${(n * 100).toFixed(1)}%`;
    case "yieldPct":
      return `${n.toFixed(2)}%`;
    case "de":
      return n.toFixed(1);
    case "eps":
      return `${n.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${currency}`;
    default:
      return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
}

export function formatExtraValue(id: keyof FundamentalExtra, n: number, currency: string): string {
  if (id === "averageVolume") return Math.round(n).toLocaleString("ko-KR");
  if (id === "ytdReturn") return `${n.toFixed(2)}%`;
  if (id === "netExpenseRatio") return `${n.toFixed(4)}%`;
  if (id === "netAssets") return formatCompactMoney(n, currency);
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatFundamentalsContext(row: FundamentalSnapshot): string {
  const lines = [`${row.name}(${row.symbol}) ${row.date} ${row.source}`];
  for (const f of FUNDAMENTAL_FIELDS) {
    const n = row[f.id];
    if (n == null) continue;
    lines.push(`- ${f.label} ${formatFundamentalValue(f.id, n, row.currency)}`);
  }
  const x = row.extra;
  if (x.fiftyTwoWeekHigh != null && x.fiftyTwoWeekLow != null) {
    lines.push(`- 52w ${x.fiftyTwoWeekLow.toLocaleString("en-US")}–${x.fiftyTwoWeekHigh.toLocaleString("en-US")} ${row.currency}`);
  }
  if (x.ytdReturn != null) lines.push(`- YTD ${formatExtraValue("ytdReturn", x.ytdReturn, row.currency)}`);
  if (x.netExpenseRatio != null) lines.push(`- Expense ratio ${formatExtraValue("netExpenseRatio", x.netExpenseRatio, row.currency)}`);
  return lines.join("\n");
}
