import { describe, expect, it } from "vitest";
import { isNewsEmbedVector, newsEmbedInput, NEWS_EMBED_DIM } from "./news-embed";

describe("뉴스 임베딩 입력", () => {
  it("제목과 요약만 잇고 요약은 500자", () => {
    const summary = "가".repeat(600);
    const text = newsEmbedInput("  삼성 실적  ", summary);
    expect(text.startsWith("삼성 실적\n")).toBe(true);
    expect(text.length).toBe("삼성 실적\n".length + 500);
  });

  it("요약이 없으면 제목만", () => {
    expect(newsEmbedInput("Apple", "  ")).toBe("Apple");
  });

  it("768차원만 벡터로 본다", () => {
    expect(isNewsEmbedVector(Array.from({ length: NEWS_EMBED_DIM }, () => 0.1))).toBe(true);
    expect(isNewsEmbedVector([1, 2])).toBe(false);
    expect(isNewsEmbedVector(undefined)).toBe(false);
  });
});
