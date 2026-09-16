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
};

export function isKoreanSymbol(symbol: string): boolean {
  const s = symbol.trim().toUpperCase();
  return s.endsWith(".KS") || s.endsWith(".KQ") || /^\d{6}$/.test(s);
}

export function extractKoreanCode(symbol: string): string | null {
  const s = symbol.trim().toUpperCase();
  const match = s.match(/^(\d{6})/);
  return (match && match[1]) ? match[1] : null;
}

export function statementsUrl(symbol: string): string {
  const code = extractKoreanCode(symbol);
  const q = code ?? symbol.trim();
  return `/statements?q=${encodeURIComponent(q)}`;
}

export type MarketRegion = "all" | "us" | "kr";

export function marketRegionFor(symbol: string, market?: string): "us" | "kr" | "other" {
  if (isKoreanSymbol(symbol) || market?.toUpperCase() === "KRX") return "kr";
  const m = market?.toUpperCase();
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

export const FALLBACK_FUNDAMENTAL_ROWS: FundamentalBoardRow[] = [
  {
    instrumentId: "fallback-aapl",
    symbol: "AAPL",
    name: "Apple Inc.",
    market: "US",
    assetClass: "stock",
    currency: "USD",
    date: "2026-09-15",
    source: "yahoo",
    marketCap: 3450000000000,
    per: 34.2,
    forwardPer: 30.5,
    pbr: 48.2,
    eps: 6.75,
    roe: 1.4875,
    dividendYield: 0.44,
    revenueTtm: 391000000000,
    netIncomeTtm: 101000000000,
    debtToEquity: 152.3,
    beta: 1.08,
    extra: {
      fiftyTwoWeekLow: 164.08,
      fiftyTwoWeekHigh: 237.23,
      ytdReturn: 18.5,
      averageVolume: 48500000,
      quoteType: "EQUITY",
    },
  },
  {
    instrumentId: "fallback-msft",
    symbol: "MSFT",
    name: "Microsoft Corporation",
    market: "US",
    assetClass: "stock",
    currency: "USD",
    date: "2026-09-15",
    source: "yahoo",
    marketCap: 3220000000000,
    per: 35.8,
    forwardPer: 31.2,
    pbr: 11.5,
    eps: 11.8,
    roe: 0.385,
    dividendYield: 0.72,
    revenueTtm: 245000000000,
    netIncomeTtm: 88100000000,
    debtToEquity: 42.1,
    beta: 0.91,
    extra: {
      fiftyTwoWeekLow: 366.5,
      fiftyTwoWeekHigh: 468.35,
      ytdReturn: 14.2,
      averageVolume: 21500000,
      quoteType: "EQUITY",
    },
  },
  {
    instrumentId: "fallback-nvda",
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    market: "US",
    assetClass: "stock",
    currency: "USD",
    date: "2026-09-15",
    source: "yahoo",
    marketCap: 3050000000000,
    per: 52.4,
    forwardPer: 40.1,
    pbr: 51.2,
    eps: 2.25,
    roe: 1.15,
    dividendYield: 0.03,
    revenueTtm: 96300000000,
    netIncomeTtm: 53000000000,
    debtToEquity: 18.5,
    beta: 1.68,
    extra: {
      fiftyTwoWeekLow: 45.0,
      fiftyTwoWeekHigh: 140.76,
      ytdReturn: 135.0,
      averageVolume: 65000000,
      quoteType: "EQUITY",
    },
  },
  {
    instrumentId: "fallback-005930",
    symbol: "005930.KS",
    name: "삼성전자",
    market: "KRX",
    assetClass: "stock",
    currency: "KRW",
    date: "2026-09-15",
    source: "yahoo",
    marketCap: 410000000000000,
    per: 14.2,
    forwardPer: 10.8,
    pbr: 0.98,
    eps: 4650,
    roe: 0.082,
    dividendYield: 2.35,
    revenueTtm: 300000000000000,
    netIncomeTtm: 35000000000000,
    debtToEquity: 26.4,
    beta: 0.95,
    extra: {
      fiftyTwoWeekLow: 56000,
      fiftyTwoWeekHigh: 88800,
      ytdReturn: -12.4,
      averageVolume: 18000000,
      quoteType: "EQUITY",
    },
  },
  {
    instrumentId: "fallback-spy",
    symbol: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    market: "US",
    assetClass: "etf",
    currency: "USD",
    date: "2026-09-15",
    source: "yahoo",
    marketCap: 580000000000,
    per: null,
    forwardPer: null,
    pbr: null,
    eps: null,
    roe: null,
    dividendYield: 1.22,
    revenueTtm: null,
    netIncomeTtm: null,
    debtToEquity: null,
    beta: 1.0,
    extra: {
      fiftyTwoWeekLow: 410.0,
      fiftyTwoWeekHigh: 565.0,
      ytdReturn: 18.2,
      netExpenseRatio: 0.0945,
      netAssets: 580000000000,
      averageVolume: 52000000,
      quoteType: "ETF",
    },
  },
];

export function yahooSavesFundamentals(assetClass: string, quoteType?: string | null): boolean {
  const qt = (quoteType ?? "").toUpperCase();
  if (qt === "EQUITY" || qt === "ETF") return true;
  if (qt) return false;
  const ac = assetClass.trim().toLowerCase();
  return ac === "stock" || ac === "etf";
}

export function yahooQuoteUrl(symbol: string) {
  const s = symbol.trim();
  if (!s) return "https://finance.yahoo.com/";
  return `https://finance.yahoo.com/quote/${encodeURIComponent(s)}`;
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
