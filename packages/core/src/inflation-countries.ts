// 세계은행 연간 소비자물가 상승률(FP.CPI.TOTL.ZG). 키 없음.
// 코드는 macro_indicators.code = WB_INFL_<ISO2>. 값은 % (이미 퍼센트 숫자).

export type InflationCountry = { iso2: string; label: string };

export const INFLATION_COUNTRIES: readonly InflationCountry[] = [
  { iso2: "KR", label: "한국" },
  { iso2: "US", label: "미국" },
  { iso2: "JP", label: "일본" },
  { iso2: "CN", label: "중국" },
  { iso2: "DE", label: "독일" },
  { iso2: "GB", label: "영국" },
  { iso2: "FR", label: "프랑스" },
  { iso2: "IN", label: "인도" },
  { iso2: "BR", label: "브라질" },
  { iso2: "AU", label: "호주" },
  { iso2: "CA", label: "캐나다" },
  { iso2: "ID", label: "인도네시아" },
  { iso2: "TR", label: "튀르키예" },
  { iso2: "MX", label: "멕시코" },
  { iso2: "IT", label: "이탈리아" },
  { iso2: "ZA", label: "남아공" },
];

export function wbInflCode(iso2: string): string {
  return `WB_INFL_${iso2.trim().toUpperCase()}`;
}

export function inflationTone(pct: number): "hot" | "warm" | "ok" | "cool" {
  if (pct >= 6) return "hot";
  if (pct >= 3) return "warm";
  if (pct >= 1) return "ok";
  return "cool";
}
