import { describe, expect, it } from "vitest";
import {
  ANALYST_TITLE_RE,
  OPINION_CATEGORIES,
  allOpinionSources,
  isOpinionSource,
  opinionCategoriesForLang,
  opinionCategoryForItem,
  opinionCategoryForSource,
  sourcesForOpinionCategory,
} from "./opinion-category";

describe("opinion sources", () => {
  it("한경·연합 오피니언은 국내 칼럼", () => {
    expect(opinionCategoryForSource("rss:hankyung-opinion")).toBe("kr_column");
    expect(opinionCategoryForSource("rss:yonhap-opinion")).toBe("kr_column");
  });

  it("Seeking Alpha는 애널리스트, FT·Project Syndicate는 해외 오피니언", () => {
    expect(opinionCategoryForSource("rss:seeking-alpha")).toBe("analyst");
    expect(opinionCategoryForSource("rss:ft-opinion")).toBe("global_opinion");
    expect(opinionCategoryForSource("rss:project-syndicate")).toBe("global_opinion");
  });

  it("뉴스 피드는 오피니언 소스가 아니다", () => {
    expect(isOpinionSource("rss:hankyung")).toBe(false);
    expect(isOpinionSource("rss:hankyung-opinion")).toBe(true);
    expect(allOpinionSources()).toContain("rss:yonhap-opinion");
  });
});

describe("title analyst", () => {
  it("국내 속보 제목의 투자의견은 애널리스트 열", () => {
    expect(opinionCategoryForItem("rss:hankyung", "삼성전자 목표가 상향")).toBe("analyst");
    expect(opinionCategoryForItem("rss:mk", "NH투자 애널리스트 리포트")).toBe("analyst");
    expect(ANALYST_TITLE_RE.test("비중확대 유지")).toBe(true);
  });

  it("칼럼 제목은 소스 분류를 유지", () => {
    expect(opinionCategoryForItem("rss:hankyung-opinion", "[천자칼럼] 베스트셀러")).toBe("kr_column");
    expect(opinionCategoryForItem("rss:hankyung", "환율 급등")).toBe("other");
  });
});

describe("helpers", () => {
  it("분류별 소스·언어", () => {
    expect(sourcesForOpinionCategory("kr_column").sort()).toEqual(
      ["rss:hankyung-opinion", "rss:yonhap-opinion"],
    );
    expect(opinionCategoriesForLang("ko").map((c) => c.id)).toEqual(["kr_column", "analyst"]);
    expect(opinionCategoriesForLang("en").map((c) => c.id)).toEqual(["analyst", "global_opinion"]);
    expect(opinionCategoriesForLang().map((c) => c.id)).toEqual(OPINION_CATEGORIES.map((c) => c.id));
  });
});
