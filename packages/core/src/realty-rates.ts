// 대출 금리는 한은 가중평균·기준금리, 은행연합회 COFIX만. 개별 은행 상품·등기는 안 긁는다.
// ECOS 항목코드는 이름 매칭. 코드 추측 금지.

export type RealtyRateBasis = "policy" | "new" | "out" | "cofix" | "market";

export type RealtyRateRow = {
  id: string;
  group: string;
  label: string;
  /** 연 %. 칸이면 null. */
  rate: number | null;
  /** 전월 대비 %p. 정책금리는 직전 결정 대비. */
  delta: number | null;
  asOf: string;
  basis: RealtyRateBasis;
  basisLabel: string;
  liveCode?: string;
  note?: string;
};

export const REALTY_RATE_LINKS = {
  bokJuly: "https://www.bok.or.kr/portal/bbs/B0000501/view.do?nttId=11064110&menuNo=201264",
  bokMpc: "https://www.bok.or.kr/portal/bbs/P0000559/view.do?menuNo=200690&nttId=11064191",
  bokCal: "https://www.bok.or.kr/portal/stats/statsPublictSchdul/listCldr.do?menuNo=200775",
  ecos: "https://ecos.bok.or.kr/",
  cofix: "https://portal.kfb.or.kr/fingoods/cofix.php",
  finlife: "https://finlife.fss.or.kr/",
} as const;

export const REALTY_RATE_NOTE =
  "예금은행 가중평균이지 특정 은행 상품금리가 아닙니다. 8월 가중평균은 2026-09-30 공표. COFIX는 조달비용 지수입니다.";

/** 한은 2026-08-27 금통위. */
export const REALTY_BASE_RATE = {
  asOf: "2026-08-27",
  source: "한국은행 통화정책방향",
  rate: 3.0,
  prev: 2.75,
  delta: 0.25,
  liveCode: "BOK_BASE_RATE",
} as const;

/**
 * 한은 2026년 7월 금융기관 가중평균금리. 본문 헤드라인 + 같은 보도 붙임 표(가계·주담대·전세·신용).
 * 8월 숫자는 9월 30일 공표 전이라 넣지 않는다.
 */
export const REALTY_BOK_AVG = {
  asOf: "2026-07",
  published: "2026-08-26",
  source: "한국은행 2026년 7월 금융기관 가중평균금리",
  newDeposit: 3.21,
  newDepositDelta: 0.13,
  newLoan: 4.27,
  newLoanDelta: -0.04,
  outDeposit: 2.15,
  outDepositDelta: 0.08,
  outLoan: 4.37,
  outLoanDelta: 0.03,
  newHh: 4.64,
  newHhDelta: 0.14,
  newMort: 4.48,
  newMortDelta: 0.12,
  newJeonse: 4.19,
  newJeonseDelta: 0.12,
  newCredit: 5.97,
  newCreditDelta: 0.25,
  newCorp: 4.2,
  newCorpDelta: -0.07,
  newLarge: 4.18,
  newLargeDelta: 0.01,
  newSme: 4.22,
  newSmeDelta: -0.16,
  newMortFix: 4.76,
  newMortFixDelta: 0.23,
  newMortVar: 4.35,
  newMortVarDelta: 0.08,
  mortFixShare: 31.9,
  mortFixShareDelta: -5.8,
  spreadNew: 1.06,
  spreadNewDelta: -0.17,
} as const;

/** 은행연합회 2026-09-15 공시. 대상기간 2026-08. */
export const REALTY_COFIX = {
  asOf: "2026-08",
  published: "2026-09-15",
  source: "전국은행연합회 COFIX",
  next: "2026-10-15",
  fresh: 3.18,
  freshDelta: 0,
  out: 3.05,
  outDelta: 0.05,
  newOut: 2.71,
  newOutDelta: 0.06,
  short: 3.12,
  shortAsOf: "2026-09-09",
} as const;

export const ECOS_LOAN_RATE_NEW_STAT = "121Y006";
export const ECOS_LOAN_RATE_OUT_STAT = "121Y015";

export type EcosLoanRateSpec = {
  id: string;
  stat: string;
  names: readonly string[];
  code: string;
};

