// 원화 대비 주요 환율. 숫자는 Yahoo, Investing.com은 원문 링크만 (ADR 0009).
// KRW=X = 원/달러는 2026-09-13 수집으로 확인. EURKRW=X·JPYKRW=X·CNYKRW=X·GBPKRW=X는 2026-09-14 quote 확인.

export type FxPairId = "usdkrw" | "eurkrw" | "jpykrw" | "cnykrw" | "gbpkrw";

export type FxPair = {
  id: FxPairId;
  code: string;
  label: string;
  yahoo: string;
  unit: string;
  /** 저장값은 1단위당 원. 화면만 이 배수를 곱한다 (엔 100엔). */
  scale: number;
  href: string;
};

export const FX_PAIRS: readonly FxPair[] = [
  { id: "usdkrw", code: "USDKRW", label: "달러", yahoo: "KRW=X", unit: "KRW", scale: 1, href: "https://kr.investing.com/currencies/usd-krw" },
  { id: "eurkrw", code: "EURKRW", label: "유로", yahoo: "EURKRW=X", unit: "KRW", scale: 1, href: "https://kr.investing.com/currencies/eur-krw" },
  { id: "jpykrw", code: "JPYKRW", label: "엔(100엔)", yahoo: "JPYKRW=X", unit: "KRW", scale: 100, href: "https://kr.investing.com/currencies/jpy-krw" },
  { id: "cnykrw", code: "CNYKRW", label: "위안", yahoo: "CNYKRW=X", unit: "KRW", scale: 1, href: "https://kr.investing.com/currencies/cny-krw" },
  { id: "gbpkrw", code: "GBPKRW", label: "파운드", yahoo: "GBPKRW=X", unit: "KRW", scale: 1, href: "https://kr.investing.com/currencies/gbp-krw" },
];

export function fxYahooTickers(): string[] {
  return FX_PAIRS.map((p) => p.yahoo);
}

export function fxPairByCode(code: string): FxPair | undefined {
  return FX_PAIRS.find((p) => p.code === code);
}

export function displayFx(value: number, pair: Pick<FxPair, "scale">): number {
  return value * pair.scale;
}
