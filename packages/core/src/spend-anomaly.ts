// 이상 지출. 본인 원장의 분류별 월 합계만 비교한다. 인구 통계·배수는 쓰지 않는다.
import { addMonths } from "./savings";
import { TXN_ACCOUNT_LABELS } from "./tax-year";

/** 이전 달 수. 제품 규칙이며 공표 통계가 아니다. */
export const SPEND_ANOMALY_LOOKBACK_MONTHS = 6;
/** 소비가 있는 이전 달이 이 수 미만이면 비교하지 않는다. */
export const SPEND_ANOMALY_MIN_BASELINE_MONTHS = 3;
/** 최댓값을 넘긴 거래는 금액이 큰 순으로 이 건수만 돌려준다. */
export const SPEND_ANOMALY_OUTLIER_LIMIT = 5;

// 홈의 소비(고정+변동)와 같다. 저축·투자·이체·미분류는 빼 둔다.
export const SPEND_ANOMALY_CATEGORIES = new Set([
  "housing", "utilities", "insurance", "subscription", "phone",
  "income_tax", "health_insurance", "loan_repayment",
  "food", "transport", "shopping", "leisure", "health", "education", "misc",
]);

export type SpendAnomalyTxn = {
  id?: string | null;
  date: string;
  amount: number;
  direction: "in" | "out" | "transfer";
  category: string;
  merchant?: string | null;
  memo?: string | null;
};

export type SpendAnomalyOutlier = {
  id: string | null;
  date: string;
  amount: number;
  merchant: string | null;
  memo: string | null;
};

export type SpendAnomalyFlag = {
  category: string;
  monthTotal: number;
  baselineMax: number;
  baselineMonth: string;
  outliers: SpendAnomalyOutlier[];
  outlierCount: number;
};

export type SpendAnomalyResult = {
  status: "empty" | "insufficient" | "ok";
  lookbackMonths: number;
  minBaselineMonths: number;
  comparedMonths: number;
  flags: SpendAnomalyFlag[];
};

