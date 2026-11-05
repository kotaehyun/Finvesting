/**
 * @file net-worth.ts
 * 순자산(Net Worth) 시계열 계산 및 자산/부채 배분 분석 순수 모듈
 * 
 * 순자산 = 총자산(유동자산 + 저축성자산 + 투자자산) - 총부채(대출 + 카드 미결제액)
 */

export interface MonthlyAssetBreakdown {
  month: string; // "YYYY-MM"
  liquid: number; // 유동 자산 (보통예금, CMA, 현금)
  savings: number; // 저축성 자산 (정기예금, 적금 누적)
  invested: number; // 투자 자산 (주식/ETF/가상자산 평가액 + 예수금)
  debt: number; // 부채 (대출 잔액, 카드 대금)
}

export interface MonthlyNetWorthPoint {
  month: string; // "YYYY-MM"
  liquid: number;
  savings: number;
  invested: number;
  totalAssets: number; // liquid + savings + invested
  debt: number;
  netWorth: number; // totalAssets - debt
  momChange: number; // 전월 대비 증감액
  momRate: number; // 전월 대비 증감률 (소수점 4자리, 예: 0.0321 = +3.21%)
}

export interface NetWorthSummary {
  currentMonth: string;
  currentNetWorth: number;
  currentTotalAssets: number;
  currentDebt: number;
  momChange: number;
  momRate: number;
  history: MonthlyNetWorthPoint[];
  allocation: {
    liquidPct: number;
    savingsPct: number;
    investedPct: number;
  };
  debtRatio: number; // 부채비율 (debt / totalAssets)
  peakNetWorth: number;
  lowestNetWorth: number;
  avgMonthlyGrowth: number;
}

/**
 * 월별 자산/부채 브레이크다운 배열로부터 순자산 시계열 추이 계산
 */
export function calculateNetWorthHistory(
  rawPoints: MonthlyAssetBreakdown[],
): MonthlyNetWorthPoint[] {
  if (!rawPoints || rawPoints.length === 0) return [];

  // 월 오름차순 정렬
  const sorted = [...rawPoints].sort((a, b) => a.month.localeCompare(b.month));
  const points: MonthlyNetWorthPoint[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]!;
    const liquid = Math.max(0, Math.round(cur.liquid));
    const savings = Math.max(0, Math.round(cur.savings));
    const invested = Math.max(0, Math.round(cur.invested));
    const debt = Math.max(0, Math.round(cur.debt));

    const totalAssets = liquid + savings + invested;
    const netWorth = totalAssets - debt;

    let momChange = 0;
    let momRate = 0;

    if (i > 0) {
      const prevNet = points[i - 1]!.netWorth;
      momChange = netWorth - prevNet;
      momRate = prevNet !== 0 ? Number((momChange / Math.abs(prevNet)).toFixed(4)) : 0;
    }

    points.push({
      month: cur.month,
      liquid,
      savings,
      invested,
      totalAssets,
      debt,
      netWorth,
      momChange,
      momRate,
    });
  }

  return points;
}

/**
 * 순자산 요약 지표 및 배분 비율 종합 계산
 */
export function summarizeNetWorth(history: MonthlyNetWorthPoint[]): NetWorthSummary | null {
  if (!history || history.length === 0) return null;

  const latest = history[history.length - 1]!;
  const currentTotalAssets = latest.totalAssets;
  const currentDebt = latest.debt;
  const currentNetWorth = latest.netWorth;

  const liquidPct = currentTotalAssets > 0 ? Number((latest.liquid / currentTotalAssets).toFixed(4)) : 0;
  const savingsPct = currentTotalAssets > 0 ? Number((latest.savings / currentTotalAssets).toFixed(4)) : 0;
  const investedPct = currentTotalAssets > 0 ? Number((latest.invested / currentTotalAssets).toFixed(4)) : 0;

  const debtRatio = currentTotalAssets > 0 ? Number((currentDebt / currentTotalAssets).toFixed(4)) : 0;

  let peakNetWorth = -Infinity;
  let lowestNetWorth = Infinity;
  let totalGrowth = 0;

  for (let i = 0; i < history.length; i++) {
    const nw = history[i]!.netWorth;
    if (nw > peakNetWorth) peakNetWorth = nw;
    if (nw < lowestNetWorth) lowestNetWorth = nw;
    if (i > 0) {
      totalGrowth += history[i]!.momChange;
    }
  }

  const avgMonthlyGrowth = history.length > 1
    ? Math.round(totalGrowth / (history.length - 1))
    : 0;

  return {
    currentMonth: latest.month,
    currentNetWorth,
    currentTotalAssets,
    currentDebt,
    momChange: latest.momChange,
    momRate: latest.momRate,
    history,
    allocation: {
      liquidPct,
      savingsPct,
      investedPct,
    },
    debtRatio,
    peakNetWorth,
    lowestNetWorth,
    avgMonthlyGrowth,
  };
}

/**
 * 자산 시계열 바 높이(백분율) 계산 헬퍼
 */
export function calculateBarHeights(
  point: MonthlyNetWorthPoint,
  maxAssetScale: number,
) {
  if (maxAssetScale <= 0) {
    return { liquidH: 0, savingsH: 0, investedH: 0, debtH: 0, netWorthH: 0 };
  }

  return {
    liquidH: Math.min(100, Number(((point.liquid / maxAssetScale) * 100).toFixed(1))),
    savingsH: Math.min(100, Number(((point.savings / maxAssetScale) * 100).toFixed(1))),
    investedH: Math.min(100, Number(((point.invested / maxAssetScale) * 100).toFixed(1))),
    debtH: Math.min(100, Number(((point.debt / maxAssetScale) * 100).toFixed(1))),
    netWorthH: Math.min(100, Number(((Math.max(0, point.netWorth) / maxAssetScale) * 100).toFixed(1))),
  };
}
