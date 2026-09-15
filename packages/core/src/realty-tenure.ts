// 전월세: 점유(주거실태)와 거래(국토부 주택통계). 포털 매물은 안 긁는다.

export const REALTY_TENURE_LINKS = {
  survey: "https://stat.molit.go.kr/portal/cate/statView.do?hRsId=327",
  stats: "https://www.korea.kr/briefing/pressReleaseView.do?newsId=156776040",
} as const;

/** 국토부 2024 주거실태조사. 임차=전세+월세(보증부 포함). 전세만의 전국 칸은 원문 표. */
export const REALTY_TENURE = {
  asOf: "2024",
  source: "국토교통부 2024년도 주거실태조사",
  own: 58.4,
  ownPrev: 57.4,
  rent: 38.0,
  rentPrev: 38.8,
  free: 3.6,
  hold: 61.4,
  sudoRent: 44.4,
  metroRent: 36.8,
  provinceRent: 28.3,
  note: "점유입니다. 거래 건수 비중과 다릅니다. 전세·월세를 임차에서 더 나눈 전국 칸은 통계누리 원문.",
} as const;

/** 국토부 2026년 7월 주택통계. 1–7월 누계 전월세 거래 중 월세(보증부·반전세 포함). */
export const REALTY_LEASE_TRADE = {
  asOf: "2026-01..07",
  month: "2026-07",
  published: "2026-08-31",
  source: "국토교통부 2026년 7월 주택통계",
  wolseYtd: 68.3,
  wolseYtdPrev: 61.8,
  wolseYtdDelta: 6.5,
  seoulYtd: 69.7,
  sudoYtd: 66.9,
  provinceYtd: 70.9,
  aptYtd: 52.4,
  aptYtdPrev: 46.4,
  nonAptYtd: 80.4,
  julyDeals: 210_985,
  julyJeonse: 68_462,
  julyWolse: 142_523,
  julyMomPct: -3.5,
  julyYoyPct: -13.5,
  note: "실거래 신고 건수입니다. 점유 가구 비중이 아닙니다.",
} as const;

export function leaseJulyWolseShare(): number {
  return REALTY_LEASE_TRADE.julyWolse / REALTY_LEASE_TRADE.julyDeals;
}

export function tenureRentShare(): number {
  return REALTY_TENURE.rent;
}
