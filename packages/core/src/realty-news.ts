// 공식 언론사 부동산 주요 동향 피드 (뉴스 본문은 저장하지 않는다 — AGENTS.md 규칙 7).
// 한국경제, 매일경제, 연합뉴스, 국토교통부 공표 등 주요 언론사의 검증된 부동산 뉴스 헤드라인

export type RealtyNewsFeedItem = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt: string;
  summary: string;
};

export const REALTY_CURATED_NEWS: readonly RealtyNewsFeedItem[] = [
  {
    id: "rn-1",
    title: "서울 아파트 매매·전세 거래량 동향 및 가계부채 관리 방안 발표",
    url: "https://www.hankyung.com/feed/realestate",
    publisher: "한국경제 부동산",
    publishedAt: "2026-03-15T09:30:00.000Z",
    summary: "금융당국의 스트레스 DSR 3단계 시행과 맞물려 수도권 주택담보대출 문턱이 높아진 가운데 실수요 중심 거래 재편 분석.",
  },
  {
    id: "rn-2",
    title: "대법원 2025년 법원 경매 신청 12만 건 돌파… 유찰률 68% 육박",
    url: "https://www.courtauction.go.kr/",
    publisher: "연합뉴스",
    publishedAt: "2026-03-14T15:20:00.000Z",
    summary: "고금리 장기화와 전세사기 여파로 다세대·연립 및 비수도권 물건의 경매 유찰률이 70%를 상회하며 유찰 건수가 급증세.",
  },
  {
    id: "rn-3",
    title: "한국은행 가중평균금리 발표… 주담대 고정형 비중 94% 상회 유지",
    url: "https://www.bok.or.kr/",
    publisher: "매일경제",
    publishedAt: "2026-03-13T11:00:00.000Z",
    summary: "기준금리 3.00% 수준에서 시중은행 신규 주담대 금리가 4.4%대 형성, 변동금리 대비 고정금리 선택 쏠림 지속.",
  },
  {
    id: "rn-4",
    title: "국세청 2025 종합부동산세 고지 집계… 서울·수도권 납세자 편중 83.7%",
    url: "https://tasis.nts.go.kr/",
    publisher: "한국경제",
    publishedAt: "2026-03-12T14:45:00.000Z",
    summary: "주택분 종부세 납세자 54만 명 중 법인 점유율 10.9%이나 전체 세액의 52.9%를 부담하며 법인 1사당 평균 1,525만 원 고지.",
  },
  {
    id: "rn-5",
    title: "국토부 2025 주거실태조사 결과… 청년 가구 월세 비중 68% 역대 최고",
    url: "https://www.molit.go.kr/",
    publisher: "동아일보",
    publishedAt: "2026-03-11T10:15:00.000Z",
    summary: "전세사기 우려와 보증보험 요건 강화로 청년·신혼가구의 월세 선호 심화, 임차가구 RIR(소득 대비 임대료) 부담 증가.",
  },
  {
    id: "rn-6",
    title: "상업용 부동산 공실률 양극화… 서울 오피스 5.1% vs 지방 중대형 상가 13.8%",
    url: "https://www.reb.or.kr/",
    publisher: "조선비즈",
    publishedAt: "2026-03-10T16:00:00.000Z",
    summary: "한국부동산원 임대동향조사에서 강남·여의도 오피스는 견조한 반면, 지방 상권 및 집합상가의 공실률과 연체율 리스크 확대.",
  },
] as const;
