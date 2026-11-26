/** 예전에 KRX로 덮인 코스닥 종목을 되돌릴 때 쓰는 순수 판단. 추측하지 않는다. */

export type InstrumentMarketRow = {
  id: string;
  symbol: string;
  market: string;
};

export type MarketEvidence = {
  symbol: string;
  market: "KOSDAQ";
  reason: string;
};

export type MarketRepairPlan =
  | { action: "restore"; id: string; symbol: string; from: string; to: "KOSDAQ"; reason: string }
  | { action: "skip"; id: string; symbol: string; reason: string };

/** 6자리 숫자 종목코드. */
export function isKrStockSymbol(symbol: string): boolean {
  return /^\d{6}$/.test(symbol.trim());
}

/**
 * market=KRX인 6자리 종목만 본다.
 * evidence에 KOSDAQ이 있으면 restore, 없으면 skip(목록만).
 */
export function planKosdaqMarketRepair(
  instruments: InstrumentMarketRow[],
  evidence: MarketEvidence[],
): MarketRepairPlan[] {
  const bySymbol = new Map<string, MarketEvidence>();
  for (const e of evidence) {
    const sym = e.symbol.trim();
    if (!isKrStockSymbol(sym)) continue;
    if (e.market !== "KOSDAQ") continue;
    if (!bySymbol.has(sym)) bySymbol.set(sym, { ...e, symbol: sym });
  }

  const out: MarketRepairPlan[] = [];
  for (const row of instruments) {
    const symbol = row.symbol.trim();
    if (!isKrStockSymbol(symbol)) continue;
    if (row.market.trim().toUpperCase() !== "KRX") continue;
    const hit = bySymbol.get(symbol);
    if (hit) {
      out.push({
        action: "restore",
        id: row.id,
        symbol,
        from: row.market,
        to: "KOSDAQ",
        reason: hit.reason,
      });
    } else {
      out.push({
        action: "skip",
        id: row.id,
        symbol,
        reason: "근거 없음(사용자 원장·관심 시장 기록 없음)",
      });
    }
  }
  return out;
}

/** trades.raw·가져오기 JSON 등에서 symbol+market=KOSDAQ만 모은다. 추측 금지. */
export function collectKosdaqEvidenceFromRaw(raw: unknown, reason: string): MarketEvidence[] {
  const out: MarketEvidence[] = [];
  const walk = (v: unknown) => {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) {
      for (const item of v) walk(item);
      return;
    }
    const o = v as Record<string, unknown>;
    const symbol = typeof o.symbol === "string" ? o.symbol.trim() : "";
    const market = typeof o.market === "string" ? o.market.trim().toUpperCase() : "";
    if (isKrStockSymbol(symbol) && market === "KOSDAQ") {
      out.push({ symbol, market: "KOSDAQ", reason });
    }
    for (const child of Object.values(o)) walk(child);
  };
  walk(raw);
  return out;
}
