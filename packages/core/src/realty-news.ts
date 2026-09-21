// 부동산 뉴스는 worker RSS만. 제목을 만들어 피드/홈에 붙이지 않는다.

export const REALTY_NEWS_FEEDS = [
  { id: "hankyung", label: "한국경제 부동산 RSS", url: "https://www.hankyung.com/feed/realestate" },
  { id: "auction", label: "대법원 법원경매정보", url: "https://www.courtauction.go.kr/" },
] as const;
