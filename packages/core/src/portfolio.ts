// 체결 원장 → 보유 포지션(수량·평단·실현손익). 평균단가법.

export type TradeLike = {
  instrumentId: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  fee?: number;
  tax?: number;
};

export type Position = {
  instrumentId: string;
  quantity: number;
  avgCost: number;      // 수수료 포함 평균 매입단가
  realizedPnl: number;
};

export function buildPositions(trades: TradeLike[]): Map<string, Position> {
  const pos = new Map<string, Position>();
  for (const t of trades) {
    const p = pos.get(t.instrumentId) ?? { instrumentId: t.instrumentId, quantity: 0, avgCost: 0, realizedPnl: 0 };
    const fee = (t.fee ?? 0) + (t.tax ?? 0);
    if (t.side === "buy") {
      const cost = p.avgCost * p.quantity + t.price * t.quantity + fee;
      p.quantity += t.quantity;
      p.avgCost = p.quantity > 0 ? cost / p.quantity : 0;
    } else {
      const qty = Math.min(t.quantity, p.quantity);
      p.realizedPnl += (t.price - p.avgCost) * qty - fee;
      p.quantity -= qty;
      if (p.quantity === 0) p.avgCost = 0;
    }
    pos.set(t.instrumentId, p);
  }
  return pos;
}

export function unrealizedPnl(p: Position, lastPrice: number) {
  const marketValue = p.quantity * lastPrice;
  const cost = p.quantity * p.avgCost;
  return { marketValue, cost, pnl: marketValue - cost, pnlRate: cost > 0 ? (marketValue - cost) / cost : 0 };
}
