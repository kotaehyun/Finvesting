// 능동 알림. 푸시·메일이 아니라, 이미 계산된 결과를 확인할 일로 올린다.
// 새 통계를 만들지 않는다. ADR 0062·0063·0064와 같은 문장만 쓴다.
import { TXN_ACCOUNT_LABELS } from "./tax-year";
import type { SpendAnomalyResult } from "./spend-anomaly";
import type { RiskExplainResult } from "./risk-explain";
import type { RepeatMistakeResult } from "./repeat-mistake";

export type ProactiveAlert = {
  id: string;
  href: string;
  label: string;
};

export type ProactiveAlertsInput = {
  uncategorizedCount: number;
  missingQuoteCount: number;
  spendAnomaly: SpendAnomalyResult;
  riskExplain: RiskExplainResult;
  repeatMistake: RepeatMistakeResult;
};

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

/** 홈 「확인할 일」·챗용. 없으면 빈 배열. */
export function buildProactiveAlerts(input: ProactiveAlertsInput): ProactiveAlert[] {
  const out: ProactiveAlert[] = [];
  if (input.uncategorizedCount > 0) {
    out.push({
      id: "uncategorized",
      href: "/accounts",
      label: `미분류 거래 ${input.uncategorizedCount}건`,
    });
  }
  if (input.missingQuoteCount > 0) {
    out.push({
      id: "missing-quote",
      href: "/holdings",
      label: `시세 없는 보유 ${input.missingQuoteCount}종목`,
    });
  }
  if (input.spendAnomaly.status === "ok") {
    for (const f of input.spendAnomaly.flags) {
      const label = TXN_ACCOUNT_LABELS[f.category] ?? f.category;
      out.push({
        id: `spend-${f.category}`,
        href: "/",
        label: `이상 지출 ${label} (이전 최댓값 ${f.baselineMonth} 초과)`,
      });
    }
  }
  if (input.riskExplain.concentration) {
    const c = input.riskExplain.concentration;
    out.push({
      id: "risk-concentration",
      href: "/holdings",
      label: `보유 집중 ${c.symbol} ${pct(c.weight)} (경험 규칙 40%)`,
    });
  }
  if (input.riskExplain.cryptoAttention) {
    const c = input.riskExplain.cryptoAttention;
    out.push({
      id: "risk-crypto",
      href: "/holdings",
      label: `코인 ${pct(c.weight)} · 성향 ${c.riskLabel} (경험 규칙 20%)`,
    });
  }
  if (input.repeatMistake.status === "ok") {
    for (const p of input.repeatMistake.patterns) {
      out.push({
        id: `repeat-${p.accountId}-${p.instrumentId}`,
        href: "/holdings",
        label: `반복 패턴 ${p.symbol} ${p.count}회 (손실 매도 후 재매수)`,
      });
    }
  }
  return out;
}

export function formatProactiveAlertsContext(alerts: readonly ProactiveAlert[]): string {
  if (alerts.length === 0) {
    return "지금 올릴 확인 항목이 없습니다. 푸시·메일은 보내지 않습니다.";
  }
  const lines = alerts.map((a) => `- ${a.label}`);
  return `푸시·메일은 보내지 않습니다. 홈 「확인할 일」과 같은 목록입니다.\n${lines.join("\n")}`;
}
