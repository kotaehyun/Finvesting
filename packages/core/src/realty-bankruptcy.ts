// 개인회생·파산은 법원통계월보 신청 건수, 파탄원인은 서울회생법원 중복응답.
// 주담대 전용 비중·미수금 일별 잔액·면책률은 공표 칸.

export type BankruptcyCause = {
  id: "living" | "income" | "business" | "invest";
  label: string;
  share: number;
  description: string;
};

/** 서울회생법원 2025 상반기 개인파산 파탄원인. 복수 응답이라 합이 100이 아니다. 주담대 항목 없음. */
export const REALTY_BANKRUPTCY_CAUSES: readonly BankruptcyCause[] = [
  {
    id: "living",
    label: "생활비 지출 증가",
    share: 46.65,
    description: "서울회생법원 개인파산 파탄원인 1위. 카드·소액대출 돌려막기와는 다른 조사입니다.",
  },
  {
    id: "business",
    label: "사업 실패·사업소득 감소",
    share: 42.92,
    description: "자영업 매출·사업소득 감소. 생활비와 동시에 고를 수 있습니다.",
  },
  {
    id: "income",
    label: "실직·근로소득 감소",
    share: 40.91,
    description: "근로소득 공백. 생활비 항목과 겹칩니다.",
  },
  {
    id: "invest",
    label: "투자(주식 등) 실패·사기",
    share: 13.55,
    description: "주식·사기 피해. 금투협 미수금 잔액과는 다른 설문입니다.",
  },
] as const;

export const REALTY_INSOLVENCY_STATS = {
  asOf: "2025",
  causeAsOf: "2025 상반기",
  source: "법원통계월보 · 서울회생법원 개인파산 통계조사",
  rehabilitationFiled: 149_146,
  rehabilitationFiledPrev: 129_499,
  bankruptcyFiled: 40_908,
  bankruptcyFiledPrev: 40_104,
  /** 2024 확정자. 접수가 아님. */
  debtAdjustmentAsOf: "2024",
  debtAdjustmentSettled: 174_841,
  debtAdjustmentSource: "신용회복위원회(국회 제출)",
  causeNote: "파탄원인은 중복응답입니다. 합이 100%가 아니고, 주담대·영끌 전용 칸은 없습니다.",
} as const;

export const REALTY_INSOLVENCY_LINKS = {
  scourtInsolvency: "https://www.scourt.go.kr/portal/news/NewsViewAction.work?gubun=6&seqnum=2860",
  slbCourt: "https://slb.scourt.go.kr/",
  slbPdf: "https://slb.scourt.go.kr/rel/information/statistics/stat_file02.pdf",
  ccrs: "https://www.ccrs.or.kr/",
  kofiaMisu: "https://freesis.kofia.or.kr/",
} as const;

export const REALTY_INSOLVENCY_SLOTS = [
  {
    id: "margin",
    label: "위탁매매 미수금",
    need: "금투협 일별. 고정 스냅샷을 넣지 않습니다.",
  },
  {
    id: "forced-sale",
    label: "반대매매",
    need: "금투협 일별. 일평균을 지어내지 않습니다.",
  },
  {
    id: "discharge",
    label: "파산 면책 인용률",
    need: "사법연감 원문 칸. 확인 전 숫자를 넣지 않습니다.",
  },
] as const;

export function insolvencyFiledTotal(): number {
  return REALTY_INSOLVENCY_STATS.rehabilitationFiled + REALTY_INSOLVENCY_STATS.bankruptcyFiled;
}

export function rehabilitationYoyPct(): number {
  const s = REALTY_INSOLVENCY_STATS;
  return ((s.rehabilitationFiled - s.rehabilitationFiledPrev) / s.rehabilitationFiledPrev) * 100;
}
