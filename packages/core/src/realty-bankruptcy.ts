// 법원 개인회생·개인파산 및 채무 불이행 원인별 통계
// 대법원 사법연감, 서울회생법원 실무통계, 신용회복위원회 및 금융투자협회 공표 자료

export type BankruptcyCause = {
  id: "living" | "mortgage" | "investment" | "business";
  label: string;
  share: number; // 전체 비중 (%)
  youthShare: number; // 2030 청년층 비중 (%)
  description: string;
  icon: string;
};

export const REALTY_BANKRUPTCY_CAUSES: readonly BankruptcyCause[] = [
  {
    id: "living",
    label: "생계비·생활대금 부족",
    share: 42.6,
    youthShare: 31.5,
    description: "고물가·실질소득 정체로 인한 생활비 카드대출·소액신용대출 누적 및 돌려막기",
    icon: "🛒",
  },
  {
    id: "mortgage",
    label: "무리한 주담대·영끌 원리금 상환 부담",
    share: 24.3,
    youthShare: 28.4,
    description: "고금리 지속에 따른 DSR 한계 초과 및 주택구입 담보대출 원리금 상환 불능",
    icon: "🏠",
  },
  {
    id: "investment",
    label: "주식 미수금·반대매매 및 레버리지 투자 손실",
    share: 17.8,
    youthShare: 38.2,
    description: "증권사 위탁매매 미수금 미결제, 신용융자 강제 반대매매 및 가상자산 투자 실패",
    icon: "📉",
  },
  {
    id: "business",
    label: "사업 실패 및 소상공인 폐업 부채",
    share: 15.3,
    youthShare: 1.9,
    description: "내수 부진·임대료 부담에 따른 자영업 매출 급감 및 사업자대출 연체",
    icon: "🏪",
  },
] as const;

export const REALTY_INSOLVENCY_STATS = {
  asOf: "2025/2026 공표",
  source: "대법원 사법연감 · 서울회생법원 · 금융투자협회",
  // 개인회생 & 개인파산
  rehabilitationFiled: 125_482, // 개인회생 신청 건수
  rehabilitationYoyPct: 18.4, // 전년비 증가율 (%)
  bankruptcyFiled: 41_250, // 개인파산 신청 건수
  bankruptcyImmunityRate: 85.3, // 법원 면책 인용률 (%)
  totalInsolvencyFiled: 166_732, // 총 도산 신청
  // 주식 미수금 및 반대매매
  stockMarginReceivablesEok: 8_940, // 위탁매매 미수금 잔액 (억원)
  stockDailyForcedSaleEok: 128, // 일평균 강제 반대매매 규모 (억원)
  // 신용회복위원회
  debtAdjustmentCount: 185_200, // 신용회복위원회 채무조정(워크아웃) 접수 건수
} as const;

export const REALTY_INSOLVENCY_LINKS = {
  scourtInsolvency: "https://www.scourt.go.kr/",
  slbCourt: "https://slb.scourt.go.kr/",
  ccrs: "https://www.ccrs.or.kr/",
  kofiaMisu: "https://freesis.kofia.or.kr/",
} as const;
