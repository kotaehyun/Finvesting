// 양도·증여·보유 세율표. 조문 문언만. 특례·중과·비과세는 곱하지 않음. ADR 0041

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
export const ITA_ART55_BRACKETS: TaxBracket[] = [
  { id: "ita55-6", floor: 0, cap: 14_000_000, rateBp: 600, addWon: 0, quickDeductionWon: 0, rateLabel: "과세표준의 6퍼센트" },
  { id: "ita55-15", floor: 14_000_000, cap: 50_000_000, rateBp: 1500, addWon: 840_000, quickDeductionWon: 1_260_000, rateLabel: "84만원 + (1,400만원을 초과하는 금액의 15퍼센트)" },
  { id: "ita55-24", floor: 50_000_000, cap: 88_000_000, rateBp: 2400, addWon: 6_240_000, quickDeductionWon: 5_760_000, rateLabel: "624만원 + (5,000만원을 초과하는 금액의 24퍼센트)" },
  { id: "ita55-35", floor: 88_000_000, cap: 150_000_000, rateBp: 3500, addWon: 15_360_000, quickDeductionWon: 15_440_000, rateLabel: "1,536만원 + (8,800만원을 초과하는 금액의 35퍼센트)" },
  { id: "ita55-38", floor: 150_000_000, cap: 300_000_000, rateBp: 3800, addWon: 37_060_000, quickDeductionWon: 19_940_000, rateLabel: "3,706만원 + (1억5천만원을 초과하는 금액의 38퍼센트)" },
  { id: "ita55-40", floor: 300_000_000, cap: 500_000_000, rateBp: 4000, addWon: 94_060_000, quickDeductionWon: 25_940_000, rateLabel: "9,406만원 + (3억원을 초과하는 금액의 40퍼센트)" },
  { id: "ita55-42", floor: 500_000_000, cap: 1_000_000_000, rateBp: 4200, addWon: 174_060_000, quickDeductionWon: 35_940_000, rateLabel: "1억7,406만원 + (5억원을 초과하는 금액의 42퍼센트)" },
  { id: "ita55-45", floor: 1_000_000_000, cap: null, rateBp: 4500, addWon: 384_060_000, quickDeductionWon: 65_940_000, rateLabel: "3억8,406만원 + (10억원을 초과하는 금액의 45퍼센트)" },
];

/** 상속세 및 증여세법 제26조. 증여는 제56조가 이 세율을 씀. */
export const IHTA_ART26_BRACKETS: TaxBracket[] = [
  { id: "ihta26-10", floor: 0, cap: 100_000_000, rateBp: 1000, addWon: 0, quickDeductionWon: 0, rateLabel: "과세표준의 100분의 10" },
  { id: "ihta26-20", floor: 100_000_000, cap: 500_000_000, rateBp: 2000, addWon: 10_000_000, quickDeductionWon: 10_000_000, rateLabel: "1천만원 + (1억원을 초과하는 금액의 100분의 20)" },
  { id: "ihta26-30", floor: 500_000_000, cap: 1_000_000_000, rateBp: 3000, addWon: 90_000_000, quickDeductionWon: 60_000_000, rateLabel: "9천만원 + (5억원을 초과하는 금액의 100분의 30)" },
  { id: "ihta26-40", floor: 1_000_000_000, cap: 3_000_000_000, rateBp: 4000, addWon: 240_000_000, quickDeductionWon: 160_000_000, rateLabel: "2억4천만원 + (10억원을 초과하는 금액의 100분의 40)" },
  { id: "ihta26-50", floor: 3_000_000_000, cap: null, rateBp: 5000, addWon: 1_040_000_000, quickDeductionWon: 460_000_000, rateLabel: "10억4천만원 + (30억원을 초과하는 금액의 100분의 50)" },
];

