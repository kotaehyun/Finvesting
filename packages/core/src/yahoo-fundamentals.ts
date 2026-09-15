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
