// 면세·확인서·수출입. 조문 칸과 직역. 홈택스 발급·관세 10% 곱셈이 아님.

import { formCsv, slotCsvCell, type SlotWon } from "./form-csv";

/** 소득세법 제78조. 개인 면세사업자. 법인은 이 조문 대상이 아님. */
export const EXEMPT_STATUS_FILING = {
  id: "workplace_status",
  form: "사업장현황신고서",
  basis: "소득세법 제78조",
  plain: "부가세가 안 붙는 개인 사업자가 작년 매출을 다음해 2월 10일까지 알리는 신고",
  due: "다음 연도 2월 10일",
  period: "해당 과세기간(1.1~12.31)",
  who: "개인 면세사업자. 부가가치세 과세사업자가 부가세 신고를 하면 한 것으로 봄(제78조 제1항 제2호)",
  not: "법인은 소득세법 제78조 대상이 아님. 부가세 면세 공급과 법인세는 따로",
} as const;

/** 흔히 면세사업자 확인서. 이 화면에서 발급하지 않음. */
export const EXEMPT_INCOME_CERT = {
  form: "부가가치세면세사업자수입금액증명",
  basis: "국세청민원사무처리규정 별지서식 11호. 소득세법 제78조",
  plain: "흔히 면세사업자 확인서라고 부르는 종이. 2월 현황신고에 적은 수입금액을 찍어 줌. 이 화면에서 발급하지 않음",
} as const;

export const EXEMPT_KINDS = [
  {
    id: "association",
    label: "사단법인",
    basis: "부가가치세법 제26조 제1항 제18호, 시행령 제45조",
    plain: "공익 목적 단체가 고유 일을 위해 잠깐·실비·공짜로 줄 때만 면세",
    not: "이름만 사단법인이면 안 됨. 계속 파는 수익사업은 과세. 세무사·국세청이 먼저",
  },
  {
    id: "farm",
    label: "농업법인",
    basis: "부가가치세법 제26조 제1항 제1호",
    plain: "가공하지 않은 농산물·축산물·수산물·임산물은 면세",
    not: "가공·계속 판매·조특법 감면율은 만들지 않음. 세무사·국세청이 먼저",
  },
  {
    id: "personal_exempt",
    label: "개인 면세사업자",
    basis: "부가가치세법 제26조. 소득세법 제78조",
    plain: "조문에 적힌 면세 공급만. 2월 10일 사업장현황신고",
    not: "조문 밖 면세 목록을 만들지 않음",
  },
] as const;

/** 부가가치세법 제21조. 0%이지 면세가 아님. */
export const ZERO_RATE_EXPORT = {
  form: "수출실적명세서·영세율 매출명세서",
  basis: "부가가치세법 제21조",
  plain: "외국으로 물건을 내면 부가세 0%. 0%이지 면세가 아님. 환율을 곱하지 않음",
} as const;

/** 부가가치세법 제50조. 세관에서 냄. 여기서 세율을 곱하지 않음. */
export const IMPORT_VAT = {
  form: "재화의 수입에 대한 신고·납부",
  basis: "부가가치세법 제50조. 과세표준은 제29조 제2항",
  plain: "외국에서 물건을 들여오면 세관에서 부가세를 냄. 관세·내국세를 더해 10%를 곱하지 않음",
  deferral: "부가가치세법 제50조의2 납부유예. 자동 적용하지 않음. 칸만",
} as const;

export const EXEMPT_TRADE_CALENDAR = [
  {
    id: "workplace_status",
    period: "사업장현황신고",
    target: "1.1~12.31 면세 수입",
    due: "다음해 1.1~2.10",
    who: "개인 면세",
    article: "소득세법 제78조",
    roles: ["business"] as const,
  },
  {
    id: "cert",
    period: "부가가치세면세사업자수입금액증명",
    target: "현황신고 수입금액",
    due: "신고 후 민원",
    who: "개인 면세",
    article: "국세청민원사무처리규정 별지서식 11호",
    roles: ["business"] as const,
  },
  {
    id: "export_h1",
    period: "영세율 매출 (제1기)",
    target: "1.1~6.30 수출",
    due: "7.1~7.25",
    who: "수출 사업자",
    article: "부가가치세법 제21조·제49조",
    roles: ["business", "corporation"] as const,
  },
  {
    id: "export_h2",
    period: "영세율 매출 (제2기)",
    target: "7.1~12.31 수출",
    due: "다음해 1.1~1.25",
    who: "수출 사업자",
    article: "부가가치세법 제21조·제49조",
    roles: ["business", "corporation"] as const,
  },
  {
    id: "import",
    period: "수입 부가세",
    target: "재화의 수입",
    due: "세관 수입신고 때",
    who: "수입자",
    article: "부가가치세법 제50조",
    roles: ["business", "corporation"] as const,
  },
] as const;

