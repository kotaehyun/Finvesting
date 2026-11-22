import { describe, expect, it } from "vitest";
import { buildProactiveAlerts, formatProactiveAlertsContext } from "./proactive-alerts";
import type { SpendAnomalyResult } from "./spend-anomaly";
import type { RiskExplainResult } from "./risk-explain";
import type { RepeatMistakeResult } from "./repeat-mistake";

const emptySpend: SpendAnomalyResult = {
  status: "empty",
  lookbackMonths: 6,
  minBaselineMonths: 3,
  comparedMonths: 0,
  flags: [],
};

const emptyRisk: RiskExplainResult = {
  status: "empty",
  lines: [],
  concentration: null,
  cryptoAttention: null,
};

const emptyRepeat: RepeatMistakeResult = {
  status: "empty",
  minCount: 2,
  patterns: [],
};

describe("buildProactiveAlerts", () => {
  it("아무것도 없으면 빈 목록이다", () => {
    expect(buildProactiveAlerts({
      uncategorizedCount: 0,
      missingQuoteCount: 0,
      spendAnomaly: emptySpend,
      riskExplain: emptyRisk,
      repeatMistake: emptyRepeat,
    })).toEqual([]);
  });

  it("미분류·시세 없음·이상 지출·집중·코인·반복을 올린다", () => {
    const alerts = buildProactiveAlerts({
      uncategorizedCount: 2,
      missingQuoteCount: 1,
      spendAnomaly: {
        ...emptySpend,
        status: "ok",
        flags: [{
          category: "food",
          monthTotal: 200_000,
          baselineMax: 100_000,
          baselineMonth: "2026-07",
          outliers: [],
          outlierCount: 0,
        }],
      },
      riskExplain: {
        status: "ok",
        lines: [],
        concentration: { symbol: "BTC", weight: 1 },
        cryptoAttention: { weight: 1, riskLabel: "중립" },
      },
      repeatMistake: {
        status: "ok",
        minCount: 2,
        patterns: [{
          accountId: "a1",
          accountName: "증권",
          instrumentId: "i1",
          symbol: "AAA",
          name: null,
          count: 2,
          lastBuyAt: "2026-05-01",
          samples: [],
        }],
      },
    });
    expect(alerts.map((a) => a.id)).toEqual([
      "uncategorized",
      "missing-quote",
      "spend-food",
      "risk-concentration",
      "risk-crypto",
      "repeat-a1-i1",
    ]);
    expect(alerts[2]?.label).toContain("식비");
    expect(alerts[3]?.label).toContain("BTC");
  });

  it("이상 지출이 insufficient면 올리지 않는다", () => {
    const alerts = buildProactiveAlerts({
      uncategorizedCount: 0,
      missingQuoteCount: 0,
      spendAnomaly: { ...emptySpend, status: "insufficient" },
      riskExplain: emptyRisk,
      repeatMistake: emptyRepeat,
    });
    expect(alerts).toEqual([]);
  });
});

describe("formatProactiveAlertsContext", () => {
  it("없으면 없다고 적는다", () => {
    expect(formatProactiveAlertsContext([])).toContain("지금 올릴 확인 항목이 없습니다");
  });
});
