export type WatchlistSortKey = "added_desc" | "change_desc" | "change_asc" | "name_asc";
export type WatchlistMarketFilter = "all" | "KRX" | "US" | "UPBIT";

export interface WatchlistItem {
  id: string;
  instrumentId: string;
  symbol: string;
  name: string;
  market: string;
  currency: string;
  assetClass?: string | null;
  note?: string | null;
  addedAt?: string | Date | null;
  lastPrice?: number | null;
  prevPrice?: number | null;
  change?: number | null;
  changePct?: number | null;
  high?: number | null;
  low?: number | null;
  volume?: number | null;
  lastDate?: string | null;
  quoteSource?: string | null;
  per?: number | null;
  pbr?: number | null;
  roe?: number | null;
  dividendYield?: number | null;
  marketCap?: number | null;
  recentNews?: Array<{ id: string; title: string; url: string; publisher?: string | null; publishedAt: string | null }>;
}

/**
 * 가격 변동폭 및 변동률(%) 계산 (순수 함수)
 */
export function calculatePriceChange(
  currentPrice: number | null | undefined,
  prevPrice: number | null | undefined,
): { change: number; changePct: number } | null {
  if (currentPrice == null || prevPrice == null || prevPrice <= 0 || !Number.isFinite(currentPrice) || !Number.isFinite(prevPrice)) {
    return null;
  }
  const change = currentPrice - prevPrice;
  const changePct = ((currentPrice - prevPrice) / prevPrice) * 100;
  return {
    change: Number(change.toFixed(4)),
    changePct: Number(changePct.toFixed(2)),
  };
}

/**
 * 등락률 문자열 포맷팅 (+2.40%, -1.15%, 0.00%, -)
 */
export function formatChangePct(pct: number | null | undefined): string {
  if (pct == null || !Number.isFinite(pct)) return "-";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

/**
 * 관심 종목 필터링 (시장별, 자산군별, 검색어)
 */
export function filterWatchlist(
  items: WatchlistItem[],
  filter: { market?: WatchlistMarketFilter; assetClass?: string; query?: string },
): WatchlistItem[] {
  let res = items;
  if (filter.market && filter.market !== "all") {
    if (filter.market === "US") {
      res = res.filter((item) => ["NASDAQ", "NYSE", "AMEX"].includes(item.market.toUpperCase()));
    } else {
      res = res.filter((item) => item.market.toUpperCase() === filter.market!.toUpperCase());
    }
  }
  if (filter.assetClass && filter.assetClass !== "all") {
    res = res.filter((item) => item.assetClass === filter.assetClass);
  }
  if (filter.query && filter.query.trim().length > 0) {
    const q = filter.query.trim().toLowerCase();
    res = res.filter(
      (item) =>
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q)),
    );
  }
  return res;
}

/**
 * 관심 종목 정렬 (최신순, 등락률 높은순/낮은순, 이름순)
 */
export function sortWatchlist(
  items: WatchlistItem[],
  sortKey: WatchlistSortKey = "added_desc",
): WatchlistItem[] {
  const copy = [...items];
  switch (sortKey) {
    case "change_desc":
      return copy.sort((a, b) => (b.changePct ?? -Infinity) - (a.changePct ?? -Infinity));
    case "change_asc":
      return copy.sort((a, b) => (a.changePct ?? Infinity) - (b.changePct ?? Infinity));
    case "name_asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    case "added_desc":
    default:
      return copy.sort((a, b) => {
        const timeA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
        const timeB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
        return timeB - timeA;
      });
  }
}

/**
 * 관심 종목 통계 (총 개수, 상승/하락/보합 종목 수)
 */
export function summarizeWatchlist(items: WatchlistItem[]) {
  const total = items.length;
  let upCount = 0;
  let downCount = 0;
  let flatCount = 0;
  for (const item of items) {
    if (item.changePct != null && Number.isFinite(item.changePct)) {
      if (item.changePct > 0) upCount++;
      else if (item.changePct < 0) downCount++;
      else flatCount++;
    }
  }
  return { total, upCount, downCount, flatCount };
}
