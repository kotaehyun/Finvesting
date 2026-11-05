import Parser from "rss-parser";
import { newsCategoryForSource, opinionCategoryForSource } from "@finvesting/core";
import { db, news } from "@finvesting/db";

// 제목·링크·요약만 저장 (본문 저장 X — 저작권). 피드는 자유롭게 추가.
// 뉴스 분류: core/news-category. 오피니언: core/opinion-category. 증권사 리포트 공개 RSS는 없음.
const FEEDS: Array<{
  id: string;
  url: string;
  publisher: string;
  lang: "ko" | "en";
  board: "news" | "opinion";
}> = [
  // 뉴스 — hankyung=금융, mk·yonhap=경제
  { id: "hankyung", url: "https://www.hankyung.com/feed/finance", publisher: "한국경제", lang: "ko", board: "news" },
  { id: "mk", url: "https://www.mk.co.kr/rss/30100041/", publisher: "매일경제", lang: "ko", board: "news" },
  { id: "yonhap", url: "https://www.yna.co.kr/rss/economy.xml", publisher: "연합뉴스", lang: "ko", board: "news" },
  { id: "cnbc-top", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", publisher: "CNBC", lang: "en", board: "news" },
  { id: "cnbc-markets", url: "https://www.cnbc.com/id/20910258/device/rss/rss.html", publisher: "CNBC Markets", lang: "en", board: "news" },
  { id: "marketwatch", url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", publisher: "MarketWatch", lang: "en", board: "news" },
  { id: "fed-press", url: "https://www.federalreserve.gov/feeds/press_all.xml", publisher: "Federal Reserve", lang: "en", board: "news" },
  { id: "ecb-press", url: "https://www.ecb.europa.eu/rss/press.html", publisher: "ECB", lang: "en", board: "news" },
  { id: "coindesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", publisher: "CoinDesk", lang: "en", board: "news" },
  { id: "cointelegraph", url: "https://cointelegraph.com/rss", publisher: "Cointelegraph", lang: "en", board: "news" },
  { id: "fxstreet", url: "https://www.fxstreet.com/rss/news", publisher: "FXStreet", lang: "en", board: "news" },
  { id: "hankyung-realestate", url: "https://www.hankyung.com/feed/realestate", publisher: "한국경제 부동산", lang: "ko", board: "news" },
  // 오피니언 — 2026-09-13 GET으로 확인. 매경은 공식 RSS 목록에 오피니언 없음.
  { id: "hankyung-opinion", url: "https://www.hankyung.com/feed/opinion", publisher: "한국경제 오피니언", lang: "ko", board: "opinion" },
  { id: "yonhap-opinion", url: "https://www.yna.co.kr/rss/opinion.xml", publisher: "연합뉴스 오피니언", lang: "ko", board: "opinion" },
  { id: "seeking-alpha", url: "https://seekingalpha.com/feed.xml", publisher: "Seeking Alpha", lang: "en", board: "opinion" },
  { id: "project-syndicate", url: "https://www.project-syndicate.org/rss", publisher: "Project Syndicate", lang: "en", board: "opinion" },
  { id: "ft-opinion", url: "https://www.ft.com/opinion?format=rss", publisher: "Financial Times", lang: "en", board: "opinion" },
];

function feedCategory(source: string, board: "news" | "opinion") {
  return board === "opinion" ? opinionCategoryForSource(source) : newsCategoryForSource(source);
}

export async function collectRssNews() {
  const parser = new Parser({ timeout: 10_000 });
  let inserted = 0;
  const perFeed: Record<string, number | string> = {};
  for (const f of FEEDS) {
    try {
      const feed = await parser.parseURL(f.url);
      let n = 0;
      const source = `rss:${f.id}`;
      for (const item of feed.items) {
        if (!item.link || !item.title) continue;
        const r = await db.insert(news).values({
          title: item.title.trim(),
          url: item.link,
          publisher: f.publisher,
          publishedAt: item.isoDate ? new Date(item.isoDate) : null,
          summary: (item.contentSnippet ?? "").slice(0, 500),
          source,
          raw: {
            guid: item.guid,
            categories: item.categories,
            lang: f.lang,
            board: f.board,
            category: feedCategory(source, f.board),
          },
        }).onConflictDoNothing().returning({ id: news.id });
        inserted += r.length; n += r.length;
      }
      perFeed[f.id] = `${n}/${feed.items.length}`;
    } catch (e) { perFeed[f.id] = `FAIL ${((e as Error).message ?? String(e)).split("\n")[0]?.slice(0, 60)}`; }
  }
  return { inserted, perFeed };
}
