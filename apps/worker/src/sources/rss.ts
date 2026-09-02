import Parser from "rss-parser";
import { db, news } from "@finvesting/db";

// 제목·링크·요약만 저장 (본문 저장 X — 저작권). 피드는 자유롭게 추가.
const FEEDS: Array<{ id: string; url: string; publisher: string; lang: "ko" | "en" }> = [
  // 국내
  { id: "hankyung",  url: "https://www.hankyung.com/feed/finance", publisher: "한국경제", lang: "ko" },
  { id: "mk",        url: "https://www.mk.co.kr/rss/30100041/",   publisher: "매일경제", lang: "ko" },
  { id: "yonhap",    url: "https://www.yna.co.kr/rss/economy.xml", publisher: "연합뉴스", lang: "ko" },
  // 해외 (영문) — URL은 변경될 수 있음, 실패 시 콘솔 경고만
  { id: "cnbc-top",     url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", publisher: "CNBC", lang: "en" },
  { id: "cnbc-markets", url: "https://www.cnbc.com/id/20910258/device/rss/rss.html",  publisher: "CNBC Markets", lang: "en" },
  { id: "marketwatch",  url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", publisher: "MarketWatch", lang: "en" },
  { id: "fed-press",    url: "https://www.federalreserve.gov/feeds/press_all.xml",     publisher: "Federal Reserve", lang: "en" },
  { id: "ecb-press",    url: "https://www.ecb.europa.eu/rss/press.html",              publisher: "ECB", lang: "en" },
];

export async function collectRssNews() {
  const parser = new Parser({ timeout: 10_000 });
  let inserted = 0;
  const perFeed: Record<string, number | string> = {};
  for (const f of FEEDS) {
    try {
      const feed = await parser.parseURL(f.url);
      let n = 0;
      for (const item of feed.items) {
        if (!item.link || !item.title) continue;
        const r = await db.insert(news).values({
          title: item.title.trim(),
          url: item.link,
          publisher: f.publisher,
          publishedAt: item.isoDate ? new Date(item.isoDate) : null,
          summary: (item.contentSnippet ?? "").slice(0, 500),
          source: `rss:${f.id}`,
          raw: { guid: item.guid, categories: item.categories, lang: f.lang },
        }).onConflictDoNothing().returning({ id: news.id });
        inserted += r.length; n += r.length;
      }
      perFeed[f.id] = `${n}/${feed.items.length}`; // 신규/전체
    } catch (e) { perFeed[f.id] = `FAIL ${(e as Error).message.split("\n")[0].slice(0, 60)}`; }
  }
  return { inserted, perFeed };
}
