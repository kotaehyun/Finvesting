// 대시보드 투자자산. 증권·코인·연금 계좌 balance는 예수금(현금)으로 본다.

export const BROKER_CASH_TYPES = ["brokerage", "crypto", "pension"] as const;

export function brokerCashKrw(byType: Record<string, number>): number {
  let s = 0;
  for (const t of BROKER_CASH_TYPES) s += byType[t] ?? 0;
  return s;
}

/** 보유 평가액(원화) + 증권·코인·연금 예수금. */
export function investedAssets(holdingsMarketValueKrw: number, brokerCash: number): number {
  return holdingsMarketValueKrw + brokerCash;
}
