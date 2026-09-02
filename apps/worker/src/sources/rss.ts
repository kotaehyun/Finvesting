import Parser from "rss-parser";
import { db, news } from "@finvesting/db";

// 제목·링크·요약만 저장 (본문 저장 X — 저작권). 피드는 자유롭게 추가.
const FEEDS: Array<{ id: string; url: string; publisher: string }> = [
  { id: "hankyung",  url: "https://www.hankyung.com/feed/finance", publisher: "한국경제" },
  { id: "mk",        url: "https://www.mk.co.kr/rss/30100041/",   publisher: "매일경제" },
  { id: "yonhap",    url: "https://www.yna.co.kr/rss/economy.xml", publisher: "연합뉴스" },
];

export async function collectRssNews() {
  const parser = new Parser({ timeout: 10_000 });
  let inserted = 0;
  for (const f of FEEDS) {
    try {
      const feed = await parser.parseURL(f.url);
      for (const item of feed.items) {
        if (!item.link || !item.title) continue;
        const r = await db.insert(news).values({
          title: item.title.trim(),
          url: item.link,
          publisher: f.publisher,
          publishedAt: item.isoDate ? new Date(item.isoDate) : null,
          summary: (item.contentSnippet ?? "").slice(0, 500),
          source: `rss:${f.id}`,
          raw: { guid: item.guid, categories: item.categories },
        }).onConflictDoNothing().returning({ id: news.id });
        inserted += r.length;
      }
    } catch (e) { console.warn(`rss ${f.id} failed`, (e as Error).message); }
  }
  return { inserted };
}
