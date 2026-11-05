// 뉴스 피드 → 대시보드 분류. RSS item.categories는 언론마다 들쑥날쑥해서 쓰지 않는다.
// 기준은 market_news.source (`rss:<feedId>`).

export const NEWS_CATEGORY_IDS = ["kr_economy", "kr_finance", "realty", "global_markets", "crypto", "fx", "central_bank"] as const;
export type NewsCategoryId = (typeof NEWS_CATEGORY_IDS)[number];

export const NEWS_CATEGORIES: ReadonlyArray<{ id: NewsCategoryId; label: string; lang: "ko" | "en" }> = [
  { id: "kr_economy", label: "국내 경제", lang: "ko" },
  { id: "kr_finance", label: "국내 금융", lang: "ko" },
  { id: "realty", label: "부동산", lang: "ko" },
  { id: "global_markets", label: "해외 시황", lang: "en" },
  { id: "crypto", label: "크립토", lang: "en" },
  { id: "fx", label: "외환", lang: "en" },
  { id: "central_bank", label: "중앙은행", lang: "en" },
];

const SOURCE_CATEGORY: Record<string, NewsCategoryId> = {
  "rss:yonhap": "kr_economy",
  "rss:mk": "kr_economy",
  "rss:hankyung": "kr_finance",
  "rss:hankyung-realestate": "realty",
  "rss:cnbc-top": "global_markets",
  "rss:cnbc-markets": "global_markets",
  "rss:marketwatch": "global_markets",
  "rss:coindesk": "crypto",
  "rss:cointelegraph": "crypto",
  "rss:fxstreet": "fx",
  "rss:fed-press": "central_bank",
  "rss:ecb-press": "central_bank",
};

export function newsCategoryForSource(source: string): NewsCategoryId | "other" {
  return SOURCE_CATEGORY[source] ?? "other";
}

export function newsCategoryLabel(id: NewsCategoryId | "other"): string {
  if (id === "other") return "기타";
  return NEWS_CATEGORIES.find((c) => c.id === id)?.label ?? "기타";
}

export function newsCategoryLang(id: NewsCategoryId): "ko" | "en" {
  return NEWS_CATEGORIES.find((c) => c.id === id)?.lang ?? "ko";
}

export function sourcesForNewsCategory(id: NewsCategoryId): string[] {
  return Object.entries(SOURCE_CATEGORY)
    .filter(([, cat]) => cat === id)
    .map(([source]) => source);
}

export function newsCategoriesForLang(lang?: "ko" | "en") {
  if (!lang) return [...NEWS_CATEGORIES];
  return NEWS_CATEGORIES.filter((c) => c.lang === lang);
}
