// 법인세 신고 첨부 서식. 문언 칸만. 세율·유보 과목을 만들지 않음. ADR 0044

import {
  closingBalance,
  formCsv,
  slotCsvCell,
  type FormCsvMeta,
  type SlotWon,
} from "./form-csv";

export type CitFormField = {
  id: string;
  label: string;
  plain: string;
};

export type CitGapRowDef = {
  id: string;
  title: string;
  code: string;
  plain: string;
};

/** 법인세법 시행규칙 별지 제50호서식(갑). 과목·코드는 서식 문언. */
export const CIT_FORM_50_GAP: FormCsvMeta & {
  columns: readonly CitFormField[];
  rows: readonly CitGapRowDef[];
} = {
  form: "자본금과 적립금 조정명세서(갑)",
  basis: "법인세법 시행규칙 별지 제50호서식(갑)",
  plain: "회사 밑천(자본금)과 모아 둔 이익(적립금)이 올해 어떻게 바뀌었는지 적는 표",
  columns: [
    { id: "title", label: "①과목 또는 사항", plain: "무슨 칸인지" },
    { id: "code", label: "코드", plain: "서식 번호. 바꾸지 않음" },
    { id: "opening", label: "②기초잔액", plain: "사업연도 첫날 남은 금액" },
    { id: "decrease", label: "③당기 중 감소", plain: "올해 줄어든 금액" },
    { id: "increase", label: "④당기 중 증가", plain: "올해 늘어난 금액" },
    { id: "closing", label: "⑤기말잔액", plain: "마지막 날 남은 금액. 기초−감소+증가" },
    { id: "note", label: "비고", plain: "짧은 설명" },
  ],
  rows: [
    { id: "capital", title: "자본금", code: "01", plain: "처음에 넣은 회사 밑천" },
    { id: "surplus", title: "자본잉여금", code: "02", plain: "주식을 액면보다 비싸게 팔아 남은 돈 등" },
    { id: "adjust", title: "자본조정", code: "15", plain: "자기주식처럼 자본에서 빼 보는 칸. 화면 이름이 아님" },
    { id: "oci", title: "기타포괄손익누계액", code: "18", plain: "아직 당기순이익에 안 넣은 평가 차이" },
    { id: "retained", title: "이익잉여금", code: "14", plain: "벌어 모아 둔 이익" },
  ],
};

/** 별지 제50호서식(을). 유보 과목 이름을 만들지 않음. */
export const CIT_FORM_50_EUL: FormCsvMeta & { columns: readonly CitFormField[] } = {
  form: "자본금과 적립금 조정명세서(을)",
  basis: "법인세법 시행규칙 별지 제50호서식(을)",
  plain: "세무조정으로 미뤄 둔 금액(유보)이 올해 어떻게 바뀌었는지 적는 표. 과목 이름은 서식·세무사가 정함",
  columns: [
    { id: "title", label: "과목 또는 사항", plain: "무슨 유보인지. 이름을 만들지 않음" },
    { id: "opening", label: "②기초잔액", plain: "사업연도 첫날" },
    { id: "decrease", label: "③당기 중 감소", plain: "올해 줄어든 금액" },
    { id: "increase", label: "④당기 중 증가", plain: "올해 늘어난 금액" },
    { id: "closing", label: "⑤기말잔액", plain: "기초−감소+증가" },
    { id: "note", label: "비고", plain: "짧은 설명" },
  ],
};

export const CIT_FORM_50_BYEONG_NOTE =
  "별지 제50호서식(병) 해외현지기업 출자는 원문이 필요합니다. 칸을 만들지 않습니다.";

export type CitAmountLine = {
  opening: SlotWon;
  decrease: SlotWon;
  increase: SlotWon;
  note: string;
};

export type CitEulLine = CitAmountLine & { id: string; title: string };

export function emptyCitAmountLine(): CitAmountLine {
  return { opening: null, decrease: null, increase: null, note: "" };
}

export function emptyCitEulLines(n = 4): CitEulLine[] {
  const count = Math.min(20, Math.max(1, Math.floor(n)));
  return Array.from({ length: count }, (_, i) => ({
    id: `eul${i + 1}`,
    title: "",
    ...emptyCitAmountLine(),
  }));
}

export function emptyCitGapAmounts(): Record<(typeof CIT_FORM_50_GAP.rows)[number]["id"], CitAmountLine> {
  const out = {} as Record<(typeof CIT_FORM_50_GAP.rows)[number]["id"], CitAmountLine>;
  for (const r of CIT_FORM_50_GAP.rows) out[r.id] = emptyCitAmountLine();
  return out;
}

