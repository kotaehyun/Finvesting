// 보유 리스크 설명. 시세가 있는 평가액의 비중만 말한다.
// 40%·20%는 투자성향 조언과 같은 경험 규칙(ADR 0010)이다. 공표 통계가 아니다.
import { RISK_TOLERANCE_LABEL, type RiskTolerance } from "./allocation";
import { assetClassLabel } from "./holdings-summary";

export const SINGLE_NAME_WEIGHT = 0.4;
export const CRYPTO_WEIGHT_FOR_NON_AGGRESSIVE = 0.2;

export type RiskExplainPosition = {
  symbol: string;
  name?: string | null;
  assetClass: string;
  currency: string;
  quantity: number;
  marketValueKrw: number | null;
};

export type RiskExplainInput = {
  positions: readonly RiskExplainPosition[];
  riskTolerance?: RiskTolerance | null;
  usdkrw?: number | null;
};

export type RiskExplainResult = {
  status: "empty" | "unpriced" | "ok";
  lines: string[];
};

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function priced(p: RiskExplainPosition) {
  return p.quantity > 0 && p.marketValueKrw != null && Number.isFinite(p.marketValueKrw) && p.marketValueKrw > 0;
}

/** 보유 비중·통화로 설명할 문장. 가격 변동폭은 만들지 않는다. */
export function explainHoldingRisk(input: RiskExplainInput): RiskExplainResult {
  const open = input.positions.filter((p) => p.quantity > 0);
  const tail = "가격 변동폭은 계산하지 않습니다.";
  if (open.length === 0) {
    return { status: "empty", lines: ["보유 종목이 없습니다.", tail] };
  }
  const usable = open.filter(priced);
  const missing = open.length - usable.length;
  if (usable.length === 0) {
    return {
      status: "unpriced",
      lines: ["시세가 없어 비중을 계산하지 않습니다.", `시세 없는 종목 ${missing}개입니다.`, tail],
    };
  }

  const total = usable.reduce((s, p) => s + (p.marketValueKrw ?? 0), 0);
  const bySymbol = new Map<string, { symbol: string; assetClass: string; currency: string; marketValueKrw: number }>();
  for (const p of usable) {
    const key = `${p.symbol}|${p.currency}`;
    const row = bySymbol.get(key) ?? { symbol: p.symbol, assetClass: p.assetClass, currency: p.currency, marketValueKrw: 0 };
    row.marketValueKrw += p.marketValueKrw ?? 0;
    bySymbol.set(key, row);
  }
  const names = [...bySymbol.values()].sort((a, b) => b.marketValueKrw - a.marketValueKrw || a.symbol.localeCompare(b.symbol));
  const top = names[0]!;
  const topWeight = top.marketValueKrw / total;

  const byClass = new Map<string, number>();
  const byCurrency = new Map<string, number>();
  for (const row of names) {
    byClass.set(row.assetClass, (byClass.get(row.assetClass) ?? 0) + row.marketValueKrw);
    byCurrency.set(row.currency, (byCurrency.get(row.currency) ?? 0) + row.marketValueKrw);
  }
  const classText = [...byClass.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, value]) => `${assetClassLabel(id)} ${pct(value / total)}`)
    .join(", ");
  const currencyText = [...byCurrency.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([currency, value]) => `${currency} ${pct(value / total)}`)
    .join(", ");

  const lines = [`시세가 있는 평가액 가운데 가장 큰 종목은 ${top.symbol}이고, 비중은 ${pct(topWeight)}입니다.`];
  if (topWeight >= SINGLE_NAME_WEIGHT) {
    lines.push("한 종목이 40% 이상입니다. 투자성향과 같은 경험 규칙이며, 공식 위험 지표가 아닙니다.");
  }
  lines.push(`자산군은 ${classText}입니다.`);
  lines.push(`통화는 ${currencyText}입니다.`);

  const foreign = [...byCurrency.entries()].filter(([currency]) => currency !== "KRW");
  if (foreign.length === 0) {
    lines.push("해외 통화 보유는 없습니다.");
  } else {
    for (const [currency, value] of foreign.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
      const share = pct(value / total);
      if (currency === "USD" && input.usdkrw != null && Number.isFinite(input.usdkrw)) {
        lines.push(`미국 달러 비중은 ${share}입니다. 원화 평가에 쓴 원/달러는 ${input.usdkrw}입니다. 환율이 바뀌면 원화 평가가 바뀝니다.`);
      } else {
        lines.push(`${currency}는 ${share}입니다. 원화 평가는 체결 환율을 썼고, 그 환율이 바뀌면 평가가 바뀝니다.`);
      }
    }
  }

  const cryptoWeight = (byClass.get("crypto") ?? 0) / total;
  if (cryptoWeight >= CRYPTO_WEIGHT_FOR_NON_AGGRESSIVE && input.riskTolerance && input.riskTolerance !== "aggressive") {
    lines.push(`코인이 ${pct(cryptoWeight)}이고 성향은 ${RISK_TOLERANCE_LABEL[input.riskTolerance]}입니다. 투자성향과 같은 경험 규칙으로 20% 이상입니다.`);
  }
  if (missing > 0) lines.push(`시세 없는 종목 ${missing}개는 비중에 넣지 않았습니다.`);
  lines.push(tail);
  return { status: "ok", lines };
}

export function formatRiskExplainContext(result: RiskExplainResult): string {
  return result.lines.map((line) => `- ${line}`).join("\n");
}