/** 지방세법 제111조 제1항 제3호 나목. 주택 재산세 표준세율. */
export const LTA_ART111_HOUSE_BRACKETS: TaxBracket[] = [
  { id: "lta111-h1", floor: 0, cap: 60_000_000, rateBp: 10, addWon: 0, quickDeductionWon: 0, rateLabel: "1,000분의 1" },
  { id: "lta111-h2", floor: 60_000_000, cap: 150_000_000, rateBp: 15, addWon: 60_000, quickDeductionWon: 30_000, rateLabel: "60,000원 + 6천만원 초과금액의 1,000분의 1.5" },
  { id: "lta111-h3", floor: 150_000_000, cap: 300_000_000, rateBp: 25, addWon: 195_000, quickDeductionWon: 180_000, rateLabel: "195,000원 + 1억5천만원 초과금액의 1,000분의 2.5" },
  { id: "lta111-h4", floor: 300_000_000, cap: null, rateBp: 40, addWon: 570_000, quickDeductionWon: 630_000, rateLabel: "570,000원 + 3억원 초과금액의 1,000분의 4" },
];

/** 종합부동산세법 제9조 제1항 제1호. 납세의무자가 2주택 이하. */
export const CRET_ART9_2HOUSE_BRACKETS: TaxBracket[] = [
  { id: "cret9-2-1", floor: 0, cap: 300_000_000, rateBp: 50, addWon: 0, quickDeductionWon: 0, rateLabel: "1천분의 5" },
  { id: "cret9-2-2", floor: 300_000_000, cap: 600_000_000, rateBp: 70, addWon: 1_500_000, quickDeductionWon: 600_000, rateLabel: "150만원 + (3억원 초과분의 1천분의 7)" },
  { id: "cret9-2-3", floor: 600_000_000, cap: 1_200_000_000, rateBp: 100, addWon: 3_600_000, quickDeductionWon: 2_400_000, rateLabel: "360만원 + (6억원 초과분의 1천분의 10)" },
  { id: "cret9-2-4", floor: 1_200_000_000, cap: 2_500_000_000, rateBp: 130, addWon: 9_600_000, quickDeductionWon: 6_000_000, rateLabel: "960만원 + (12억원 초과분의 1천분의 13)" },
  { id: "cret9-2-5", floor: 2_500_000_000, cap: 5_000_000_000, rateBp: 150, addWon: 26_500_000, quickDeductionWon: 11_000_000, rateLabel: "2천650만원 + (25억원 초과분의 1천분의 15)" },
  { id: "cret9-2-6", floor: 5_000_000_000, cap: 9_400_000_000, rateBp: 200, addWon: 64_000_000, quickDeductionWon: 36_000_000, rateLabel: "6천400만원 + (50억원 초과분의 1천분의 20)" },
  { id: "cret9-2-7", floor: 9_400_000_000, cap: null, rateBp: 270, addWon: 152_000_000, quickDeductionWon: 101_800_000, rateLabel: "1억5천200만원 + (94억원 초과분의 1천분의 27)" },
];

/** 종합부동산세법 제9조 제1항 제2호. 납세의무자가 3주택 이상. */
export const CRET_ART9_3HOUSE_BRACKETS: TaxBracket[] = [
  { id: "cret9-3-1", floor: 0, cap: 300_000_000, rateBp: 50, addWon: 0, quickDeductionWon: 0, rateLabel: "1천분의 5" },
  { id: "cret9-3-2", floor: 300_000_000, cap: 600_000_000, rateBp: 70, addWon: 1_500_000, quickDeductionWon: 600_000, rateLabel: "150만원 + (3억원 초과분의 1천분의 7)" },
  { id: "cret9-3-3", floor: 600_000_000, cap: 1_200_000_000, rateBp: 100, addWon: 3_600_000, quickDeductionWon: 2_400_000, rateLabel: "360만원 + (6억원 초과분의 1천분의 10)" },
  { id: "cret9-3-4", floor: 1_200_000_000, cap: 2_500_000_000, rateBp: 200, addWon: 9_600_000, quickDeductionWon: 14_400_000, rateLabel: "960만원 + (12억원 초과분의 1천분의 20)" },
  { id: "cret9-3-5", floor: 2_500_000_000, cap: 5_000_000_000, rateBp: 300, addWon: 35_600_000, quickDeductionWon: 39_400_000, rateLabel: "3천560만원 + (25억원 초과분의 1천분의 30)" },
  { id: "cret9-3-6", floor: 5_000_000_000, cap: 9_400_000_000, rateBp: 400, addWon: 110_600_000, quickDeductionWon: 89_400_000, rateLabel: "1억1천60만원 + (50억원 초과분의 1천분의 40)" },
  { id: "cret9-3-7", floor: 9_400_000_000, cap: null, rateBp: 500, addWon: 286_600_000, quickDeductionWon: 183_400_000, rateLabel: "2억8천660만원 + (94억원 초과분의 1천분의 50)" },
];

