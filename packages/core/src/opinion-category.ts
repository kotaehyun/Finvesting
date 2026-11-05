// 오피니언 대시보드 분류. 본문은 저장하지 않는다.
// 전용 RSS는 source로 가른다. 증권사 리포트 공개 RSS는 없어서
// 국내 뉴스 제목의 애널리스트·목표가·투자의견만 애널리스트 열로 끌어온다.

export const OPINION_CATEGORY_IDS = ["kr_column", "analyst", "global_opinion"] as const;
export type OpinionCategoryId = (typeof OPINION_CATEGORY_IDS)[number];

export const OPINION_CATEGORIES: ReadonlyArray<{ id: OpinionCategoryId; label: string; lang: "ko" | "en" }> = [
  { id: "kr_column", label: "국내 칼럼", lang: "ko" },
  { id: "analyst", label: "애널리스트", lang: "en" },
  { id: "global_opinion", label: "해외 오피니언", lang: "en" },
];

const SOURCE_OPINION: Record<string, OpinionCategoryId> = {
  "rss:hankyung-opinion": "kr_column",
  "rss:yonhap-opinion": "kr_column",
  "rss:seeking-alpha": "analyst",
  "rss:project-syndicate": "global_opinion",
  "rss:ft-opinion": "global_opinion",
};

/** Postgres POSIX · JS 공통. 국내 속보 제목에 붙는 투자의견 표지. */
export const ANALYST_TITLE_RE = /애널리스트|투자의견|목표가|목표주가|매수의견|매도의견|비중확대/;

export function isOpinionSource(source: string): boolean {
  return Object.prototype.hasOwnProperty.call(SOURCE_OPINION, source);
}

export function allOpinionSources(): string[] {
  return Object.keys(SOURCE_OPINION);
}

export function opinionCategoryForSource(source: string): OpinionCategoryId | "other" {
  return SOURCE_OPINION[source] ?? "other";
}

export function opinionCategoryForItem(source: string, title?: string | null): OpinionCategoryId | "other" {
  if (ANALYST_TITLE_RE.test(title ?? "")) return "analyst";
  return opinionCategoryForSource(source);
}

export function sourcesForOpinionCategory(id: OpinionCategoryId): string[] {
  return Object.entries(SOURCE_OPINION)
    .filter(([, cat]) => cat === id)
    .map(([source]) => source);
}

export function opinionCategoryLabel(id: OpinionCategoryId | "other"): string {
  if (id === "other") return "기타";
  return OPINION_CATEGORIES.find((c) => c.id === id)?.label ?? "기타";
}

export function opinionCategoriesForLang(lang?: "ko" | "en") {
  if (!lang) return [...OPINION_CATEGORIES];
  if (lang === "ko") return OPINION_CATEGORIES.filter((c) => c.id === "kr_column" || c.id === "analyst");
  return OPINION_CATEGORIES.filter((c) => c.id === "analyst" || c.id === "global_opinion");
}
