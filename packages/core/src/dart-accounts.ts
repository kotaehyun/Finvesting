/**
 * OpenDART 계정 → 표준 재무 키.
 * `fnlttSinglAcnt`는 BS·IS만. 현금흐름(CF)은 `fnlttSinglAcntAll`의 account_id·계정명.
 * 추측 계정은 넣지 않는다. 영업현금흐름 총액만 `cfo` (중간합계·창출액 제외).
 */

export type DartStatementKind = "income" | "balance" | "cashflow";

/** 공백 제거한 account_nm → 표준 키 */
export const DART_ACCOUNT_NM_MAP: Record<string, string> = {
  "매출액": "revenue",
  "수익(매출액)": "revenue",
  "영업수익": "revenue",
  "영업이익": "operating_income",
  "영업이익(손실)": "operating_income",
  "당기순이익": "net_income",
  "당기순이익(손실)": "net_income",
  "자산총계": "total_assets",
  "부채총계": "total_liabilities",
  "자본총계": "total_equity",
  "영업활동현금흐름": "cfo",
  "영업활동으로인한현금흐름": "cfo",
};

/**
 * XBRL account_id → 표준 키.
 * `CashFlowsFromUsedInOperations`(영업에서 창출)는 WC·이자·세금 전이라 cfo로 쓰지 않음.
 */
export const DART_ACCOUNT_ID_MAP: Record<string, string> = {
  "ifrs-full_CashFlowsFromUsedInOperatingActivities": "cfo",
};

export function normalizeDartAccountNm(accountNm: string): string {
  return accountNm.replace(/\s/g, "");
}

export function dartStatementKind(sjDiv: string): DartStatementKind | null {
  const s = sjDiv.trim().toUpperCase();
  if (s === "BS") return "balance";
  if (s === "CF") return "cashflow";
  if (s === "IS" || s === "CIS") return "income";
  return null;
}

export function mapDartAccountKey(input: {
  accountNm?: string | null;
  accountId?: string | null;
}): string | null {
  const id = (input.accountId ?? "").trim();
  if (id && id !== "-표준계정코드 미사용-" && DART_ACCOUNT_ID_MAP[id]) {
    return DART_ACCOUNT_ID_MAP[id]!;
  }
  const nm = normalizeDartAccountNm(input.accountNm ?? "");
  if (!nm) return null;
  return DART_ACCOUNT_NM_MAP[nm] ?? null;
}

/** 표 종류별 허용 표준 키. CF의 「당기순이익」행이 income 키로 새지 않게. */
export const DART_KEYS_BY_STATEMENT: Record<DartStatementKind, ReadonlySet<string>> = {
  income: new Set(["revenue", "operating_income", "net_income", "eps_diluted"]),
  balance: new Set(["total_assets", "total_liabilities", "total_equity"]),
  cashflow: new Set(["cfo"]),
};

export function mapDartFsRow(input: {
  sjDiv?: string | null;
  accountNm?: string | null;
  accountId?: string | null;
}): { statement: DartStatementKind; key: string } | null {
  const statement = dartStatementKind(input.sjDiv ?? "");
  if (!statement) return null;
  const key = mapDartAccountKey(input);
  if (!key) return null;
  if (!DART_KEYS_BY_STATEMENT[statement].has(key)) return null;
  return { statement, key };
}

export function parseDartAmount(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const s = String(raw).replace(/,/g, "").trim();
  if (!s || s === "-") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export type DartAmountPeriod = "FY" | "Q1" | "H1" | "Q3";

/**
 * 손익의 반기·3분기에서 `thstrm_amount`는 3개월, `thstrm_add_amount`가 연초부터 누적이다.
 * `thstrm_dt`는 3개월 행에도 연초~기말로 적혀 있어 기간 판정에 쓰지 않는다.
 * 누적 칸이 없으면 null. 그 행은 저장하지 않는다.
 * 재무상태(시점)·현금흐름·1분기·연간은 `thstrm_amount`.
 */
export function dartReportedAmount(input: {
  statement: DartStatementKind;
  period: DartAmountPeriod;
  thstrmAmount?: string | null;
  thstrmAddAmount?: string | null;
}): number | null {
  const cumulative = input.statement === "income" && (input.period === "H1" || input.period === "Q3");
  if (cumulative) return parseDartAmount(input.thstrmAddAmount);
  return parseDartAmount(input.thstrmAmount);
}