export type WorkplaceStatusLine = {
  id: string;
  identity: string;
  industry: string;
  receipts: SlotWon;
};

export type ExportZeroRateLine = {
  id: string;
  declarationNo: string;
  foreignAmount: string;
  krw: SlotWon;
};

export type ImportVatLine = {
  id: string;
  declarationNo: string;
  customsValue: SlotWon;
  customsDuty: SlotWon;
  otherInternal: SlotWon;
  importVat: SlotWon;
  deferral: string;
};

export function emptyWorkplaceStatusLines(n: number): WorkplaceStatusLine[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `ws${i + 1}`,
    identity: "",
    industry: "",
    receipts: null,
  }));
}

export function emptyExportZeroRateLines(n: number): ExportZeroRateLine[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `ex${i + 1}`,
    declarationNo: "",
    foreignAmount: "",
    krw: null,
  }));
}

export function emptyImportVatLines(n: number): ImportVatLine[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `im${i + 1}`,
    declarationNo: "",
    customsValue: null,
    customsDuty: null,
    otherInternal: null,
    importVat: null,
    deferral: "",
  }));
}

function filledWorkplace(l: WorkplaceStatusLine) {
  return Boolean(l.identity || l.industry || l.receipts != null);
}

function filledExport(l: ExportZeroRateLine) {
  return Boolean(l.declarationNo || l.foreignAmount || l.krw != null);
}

function filledImport(l: ImportVatLine) {
  return Boolean(
    l.declarationNo
    || l.customsValue != null
    || l.customsDuty != null
    || l.otherInternal != null
    || l.importVat != null
    || l.deferral,
  );
}

export function workplaceStatusCsv(lines: WorkplaceStatusLine[]): string {
  return formCsv(
    {
      form: EXEMPT_STATUS_FILING.form,
      basis: EXEMPT_STATUS_FILING.basis,
      plain: EXEMPT_STATUS_FILING.plain,
    },
    ["인적사항", "업종", "수입금액"],
    lines.filter(filledWorkplace).map((l) => [l.identity, l.industry, slotCsvCell(l.receipts)]),
  );
}

export function exportZeroRateCsv(lines: ExportZeroRateLine[]): string {
  return formCsv(
    {
      form: ZERO_RATE_EXPORT.form,
      basis: ZERO_RATE_EXPORT.basis,
      plain: ZERO_RATE_EXPORT.plain,
    },
    ["수출신고번호", "외화금액", "원화공급가액"],
    lines.filter(filledExport).map((l) => [l.declarationNo, l.foreignAmount, slotCsvCell(l.krw)]),
  );
}

export function importVatCsv(lines: ImportVatLine[]): string {
  return formCsv(
    {
      form: IMPORT_VAT.form,
      basis: IMPORT_VAT.basis,
      plain: IMPORT_VAT.plain,
    },
    ["수입신고번호", "관세의 과세가격", "관세", "그 밖 내국세", "수입부가세", "납부유예"],
    lines.filter(filledImport).map((l) => [
      l.declarationNo,
      slotCsvCell(l.customsValue),
      slotCsvCell(l.customsDuty),
      slotCsvCell(l.otherInternal),
      slotCsvCell(l.importVat),
      l.deferral,
    ]),
  );
}

export function exemptTradeCalendarFor(role: "business" | "corporation") {
  return EXEMPT_TRADE_CALENDAR.filter((r) => (r.roles as readonly string[]).includes(role));
}
