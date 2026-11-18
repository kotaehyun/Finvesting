import { newsCategoryForSource, naverNewsCollectRows, naverNewsPage, naverNewsRow, naverNewsSearchQueries, NAVER_NEWS_DISPLAY, NAVER_NEWS_QUERY_CAP, NAVER_NEWS_SOURCE, NAVER_NEWS_URL, symbolsMentionedInTitle, type NaverNewsItem } from "@finvesting/core";
import { db, instruments, news } from "@finvesting/db";
import { loadHeldInstruments } from "../lib/instruments";
import { embedMissingNews } from "./rss";

// NAVER API HUB 뉴스 검색. 키 없으면 skip.
// 보유·관심과, 이미 저장된 KRX 종목의 한글 이름. 본문 저장 없음.
export async function collectNaverNews() {
  const id = process.env.NAVER_CLIENT_ID?.trim();
  const secret = process.env.NAVER_CLIENT_SECRET?.trim();
  if (!id || !secret) return { skipped: "NAVER_CLIENT_ID not set" };

  const held = await loadHeldInstruments();
  const listed = await db.select({
    symbol: instruments.symbol,
    name: instruments.name,
    market: instruments.market,
  }).from(instruments);
  const targets = naverNewsCollectRows(held, listed);
  const planned = naverNewsSearchQueries(targets, { cap: NAVER_NEWS_QUERY_CAP, page: 0 });
  const page = naverNewsPage(new Date(), planned.pages);
  const { queries, pages } = naverNewsSearchQueries(targets, { cap: NAVER_NEWS_QUERY_CAP, page });
  if (!queries.length) return { skipped: "no korean names", inserted: 0, page, pages };

  const known = await db.select({ symbol: instruments.symbol, name: instruments.name }).from(instruments);
  let inserted = 0;
  const errors: string[] = [];
  for (const q of queries) {
    const url = new URL(NAVER_NEWS_URL);
    url.searchParams.set("query", q.query);
    url.searchParams.set("display", String(NAVER_NEWS_DISPLAY));
    url.searchParams.set("start", "1");
    url.searchParams.set("sort", "date");
    url.searchParams.set("format", "json");
    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          "X-NCP-APIGW-API-KEY-ID": id,
          "X-NCP-APIGW-API-KEY": secret,
        },
      });
    } catch (e) {
      errors.push(((e as Error).message ?? "fetch failed").split("\n")[0]?.slice(0, 80) ?? "fetch failed");
      break;
    }
    if (!res.ok) {
      errors.push(String(res.status));
      if (res.status === 401 || res.status === 403) break;
      continue;
    }
    const json = (await res.json()) as { items?: NaverNewsItem[] };
    for (const item of json.items ?? []) {
      const row = naverNewsRow(item);
      if (!row) continue;
      const saved = await db.insert(news).values({
        title: row.title,
        url: row.url,
        publisher: row.publisher,
        publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
        summary: row.summary,
        symbols: symbolsMentionedInTitle(row.title, known),
        source: NAVER_NEWS_SOURCE,
        raw: {
          lang: "ko",
          board: "news",
          category: newsCategoryForSource(NAVER_NEWS_SOURCE),
          query: q.query,
        },
      }).onConflictDoNothing().returning({ id: news.id });
      inserted += saved.length;
    }
  }
  const embedded = await embedMissingNews();
  return { inserted, queries: queries.length, page, pages, errors, embedded };
}
