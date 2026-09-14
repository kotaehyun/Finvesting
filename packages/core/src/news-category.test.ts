import { describe, expect, it } from "vitest";
import {
  NEWS_CATEGORIES,
  newsCategoriesForLang,
  newsCategoryForSource,
  newsCategoryLabel,
  newsCategoryLang,
  sourcesForNewsCategory,
} from "./news-category";

describe("newsCategoryForSource", () => {
  it("연합·매경은 국내 경제, 한경은 국내 금융", () => {
    expect(newsCategoryForSource("rss:yonhap")).toBe("kr_economy");
    expect(newsCategoryForSource("rss:mk")).toBe("kr_economy");
    expect(newsCategoryForSource("rss:hankyung")).toBe("kr_finance");
  });

  it("CNBC·마켓워치는 해외 시황, 연준·ECB는 중앙은행", () => {
    expect(newsCategoryForSource("rss:cnbc-top")).toBe("global_markets");
    expect(newsCategoryForSource("rss:cnbc-markets")).toBe("global_markets");
    expect(newsCategoryForSource("rss:marketwatch")).toBe("global_markets");
    expect(newsCategoryForSource("rss:fed-press")).toBe("central_bank");
    expect(newsCategoryForSource("rss:ecb-press")).toBe("central_bank");
  });

  it("모르는 소스는 other", () => {
    expect(newsCategoryForSource("rss:unknown")).toBe("other");
    expect(newsCategoryForSource("naver")).toBe("other");
  });
});

describe("news category helpers", () => {
  it("분류별 소스를 되돌릴 수 있다", () => {
    expect(sourcesForNewsCategory("kr_economy").sort()).toEqual(["rss:mk", "rss:yonhap"]);
    expect(sourcesForNewsCategory("central_bank").sort()).toEqual(["rss:ecb-press", "rss:fed-press"]);
  });

  it("언어로 분류를 가른다", () => {
    expect(newsCategoriesForLang("ko").map((c) => c.id)).toEqual(["kr_economy", "kr_finance"]);
    expect(newsCategoriesForLang("en").map((c) => c.id)).toEqual(["global_markets", "central_bank"]);
    expect(newsCategoriesForLang().map((c) => c.id)).toEqual(NEWS_CATEGORIES.map((c) => c.id));
  });

  it("라벨·언어", () => {
    expect(newsCategoryLabel("kr_economy")).toBe("국내 경제");
    expect(newsCategoryLabel("other")).toBe("기타");
    expect(newsCategoryLang("central_bank")).toBe("en");
  });
});