export function citGapClosing(line: CitAmountLine): SlotWon {
  return closingBalance(line.opening, line.decrease, line.increase);
}

function lineHasAmount(line: CitAmountLine): boolean {
  return line.opening != null || line.decrease != null || line.increase != null || line.note.trim() !== "";
}

export function citGapCsv(amounts: Record<string, CitAmountLine>): string {
  const headers = CIT_FORM_50_GAP.columns.map((c) => c.label);
  const rows = CIT_FORM_50_GAP.rows.map((r) => {
    const line = amounts[r.id] ?? emptyCitAmountLine();
    return [
      r.title,
      r.code,
      slotCsvCell(line.opening),
      slotCsvCell(line.decrease),
      slotCsvCell(line.increase),
      slotCsvCell(citGapClosing(line)),
      line.note,
    ];
  });
  return formCsv(CIT_FORM_50_GAP, headers, rows);
}

export function citEulCsv(lines: CitEulLine[]): string {
  const headers = CIT_FORM_50_EUL.columns.map((c) => c.label);
  const rows = lines
    .filter((l) => l.title.trim() !== "" || lineHasAmount(l))
    .map((l) => [
      l.title,
      slotCsvCell(l.opening),
      slotCsvCell(l.decrease),
      slotCsvCell(l.increase),
      slotCsvCell(citGapClosing(l)),
      l.note,
    ]);
  return formCsv(CIT_FORM_50_EUL, headers, rows);
}

/** 법인세법 시행규칙 별지 제54호서식. 필요적 기재사항만. 원인코드표를 만들지 않음. */
export const CIT_FORM_54: FormCsvMeta & { columns: readonly CitFormField[] } = {
  form: "주식등변동상황명세서",
  basis: "법인세법 시행규칙 별지 제54호서식. 법인세법 제60조·제119조",
  plain: "올해 회사 주식이 누구 것인지, 얼마나 바뀌었는지 적는 표. 비상장 법인이 많이 씁니다",
  columns: [
    { id: "name", label: "주주 성명 또는 법인명", plain: "누구 주식인지" },
    { id: "idNo", label: "주민등록번호·사업자등록번호", plain: "식별번호. 비워도 됨. 서버에 안 보냄" },
    { id: "opening", label: "기초 주식수", plain: "사업연도 첫날 주식 수" },
    { id: "increase", label: "증가 주식수", plain: "올해 늘어난 주식 수" },
    { id: "decrease", label: "감소 주식수", plain: "올해 줄어든 주식 수" },
    { id: "closing", label: "기말 주식수", plain: "기초+증가−감소. 다 넣은 뒤에만" },
    { id: "openingPct", label: "기초 지분율", plain: "첫날 비율. 계산하지 않음" },
    { id: "closingPct", label: "기말 지분율", plain: "마지막 날 비율. 계산하지 않음" },
    { id: "reason", label: "변동 사유", plain: "매매·증자 등. 원인코드표를 만들지 않음" },
  ],
};

export type ShareChangeLine = {
  id: string;
  name: string;
  idNo: string;
  opening: SlotWon;
  increase: SlotWon;
  decrease: SlotWon;
  openingPct: string;
  closingPct: string;
  reason: string;
};

export function emptyShareChangeLines(n = 4): ShareChangeLine[] {
  const count = Math.min(20, Math.max(1, Math.floor(n)));
  return Array.from({ length: count }, (_, i) => ({
    id: `sh${i + 1}`,
    name: "",
    idNo: "",
    opening: null,
    increase: null,
    decrease: null,
    openingPct: "",
    closingPct: "",
    reason: "",
  }));
}

export function shareClosing(line: ShareChangeLine): SlotWon {
  return closingBalance(line.opening, line.decrease, line.increase);
}

export function shareChangeCsv(lines: ShareChangeLine[]): string {
  const headers = CIT_FORM_54.columns.map((c) => c.label);
  const rows = lines
    .filter(
      (l) =>
        l.name.trim() !== "" ||
        l.idNo.trim() !== "" ||
        l.opening != null ||
        l.increase != null ||
        l.decrease != null ||
        l.openingPct.trim() !== "" ||
        l.closingPct.trim() !== "" ||
        l.reason.trim() !== "",
    )
    .map((l) => [
      l.name,
      l.idNo,
      slotCsvCell(l.opening),
      slotCsvCell(l.increase),
      slotCsvCell(l.decrease),
      slotCsvCell(shareClosing(l)),
      l.openingPct,
      l.closingPct,
      l.reason,
    ]);
  return formCsv(CIT_FORM_54, headers, rows);
}
