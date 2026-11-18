// NAVER API HUB 뉴스 검색. 공식 문서 2026-09-17.
// https://api.ncloud-docs.com/docs/naver-api-hub-search-news
// 제목·링크·요약만. 본문은 저장하지 않는다.

export const NAVER_NEWS_SOURCE = "naver:news";
export const NAVER_NEWS_URL = "https://naverapihub.apigw.ntruss.com/search/v1/news";
export const NAVER_NEWS_QUERY_CAP = 40;
export const NAVER_NEWS_DISPLAY = 10;

const HANGUL = /[가-힣]/;

export type NaverNewsQuery = { symbol: string; query: string };

/** 보유·관심과, 이미 저장된 KRX 종목. 지수·원자재 한글 이름(은·구리)은 넣지 않는다. */
export function naverNewsCollectRows(
  held: Array<{ symbol: string; name: string }>,
  listed: Array<{ symbol: string; name: string; market: string }>,
): Array<{ symbol: string; name: string }> {
  return [
    ...held,
    ...listed.filter((row) => row.market === "KRX"),
  ];
}

export function naverNewsSearchQueries(
  rows: Array<{ symbol: string; name: string }>,
  opts?: { cap?: number; page?: number },
): { queries: NaverNewsQuery[]; page: number; pages: number } {
  const cap = opts?.cap ?? NAVER_NEWS_QUERY_CAP;
  const seen = new Set<string>();
  const unique: NaverNewsQuery[] = [];
  const sorted = [...rows].sort((a, b) => a.symbol.localeCompare(b.symbol) || a.name.localeCompare(b.name));
  for (const row of sorted) {
    const query = row.name.trim();
    if (!HANGUL.test(query) || seen.has(query)) continue;
    seen.add(query);
    unique.push({ symbol: row.symbol, query });
  }
  if (!unique.length || cap < 1) return { queries: [], page: 0, pages: 0 };
  const pages = Math.ceil(unique.length / cap);
  const page = ((opts?.page ?? 0) % pages + pages) % pages;
  return { queries: unique.slice(page * cap, page * cap + cap), page, pages };
}

/** 서울 달력의 일 번호. 같은 날은 같은 검색 페이지. */
export function naverNewsPage(now: Date, pages: number): number {
  if (pages <= 1) return 0;
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const day = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86_400_000);
  return day % pages;
}

export function stripNaverSearchText(input: string): string {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  const decoded = input
    .replace(/&#(\d+);/g, (_, n: string) => codePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => codePoint(Number.parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (all, name: string) => named[name.toLowerCase()] ?? all);
  return decoded.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function codePoint(code: number): string {
  if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return "";
  return String.fromCodePoint(code);
}

export type NaverNewsItem = {
  title?: string;
  originallink?: string;
  link?: string;
  description?: string;
  pubDate?: string;
};

export function naverNewsPublisher(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}

export function naverNewsRow(item: NaverNewsItem): {
  title: string;
  url: string;
  summary: string;
  publishedAt: string | null;
  publisher: string | null;
} | null {
  const title = stripNaverSearchText(item.title ?? "");
  const original = item.originallink?.trim() ?? "";
  const naverLink = item.link?.trim() ?? "";
  const url = /^https?:\/\//i.test(original) ? original : /^https?:\/\//i.test(naverLink) ? naverLink : "";
  if (!title || !url) return null;
  const published = item.pubDate ? new Date(item.pubDate) : null;
  return {
    title,
    url,
    summary: stripNaverSearchText(item.description ?? "").slice(0, 500),
    publishedAt: published && !Number.isNaN(published.getTime()) ? published.toISOString() : null,
    publisher: naverNewsPublisher(url),
  };
}
