import { describe, expect, it } from "vitest";
import { REALTY_NEWS_FEEDS } from "./realty-news";
import { REALTY_AUCTION, REALTY_DISTRESS_SLOTS } from "./realty-distress";

describe("realty news and auction fail rate", () => {
  it("부동산 뉴스는 RSS·원문 링크만 두고 제목을 만들지 않는다", () => {
    expect(REALTY_NEWS_FEEDS.length).toBeGreaterThan(0);
    for (const item of REALTY_NEWS_FEEDS) {
      expect(item.url).toMatch(/^https?:\/\//);
      expect(item.label).toBeTruthy();
    }
  });

  it("경매 유찰률은 칸이고 신청 건수만 숫자다", () => {
    expect(REALTY_AUCTION.filed).toBe(121_261);
    expect(REALTY_DISTRESS_SLOTS.some((s: any) => s.id === "fail")).toBe(true);
    expect("failRateKr" in REALTY_AUCTION).toBe(false);
  });
});
