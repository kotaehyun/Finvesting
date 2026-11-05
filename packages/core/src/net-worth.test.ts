import { describe, it, expect } from "vitest";
import {
  calculateNetWorthHistory,
  summarizeNetWorth,
  calculateBarHeights,
  type MonthlyAssetBreakdown,
} from "./net-worth";

describe("net-worth.ts - 순자산 시계열 계산", () => {
  const sampleBreakdowns: MonthlyAssetBreakdown[] = [
    {
      month: "2026-05",
      liquid: 5_000_000,
      savings: 2_000_000,
      invested: 3_000_000,
      debt: 1_000_000,
    },
    {
      month: "2026-06",
      liquid: 5_500_000,
      savings: 2_700_000,
      invested: 3_500_000,
      debt: 900_000,
    },
    {
      month: "2026-07",
      liquid: 6_000_000,
      savings: 3_400_000,
      invested: 4_200_000,
      debt: 800_000,
    },
  ];

  it("월별 총자산 및 순자산, 전월대비 증감(momChange, momRate) 정확 계산", () => {
    const history = calculateNetWorthHistory(sampleBreakdowns);
    expect(history.length).toBe(3);

    // 2026-05: 자산 1,000만, 부채 100만 -> 순자산 900만 (첫 달 증감 0)
    expect(history[0]).toEqual({
      month: "2026-05",
      liquid: 5_000_000,
      savings: 2_000_000,
      invested: 3_000_000,
      totalAssets: 10_000_000,
      debt: 1_000_000,
      netWorth: 9_000_000,
      momChange: 0,
      momRate: 0,
    });

    // 2026-06: 자산 1,170만, 부채 90만 -> 순자산 1,080만
    // 증감: +180만, 증감률: +180/900 = +0.2 (20%)
    expect(history[1]!.totalAssets).toBe(11_700_000);
    expect(history[1]!.netWorth).toBe(10_800_000);
    expect(history[1]!.momChange).toBe(1_800_000);
    expect(history[1]!.momRate).toBe(0.2);

    // 2026-07: 자산 1,360만, 부채 80만 -> 순자산 1,280만
    // 증감: +200만, 증감률: +200/1,080 = +0.1852
    expect(history[2]!.netWorth).toBe(12_800_000);
    expect(history[2]!.momChange).toBe(2_000_000);
    expect(history[2]!.momRate).toBe(0.1852);
  });

  it("순자산 요약 지표, 배분율, 부채비율, 역대 최고/최저 산출", () => {
    const history = calculateNetWorthHistory(sampleBreakdowns);
    const summary = summarizeNetWorth(history);

    expect(summary).not.toBeNull();
    expect(summary!.currentMonth).toBe("2026-07");
    expect(summary!.currentNetWorth).toBe(12_800_000);
    expect(summary!.currentTotalAssets).toBe(13_600_000);
    expect(summary!.currentDebt).toBe(800_000);

    // 배분율: 600만(44.12%), 340만(25.00%), 420만(30.88%)
    expect(summary!.allocation.liquidPct).toBe(0.4412);
    expect(summary!.allocation.savingsPct).toBe(0.25);
    expect(summary!.allocation.investedPct).toBe(0.3088);

    // 부채비율: 80만 / 1,360만 = 0.0588 (5.88%)
    expect(summary!.debtRatio).toBe(0.0588);

    // 역대 최고 / 최저
    expect(summary!.peakNetWorth).toBe(12_800_000);
    expect(summary!.lowestNetWorth).toBe(9_000_000);

    // 월평균 증가액: (180만 + 200만) / 2 = 190만
    expect(summary!.avgMonthlyGrowth).toBe(1_900_000);
  });

  it("바 높이 백분율 계산 확인", () => {
    const history = calculateNetWorthHistory(sampleBreakdowns);
    const heights = calculateBarHeights(history[0]!, 10_000_000);

    expect(heights.liquidH).toBe(50);
    expect(heights.savingsH).toBe(20);
    expect(heights.investedH).toBe(30);
    expect(heights.debtH).toBe(10);
    expect(heights.netWorthH).toBe(90);
  });
});
