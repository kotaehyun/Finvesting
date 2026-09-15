// 보유 포지션을 자산군·계좌별로 합산. 여러 증권·코인 계좌를 가진 사용자를 기준으로 한다.

export const ASSET_CLASSES = ["stock", "etf", "bond", "fund", "crypto", "other"] as const;
export type AssetClassId = (typeof ASSET_CLASSES)[number];

export const ASSET_CLASS_LABEL: Record<AssetClassId, string> = {
  stock: "주식",
  etf: "ETF",
  bond: "채권",
  fund: "펀드",
  crypto: "코인",
  other: "기타",
};

export const INVEST_ACCOUNT_TYPES = ["brokerage", "crypto", "pension"] as const;

export function isInvestAccountType(type: string): boolean {
  return (INVEST_ACCOUNT_TYPES as readonly string[]).includes(type);
}

export function assetClassLabel(id: string): string {
  return (ASSET_CLASS_LABEL as Record<string, string>)[id] ?? id;
}

export type HoldingSummaryRow = {
  accountId: string;
  assetClass: string;
  quantity: number;
  marketValueKrw: number | null;
  costKrw: number;
  pnlKrw: number | null;
};

export type ClassSummary = {
  assetClass: AssetClassId;
  label: string;
  count: number;
  costKrw: number;
  marketValueKrw: number;
  pnlKrw: number;
  weight: number;
};

export type AccountSummary = {
  accountId: string;
  name: string;
  institution: string | null;
  type: string;
  balance: number;
  count: number;
  costKrw: number;
  marketValueKrw: number;
  pnlKrw: number;
  weight: number;
};

function asClass(id: string): AssetClassId {
  return (ASSET_CLASSES as readonly string[]).includes(id) ? (id as AssetClassId) : "other";
}

export function summarizeByClass(rows: HoldingSummaryRow[]): ClassSummary[] {
  const open = rows.filter((r) => r.quantity > 0);
  const buckets = new Map<AssetClassId, ClassSummary>();
  for (const id of ASSET_CLASSES) {
    buckets.set(id, {
      assetClass: id,
      label: ASSET_CLASS_LABEL[id],
      count: 0,
      costKrw: 0,
      marketValueKrw: 0,
      pnlKrw: 0,
      weight: 0,
    });
  }
  for (const r of open) {
    const b = buckets.get(asClass(r.assetClass))!;
    b.count += 1;
    b.costKrw += r.costKrw;
    b.marketValueKrw += r.marketValueKrw ?? 0;
    b.pnlKrw += r.pnlKrw ?? 0;
  }
  const total = [...buckets.values()].reduce((s, b) => s + b.marketValueKrw, 0);
  for (const b of buckets.values()) {
    b.weight = total > 0 ? b.marketValueKrw / total : 0;
  }
  return ASSET_CLASSES.map((id) => buckets.get(id)!);
}

export type CurrencySummary = {
  currency: string;
  count: number;
  pricedCount: number;
  marketValueKrw: number | null;
  weight: number | null;
};

/** 시세가 있는 종목만 비중을 계산한다. 시세 없는 통화를 0%로 넣지 않는다. */
export function summarizeByCurrency(
  rows: Array<{ quantity: number; currency: string; marketValueKrw: number | null }>,
): CurrencySummary[] {
  const open = rows.filter((r) => r.quantity > 0);
  const buckets = new Map<string, { count: number; pricedCount: number; marketValueKrw: number }>();
  for (const r of open) {
    const b = buckets.get(r.currency) ?? { count: 0, pricedCount: 0, marketValueKrw: 0 };
    b.count += 1;
    if (r.marketValueKrw != null) {
      b.pricedCount += 1;
      b.marketValueKrw += r.marketValueKrw;
    }
    buckets.set(r.currency, b);
  }
  const pricedTotal = [...buckets.values()].reduce((s, b) => s + (b.pricedCount > 0 ? b.marketValueKrw : 0), 0);
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, b]) => ({
      currency,
      count: b.count,
      pricedCount: b.pricedCount,
      marketValueKrw: b.pricedCount > 0 ? b.marketValueKrw : null,
      weight: b.pricedCount > 0 && pricedTotal > 0 ? b.marketValueKrw / pricedTotal : null,
    }));
}

export type PnlContribution = {
  instrumentId: string;
  symbol: string;
  name: string;
  pnlKrw: number;
  marketValueKrw: number;
};

/** 평가손익만. 시세 없는 종목·실현손익은 넣지 않는다. */
export function unrealizedPnlContribution(
  rows: Array<{
    instrumentId: string;
    symbol: string;
    name: string;
    quantity: number;
    pnlKrw: number | null;
    marketValueKrw: number | null;
  }>,
): PnlContribution[] {
  return rows
    .filter((r): r is typeof r & { pnlKrw: number; marketValueKrw: number } =>
      r.quantity > 0 && r.pnlKrw != null && r.marketValueKrw != null)
    .map((r) => ({
      instrumentId: r.instrumentId,
      symbol: r.symbol,
      name: r.name,
      pnlKrw: r.pnlKrw,
      marketValueKrw: r.marketValueKrw,
    }))
    .sort((a, b) => Math.abs(b.pnlKrw) - Math.abs(a.pnlKrw));
}

export function summarizeByAccount(
  rows: HoldingSummaryRow[],
  accounts: Array<{ id: string; name: string; institution: string | null; type: string; balance: number }>,
): AccountSummary[] {
  const open = rows.filter((r) => r.quantity > 0);
  const idsWithRows = new Set(open.map((r) => r.accountId));
  const out: AccountSummary[] = accounts
    .filter((a) => isInvestAccountType(a.type) || idsWithRows.has(a.id))
    .map((a) => ({
      accountId: a.id,
      name: a.name,
      institution: a.institution,
      type: a.type,
      balance: a.balance,
      count: 0,
      costKrw: 0,
      marketValueKrw: 0,
      pnlKrw: 0,
      weight: 0,
    }));
  const map = new Map(out.map((x) => [x.accountId, x]));
  for (const r of open) {
    let b = map.get(r.accountId);
    if (!b) {
      b = {
        accountId: r.accountId,
        name: r.accountId,
        institution: null,
        type: "other",
        balance: 0,
        count: 0,
        costKrw: 0,
        marketValueKrw: 0,
        pnlKrw: 0,
        weight: 0,
      };
      out.push(b);
      map.set(r.accountId, b);
    }
    b.count += 1;
    b.costKrw += r.costKrw;
    b.marketValueKrw += r.marketValueKrw ?? 0;
    b.pnlKrw += r.pnlKrw ?? 0;
  }
  const total = out.reduce((s, b) => s + b.marketValueKrw, 0);
  for (const b of out) b.weight = total > 0 ? b.marketValueKrw / total : 0;
  return out;
}