/** 항목코드 없음. StatisticItemList 이름만. */
export const ECOS_LOAN_RATE_SPECS: readonly EcosLoanRateSpec[] = [
  { id: "newAll", stat: ECOS_LOAN_RATE_NEW_STAT, names: ["대출", "대출평균", "총대출"], code: "ECOS_LOAN_NEW_ALL" },
  { id: "newCorp", stat: ECOS_LOAN_RATE_NEW_STAT, names: ["기업대출"], code: "ECOS_LOAN_NEW_CORP" },
  { id: "newLarge", stat: ECOS_LOAN_RATE_NEW_STAT, names: ["대기업대출", "대기업"], code: "ECOS_LOAN_NEW_LARGE" },
  { id: "newSme", stat: ECOS_LOAN_RATE_NEW_STAT, names: ["중소기업대출", "중소기업"], code: "ECOS_LOAN_NEW_SME" },
  { id: "newHh", stat: ECOS_LOAN_RATE_NEW_STAT, names: ["가계대출"], code: "ECOS_LOAN_NEW_HH" },
  { id: "newMort", stat: ECOS_LOAN_RATE_NEW_STAT, names: ["주택담보대출"], code: "ECOS_LOAN_NEW_MORT" },
  { id: "newJeonse", stat: ECOS_LOAN_RATE_NEW_STAT, names: ["전세자금대출", "전세자금"], code: "ECOS_LOAN_NEW_JEONSE" },
  { id: "newCredit", stat: ECOS_LOAN_RATE_NEW_STAT, names: ["일반신용대출", "신용대출"], code: "ECOS_LOAN_NEW_CREDIT" },
  { id: "outAll", stat: ECOS_LOAN_RATE_OUT_STAT, names: ["대출", "대출평균", "총대출"], code: "ECOS_LOAN_OUT_ALL" },
  { id: "outHh", stat: ECOS_LOAN_RATE_OUT_STAT, names: ["가계대출"], code: "ECOS_LOAN_OUT_HH" },
  { id: "outMort", stat: ECOS_LOAN_RATE_OUT_STAT, names: ["주택담보대출"], code: "ECOS_LOAN_OUT_MORT" },
];

export function matchEcosLoanRateItem(stat: string, name: string): EcosLoanRateSpec | null {
  const n = name.replace(/\s+/g, "").trim();
  if (!n) return null;
  return ECOS_LOAN_RATE_SPECS.find((s) => s.stat === stat && s.names.includes(n)) ?? null;
}

export function ecosLoanRateMacroCodes(): string[] {
  return [
    REALTY_BASE_RATE.liveCode,
    "KTB_3Y",
    ...ECOS_LOAN_RATE_SPECS.map((s) => s.code),
  ];
}

