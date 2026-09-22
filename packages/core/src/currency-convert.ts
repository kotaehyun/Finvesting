// 외화 계좌 원화 환산 및 통화별 자산 집계 순수 함수

export type AccountBalanceItem = {
  type: string;
  currency: string;
  balance: number | string;
};

export type BalanceConversionResult = {
  byTypeKrw: Record<string, number>;
  byCurrency: Record<string, number>;
  unconvertedCount: number;
  unconvertedCurrencies: string[];
  isFxComplete: boolean;
};

/**
 * 계좌 목록의 통화(currency)를 고려하여 원화 환산 및 통화별 집계를 수행한다.
 * - KRW: 그대로 1:1 반영
 * - USD 등 외화: 유효한 환율(fxRates[currency])이 있으면 곱하여 원화 환산 (반올림 정수)
 * - 환율이 없거나 지원하지 않는 통화: 1:1 왜곡 합산을 금지하고 미환산(unconverted)으로 분리
 */
export function convertAccountBalances(
  accounts: AccountBalanceItem[],
  fxRates: Record<string, number | null | undefined>,
): BalanceConversionResult {
  const byTypeKrw: Record<string, number> = {};
  const byCurrency: Record<string, number> = {};
  const unconvertedCurrenciesSet = new Set<string>();
  let unconvertedCount = 0;

  for (const a of accounts) {
    const rawBal = Number(a.balance);
    if (!Number.isFinite(rawBal)) continue;

    const curr = (a.currency || "KRW").toUpperCase();
    byCurrency[curr] = (byCurrency[curr] ?? 0) + rawBal;

    if (curr === "KRW") {
      byTypeKrw[a.type] = (byTypeKrw[a.type] ?? 0) + rawBal;
    } else {
      const fx = fxRates[curr];
      if (fx != null && Number.isFinite(fx) && fx > 0) {
        const converted = Math.round(rawBal * fx);
        byTypeKrw[a.type] = (byTypeKrw[a.type] ?? 0) + converted;
      } else {
        unconvertedCount++;
        unconvertedCurrenciesSet.add(curr);
      }
    }
  }

  const unconvertedCurrencies = [...unconvertedCurrenciesSet];
  return {
    byTypeKrw,
    byCurrency,
    unconvertedCount,
    unconvertedCurrencies,
    isFxComplete: unconvertedCount === 0,
  };
}
