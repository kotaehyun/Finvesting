// 투자 대시보드 세계 지수. Yahoo 심볼은 2026-09-13 query1.finance.yahoo.com chart로 확인.
// TradingView 심볼은 공식 위젯(s3.tradingview.com/external-embedding)용.

export type WorldIndexId =
  | "kospi"
  | "kosdaq"
  | "spx"
  | "nasdaq"
  | "dji"
  | "n225"
  | "dax"
  | "hsi"
  | "gold"
  | "wti";

export type WorldIndex = {
  id: WorldIndexId;
  label: string;
  yahoo: string;
  tv: string;
  region: "kr" | "us" | "jp" | "eu" | "hk" | "cmdty";
};

export const WORLD_INDICES: readonly WorldIndex[] = [
  { id: "kospi", label: "KOSPI", yahoo: "^KS11", tv: "KRX:KOSPI", region: "kr" },
  { id: "kosdaq", label: "KOSDAQ", yahoo: "^KQ11", tv: "KRX:KOSDAQ", region: "kr" },
  { id: "spx", label: "S&P 500", yahoo: "^GSPC", tv: "FOREXCOM:SPXUSD", region: "us" },
  { id: "nasdaq", label: "NASDAQ", yahoo: "^IXIC", tv: "FOREXCOM:NSXUSD", region: "us" },
  { id: "dji", label: "Dow Jones", yahoo: "^DJI", tv: "FOREXCOM:DJI", region: "us" },
  { id: "n225", label: "Nikkei 225", yahoo: "^N225", tv: "INDEX:NKY", region: "jp" },
  { id: "dax", label: "DAX", yahoo: "^GDAXI", tv: "INDEX:DEU40", region: "eu" },
  { id: "hsi", label: "항셍", yahoo: "^HSI", tv: "HSI:HSI", region: "hk" },
  { id: "gold", label: "금", yahoo: "GC=F", tv: "TVC:GOLD", region: "cmdty" },
  { id: "wti", label: "WTI", yahoo: "CL=F", tv: "TVC:USOIL", region: "cmdty" },
];

export const WORLD_INDEX_MARKET = "INDEX";

export function worldIndexYahooTickers(): string[] {
  return WORLD_INDICES.map((i) => i.yahoo);
}

export function worldIndexByYahoo(symbol: string): WorldIndex | undefined {
  const s = symbol.trim().toUpperCase();
  return WORLD_INDICES.find((i) => i.yahoo.toUpperCase() === s);
}

export function tvTickerTapeSymbols() {
  return WORLD_INDICES.map((i) => ({ proName: i.tv, title: i.label }));
}

/** Investing.com·Finviz·Seeking Alpha·TradingView — 크롤링 없이 원문만. */
export const MARKET_REF_LINKS = [
  { id: "tv", label: "TradingView 마켓", url: "https://www.tradingview.com/markets/" },
  { id: "investing-idx", label: "Investing.com 세계 지수", url: "https://www.investing.com/indices/major-indices" },
  { id: "investing-cal", label: "Investing.com 경제캘린더", url: "https://www.investing.com/economic-calendar/" },
  { id: "finviz-map", label: "Finviz 섹터 맵", url: "https://finviz.com/map.ashx" },
  { id: "finviz-screener", label: "Finviz 스크리너", url: "https://finviz.com/screener.ashx" },
  { id: "sa", label: "Seeking Alpha", url: "https://seekingalpha.com/" },
] as const;