export const TAX_TABLES: TaxTable[] = [
  {
    id: "ita55",
    title: "종합소득·양도 기본세율",
    article: "소득세법 제55조 제1항. 양도는 제104조 제1항 제1호가 이 표를 씀(2년 이상 보유 부동산 등).",
    kind: "cgt",
    localOnTax: true,
    note: "단기 보유·주택 중과·1세대1주택 비과세는 이 표가 아닙니다. 지방소득세는 산출세액의 10%(지방세법 제103조의13).",
    brackets: ITA_ART55_BRACKETS,
  },
  {
    id: "ihta26",
    title: "상속·증여 세율",
    article: "상속세 및 증여세법 제26조. 증여는 제56조가 제26조 세율을 적용.",
    kind: "gift",
    localOnTax: false,
    note: "과세표준은 제55조. 공제(제53조)를 이 시산에서 빼 주지 않습니다. 세대생략 할증(제57조) 없음.",
    brackets: IHTA_ART26_BRACKETS,
  },
  {
    id: "lta111house",
    title: "주택 재산세 표준세율",
    article: "지방세법 제111조 제1항 제3호 나목. 과세표준은 제110조(시가표준액×공정시장가액비율).",
    kind: "holding",
    localOnTax: false,
    note: "1세대 1주택 특례(제111조의2)·조례 가감·도시지역분·지방교육세는 넣지 않습니다. 지자체·세무 상담.",
    brackets: LTA_ART111_HOUSE_BRACKETS,
  },
  {
    id: "cret9-2",
    title: "주택분 종부세 (2주택 이하)",
    article: "종합부동산세법 제9조 제1항 제1호. 과세표준은 제8조.",
    kind: "holding",
    localOnTax: false,
    note: "주택 수·1세대1주택 공제·재산세 기납 공제는 자동으로 빼지 않습니다. 2027년 이후 개정안은 아직 법률이 아닙니다.",
    brackets: CRET_ART9_2HOUSE_BRACKETS,
  },
  {
    id: "cret9-3",
    title: "주택분 종부세 (3주택 이상)",
    article: "종합부동산세법 제9조 제1항 제2호.",
    kind: "holding",
    localOnTax: false,
    note: "법인은 제9조 제2항(2주택 이하 1천분의 27, 3주택 이상 1천분의 50). 이 표가 아닙니다.",
    brackets: CRET_ART9_3HOUSE_BRACKETS,
  },
];

export const CGT_FLAT_RATES = [
  { id: "hold_1_2", label: "부동산 등 보유 1년 이상 2년 미만", rate: "과세표준의 100분의 40(주택·입주권·분양권은 100분의 60)", article: "소득세법 제104조 제1항 제2호" },
  { id: "hold_lt1", label: "부동산 등 보유 1년 미만", rate: "과세표준의 100분의 50(주택·입주권·분양권은 100분의 70)", article: "소득세법 제104조 제1항 제3호" },
  { id: "presale", label: "분양권(제1호가 적용되는 때)", rate: "양도소득 과세표준의 100분의 60", article: "소득세법 제104조 제1항 제1호 괄호" },
  { id: "unregistered", label: "미등기양도자산", rate: "과세표준의 100분의 70", article: "소득세법 제104조 제1항 제10호" },
  { id: "kr_sme", label: "대주주가 아닌 자가 양도하는 중소기업 주식등", rate: "100분의 10", article: "소득세법 제104조 제1항 제11호 나목 1)" },
  { id: "kr_other", label: "대주주가 아닌 자가 양도하는 그 밖의 주식등(해외주식 포함)", rate: "100분의 20", article: "소득세법 제104조 제1항 제11호 나목 2)" },
] as const;

