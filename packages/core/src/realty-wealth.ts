// 고액 자산은 분위·세금 유형으로만. 연예인·임원·사적 자산가 실명은 넣지 않는다.
// 사유재산·과세정보 비밀. 이동은 채널(법인·증여·상속·신탁) 집계.

export type RealtyWealthPut = "in" | "slot" | "never";

export type RealtyWealthMethod = {
  id: string;
  label: string;
  put: RealtyWealthPut;
  putLabel: string;
  how: string;
};

export const REALTY_WEALTH_LINKS = {
  survey: "https://www.korea.kr/news/policyNewsView.do?newsId=156733201",
  gini: "https://www.kostat.go.kr/board.es?act=view&bid=215&list_no=439535&mid=b80501010000",
  gift: "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=2848",
  inheritFile: "https://www.data.go.kr/data/3058486/fileData.do",
  giftFile: "https://www.data.go.kr/data/3058487/fileData.do",
  tasis: "https://tasis.nts.go.kr/",
  trust: "https://eiec.kdi.re.kr/policy/materialView.do?num=279502",
  rebBuyer: "https://www.reb.or.kr/reb/cm/cntnts/cntntsView.do?cntntsId=1061&mi=10338&statId=S234220286",
  dart: "https://dart.fss.or.kr/",
} as const;

export const REALTY_WEALTH_PRIVACY =
  "연예인·임원·사적 자산가는 한 명씩 올리지 않습니다. 과세정보는 비밀이고, 사유재산권은 헌법상 보장입니다. 보이는 것은 분위·납세 유형·거래 채널 집계뿐입니다.";

/** 2025 가계금융복지조사. 3월 말. 10분위 평균 순자산은 보도가 원문 표를 인용. */
export const REALTY_WEALTH_SHARE = {
  asOf: "2025-03-31",
  source: "국가데이터처·한국은행·금융감독원 2025년 가계금융복지조사",
  topShare: 46.1,
  topShareDeltaPp: 1.6,
  bottom50Share: 9.1,
  giniNet: 0.625,
  giniNetPrev: 0.612,
  over10eok: 11.8,
  under3eok: 57.0,
  /** 만원. 순자산 10분위 평균. */
  topAvgMan: 2_171_220,
  bottomAvgMan: -771,
  realShare: 75.8,
  finShare: 24.2,
  realMan: 42_988,
  finMan: 13_690,
  realHoldHh: 66.7,
  avgAssetMan: 56_678,
  avgNetMan: 47_144,
  note: "10분위 안의 부동산/금융 구성비는 원문 통계표. 연예인 전용 표가 아닙니다.",
} as const;

export const REALTY_WEALTH_GIFT = {
  asOf: "2025",
  source: "국세청 상속·증여세 결정(e-나라지표)",
  inheritPeople: 22_524,
  inheritTaxEok: 89_345,
  inheritYoyPeoplePct: 6.3,
  inheritYoyTaxPct: 9.0,
  giftCases: 181_653,
  giftTaxEok: 54_828,
  giftYoyCasesPct: 1.7,
  giftYoyTaxPct: -3.5,
  note: "결정 인원·세액입니다. 부동산/주식 종류별은 TASIS·data.go.kr 칸. 수증자 실명 없음.",
} as const;

/** 전업 부동산신탁사. 개인 명의신탁·연예인 은닉이 아님. */
export const REALTY_WEALTH_TRUST = {
  asOf: "2025-12-31",
  source: "금융감독원 2025년 신탁업 영업실적(잠정)",
  allJo: 1_516.5,
  realtyJo: 457.5,
  realtyShare: 30.2,
  realtyYoyPct: 7.1,
  note: "개발·담보 등 업권 수탁고입니다. 타인의 집을 숨기는 명의신탁이 아닙니다. 명의신탁은 증여로 봅니다.",
} as const;

export const REALTY_WEALTH_METHODS: readonly RealtyWealthMethod[] = [
  {
    id: "real",
    label: "실물(부동산) 보유",
    put: "in",
    putLabel: "가금복",
    how: "전체 가구 실물 75.8%·금융 24.2%. 상위 10% 순자산 점유 46.1%. 10분위 내부 구성은 원문 표.",
  },
  {
    id: "place",
    label: "고가주택 소재",
    put: "in",
    putLabel: "종부세 지역",
    how: "주택분 종부세 서울 60.7%·수도권 83.7%. 이사 숫자가 아니라 과세 물건지입니다.",
  },
  {
    id: "corp",
    label: "법인 명의",
    put: "in",
    putLabel: "종부세 유형",
    how: "주택분 법인 5.9만(인원 약 11%)·세액 약 53%. 실명이 아닙니다.",
  },
  {
    id: "multi",
    label: "다주택",
    put: "in",
    putLabel: "종부세 유형",
    how: "다주택 33만·1주택 15.1만. 누가 몇 채인지는 없습니다.",
  },
  {
    id: "gift",
    label: "증여",
    put: "in",
    putLabel: "국세 결정",
    how: "2025 증여세 18.2만 건·5.5조. 가족 이전의 공식 창구입니다. 수증자 명단 없음.",
  },
  {
    id: "inherit",
    label: "상속",
    put: "in",
    putLabel: "국세 결정",
    how: "2025 상속세 2.3만 명·8.9조. 사망으로 넘어가는 집계입니다.",
  },
  {
    id: "trust",
    label: "부동산 신탁",
    put: "in",
    putLabel: "금감원 업권",
    how: "전업 부동산신탁사 수탁고 457.5조. 개발·담보 신탁이지 연예인 명의신탁이 아닙니다.",
  },
  {
    id: "buyer",
    label: "매매 거래주체",
    put: "slot",
    putLabel: "칸",
    how: "부동산원 개인·법인 아파트 매매. 키·원문 표 후. 등기광장은 안 긁습니다.",
  },
  {
    id: "cause",
    label: "거래원인·신탁등기",
    put: "slot",
    putLabel: "칸",
    how: "부동산원 거래원인별·신탁/신탁해지. 증여·상속 등기 건수는 원문.",
  },
  {
    id: "exec",
    label: "상장사 임원",
    put: "slot",
    putLabel: "칸",
    how: "DART는 임원 주식·보수 공시입니다. 주택 등기가 아닙니다. 앱에 실명 목록을 옮기지 않습니다.",
  },
  {
    id: "celeb",
    label: "연예인·사적 자산가",
    put: "never",
    putLabel: "넣지 않음",
    how: "공식 공개 명단이 없습니다. 연예 기사·등기를 긁지 않습니다. 위 채널 집계만 봅니다.",
  },
  {
    id: "offshore",
    label: "국외 재산",
    put: "slot",
    putLabel: "칸",
    how: "해외금융계좌·국외전출 관련 국세 집계는 TASIS. 개인 조회 없음.",
  },
];

export function wealthTopShare(): number {
  return REALTY_WEALTH_SHARE.topShare;
}

export function giftTaxShareOfEstate(): number {
  const t = REALTY_WEALTH_GIFT.inheritTaxEok + REALTY_WEALTH_GIFT.giftTaxEok;
  return REALTY_WEALTH_GIFT.giftTaxEok / t;
}

export function realtyTrustShareOfAll(): number {
  return REALTY_WEALTH_TRUST.realtyJo / REALTY_WEALTH_TRUST.allJo;
}
