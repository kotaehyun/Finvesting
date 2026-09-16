// 투자 대시보드 세계 지수. Yahoo 심볼은 2026-09-13 query1.finance.yahoo.com chart로 확인.
// TradingView 무료 위젯은 KRX 지연시세를 안 넣는 경우가 많아, 국내 지수는 Yahoo 칸 + 네이버·한투 링크로 본다.

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
  | "silver"
  | "copper"
  | "wti"
  | "brent"
  | "btc";

export type WorldIndex = {
  id: WorldIndexId;
  label: string;
  yahoo: string;
  tv: string;
  region: "kr" | "us" | "jp" | "eu" | "hk" | "cmdty" | "crypto";
  market?: string;
  href?: string;
  hrefLabel?: string;
};

export const WORLD_INDICES: readonly WorldIndex[] = [
  { id: "kospi", label: "코스피", yahoo: "^KS11", tv: "KRX:KOSPI", region: "kr", href: "https://stock.naver.com/domestic/index/KOSPI/price", hrefLabel: "네이버" },
  { id: "kosdaq", label: "코스닥", yahoo: "^KQ11", tv: "KRX:KOSDAQ", region: "kr", href: "https://stock.naver.com/domestic/index/KOSDAQ/price", hrefLabel: "네이버" },
  { id: "spx", label: "S&P 500", yahoo: "^GSPC", tv: "FOREXCOM:SPXUSD", region: "us" },
  { id: "nasdaq", label: "NASDAQ", yahoo: "^IXIC", tv: "FOREXCOM:NSXUSD", region: "us" },
  { id: "dji", label: "Dow Jones", yahoo: "^DJI", tv: "FOREXCOM:DJI", region: "us" },
  { id: "n225", label: "Nikkei 225", yahoo: "^N225", tv: "INDEX:NKY", region: "jp" },
  { id: "dax", label: "DAX", yahoo: "^GDAXI", tv: "INDEX:DEU40", region: "eu" },
  { id: "hsi", label: "항셍", yahoo: "^HSI", tv: "HSI:HSI", region: "hk" },
  { id: "btc", label: "비트코인", yahoo: "BTC-USD", tv: "BITSTAMP:BTCUSD", region: "crypto", market: "CRYPTO", href: "https://kr.investing.com/crypto/bitcoin", hrefLabel: "Investing.com" },
  // 상품 선물은 2026-09-14 Yahoo chart로 확인. 두바이유는 Yahoo 검색에 없음.
  { id: "gold", label: "금", yahoo: "GC=F", tv: "TVC:GOLD", region: "cmdty", href: "https://kr.investing.com/commodities/gold", hrefLabel: "Investing.com" },
  { id: "silver", label: "은", yahoo: "SI=F", tv: "TVC:SILVER", region: "cmdty", href: "https://kr.investing.com/commodities/silver", hrefLabel: "Investing.com" },
  { id: "copper", label: "구리", yahoo: "HG=F", tv: "TVC:COPPER", region: "cmdty", href: "https://kr.investing.com/commodities/copper", hrefLabel: "Investing.com" },
  { id: "wti", label: "WTI", yahoo: "CL=F", tv: "TVC:USOIL", region: "cmdty", href: "https://kr.investing.com/commodities/crude-oil", hrefLabel: "Investing.com" },
  { id: "brent", label: "브렌트", yahoo: "BZ=F", tv: "TVC:UKOIL", region: "cmdty", href: "https://kr.investing.com/commodities/brent-oil", hrefLabel: "Investing.com" },
];

export const WORLD_INDEX_MARKET = "INDEX";

export function worldIndexYahooTickers(): string[] {
  return WORLD_INDICES.map((i) => i.yahoo);
}

export function worldIndexByYahoo(symbol: string): WorldIndex | undefined {
  const s = symbol.trim().toUpperCase();
  return WORLD_INDICES.find((i) => i.yahoo.toUpperCase() === s);
}

export function worldIndexById(id: string): WorldIndex | undefined {
  return WORLD_INDICES.find((i) => i.id === id);
}

export function worldIndexMarket(i: WorldIndex): string {
  return i.market ?? "INDEX";
}

export function equityWorldIndices(): readonly WorldIndex[] {
  return WORLD_INDICES.filter((i) => i.region !== "cmdty");
}

export function commodityWorldIndices(): readonly WorldIndex[] {
  return WORLD_INDICES.filter((i) => i.region === "cmdty");
}

/** TradingView 티커용. 국내는 위젯에 안 나와 Yahoo 칸으로 본다. */
export function tvTickerTapeSymbols() {
  return WORLD_INDICES.filter((i) => i.region !== "kr").map((i) => ({ proName: i.tv, title: i.label }));
}

/** symbol-overview는 [표시이름, 심볼|기간]. 티커 테이프 [proName, title]과 순서가 반대다. */
export function tvSymbolOverviewSymbols(): [string, string][] {
  return tvTickerTapeSymbols().map((s) => [s.title, `${s.proName}|1D`]);
}

/** 원문 링크만. 네이버·한투·KRX 시세는 크롤링하지 않는다. */
export const MARKET_REF_LINKS = [
  { id: "naver", label: "네이버 증권", url: "https://stock.naver.com/market/stock/kr", group: "kr" },
  { id: "naver-kospi", label: "네이버 코스피", url: "https://stock.naver.com/domestic/index/KOSPI/price", group: "kr" },
  { id: "naver-kosdaq", label: "네이버 코스닥", url: "https://stock.naver.com/domestic/index/KOSDAQ/price", group: "kr" },
  { id: "kis", label: "한국투자증권", url: "https://securities.koreainvestment.com/", group: "kr" },
  { id: "krx", label: "한국거래소", url: "https://open.krx.co.kr/", group: "kr" },
  { id: "daum", label: "다음 금융", url: "https://finance.daum.net/", group: "kr" },
  { id: "tv", label: "TradingView 마켓", url: "https://www.tradingview.com/markets/", group: "global" },
  { id: "investing-idx", label: "Investing.com 세계 지수", url: "https://www.investing.com/indices/major-indices", group: "global" },
  { id: "investing-fx", label: "Investing.com 환율", url: "https://kr.investing.com/currencies/", group: "global" },
  { id: "investing-btc", label: "Investing.com 비트코인", url: "https://kr.investing.com/crypto/bitcoin", group: "global" },
  { id: "investing-cmdty", label: "Investing.com 원자재", url: "https://kr.investing.com/commodities/", group: "global" },
  { id: "investing-cal", label: "Investing.com 경제캘린더", url: "https://www.investing.com/economic-calendar/", group: "global" },
  { id: "finviz-map", label: "Finviz 섹터 맵", url: "https://finviz.com/map.ashx", group: "global" },
  { id: "finviz-screener", label: "Finviz 스크리너", url: "https://finviz.com/screener.ashx", group: "global" },
  { id: "sa", label: "Seeking Alpha", url: "https://seekingalpha.com/", group: "global" },
] as const;
