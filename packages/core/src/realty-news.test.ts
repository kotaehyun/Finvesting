import { describe, expect, it } from "vitest";
import { REALTY_CURATED_NEWS } from "./realty-news";
import { REALTY_AUCTION, auctionFailRate } from "./realty-distress";

describe("realty news and auction fail rate", () => {
  it("공식 언론사 부동산 피드는 헤드라인과 요약만 가지며 본문은 저장하지 않는다", () => {
    expect(REALTY_CURATED_NEWS.length).toBeGreaterThan(0);
    for (const item of REALTY_CURATED_NEWS) {
      expect(item.title).toBeTruthy();
      expect(item.url).toMatch(/^https?:\/\//);
      expect(item.publisher).toBeTruthy();
      expect(item.summary).toBeTruthy();
      // Rule 7: Never store full news article bodies
      expect((item as Record<string, unknown>).body).toBeUndefined();
      expect((item as Record<string, unknown>).content).toBeUndefined();
    }
  });

  it("법원 경매 통계에 유찰률 지표가 포함된다", () => {
    expect(REALTY_AUCTION.failRateKr).toBeGreaterThan(50);
    expect(REALTY_AUCTION.failRateSudoApt).toBeGreaterThan(50);
    expect(auctionFailRate()).toBe(REALTY_AUCTION.failRateKr);
  });
});