export const GIFT_DEDUCTIONS = [
  { id: "spouse", label: "배우자로부터", amount: "6억원", article: "상속세 및 증여세법 제53조 제1호", note: "10년 합산 한도. 이 화면에서 빼 주지 않음." },
  { id: "ascendant", label: "직계존속으로부터", amount: "5천만원(미성년 수증자 2천만원)", article: "같은 조 제2호", note: "사실혼 배우자의 존속은 조문 문언대로." },
  { id: "descendant", label: "직계비속으로부터", amount: "5천만원", article: "같은 조 제3호", note: "혼인 중인 배우자의 직계비속 포함." },
  { id: "other_kin", label: "그 밖 4촌 이내 혈족·3촌 이내 인척", amount: "1천만원", article: "같은 조 제4호", note: "친족이 아니면 이 공제가 아님." },
] as const;

export const TAX_TERMS = [
  { id: "tax_base", term: "과세표준", plain: "세율을 곱하기 직전 금액입니다. 받은 돈·집값 전부가 아닙니다. 공제를 뺀 뒤의 숫자입니다." },
  { id: "progressive", term: "누진세율(초과누진)", plain: "금액이 커질수록 더 높은 칸의 세율을 씁니다. 전액에 높은 세율을 곱하지 않습니다. 아래 칸은 낮은 세율, 칸을 넘긴 몫만 높은 세율입니다." },
  { id: "quick", term: "누진공제", plain: "칸마다 쪼개 더하지 않고 「과세표준 × 그 칸 세율 − 누진공제」로 같은 값을 내는 숫자입니다. 국세청 세율표의 누진공제입니다." },
  { id: "assessed", term: "산출세액", plain: "과세표준에 세율을 넣어 나온 세금입니다. 아직 낸 돈이 아니고, 신고서의 결정세액도 아닙니다." },
  { id: "cgt", term: "양도세", plain: "집·토지·주식을 팔아서 남긴 차익에 매기는 국세입니다. 법령 이름은 양도소득세입니다." },
  { id: "gift", term: "증여세", plain: "대가 없이 재산을 받으면 받는 사람(수증자)이 내는 국세입니다. 상속세와 세율 표는 같습니다." },
  { id: "holding", term: "보유세", plain: "팔지 않아도 가지고 있는 동안 내는 세금입니다. 재산세(지방세)와 종합부동산세(국세)가 있습니다." },
  { id: "cret", term: "종합부동산세", plain: "공시가격을 전국 합산해 일정 금액을 넘는 주택·토지에 더하는 국세입니다. 재산세와 별개입니다." },
] as const;

export const PROGRESSIVE_PLAIN = [
  "누진세율은 계단입니다. 과세표준이 커질수록 더 높은 칸의 세율을 씁니다.",
  "전체를 높은 세율로 곱하지 않습니다. 아래 칸은 낮은 세율, 넘긴 몫만 높은 세율입니다.",
  "한 줄로 쓰면 「과세표준 × 그 칸 세율 − 누진공제」입니다. 조문의 「가산액 + 초과분의 ○%」와 값이 같습니다.",
  "국세청 종소세 예시: 과세표준 3,000만원은 15% 칸. 3,000만 × 15% − 126만 = 324만 원.",
] as const;

export const TAX_HELP_LINKS = [
  { id: "nts126", label: "국세청 전화 126", href: "https://www.nts.go.kr/", note: "전국 국번 없이 126(유료). 특이사항은 여기 또는 세무사·회계사가 먼저." },
  { id: "hometax", label: "홈택스", href: "https://www.hometax.go.kr/", note: "신고·상담 창구. 이 화면이 홈택스가 아닙니다." },
  { id: "law", label: "국가법령정보센터", href: "https://www.law.go.kr/", note: "조문 원문." },
  { id: "nts_git", label: "국세청 종합소득세 세율", href: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7667&mi=2227", note: "제55조 표·누진공제 예시." },
  { id: "nts_cgt", label: "국세청 양도소득세 세율", href: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7711&mi=2312", note: "제104조 단기·주식." },
  { id: "nts_gift", label: "국세청 상속세 세율", href: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7957&mi=6529", note: "제26조. 증여도 같은 표(제56조)." },
  { id: "nts_cret", label: "국세청 종합부동산세", href: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7739&mi=2357", note: "종부세법 제8조·제9조 안내." },
] as const;

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
