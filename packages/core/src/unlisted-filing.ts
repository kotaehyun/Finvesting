// 비상장주식 신고 달력. 평가액·세율을 만들지 않는다.

import { formCsv } from "./form-csv";

/** 소득세법 제105조 예정신고. 하반기 양도는 다음해 2월 말일. */
export const UNLISTED_FILING_CALENDAR = [
  {
    id: "cgt_h2",
    period: "양도소득세 예정신고(하반기)",
    target: "7.1~12.31 양도",
    due: "다음해 2월 말일",
    who: "개인 주주(비상장주식 등)",
    article: "소득세법 제105조",
  },
  {
    id: "cgt_h1",
    period: "양도소득세 예정신고(상반기)",
    target: "1.1~6.30 양도",
    due: "8.31",
    who: "개인 주주(비상장주식 등)",
    article: "소득세법 제105조",
  },
  {
    id: "cgt_final",
    period: "양도소득세 확정신고",
    target: "해당 연 양도",
    due: "다음해 5.1~5.31",
    who: "예정신고 대상도 확정",
    article: "소득세법 제110조",
  },
  {
    id: "cit_final",
    period: "법인세 확정",
    target: "사업연도",
    due: "종료일부터 3개월 (12월 결산 → 3.31). 2월이 아님",
    who: "비상장 법인",
    article: "법인세법 제60조",
  },
] as const;

export type UnlistedCgtInput = {
  proceeds: number;
  acquisition: number;
  expenses: number;
};

export type UnlistedCgtSheet = {
  proceeds: number;
  acquisition: number;
  expenses: number;
  gain: number;
  note: string;
};

export function emptyUnlistedCgt(): UnlistedCgtInput {
  return { proceeds: 0, acquisition: 0, expenses: 0 };
}

/** 양도차익만. 대주주 세율·기본공제를 곱하지 않음. */
export function unlistedCgtSheet(input: UnlistedCgtInput): UnlistedCgtSheet {
  const proceeds = Math.max(0, Math.floor(Number(input.proceeds) || 0));
  const acquisition = Math.max(0, Math.floor(Number(input.acquisition) || 0));
  const expenses = Math.max(0, Math.floor(Number(input.expenses) || 0));
  const gain = proceeds - acquisition - expenses;
  return {
    proceeds,
    acquisition,
    expenses,
    gain,
    note: "비상장주식 양도차익 시산. 세율·대주주·보충적 평가를 만들지 않음. 하반기 양도 예정신고는 다음해 2월 말일.",
  };
}

export const UNLISTED_CGT_FIELDS = [
  { id: "proceeds", label: "양도가액", plain: "판 값" },
  { id: "acquisition", label: "취득가액", plain: "산 값" },
  { id: "expenses", label: "필요경비", plain: "팔 때 든 비용" },
] as const;

export function unlistedCgtCsv(sheet: UnlistedCgtSheet, input: UnlistedCgtInput): string {
  const filled = input.proceeds > 0 || input.acquisition > 0 || input.expenses > 0;
  return formCsv(
    {
      form: "양도소득세 예정신고 시산",
      basis: "소득세법 제105조. 홈택스 제출 서식이 아님",
      plain: "비상장 주식을 팔았을 때 얼마에 사고 얼마에 팔았는지 적는 칸",
    },
    ["항목", "직역", "금액"],
    [
      ["양도가액", "판 값", input.proceeds > 0 ? String(input.proceeds) : ""],
      ["취득가액", "산 값", input.acquisition > 0 ? String(input.acquisition) : ""],
      ["필요경비", "팔 때 든 비용", input.expenses > 0 ? String(input.expenses) : ""],
      ["양도차익", "판 값 − 산 값 − 비용. 세율 없음", filled ? String(sheet.gain) : ""],
    ],
  );
}
