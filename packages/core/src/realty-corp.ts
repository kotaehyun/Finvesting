// 고액·법인 명의 창구. 연예인·4급 실명·개인 등기는 넣지 않는다.
// 넣는 방법: 공개 집계(종부세 법인, 거래주체별)만. 등록만 된 재산은 누설 금지.

export type RealtyCorpPut = "in" | "slot" | "never";

export type RealtyCorpChannel = {
  id: string;
  group: string;
  put: RealtyCorpPut;
  putLabel: string;
  how: string;
};

export const REALTY_CORP_LINKS = {
  rebBuyer: "https://www.reb.or.kr/reb/cm/cntnts/cntntsView.do?cntntsId=1061&mi=10338&statId=S234220286",
  cgtFile: "https://www.data.go.kr/data/15119698/fileData.do",
  tasis: "https://tasis.nts.go.kr/",
  petiReg: "https://www.peti.go.kr/prptRgsDtr.do",
  petiOpen: "https://www.peti.go.kr/prptOptpOpe.do",
  ethics: "https://www.korea.kr/multi/visualNewsView.do?newsId=148885997",
  dart: "https://dart.fss.or.kr/",
  iros: "https://www.iros.go.kr/",
} as const;

export const REALTY_CORP_CHANNELS: readonly RealtyCorpChannel[] = [
  {
    id: "grade4",
    group: "4급 이상 공무원",
    put: "never",
    putLabel: "넣지 않음",
    how: "공직자윤리법상 재산등록만. 외부 공개가 아니고 누설은 처벌입니다. 명단·가액을 넣지 않습니다.",
  },
  {
    id: "open-official",
    group: "재산공개 고위공직·공직유관단체장",
    put: "in",
    putLabel: "집계·관보",
    how: "1급·정무직 등 공개 대상만. 인사혁신처 보도 집계 + 관보 주택 소재. 사이트는 긁지 않습니다.",
  },
  {
    id: "exec",
    group: "상장사 임원",
    put: "slot",
    putLabel: "칸",
    how: "DART는 임원 주식·보수입니다. 개인 주택 등기가 아닙니다. 실명 목록을 앱에 안 옮깁니다. 이동은 증여·상속·법인 집계로만.",
  },
  {
    id: "celeb",
    group: "연예인·사적 자산가",
    put: "never",
    putLabel: "넣지 않음",
    how: "공식 공개 명단이 없습니다. 사유재산·과세비밀입니다. 연예 기사·등기를 긁지 않습니다. 이동 방식은 증여·상속·법인·신탁 집계입니다.",
  },
  {
    id: "corp",
    group: "법인 명의 주택",
    put: "in",
    putLabel: "국세 집계",
    how: "종부세 주택분 법인 인원·세액. 실명이 아니라 납세자 유형입니다. 지역×법인 표는 TASIS·data.go.kr 칸.",
  },
  {
    id: "buyer",
    group: "거래 주체(개인·법인)",
    put: "slot",
    putLabel: "칸",
    how: "한국부동산원 월별 거래주체별 아파트 매매. 키·원문 표 후. 등기정보광장·포털은 긁지 않습니다.",
  },
];

export const REALTY_CORP_BUYER_NOTE =
  "법인 매수 비중은 부동산원 ‘거래주체별’이 공식입니다. 등기 건수 기사를 숫자로 옮기지 않습니다.";
