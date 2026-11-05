// 부가가치세법 골격 양식. 원장 금액이 없으면 칸. 홈택스 신고서 XML이 아님.

function truncWon(n: number) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

/** 부가가치세법 제30조. */
export const VAT_RATE = 0.1;

export const VAT_ENTITIES = [
  { id: "individual", label: "개인사업자" },
  { id: "corporation", label: "법인사업자" },
] as const;

export type VatEntity = (typeof VAT_ENTITIES)[number]["id"];

export const VAT_TAXPAYER_TYPES = [
  { id: "general", label: "일반과세자", note: "매출세액 − 매입세액. 세금계산서" },
  { id: "simplified", label: "간이과세자", note: "개인만. 업종별 부가가치율은 고시. 여기 숫자를 만들지 않음" },
  { id: "exempt", label: "면세사업자", note: "부가세 납부의무 없음. 계산서·영수증" },
] as const;

/** 부가가치세법 제48조·제49조·제63조 골격. 홈택스 마감일 연장은 칸. */
export const VAT_FILING_CALENDAR = [
  { id: "h1_preview", period: "제1기 예정", target: "1.1~3.31", due: "4.1~4.25", who: "법인" },
  { id: "h1_final", period: "제1기 확정", target: "1.1~6.30", due: "7.1~7.25", who: "법인·개인 일반" },
  { id: "h2_preview", period: "제2기 예정", target: "7.1~9.30", due: "10.1~10.25", who: "법인" },
  { id: "h2_final", period: "제2기 확정", target: "7.1~12.31", due: "다음해 1.1~1.25", who: "법인·개인 일반" },
  { id: "simplified_h1", period: "간이 상반기", target: "1.1~6.30", due: "7.1~7.25", who: "간이과세자" },
  { id: "simplified_h2", period: "간이 하반기", target: "7.1~12.31", due: "다음해 1.1~1.25", who: "간이과세자" },
  { id: "exempt_status", period: "사업장현황신고", target: "1.1~12.31 면세 수입", due: "다음해 1.1~2.10", who: "개인 면세(소득세법 제78조)" },
] as const;

/** 법인은 간이·제78조 현황신고가 없다. */
export function vatFilingRows(entity: VatEntity) {
  return VAT_FILING_CALENDAR.filter((r) => {
    if (entity === "corporation" && (r.id.startsWith("simplified") || r.id === "exempt_status")) return false;
    return true;
  });
}

export type VatTaxpayer = (typeof VAT_TAXPAYER_TYPES)[number]["id"];

export type VatWorksheetInput = {
  entity: VatEntity;
  taxpayer: VatTaxpayer;
  taxableSupply: number;
  zeroRateSupply: number;
  exemptSupply: number;
  inputVat: number;
  prepaid: number;
};

export type VatWorksheet = {
  entity: VatEntity;
  taxpayer: VatTaxpayer;
  taxableSupply: number;
  zeroRateSupply: number;
  exemptSupply: number;
  outputVat: number;
  inputVat: number;
  payable: number;
  prepaid: number;
  remaining: number;
  note: string;
};

export function emptyVatInput(): VatWorksheetInput {
  return { entity: "individual", taxpayer: "general", taxableSupply: 0, zeroRateSupply: 0, exemptSupply: 0, inputVat: 0, prepaid: 0 };
}

/** 법인은 간이과세 적용 대상이 아님. 부가가치세법 제61조. */
export function vatTaxpayerOptions(entity: VatEntity) {
  if (entity === "corporation") return VAT_TAXPAYER_TYPES.filter((t) => t.id !== "simplified");
  return VAT_TAXPAYER_TYPES;
}

function asTaxpayer(v: string | undefined): VatTaxpayer {
  return VAT_TAXPAYER_TYPES.some((t) => t.id === v) ? (v as VatTaxpayer) : "general";
}

function asEntity(v: string | undefined): VatEntity {
  return VAT_ENTITIES.some((t) => t.id === v) ? (v as VatEntity) : "individual";
}

/** 일반과세만 매출세액 = 과세 공급가액 × 10%. 영세율·면세 공급은 0. 간이 부가가치율은 칸. 법인은 간이 없음. */
export function vatWorksheet(input: VatWorksheetInput): VatWorksheet {
  const entity = asEntity(input.entity);
  let taxpayer = asTaxpayer(input.taxpayer);
  if (entity === "corporation" && taxpayer === "simplified") taxpayer = "general";
  const taxableSupply = Math.max(0, Math.floor(Number(input.taxableSupply) || 0));
  const zeroRateSupply = Math.max(0, Math.floor(Number(input.zeroRateSupply) || 0));
  const exemptSupply = Math.max(0, Math.floor(Number(input.exemptSupply) || 0));
  const inputVat = Math.max(0, Math.floor(Number(input.inputVat) || 0));
  const prepaid = Math.max(0, Math.floor(Number(input.prepaid) || 0));
  let outputVat = 0;
  let payable = 0;
  let remaining = 0;
  let note = "";
  if (taxpayer === "general") {
    outputVat = truncWon(taxableSupply * 10 / 100);
    payable = outputVat - inputVat;
    remaining = payable - prepaid;
    note = entity === "corporation"
      ? "법인. 간이과세 없음(부가가치세법 제61조). 제30조 세율 10%."
      : "부가가치세법 제30조 세율 10%. 영세율·면세 공급은 매출세액 0. 원장이 없으면 0.";
  } else if (taxpayer === "simplified") {
    note = "간이과세는 공급대가 × 업종 부가가치율 × 10%. 부가가치율 고시를 넣지 않아 매출·납부세액을 만들지 않음.";
  } else {
    note = "면세사업자는 부가세 납부의무 없음. 매출·납부세액을 만들지 않음.";
  }
  return {
    entity,
    taxpayer,
    taxableSupply,
    zeroRateSupply,
    exemptSupply,
    outputVat,
    inputVat,
    payable,
    prepaid,
    remaining,
    note,
  };
}
