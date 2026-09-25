// 법인사업자 양식. 법인세 세율은 과세표준 구간 고시라 곱하지 않는다. 종소세가 아님.
import corpLocal from "../data/tax/corp-local-rate.json";
import { assertDataFile, dataSourceLine, requireValue } from "./load-data";

assertDataFile(corpLocal, "tax/corp-local-rate.json");

export const CORP_LOCAL_RATE_SOURCE = dataSourceLine(corpLocal.defaults);

function truncWon(n: number) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

/** 지방세법 제103조의20. 법인지방소득세 표준세율 = 법인세액의 10%. */
export const CIT_LOCAL_ON_CORP_TAX = requireValue(corpLocal, "citLocalOnCorpTax");

/** 법인세법 제60조·제63조. 12월 결산 예시. 사업연도가 다르면 칸. */
export const CIT_FILING_CALENDAR = [
  {
    id: "interim",
    period: "중간예납",
    target: "사업연도 개시일부터 6개월",
    due: "그 기간 종료일부터 2개월 (12월 결산 → 8.31)",
    who: "법인",
    article: "법인세법 제63조",
  },
  {
    id: "final",
    period: "확정신고",
    target: "사업연도",
    due: "사업연도 종료일부터 3개월 (12월 결산 → 3.31)",
    who: "법인",
    article: "법인세법 제60조",
  },
] as const;

export const CORP_SOLE_DIFF = [
  { id: "person", label: "인격", sole: "대표 = 사업자 본인", corp: "법인 별도 인격. 대표는 임원" },
  { id: "income_tax", label: "소득세", sole: "종합소득세 5월", corp: "법인세. 종소세·연말정산 아님" },
  { id: "vat", label: "부가세", sole: "일반·간이·면세", corp: "일반 또는 면세. 간이과세 없음" },
  { id: "pay", label: "대표 보수", sole: "인출은 사업소득", corp: "급여는 근로소득·4대보험. 3.3% 아님" },
  { id: "dividend", label: "이익 분배", sole: "해당 없음", corp: "주주 배당은 배당소득 원천. 칸" },
] as const;

export type CitWorksheetInput = {
  taxableIncome: number;
  corporateTax: number;
  interimPaid: number;
};

export type CitWorksheet = {
  taxableIncome: number;
  corporateTax: number;
  localTax: number;
  total: number;
  interimPaid: number;
  remaining: number;
  note: string;
};

export function emptyCitInput(): CitWorksheetInput {
  return { taxableIncome: 0, corporateTax: 0, interimPaid: 0 };
}

/** 산출세액은 칸. 넣은 법인세에만 지방세 10%. 과세표준×세율은 하지 않음. */
export function citWorksheet(input: CitWorksheetInput): CitWorksheet {
  const taxableIncome = Math.max(0, Math.floor(Number(input.taxableIncome) || 0));
  const corporateTax = Math.max(0, Math.floor(Number(input.corporateTax) || 0));
  const interimPaid = Math.max(0, Math.floor(Number(input.interimPaid) || 0));
  const localTax = truncWon(corporateTax / 10);
  const total = corporateTax + localTax;
  return {
    taxableIncome,
    corporateTax,
    localTax,
    total,
    interimPaid,
    remaining: total - interimPaid,
    note: "법인세 세율은 과세표준 구간 고시라 곱하지 않음. 법인지방소득세는 넣은 산출세액의 10%(지방세법 제103조의20).",
  };
}
