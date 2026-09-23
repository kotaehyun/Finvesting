// 양도·증여·보유 세율표. 조문 문언만. 특례·중과·비과세는 곱하지 않음. ADR 0041
import dataFile from "../data/tax/brackets.json";
import { assertDataFile } from "./load-data";

assertDataFile(dataFile as any, "tax/brackets.json");


export type TaxBracket = {
  id: string;
  /** 이 칸의 과세표준 하한(이 값을 초과). 첫 칸은 0 */
  floor: number;
  /** 상한. null이면 그 이상 */
  cap: number | null;
  /** 세율. 600 = 6% */
  rateBp: number;
  /** 조문 가산액(하한까지 세액) */
  addWon: number;
  /** 국세청 표의 누진공제. 과세표준×세율 − 이 값 = 산출세액 */
  quickDeductionWon: number;
  rateLabel: string;
};

export type TaxTable = {
  id: string;
  title: string;
  article: string;
  kind: "cgt" | "gift" | "holding";
  localOnTax: boolean;
  note: string;
  brackets: readonly TaxBracket[];
};

function truncWon(n: number) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

/** 소득세법 제55조 제1항. 종소세·양도 기본세율(제104조 제1항 제1호가 이 표를 씀). */
export const ITA_ART55_BRACKETS: TaxBracket[] = (dataFile as any).itaArt55 as TaxBracket[];

/** 상속세 및 증여세법 제26조. 증여는 제56조가 이 세율을 씀. */
export const IHTA_ART26_BRACKETS: TaxBracket[] = (dataFile as any).ihtaArt26 as TaxBracket[];

/** 지방세법 제111조 제1항 제3호 나목. 주택 재산세 표준세율. */
export const LTA_ART111_HOUSE_BRACKETS: TaxBracket[] = (dataFile as any).ltaArt111House as TaxBracket[];

/** 종합부동산세법 제9조 제1항 제1호. 납세의무자가 2주택 이하. */
export const CRET_ART9_2HOUSE_BRACKETS: TaxBracket[] = (dataFile as any).cretArt9_2house as TaxBracket[];

/** 종합부동산세법 제9조 제1항 제2호. 납세의무자가 3주택 이상. */
export const CRET_ART9_3HOUSE_BRACKETS: TaxBracket[] = (dataFile as any).cretArt9_3house as TaxBracket[];

export const TAX_TABLES: TaxTable[] = [
  { id: "ita55", title: "종합소득·양도 기본세율", article: "소득세법 제55조 제1항. 양도는 제104조 제1항 제1호가 이 표를 씀(2년 이상 보유 부동산 등).", kind: "cgt", localOnTax: true, note: "단기 보유·주택 중과·1세대1주택 비과세는 이 표가 아닙니다. 지방소득세는 산출세액의 10%(지방세법 제103조의13).", brackets: ITA_ART55_BRACKETS },
  { id: "ihta26", title: "상속·증여 세율", article: "상속세 및 증여세법 제26조. 증여는 제56조가 제26조 세율을 적용.", kind: "gift", localOnTax: false, note: "과세표준은 제55조. 공제(제53조)를 이 시산에서 빼 주지 않습니다. 세대생략 할증(제57조) 없음.", brackets: IHTA_ART26_BRACKETS },
  { id: "lta111house", title: "주택 재산세 표준세율", article: "지방세법 제111조 제1항 제3호 나목. 과세표준은 제110조(시가표준액×공정시장가액비율).", kind: "holding", localOnTax: false, note: "1세대 1주택 특례(제111조의2)·조례 가감·도시지역분·지방교육세는 넣지 않습니다. 지자체·세무 상담.", brackets: LTA_ART111_HOUSE_BRACKETS },
  { id: "cret9-2", title: "주택분 종부세 (2주택 이하)", article: "종합부동산세법 제9조 제1항 제1호. 과세표준은 제8조.", kind: "holding", localOnTax: false, note: "주택 수·1세대1주택 공제·재산세 기납 공제는 자동으로 빼지 않습니다. 2027년 이후 개정안은 아직 법률이 아닙니다.", brackets: CRET_ART9_2HOUSE_BRACKETS },
  { id: "cret9-3", title: "주택분 종부세 (3주택 이상)", article: "종합부동산세법 제9조 제1항 제2호.", kind: "holding", localOnTax: false, note: "법인은 제9조 제2항(2주택 이하 1천분의 27, 3주택 이상 1천분의 50). 이 표가 아닙니다.", brackets: CRET_ART9_3HOUSE_BRACKETS },
];

export const CGT_FLAT_RATES = (dataFile as any).cgtFlatRates as any;

export const GIFT_DEDUCTIONS = (dataFile as any).giftDeductions as any;

export const TAX_TERMS = (dataFile as any).taxTerms as any;

export const PROGRESSIVE_PLAIN = (dataFile as any).progressivePlain as readonly string[];

export const TAX_HELP_LINKS = (dataFile as any).taxHelpLinks as any;

export function findTaxTable(id: string): TaxTable | undefined {
  return TAX_TABLES.find((t) => t.id === id);
}

export function pickBracket(base: number, brackets: readonly TaxBracket[]): TaxBracket | undefined {
  const n = Math.max(0, Math.floor(Number(base) || 0));
  return brackets.find((b) => {
    const overFloor = b.floor === 0 ? n >= 0 : n > b.floor;
    const underCap = b.cap == null ? true : n <= b.cap;
    return overFloor && underCap;
  });
}

export type BracketAssessment = {
  base: number;
  tableId: string;
  bracket: TaxBracket | undefined;
  assessed: number;
  localTax: number;
  total: number;
  formula: string;
  note: string;
};

/** 조문 가산식. 원 미만 절사. 특례를 넣지 않음. */
export function assessBracketTax(base: number, table: TaxTable): BracketAssessment {
  const n = Math.max(0, Math.floor(Number(base) || 0));
  const bracket = pickBracket(n, table.brackets);
  if (!bracket || n <= 0) {
    return {
      base: n,
      tableId: table.id,
      bracket,
      assessed: 0,
      localTax: 0,
      total: 0,
      formula: "과세표준이 0이면 산출세액 0",
      note: table.note,
    };
  }
  const excess = Math.max(0, n - bracket.floor);
  const assessed = truncWon(bracket.addWon + excess * bracket.rateBp / 10_000);
  const localTax = table.localOnTax ? truncWon(assessed / 10) : 0;
  const ratePct = (bracket.rateBp / 100).toFixed(bracket.rateBp % 100 === 0 ? 0 : 2);
  return {
    base: n,
    tableId: table.id,
    bracket,
    assessed,
    localTax,
    total: assessed + localTax,
    formula: `${n.toLocaleString("ko-KR")}원 × ${ratePct}% − 누진공제 ${bracket.quickDeductionWon.toLocaleString("ko-KR")}원`,
    note: table.note,
  };
}
