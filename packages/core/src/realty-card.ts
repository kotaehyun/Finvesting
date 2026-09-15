// 카드 연체·결제성 리볼빙(리빙볼). 개별 카드사 실명 상품은 안 긁는다.

export const REALTY_CARD_LINKS = {
  fss: "https://www.fss.or.kr/fss/bbs/B0000188/list.do?menuNo=200218",
  crefia: "https://gongsi.crefia.or.kr/",
  revolving: "https://gongsi.crefia.or.kr/portal/creditcard/creditcardDisclosureDetail30?cgcMode=30",
} as const;

/** 금감원 2026년 상반기 여신전문금융회사 영업실적(잠정). 8개 전업카드사. */
export const REALTY_CARD_NPL = {
  asOf: "2026-06-30",
  published: "2026-08-27",
  source: "금융감독원 2026년 상반기 여신전문금융회사 영업실적(잠정)",
  all: 1.54,
  allDelta: 0.02,
  card: 1.61,
  cardDelta: 0.07,
  sales: 0.86,
  salesDelta: 0.05,
  loan: 3.35,
  loanDelta: 0.14,
  nplRatio: 1.13,
  nplRatioDelta: -0.02,
  nonCard: 2.29,
  nonCardDelta: 0.18,
  note: "총채권 연체율입니다. 가계 주담대 연체와 시계열이 다릅니다.",
} as const;

/**
 * 여신금융협회 9개 카드사 7월 말 잔액. 리볼빙=결제성 리볼빙 이월.
 * 비율은 카드론+현금서비스+리볼빙 합 대비.
 */
export const REALTY_REVOLVING = {
  asOf: "2026-07-31",
  source: "여신금융협회 신용카드 이용실적(9개사)",
  /** 억 원 */
  cardLoanEok: 427_957,
  cardLoanPrevEok: 429_093,
  cashEok: 70_251,
  cashPrevEok: 67_842,
  revolveEok: 68_759,
  revolvePrevEok: 68_320,
  feePct: 17.38,
  cashFeePct: 18.16,
  cardLoanFeePct: 14.15,
  note: "결제성 리볼빙입니다. 일부만 갚고 나머지를 넘깁니다. 카드 매출액 대비가 아닙니다.",
} as const;

export function revolvingShareOfCardCredit(): number {
  const t = REALTY_REVOLVING.cardLoanEok + REALTY_REVOLVING.cashEok + REALTY_REVOLVING.revolveEok;
  return REALTY_REVOLVING.revolveEok / t;
}

export function cardLoanShareOfCardCredit(): number {
  const t = REALTY_REVOLVING.cardLoanEok + REALTY_REVOLVING.cashEok + REALTY_REVOLVING.revolveEok;
  return REALTY_REVOLVING.cardLoanEok / t;
}

export function eokToJo1(eok: number): number {
  return eok / 10_000;
}
