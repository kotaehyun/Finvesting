"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { calculateBarHeights, type MonthlyNetWorthPoint } from "@finvesting/core";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const pct = (r: number) => `${(r * 100).toFixed(1)}%`;

interface NetWorthChartProps {
  selectedMonth?: string;
  onSelectMonth?: (month: string) => void;
}

export function NetWorthChart({ selectedMonth, onSelectMonth }: NetWorthChartProps) {
  const [rangeMonths, setRangeMonths] = useState<number>(6);
  const [hoveredPoint, setHoveredPoint] = useState<MonthlyNetWorthPoint | null>(null);

  const { data: summary, isLoading } = trpc.dashboard.netWorthHistory.useQuery({
    count: rangeMonths,
  });

  if (isLoading) {
    return (
      <div className="card nw-loading-card">
        <div className="spinner" style={{ width: 24, height: 24 }}></div>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>순자산 시계열을 분석하는 중…</p>
      </div>
    );
  }

  if (!summary || summary.history.length === 0) {
    return null;
  }

  const { history, currentNetWorth, currentTotalAssets, currentDebt, momChange, momRate, allocation, debtRatio, peakNetWorth, avgMonthlyGrowth } = summary;

  // 전체 기간 중 최대 자산 스케일 (차트 정규화용)
  const maxScale = Math.max(...history.map((h) => Math.max(h.totalAssets, h.netWorth, 10_000_000))) * 1.15;

  const displayPoint = hoveredPoint ?? history.find((h) => h.month === selectedMonth) ?? history[history.length - 1]!;

  return (
    <div className="card nw-card">
      {/* 1. 상단 타이틀 & 주요 메트릭 */}
      <div className="nw-header">
        <div>
          <div className="nw-title-row">
            <h3 className="nw-title">월별 순자산 추이 & 자산 배분</h3>
            <span className="nw-tag">Net Worth Trend</span>
          </div>
          <div className="nw-metric-row">
            <span className="nw-big-amount">{won(displayPoint.netWorth)}</span>
            <div className={`nw-growth-badge ${displayPoint.momChange >= 0 ? "up" : "down"}`}>
              {displayPoint.momChange >= 0 ? "▲" : "▼"} {won(Math.abs(displayPoint.momChange))} ({pct(displayPoint.momRate)})
              <span className="nw-growth-sub">전월 대비</span>
            </div>
          </div>
          <p className="muted nw-month-label">
            기준월: <strong>{displayPoint.month}</strong> · 총자산 {won(displayPoint.totalAssets)} · 부채 {won(displayPoint.debt)}
          </p>
        </div>

        <div className="nw-range-toggle">
          <button
            className={`pill-btn ${rangeMonths === 6 ? "on" : ""}`}
            onClick={() => setRangeMonths(6)}
          >
            최근 6개월
          </button>
          <button
            className={`pill-btn ${rangeMonths === 12 ? "on" : ""}`}
            onClick={() => setRangeMonths(12)}
          >
            최근 12개월
          </button>
        </div>
      </div>

      {/* 2. 인터랙티브 스택 바 시계열 차트 */}
      <div className="nw-chart-container">
        <div className="nw-chart-bars">
          {history.map((pt) => {
            const isSelected = pt.month === selectedMonth;
            const isHovered = hoveredPoint?.month === pt.month;
            const heights = calculateBarHeights(pt, maxScale);

            return (
              <div
                key={pt.month}
                className={`nw-bar-column ${isSelected ? "selected" : ""} ${isHovered ? "hovered" : ""}`}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={() => onSelectMonth?.(pt.month)}
              >
                {/* 바 스택 (상단부터 투자, 저축, 유동) */}
                <div className="nw-bar-stack">
                  {/* 순자산 꺾은선 앵커 닷 */}
                  <div
                    className="nw-dot-networth"
                    style={{ bottom: `${heights.netWorthH}%` }}
                    title={`순자산: ${won(pt.netWorth)}`}
                  ></div>

                  {/* 자산 스택 바 */}
                  <div className="nw-segment invested" style={{ height: `${heights.investedH}%` }}></div>
                  <div className="nw-segment savings" style={{ height: `${heights.savingsH}%` }}></div>
                  <div className="nw-segment liquid" style={{ height: `${heights.liquidH}%` }}></div>
                </div>

                {/* 하단 월 라벨 */}
                <span className="nw-bar-label">{pt.month.slice(5)}월</span>
              </div>
            );
          })}
        </div>

        {/* 차트 범례 (Legend) */}
        <div className="nw-legend">
          <span className="legend-item"><span className="legend-color liquid"></span>유동자산 (예금·현금)</span>
          <span className="legend-item"><span className="legend-color savings"></span>저축성자산 (적금·예금)</span>
          <span className="legend-item"><span className="legend-color invested"></span>투자자산 (주식·ETF)</span>
          <span className="legend-item"><span className="legend-color networth"></span>순자산 포인트</span>
        </div>
      </div>

      {/* 3. 자산 구성 배분율 프로그레스 & 보조 지표 */}
      <div className="nw-footer-grid">
        {/* 자산 배분 프로그레스 바 */}
        <div className="nw-alloc-card">
          <div className="alloc-header">
            <span className="muted">현재 포트폴리오 자산 배분</span>
            <span className="alloc-debt-tag">부채비율 {pct(debtRatio)}</span>
          </div>
          <div className="alloc-bar-track">
            <div className="alloc-fill liquid" style={{ width: `${allocation.liquidPct * 100}%` }} title={`유동: ${pct(allocation.liquidPct)}`}></div>
            <div className="alloc-fill savings" style={{ width: `${allocation.savingsPct * 100}%` }} title={`저축: ${pct(allocation.savingsPct)}`}></div>
            <div className="alloc-fill invested" style={{ width: `${allocation.investedPct * 100}%` }} title={`투자: ${pct(allocation.investedPct)}`}></div>
          </div>
          <div className="alloc-legend-row">
            <span>유동 <strong>{pct(allocation.liquidPct)}</strong></span>
            <span>저축 <strong>{pct(allocation.savingsPct)}</strong></span>
            <span>투자 <strong>{pct(allocation.investedPct)}</strong></span>
          </div>
        </div>

        {/* 핵심 부가 통계 */}
        <div className="nw-stats-card">
          <div className="nw-stat-item">
            <span className="muted">역대 최고 순자산 (Peak)</span>
            <strong>{won(peakNetWorth)}</strong>
          </div>
          <div className="nw-stat-item">
            <span className="muted">월평균 순자산 증가</span>
            <strong className={avgMonthlyGrowth >= 0 ? "up" : "down"}>
              {avgMonthlyGrowth >= 0 ? `+${won(avgMonthlyGrowth)}` : won(avgMonthlyGrowth)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
