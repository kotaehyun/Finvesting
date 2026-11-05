// 프리랜서 원천징수(흔히 3.3%). 근로·기타소득과 구분. 종소세 확정세액이 아님.

function truncWon(n: number) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

export const FREELANCER_INCOME_TAX_RATE = 0.03; // 소득세법 제129조 제1항 제3호
export const LOCAL_ON_WITHHELD_TAX = 0.1; // 지방세법 제103조의13. 원천 소득세의 10%

export const ENGAGEMENT_KINDS = [
  {
    id: "employee",
    label: "근로자",
    tax: "근로소득·간이세액·4대보험",
    when: "사용종속관계. 지휘·감독, 근로시간, 전속성",
    not: "3.3% 원천이 아님",
  },
  {
    id: "freelancer",
    label: "프리랜서(인적용역 사업소득)",
    tax: "지급액의 소득세 3% + 지방세 0.3% = 3.3%",
    when: "이 화면 한정: 연예인·모델·독립 개발·인플루언서·전문직. 고용 없이 독립 용역",
    not: "아르바이트생·매장 알바·위장 3.3%(사짜)가 아님. 부가세 10%와 다름. 종소세 5월 확정",
  },
  {
    id: "other_income",
    label: "기타소득(단발)",
    tax: "기타소득 원천(소득세법 제129조). 3.3%가 아님",
    when: "일시적·우발적 대가",
    not: "계속 반복이면 사업소득 검토",
  },
  {
    id: "vat_business",
    label: "개인사업자",
    tax: "종소세 5월 + 부가세(일반/간이/면세)",
    when: "대표 = 사업자 본인. 재화·용역 공급",
    not: "법인세가 아님. 인적용역 3.3%와 별개",
  },
  {
    id: "corporation",
    label: "법인사업자",
    tax: "법인세 + 부가세(일반/면세). 종소세 아님",
    when: "법인 등기. 대표와 별도 인격",
    not: "간이과세 없음. 대표 급여는 근로소득이지 3.3% 아님",
  },
] as const;

export const FREELANCER_CONDITIONS = [
  { id: "independent", pass: "고용관계 없이 독립된 자격", fail: "지휘·감독을 받으면 근로소득" },
  { id: "not_disguised", pass: "위장 프리랜서(소위 사짜)가 아님", fail: "출퇴근·근태·복장·대타를 지정받으면 근로소득(소득세법 제20조)" },
  { id: "repeat", pass: "계속·반복 용역", fail: "단발이면 기타소득 검토. 3.3%를 바로 쓰지 않음" },
  { id: "no_facility", pass: "물적시설 없이 근로자를 고용하지 않음(인적용역)", fail: "사업장·직원을 두면 일반 사업소득·부가세" },
  { id: "payer", pass: "지급자가 원천징수의무자(사업자·법인·국가 등)", fail: "개인 간 지급은 원천이 안 붙을 수 있음" },
  { id: "statute_only", pass: "법령 문언만 보수적으로 읽었음을 확인", fail: "조문·시행령에 없는 해석으로 3.3%를 쓰지 않음. 확인 전 곱하지 않음" },
] as const;

export type FreelancerConditionId = (typeof FREELANCER_CONDITIONS)[number]["id"];

/** 이 화면의 엄격 안내. 소득세법이 이 직종만 허용한다고 쓰지 않음. */
export const FREELANCER_SCOPES = [
  { id: "entertainer", label: "연예인", note: "출연·공연 인적용역. 소속사에 출퇴근하는 직원은 근로." },
  { id: "model", label: "모델", note: "촬영·런웨이 인적용역. 전속 직원은 근로." },
  { id: "developer", label: "프리랜서 개발자", note: "프로젝트 단위 독립 용역. 회사 상주·슬랙 근태·지시는 근로." },
  { id: "influencer", label: "인플루언서", note: "본인 채널로 콘텐츠·협찬 용역. 매장 아르바이트가 아님." },
  { id: "professional", label: "전문직", note: "의사·변호사·노무사·세무사·변리사 등 자격 독립 자문. 개원·사무소는 개인사업자." },
] as const;

/** 이 화면 전문직 예시. 자격 법령 전부가 아님. 개원은 3.3%가 아님. */
export const FREELANCER_PROFESSIONS = [
  { id: "doctor", label: "의사", note: "봉직은 근로. 개원 병원은 개인사업자. 독립 자문 용역만 여기." },
  { id: "lawyer", label: "변호사", note: "법률사무소 개업은 개인사업자. 독립 자문 용역만 여기." },
  { id: "labor", label: "노무사", note: "사무소 개업은 개인사업자. 독립 자문 용역만 여기." },
  { id: "tax", label: "세무사", note: "세무사무소 개업은 개인사업자. 독립 자문 용역만 여기." },
  { id: "patent", label: "변리사", note: "특허사무소 개업은 개인사업자. 독립 자문 용역만 여기." },
  { id: "cpa", label: "공인회계사", note: "회계사무소 개업은 개인사업자. 독립 자문 용역만 여기." },
] as const;

export type FreelancerScopeId = (typeof FREELANCER_SCOPES)[number]["id"];

