// 종합소득세. 연말정산·법인세와 구분. 세율 구간을 곱하지 않는다.

function truncWon(n: number) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

/** 소득세법 제70조. 거주자 확정신고. */
export const GIT_FILING_CALENDAR = [
  {
    id: "final",
    period: "종합소득세 확정신고",
    target: "해당 과세기간 1.1~12.31",
    due: "다음해 5.1~5.31",
    who: "거주자(근로만 있고 연말정산으로 납세완료면 생략 가능)",
    article: "소득세법 제70조",
  },
] as const;

export const GIT_INCOME_KINDS = [
  { id: "earned", label: "근로소득", note: "연말정산 후 합산. 다른 소득 없으면 확정신고를 생략할 수 있음" },
  { id: "business", label: "사업소득", note: "개인사업·프리랜서. 3.3% 원천은 기납부 칸" },
  { id: "interest", label: "이자소득", note: "원장 합. 세율 추정 없음" },
  { id: "dividend", label: "배당소득", note: "원장 합. 세율 추정 없음" },
  { id: "pension", label: "연금소득", note: "칸" },
  { id: "other", label: "기타소득", note: "단발. 인적용역 3.3%와 다름" },
] as const;

export type GitWorksheetInput = {
  taxableIncome: number;
  incomeTax: number;
  prepaid: number;
};

export type GitWorksheet = {
  taxableIncome: number;
  incomeTax: number;
  localTax: number;
  total: number;
  prepaid: number;
  remaining: number;
  note: string;
};

export function emptyGitInput(): GitWorksheetInput {
  return { taxableIncome: 0, incomeTax: 0, prepaid: 0 };
}

/** 산출세액은 칸. 넣은 소득세의 10%만 지방세. 제55조 표는 tax-brackets·세율표 화면. */
export function gitWorksheet(input: GitWorksheetInput): GitWorksheet {
  const taxableIncome = Math.max(0, Math.floor(Number(input.taxableIncome) || 0));
  const incomeTax = Math.max(0, Math.floor(Number(input.incomeTax) || 0));
  const prepaid = Math.max(0, Math.floor(Number(input.prepaid) || 0));
  const localTax = truncWon(incomeTax / 10);
  const total = incomeTax + localTax;
  return {
    taxableIncome,
    incomeTax,
    localTax,
    total,
    prepaid,
    remaining: total - prepaid,
    note: "종소세 세율 구간을 곱하지 않음. 지방소득세는 넣은 산출세액의 10%. 연말정산·법인세가 아님.",
  };
}
