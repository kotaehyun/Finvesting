// 대출 금리는 한은 가중평균·기준금리, 은행연합회 COFIX만. 개별 은행 상품·등기는 안 긁는다.
// ECOS 항목코드는 이름 매칭. 코드 추측 금지.
import dataFile from "../data/realty/rates.json";
import { assertDefaults } from "./load-data";

assertDefaults(dataFile, "realty/rates.json");


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

export const REALTY_RATE_LINKS = dataFile.REALTY_RATE_LINKS;

export const REALTY_RATE_NOTE = dataFile.REALTY_RATE_NOTE;

/** 한은 2026-08-27 금통위. */
export const REALTY_BASE_RATE = dataFile.REALTY_BASE_RATE;

/**
 * 한은 2026년 7월 금융기관 가중평균금리. 본문 헤드라인 + 같은 보도 붙임 표(가계·주담대·전세·신용).
 * 8월 숫자는 9월 30일 공표 전이라 넣지 않는다.
 */
export const REALTY_BOK_AVG = dataFile.REALTY_BOK_AVG;

/** 은행연합회 2026-09-15 공시. 대상기간 2026-08. */
export const REALTY_COFIX = dataFile.REALTY_COFIX;

export const ECOS_LOAN_RATE_NEW_STAT = dataFile.ECOS_LOAN_RATE_NEW_STAT;
export const ECOS_LOAN_RATE_OUT_STAT = dataFile.ECOS_LOAN_RATE_OUT_STAT;

export type EcosLoanRateSpec = {
  id: string;
  stat: string;
  names: readonly string[];
  code: string;
};

/** 항목코드 없음. StatisticItemList 이름만. */
export const ECOS_LOAN_RATE_SPECS: readonly EcosLoanRateSpec[] = dataFile.ECOS_LOAN_RATE_SPECS;

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