export function realtyRateSnapshot(): RealtyRateRow[] {
  const a = REALTY_BOK_AVG;
  const c = REALTY_COFIX;
  const b = REALTY_BASE_RATE;
  return [
    { id: "base", group: "정책", label: "한국은행 기준금리", rate: b.rate, delta: b.delta, asOf: b.asOf, basis: "policy", basisLabel: "금통위", liveCode: b.liveCode },
    { id: "ktb", group: "시장", label: "국고채 3년", rate: null, delta: null, asOf: "", basis: "market", basisLabel: "ECOS", liveCode: "KTB_3Y", note: "수집되면 채웁니다." },
    { id: "newLoan", group: "신규취급액", label: "예금은행 대출", rate: a.newLoan, delta: a.newLoanDelta, asOf: a.asOf, basis: "new", basisLabel: "신규", liveCode: "ECOS_LOAN_NEW_ALL" },
    { id: "newHh", group: "신규취급액", label: "가계대출", rate: a.newHh, delta: a.newHhDelta, asOf: a.asOf, basis: "new", basisLabel: "신규", liveCode: "ECOS_LOAN_NEW_HH" },
    { id: "newMort", group: "신규취급액", label: "주택담보대출", rate: a.newMort, delta: a.newMortDelta, asOf: a.asOf, basis: "new", basisLabel: "신규", liveCode: "ECOS_LOAN_NEW_MORT" },
    { id: "newMortFix", group: "신규취급액", label: "주담대 고정형", rate: a.newMortFix, delta: a.newMortFixDelta, asOf: a.asOf, basis: "new", basisLabel: "신규" },
    { id: "newMortVar", group: "신규취급액", label: "주담대 변동형", rate: a.newMortVar, delta: a.newMortVarDelta, asOf: a.asOf, basis: "new", basisLabel: "신규" },
    { id: "newJeonse", group: "신규취급액", label: "전세자금대출", rate: a.newJeonse, delta: a.newJeonseDelta, asOf: a.asOf, basis: "new", basisLabel: "신규", liveCode: "ECOS_LOAN_NEW_JEONSE" },
    { id: "newCredit", group: "신규취급액", label: "일반신용대출", rate: a.newCredit, delta: a.newCreditDelta, asOf: a.asOf, basis: "new", basisLabel: "신규", liveCode: "ECOS_LOAN_NEW_CREDIT" },
    { id: "newCorp", group: "신규취급액", label: "기업대출", rate: a.newCorp, delta: a.newCorpDelta, asOf: a.asOf, basis: "new", basisLabel: "신규", liveCode: "ECOS_LOAN_NEW_CORP" },
    { id: "newLarge", group: "신규취급액", label: "대기업", rate: a.newLarge, delta: a.newLargeDelta, asOf: a.asOf, basis: "new", basisLabel: "신규", liveCode: "ECOS_LOAN_NEW_LARGE" },
    { id: "newSme", group: "신규취급액", label: "중소기업", rate: a.newSme, delta: a.newSmeDelta, asOf: a.asOf, basis: "new", basisLabel: "신규", liveCode: "ECOS_LOAN_NEW_SME" },
    { id: "newDep", group: "신규취급액", label: "저축성수신", rate: a.newDeposit, delta: a.newDepositDelta, asOf: a.asOf, basis: "new", basisLabel: "신규" },
    { id: "spread", group: "신규취급액", label: "예대금리차", rate: a.spreadNew, delta: a.spreadNewDelta, asOf: a.asOf, basis: "new", basisLabel: "신규" },
    { id: "outLoan", group: "잔액", label: "예금은행 총대출", rate: a.outLoan, delta: a.outLoanDelta, asOf: a.asOf, basis: "out", basisLabel: "잔액", liveCode: "ECOS_LOAN_OUT_ALL" },
    { id: "outDep", group: "잔액", label: "총수신", rate: a.outDeposit, delta: a.outDepositDelta, asOf: a.asOf, basis: "out", basisLabel: "잔액" },
    { id: "cofixNew", group: "COFIX", label: "신규취급액", rate: c.fresh, delta: c.freshDelta, asOf: c.asOf, basis: "cofix", basisLabel: "COFIX" },
    { id: "cofixOut", group: "COFIX", label: "잔액", rate: c.out, delta: c.outDelta, asOf: c.asOf, basis: "cofix", basisLabel: "COFIX" },
    { id: "cofixNewOut", group: "COFIX", label: "신잔액", rate: c.newOut, delta: c.newOutDelta, asOf: c.asOf, basis: "cofix", basisLabel: "COFIX" },
    { id: "cofixShort", group: "COFIX", label: "단기", rate: c.short, delta: null, asOf: c.shortAsOf, basis: "cofix", basisLabel: "주간" },
  ];
}

export type LiveRatePoint = { date: string; value: number };

export function applyLiveRates(
  rows: readonly RealtyRateRow[],
  live: Partial<Record<string, LiveRatePoint>>,
): RealtyRateRow[] {
  return rows.map((row) => {
    if (!row.liveCode) return row;
    const pt = live[row.liveCode];
    if (!pt || !Number.isFinite(pt.value)) return row;
    if (row.asOf && pt.date.slice(0, 7) < row.asOf.slice(0, 7)) return row;
    const newer = !row.asOf || pt.date.slice(0, 7) > row.asOf.slice(0, 7);
    return {
      ...row,
      rate: pt.value,
      asOf: row.basis === "policy" || row.basis === "market" ? pt.date : pt.date.slice(0, 7),
      delta: row.basis === "market" || newer ? null : row.delta,
      note: row.rate == null ? "ECOS" : row.note,
    };
  });
}

export function formatRate(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}%`;
}

export function formatRateDelta(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "" : "";
  return `${sign}${n.toFixed(2)}%p`;
}
