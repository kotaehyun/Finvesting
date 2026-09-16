// 공실 정의·빈집 유형, 상환·경매, 영끌 고위험, 임대업(꼬마·중형 빌딩) 부채, 상권 수익률.
// 포털 급매·민간 경매 유찰률·상권정보시스템 매출은 긁지 않는다.

export const REALTY_DISTRESS_LINKS = {
  reb: "https://www.reb.or.kr/reb/cm/cntnts/cntntsView.do?cntntsId=1049&mi=10335&statId=S237220284",
  rebPress: "https://www.reb.or.kr/reb/na/ntt/selectNttInfo.do?mi=9565&nttSn=111709",
  census: "https://www.korea.kr/briefing/policyBriefingView.do?newsId=156772432",
  fsrJun: "https://www.bok.or.kr/portal/bbs/P0000593/view.do?menuNo=200068&nttId=10092099",
  fsrDec: "https://www.bok.or.kr/portal/bbs/P0000593/view.do?menuNo=200068&nttId=10095308",
  auction: "https://www.courtauction.go.kr/",
  fscRti: "https://www.fsc.go.kr/po010101/73190",
  sbiz: "https://bigdata.sbiz.or.kr/",
  sg: "https://sg.sbiz.or.kr/",
  housing: "https://kostat.go.kr/board.es?act=view&bid=215&list_no=439535&mid=b80501010000",
} as const;

/** 부동산원 공실. 자가·무상임대는 공실이 아님. 법인이 채워도 공실률이 내려간다. */
export const REALTY_VACANCY_DEF = {
  source: "한국부동산원 상업용부동산 임대동향조사",
  rule: "임대계약이 없고 자가·무상임대로도 안 쓰는 면적 ÷ 임대가능면적.",
  note: "표본 공실입니다. 법인이 자가 사용하거나 무상으로 넣으면 공실이 아닙니다. 대기업·법인이 아파트 공실을 얼마나 낮췄는지는 공표가 없습니다.",
} as const;

/** 2025 주택총조사 유형별 미거주 비중 %. 아파트가 가장 낮음. */
export const REALTY_EMPTY_BY_TYPE = [
  { id: "nonres", label: "비주거용 건물 내 주택", share: 14.9 },
  { id: "row", label: "연립", share: 14.7 },
  { id: "multi", label: "다세대", share: 11.4 },
  { id: "detached", label: "단독", share: 10.3 },
  { id: "apt", label: "아파트", share: 7.1 },
] as const;

export const REALTY_HH_NPL = {
  asOf: "2025-03-31",
  source: "한국은행 금융안정보고서(2025년 6월)",
  household: 1.05,
  mortgage: 0.44,
  other: 2.08,
  firm: 2.84,
  bankFirm: 0.62,
  nonbankFirm: 7.43,
  selfEmp: 1.88,
  selfEmpWeak: 12.24,
} as const;

/** 꼬마·중형 빌딩 전용이 아니라 기업 부동산업 대출. */
export const REALTY_CRE_NPL = {
  asOf: "2025-03-31",
  source: "한국은행 금융안정보고서(2025년 6월)",
  realEstate: 3.01,
  realEstateShare: 23.9,
  retail: 2.52,
  retailShare: 12.6,
  all: 2.09,
  note: "꼬마빌딩·중형빌딩만의 시계열은 없습니다. 상가·오피스 담보를 포함한 기업 부동산업입니다.",
} as const;

export const REALTY_RTI = {
  source: "금융위원회 개인사업자대출 여신심사 가이드라인",
  housing: 1.25,
  nonHousing: 1.5,
  note: "연간 임대소득 ÷ 연간 이자. 비주택(상가·오피스·꼬마빌딩)은 1.5배. 공실이 늘면 RTI가 깨집니다.",
} as const;

/** 영끌 공식 명칭은 없음. 한은 고위험가구(DSR>40%·DTA>100%)의 청년 비중. */
export const REALTY_YOUNG_LEVERAGE = {
  asOf: "2025-03",
  source: "한국은행 고위험가구(금융안정보고서)",
  households: 459_000,
  shareOfDebtHh: 4.0,
  youthShare: 34.9,
  youthShare2020: 22.6,
  dsrCut: 40,
  dtaCut: 100,
  seoulBuyerYouth: 39.5,
  seoulBuyerAsOf: "2025-10~11",
  seoulBuyerNote: "서울 아파트 매매 중 30대 이하 비중. 대출 잔액 비중이 아닙니다.",
} as const;

export const REALTY_AUCTION = {
  asOf: "2025",
  source: "대법원 경매신청 및 법원경매정보",
  filed: 121_261,
  filed2024: 119_312,
  filed2023: 101_150,
  failRateKr: 68.4,
  failRateSudoApt: 59.2,
  failRateNonCapital: 73.8,
  hug: 11_663,
  hugShare: 10,
  hugRecover: 71.5,
  hugRecoverPrev: 29.7,
  note: "대법원 경매신청 12.1만건 및 전국 평균 유찰률 68.4%(매각률 31.6%). 세부 물건별은 법원경매정보 원문.",
} as const;

export const REALTY_CRE_YIELD = {
  asOf: "2025-12-31",
  source: "한국부동산원 2025년 4분기 상업용부동산 임대동향조사",
  officeQ: 1.74,
  midShopQ: 0.99,
  smallShopQ: 0.81,
  retailQ: 1.15,
  officeInc: 0.9,
  midShopInc: 0.78,
  smallShopInc: 0.71,
  retailInc: 0.96,
  officeY: 6.17,
  midShopY: 3.48,
  smallShopY: 2.83,
  retailY: 4.28,
  officeRent: 18.8,
  midShopRent: 26.6,
  smallShopRent: 20.6,
  retailRent: 26.9,
  keyMoney: 33_940_000,
  keyMoneyShare: 54.64,
} as const;

export const REALTY_DISTRESS_SLOTS = [
  {
    id: "fire",
    label: "급매 호수",
    need: "포털 급매는 공식 통계가 아닙니다. 네이버·직방 호수는 안 긁습니다.",
  },
  {
    id: "seize",
    label: "압류 건수",
    need: "개인 등기·압류는 비밀입니다. 공개 창구는 법원경매입니다.",
  },
  {
    id: "fail",
    label: "경매 유찰·매각률",
    need: "대법원 법원경매정보 원문. 민간 경매 사이트를 긁지 않아 칸만 둡니다.",
  },
  {
    id: "maturity",
    label: "만기 도래 잔액",
    need: "주담대·임대업 만기 도래 잔액 공개 시계열이 없습니다. 금감원 원문 칸.",
  },
  {
    id: "corp-fill",
    label: "법인 자가로 빠진 공실",
    need: "법인이 자가·무상으로 채운 면적은 공표가 없습니다. 정의상 공실에서 빠집니다.",
  },
  {
    id: "sales",
    label: "상권 소비액",
    need: "소상공인365 추정매출. 사이트를 긁지 않아 칸만. 아래 링크로 조회.",
  },
] as const;

export function emptyAptShare(): number {
  return REALTY_EMPTY_BY_TYPE.find((r) => r.id === "apt")?.share ?? 0;
}

export function auctionYoyPct(): number {
  return ((REALTY_AUCTION.filed - REALTY_AUCTION.filed2024) / REALTY_AUCTION.filed2024) * 100;
}

export function auctionFailRate(): number {
  return REALTY_AUCTION.failRateKr;
}