export const FREELANCER_REJECTED = [
  { id: "disguised", label: "소위 사짜(위장 프리랜서)", note: "출퇴근·지휘감독이 있는데 3.3만 떼는 계약. 근로소득·4대보험." },
  { id: "forced_alba", label: "아르바이트생 3.3% 강제", note: "계약서에 3.3%라고 적어도 근로소득 원천이다. 소득세법 제20조·제129조 제1항 제1호." },
  { id: "shop_alba", label: "매장·현장 알바", note: "카페·편의점·물류 등 시간을 맞춰 일하는 알바. 인플루언서가 아님." },
  { id: "office_dev", label: "상주 개발 알바", note: "회사 자리와 근태. 프리랜서 개발자가 아님." },
  { id: "opened_office", label: "개원·개업 전문직", note: "병원·법률·세무 사무소는 개인사업자(종소세·부가세). 3.3% 인적용역이 아님." },
] as const;

/** 아르바이트 임금에 사업소득 3%를 쓰지 않는다는 법령 주의. 절세 특약이 아님. */
export const FREELANCER_ALBA_CLAUSE_BASIS = [
  { id: "ita20", article: "소득세법 제20조", point: "근로 제공의 대가는 근로소득이다. 아르바이트 임금도 같다." },
  { id: "ita127", article: "소득세법 제127조", point: "근로소득을 지급하는 자는 원천징수한다." },
  { id: "ita1291", article: "소득세법 제129조 제1항 제1호", point: "근로소득 원천세율. 알바를 3.3%로 돌리는 근거가 아니다." },
  { id: "ita1293", article: "소득세법 제129조 제1항 제3호", point: "사업소득 중 대통령령으로 정하는 것의 3%. 근로자에게 쓰지 않는다." },
  { id: "lsa2", article: "근로기준법 제2조 제1항 제1호", point: "근로자는 직업·계약서 이름과 관계없이 임금 목적의 근로 제공자로 본다." },
] as const;

export const FREELANCER_ALBA_CLAUSE = `【법령 주의】 아르바이트 임금에 사업소득 3% 원천을 쓰지 않는다. 절세 특약이 아니다.

1. 아르바이트·시간제·일용으로 근로를 제공하고 받는 돈은 근로소득이다(소득세법 제20조).
2. 그 지급자는 근로소득 원천징수를 한다(소득세법 제127조, 제129조 제1항 제1호).
3. 사업소득 3%(같은 조 제3호, 지방소득세 가산 시 흔히 3.3%)는 독립 인적용역 사업소득용이다. 아르바이트생에게 적용하지 않는다.
4. 근로자인지는 계약서에 프리랜서·3.3%라고 적은 것으로 바뀌지 않는다(근로기준법 제2조 제1항 제1호).

애매하면 근로소득 원천을 본다. 국세청 유권해석·세무사 확인 전 이 화면만으로 신고하지 않는다.
이 화면 안내이다. 법률자문·절세 자문이 아니다.`;

export function freelancerScopeOk(scope: string | null | undefined): scope is FreelancerScopeId {
  return FREELANCER_SCOPES.some((s) => s.id === scope);
}

export function freelancerMayWithhold(
  flags: Partial<Record<FreelancerConditionId, boolean>>,
  scope: string | null | undefined,
): boolean {
  if (!freelancerScopeOk(scope)) return false;
  return FREELANCER_CONDITIONS.every((c) => flags[c.id] === true);
}

export type FreelancerWithholding = {
  gross: number;
  incomeTax: number;
  localTax: number;
  total: number;
  net: number;
};

export function freelancerWithholding(gross: number): FreelancerWithholding {
  const g = Math.max(0, Math.floor(Number(gross) || 0));
  const incomeTax = truncWon(g * 3 / 100);
  const localTax = truncWon(incomeTax / 10);
  const total = incomeTax + localTax;
  return { gross: g, incomeTax, localTax, total, net: g - total };
}

export function freelancerConditionHint(
  flags: Partial<Record<FreelancerConditionId, boolean>>,
  scope?: string | null,
): string {
  if (!freelancerScopeOk(scope)) {
    return "이 화면은 연예인·모델·프리랜서 개발자·인플루언서·전문직만 봅니다. 아르바이트생을 3.3%로 돌리지 않습니다(소득세법 제20조·제129조 제1항 제1호). 3.3%를 곱하지 않습니다.";
  }
  if (!flags.independent) return "사용종속관계가 있으면 근로소득·4대보험입니다. 3.3%가 아닙니다.";
  if (!flags.not_disguised) return "소위 사짜(위장 프리랜서)입니다. 출퇴근·근태가 있으면 근로소득입니다. 3.3%가 아닙니다.";
  if (!flags.repeat) return "단발이면 기타소득을 검토합니다. 3.3%를 바로 적용하지 않습니다.";
  if (!flags.no_facility) {
    if (scope === "professional") return "개원·사무소·직원이 있으면 개인사업자(종소세·부가세)입니다. 3.3% 인적용역이 아닙니다.";
    return "사업장·직원이 있으면 일반 사업소득·부가세를 검토합니다.";
  }
  if (!flags.payer) return "원천징수의무자가 아니면 3.3%가 안 붙을 수 있습니다.";
  if (!flags.statute_only) return "법령 문언 밖 해석으로 3.3%를 쓰지 않습니다. 확인 전에는 곱하지 않습니다.";
  return "소득세법 제129조 제1항 제3호 시산만입니다. 확정세액·절세 자문이 아닙니다. 국세청 판단과 다를 수 있습니다.";
}