function won(n: number) {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

function baselineMonthsOf(month: string) {
  const months: string[] = [];
  for (let i = 1; i <= SPEND_ANOMALY_LOOKBACK_MONTHS; i += 1) {
    months.push(addMonths(month, -i));
  }
  return months;
}

function emptyResult(status: SpendAnomalyResult["status"], comparedMonths: number): SpendAnomalyResult {
  return {
    status,
    lookbackMonths: SPEND_ANOMALY_LOOKBACK_MONTHS,
    minBaselineMonths: SPEND_ANOMALY_MIN_BASELINE_MONTHS,
    comparedMonths,
    flags: [],
  };
}

/** 고른 달의 분류 합계가 이전 달들의 최댓값보다 크면 그 분류를 돌려준다. */
export function detectSpendAnomalies(txns: readonly SpendAnomalyTxn[], month: string): SpendAnomalyResult {
  if (!/^\d{4}-\d{2}$/.test(month)) return emptyResult("empty", 0);
  const baselineMonths = baselineMonthsOf(month);
  const baselineSet = new Set(baselineMonths);
  const prior = new Map<string, Map<string, number>>();
  const monthsWithSpend = new Set<string>();
  const selected: SpendAnomalyTxn[] = [];

  for (const t of txns) {
    if (t.direction !== "out" || !SPEND_ANOMALY_CATEGORIES.has(t.category)) continue;
    if (!Number.isFinite(t.amount) || t.amount <= 0) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date)) continue;
    const ym = t.date.slice(0, 7);
    if (ym === month) {
      selected.push(t);
      continue;
    }
    if (!baselineSet.has(ym)) continue;
    monthsWithSpend.add(ym);
    const byMonth = prior.get(t.category) ?? new Map<string, number>();
    byMonth.set(ym, (byMonth.get(ym) ?? 0) + t.amount);
    prior.set(t.category, byMonth);
  }

  if (selected.length === 0) return emptyResult("empty", monthsWithSpend.size);
  if (monthsWithSpend.size < SPEND_ANOMALY_MIN_BASELINE_MONTHS) {
    return emptyResult("insufficient", monthsWithSpend.size);
  }

  const byCategory = new Map<string, SpendAnomalyTxn[]>();
  for (const t of selected) {
    const rows = byCategory.get(t.category) ?? [];
    rows.push(t);
    byCategory.set(t.category, rows);
  }

  const flags: SpendAnomalyFlag[] = [];
  for (const [category, rows] of byCategory) {
    const monthTotal = rows.reduce((sum, t) => sum + t.amount, 0);
    const byMonth = prior.get(category) ?? new Map<string, number>();
    let baselineMax = 0;
    let baselineMonth = baselineMonths[0] ?? month;
    for (const bm of baselineMonths) {
      const value = byMonth.get(bm) ?? 0;
      if (value > baselineMax) {
        baselineMax = value;
        baselineMonth = bm;
      }
    }
    if (!(monthTotal > baselineMax) || !(baselineMax > 0)) continue;
    const over = rows
      .filter((t) => t.amount > baselineMax)
      .sort((a, b) => b.amount - a.amount || b.date.localeCompare(a.date) || String(a.id ?? "").localeCompare(String(b.id ?? "")));
    flags.push({
      category,
      monthTotal,
      baselineMax,
      baselineMonth,
      outlierCount: over.length,
      outliers: over.slice(0, SPEND_ANOMALY_OUTLIER_LIMIT).map((t) => ({
        id: t.id ?? null,
        date: t.date,
        amount: t.amount,
        merchant: t.merchant?.trim() ? t.merchant.trim() : null,
        memo: t.memo?.trim() ? t.memo.trim() : null,
      })),
    });
  }

  flags.sort((a, b) => (b.monthTotal - b.baselineMax) - (a.monthTotal - a.baselineMax) || a.category.localeCompare(b.category));
  return {
    status: "ok",
    lookbackMonths: SPEND_ANOMALY_LOOKBACK_MONTHS,
    minBaselineMonths: SPEND_ANOMALY_MIN_BASELINE_MONTHS,
    comparedMonths: monthsWithSpend.size,
    flags,
  };
}

/** 챗에 넣을 문장. 계산 결과만 적고 이유를 만들지 않는다. */
export function formatSpendAnomalyContext(result: SpendAnomalyResult): string {
  const head = `비교는 이전 ${result.lookbackMonths}개월이고, 소비가 있는 달이 ${result.minBaselineMonths}개월 이상일 때만 합니다. 저축·투자·이체·미분류는 빼 둡니다. 이전 달에 없던 분류는 이상으로 보지 않습니다.`;
  if (result.status === "empty") return `${head}\n이 달 소비로 볼 거래가 없습니다.`;
  if (result.status === "insufficient") {
    return `${head}\n소비가 있는 이전 달은 ${result.comparedMonths}개월이라 비교하지 않습니다.`;
  }
  if (result.flags.length === 0) {
    return `${head}\n분류별 소비는 이전 ${result.lookbackMonths}개월 최댓값을 넘지 않습니다.`;
  }
  const lines = result.flags.map((f) => {
    const label = TXN_ACCOUNT_LABELS[f.category] ?? f.category;
    const parts = [`- ${label} ${won(f.monthTotal)} (이전 최댓값 ${won(f.baselineMax)}, ${f.baselineMonth})`];
    for (const t of f.outliers) {
      const name = t.merchant || t.memo || label;
      parts.push(`  - ${t.date} ${name} ${won(t.amount)}`);
    }
    if (f.outlierCount === 0) parts.push("  - 한 건이 월 최댓값을 넘긴 것은 아닙니다.");
    else if (f.outlierCount > f.outliers.length) {
      parts.push(`  - 월 최댓값을 넘긴 거래 ${f.outlierCount}건 중 ${f.outliers.length}건만 적었습니다.`);
    }
    return parts.join("\n");
  });
  return `${head}\n이전 최댓값을 넘긴 분류:\n${lines.join("\n")}`;
}
