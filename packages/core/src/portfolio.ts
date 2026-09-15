// 체결 원장 → 보유 포지션(수량·평단·실현손익). 평균단가법.
// 통화: 포지션은 종목 통화 기준으로 계산하고, 해외 자산은 체결 당시 환율(fxRate)을 가중평균해 원화 환산을 지원한다.

export type TradeLike = {
  instrumentId: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;      // 종목 통화 기준
  fee?: number;       // 종목 통화 기준 (증권사가 원화로 청구하면 fxRate로 나눠서 넣을 것)
  tax?: number;
  fxRate?: number;    // 종목통화→KRW. 원화 자산은 생략(=1)
};

export type Position = {
  instrumentId: string;
  quantity: number;
  avgCost: number;        // 종목 통화 기준, 수수료 포함 평균 매입단가
  avgFxRate: number;      // 매입 시점 환율 가중평균 (원화 자산은 1)
  realizedPnl: number;    // 종목 통화 기준
  realizedPnlKrw: number; // 매도 시점 환율로 환산한 원화 실현손익 (환차손익 포함)
};

export function buildPositions(trades: TradeLike[]): Map<string, Position> {
  const pos = new Map<string, Position>();
  for (const t of trades) {
    const p = pos.get(t.instrumentId) ?? { instrumentId: t.instrumentId, quantity: 0, avgCost: 0, avgFxRate: 1, realizedPnl: 0, realizedPnlKrw: 0 };
    const fee = (t.fee ?? 0) + (t.tax ?? 0);
    const fx = t.fxRate ?? 1;
    if (t.side === "buy") {
      const prevCost = p.avgCost * p.quantity;
      const addCost = t.price * t.quantity + fee;
      const newQty = p.quantity + t.quantity;
      // 환율도 매입금액 가중평균
      p.avgFxRate = newQty > 0 ? (prevCost * p.avgFxRate + addCost * fx) / (prevCost + addCost || 1) : 1;
      p.avgCost = newQty > 0 ? (prevCost + addCost) / newQty : 0;
      p.quantity = newQty;
    } else {
      if (t.quantity > p.quantity) {
        throw new Error(`매도 수량이 보유(${p.quantity})보다 많습니다`);
      }
      const qty = t.quantity;
      const pnl = (t.price - p.avgCost) * qty - fee;
      p.realizedPnl += pnl;
      // 원화: 매도금액×매도환율 − 매입원가×매입환율
      p.realizedPnlKrw += (t.price * qty - fee) * fx - p.avgCost * qty * p.avgFxRate;
      p.quantity -= qty;
      if (p.quantity === 0) { p.avgCost = 0; p.avgFxRate = 1; }
    }
    pos.set(t.instrumentId, p);
  }
  return pos;
}

/** 평가손익. currentFx를 주면 원화 환산(환차손익 포함)도 계산한다. */
export function unrealizedPnl(p: Position, lastPrice: number, currentFx?: number) {
  const marketValue = p.quantity * lastPrice;
  const cost = p.quantity * p.avgCost;
  const fx = currentFx ?? p.avgFxRate;
  const marketValueKrw = marketValue * fx;
  const costKrw = cost * p.avgFxRate;
  return {
    marketValue, cost, pnl: marketValue - cost, pnlRate: cost > 0 ? (marketValue - cost) / cost : 0,
    marketValueKrw, costKrw, pnlKrw: marketValueKrw - costKrw, pnlRateKrw: costKrw > 0 ? (marketValueKrw - costKrw) / costKrw : 0,
  };
}
