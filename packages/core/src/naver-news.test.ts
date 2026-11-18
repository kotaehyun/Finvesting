import { describe, expect, it } from "vitest";
import {
  NAVER_NEWS_DISPLAY,
  NAVER_NEWS_QUERY_CAP,
  NAVER_NEWS_URL,
  naverNewsCollectRows,
  naverNewsPage,
  naverNewsRow,
  naverNewsSearchQueries,
  stripNaverSearchText,
} from "./naver-news";

describe("naverNewsCollectRows", () => {
  it("보유·관심과 저장된 KRX 한글 이름을 합친다", () => {
    const rows = naverNewsCollectRows(
      [{ symbol: "BTC", name: "BTC" }],
      [
        { symbol: "005930", name: "삼성전자", market: "KRX" },
        { symbol: "SI=F", name: "은", market: "INDEX" },
      ],
    );
    expect(naverNewsSearchQueries(rows).queries.map((q) => q.query)).toEqual(["삼성전자"]);
  });
});

describe("naverNewsSearchQueries", () => {
  const rows = [
    { symbol: "005930", name: "삼성전자" },
    { symbol: "035420", name: "삼성전자" },
    { symbol: "000660", name: "SK하이닉스" },
    { symbol: "AAPL", name: "Apple" },
    { symbol: "035720", name: "  카카오 " },
  ];

  it("한글 이름만 남기고 같은 이름은 한 번", () => {
    const got = naverNewsSearchQueries(rows, { cap: 10, page: 0 });
    expect(got.queries.map((q) => q.query)).toEqual(["SK하이닉스", "삼성전자", "카카오"]);
    expect(got.queries.map((q) => q.symbol)).toEqual(["000660", "005930", "035720"]);
    expect(got.pages).toBe(1);
  });

  it("캡을 넘기면 다음 페이지", () => {
    const got = naverNewsSearchQueries(rows, { cap: 1, page: 1 });
    expect(got.queries.map((q) => q.query)).toEqual(["삼성전자"]);
    expect(got.pages).toBe(3);
  });

  it("한글 이름이 없으면 비운다", () => {
    expect(naverNewsSearchQueries([{ symbol: "AAPL", name: "Apple" }])).toEqual({
      queries: [],
      page: 0,
      pages: 0,
    });
  });
});

describe("naverNewsPage", () => {
  it("서울 날짜가 바뀌면 페이지가 바뀐다", () => {
    const pages = 7;
    const sameDay = naverNewsPage(new Date("2026-11-11T14:00:00Z"), pages);
    const nextSeoulDay = naverNewsPage(new Date("2026-11-11T15:00:00Z"), pages);
    expect(sameDay).toBe(naverNewsPage(new Date("2026-11-11T02:00:00Z"), pages));
    expect(nextSeoulDay).not.toBe(sameDay);
  });

  it("한 페이지면 0", () => {
    expect(naverNewsPage(new Date("2026-11-11T00:00:00Z"), 1)).toBe(0);
    expect(naverNewsPage(new Date("2026-11-11T00:00:00Z"), 0)).toBe(0);
  });
});

describe("stripNaverSearchText", () => {
  it("검색어 강조 태그와 엔티티를 걷어 낸다", () => {
    expect(stripNaverSearchText("모모스 <b>커피</b>를 소개")).toBe("모모스 커피를 소개");
    expect(stripNaverSearchText("A &amp; B &quot;C&quot;")).toBe("A & B \"C\"");
  });
});

describe("naverNewsRow", () => {
  it("원문 링크·제목·500자 요약만 남긴다", () => {
    const row = naverNewsRow({
      title: "<b>삼성전자</b>, 실적",
      originallink: "https://www.hankyung.com/article/1",
      link: "https://n.news.naver.com/article/1",
      description: `<b>삼성전자</b> ${"가".repeat(600)}`,
      pubDate: "Thu, 11 Jun 2026 18:34:00 +0900",
    });
    expect(row?.title).toBe("삼성전자, 실적");
    expect(row?.url).toBe("https://www.hankyung.com/article/1");
    expect(row?.publisher).toBe("hankyung.com");
    expect(row?.summary.length).toBe(500);
    expect(row?.publishedAt).toBe("2026-06-11T09:34:00.000Z");
  });

  it("원문이 없으면 네이버 링크를 쓴다", () => {
    const row = naverNewsRow({
      title: "삼성전자",
      originallink: "",
      link: "https://n.news.naver.com/article/2",
    });
    expect(row?.url).toBe("https://n.news.naver.com/article/2");
    expect(row?.publisher).toBe("n.news.naver.com");
    expect(row?.publishedAt).toBeNull();
  });

  it("제목이나 링크가 없으면 버린다", () => {
    expect(naverNewsRow({ title: "<b></b>", originallink: "https://a.example/1" })).toBeNull();
    expect(naverNewsRow({ title: "삼성전자", originallink: "not-a-url" })).toBeNull();
  });
});

describe("공식 요청 상수", () => {
  it("주소·건수·캡", () => {
    expect(NAVER_NEWS_URL).toBe("https://naverapihub.apigw.ntruss.com/search/v1/news");
    expect(NAVER_NEWS_DISPLAY).toBe(10);
    expect(NAVER_NEWS_QUERY_CAP).toBe(40);
  });
});
