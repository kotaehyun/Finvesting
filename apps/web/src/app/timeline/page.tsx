"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import type { TimelineTypeGroup, TimelineDateGroup, UnifiedFinancialEvent } from "@finvesting/core";

export default function TimelinePage() {
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-09");
  const [selectedType, setSelectedType] = useState<TimelineTypeGroup>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const queryInput = useMemo(() => {
    return {
      month: selectedMonth === "all" ? undefined : selectedMonth,
      typeGroup: selectedType,
      keyword: searchQuery.trim() || undefined,
    };
  }, [selectedMonth, selectedType, searchQuery]);

  const { data, isLoading } = trpc.timeline.list.useQuery(queryInput);

  const months = data?.availableMonths || ["2026-09", "2026-08"];
  const summary = data?.summary;
  const groups = data?.groups || [];
  const isFallback = data?.isFallback ?? false;

  const handlePrevMonth = () => {
    if (selectedMonth === "all") return;
    const idx = months.indexOf(selectedMonth);
    if (idx !== -1 && idx < months.length - 1) {
      const nextMonth = months[idx + 1];
      if (nextMonth) setSelectedMonth(nextMonth);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === "all") return;
    const idx = months.indexOf(selectedMonth);
    if (idx > 0) {
      const prevMonth = months[idx - 1];
      if (prevMonth) setSelectedMonth(prevMonth);
    }
  };

  return (
    <div className="timeline-page">
      {/* 1. 상단 타이틀 및 설명 헤더 */}
      <div className="timeline-header">
        <div>
          <h1 className="timeline-title">Financial Timeline</h1>
          <p className="timeline-desc">
            모든 금융 활동(통장 입출금 · 카드 지출 · 주식/ETF 체결 · 배당 · 적금 · 급여명세)의 시간순 통합 피드
          </p>
        </div>
        {isFallback && (
          <div className="timeline-fallback-badge">
            <span className="dot"></span>
            시연용 데모 데이터 표시 중 (실데이터 등록 시 자동 전환)
          </div>
        )}
      </div>

      {/* 2. 상단 4대 KPI 요약 바롬터 */}
      <div className="timeline-kpi-grid">
        <div className="timeline-kpi-card">
          <div className="timeline-kpi-label">
            <span className="kpi-icon in">🟢</span> 총 유입 (수입·배당)
          </div>
          <div className="timeline-kpi-val highlight-in">
            +{summary ? summary.totalIn.toLocaleString() : 0}
            <span className="unit">원</span>
          </div>
          <div className="timeline-kpi-sub">
            배당/이자 {summary ? summary.totalDividends.toLocaleString() : 0}원 포함
          </div>
        </div>

        <div className="timeline-kpi-card">
          <div className="timeline-kpi-label">
            <span className="kpi-icon out">🔴</span> 총 유출 (지출·납입)
          </div>
          <div className="timeline-kpi-val highlight-out">
            -{summary ? summary.totalOut.toLocaleString() : 0}
            <span className="unit">원</span>
          </div>
          <div className="timeline-kpi-sub">생활비, 카드대금, 적금 납입 합계</div>
        </div>

        <div className="timeline-kpi-card">
          <div className="timeline-kpi-label">
            <span className="kpi-icon invest">📈</span> 투자 체결액
          </div>
          <div className="timeline-kpi-val highlight-invest">
            {summary ? summary.totalInvested.toLocaleString() : 0}
            <span className="unit">원</span>
          </div>
          <div className="timeline-kpi-sub">주식·ETF 매수 체결 자산 전환액</div>
        </div>

        <div className="timeline-kpi-card">
          <div className="timeline-kpi-label">
            <span className="kpi-icon net">⚡</span> 순 현금흐름
          </div>
          <div
            className={`timeline-kpi-val ${
              (summary?.netFlow ?? 0) >= 0 ? "highlight-in" : "highlight-out"
            }`}
          >
            {(summary?.netFlow ?? 0) >= 0 ? "+" : ""}
            {summary ? summary.netFlow.toLocaleString() : 0}
            <span className="unit">원</span>
          </div>
          <div className="timeline-kpi-sub">총 유입 대비 유출 잔여 자금</div>
        </div>
      </div>

      {/* 3. 인터랙티브 컨트롤 바: 월 선택기, 유형 필터, 검색창 */}
      <div className="timeline-controls-card">
        {/* 월 선택 네비게이터 */}
        <div className="timeline-month-bar">
          <div className="month-selector">
            <button
              className="month-nav-btn"
              onClick={handlePrevMonth}
              disabled={selectedMonth === "all" || selectedMonth === months[months.length - 1]}
              title="이전 달"
            >
              ◀
            </button>
            <select
              className="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {months.map((m: string) => (
                <option key={m} value={m}>
                  {m.slice(0, 4)}년 {m.slice(5, 7)}월
                </option>
              ))}
              <option value="all">전체 기간 보기</option>
            </select>
            <button
              className="month-nav-btn"
              onClick={handleNextMonth}
              disabled={selectedMonth === "all" || selectedMonth === months[0]}
              title="다음 달"
            >
              ▶
            </button>
          </div>

          {/* 검색창 */}
          <div className="timeline-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="가맹점, 종목명, 메모, 계좌 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="timeline-search-input"
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery("")}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 유형 필터 탭 */}
        <div className="timeline-filter-tabs">
          <button
            className={`timeline-filter-tab ${selectedType === "all" ? "active" : ""}`}
            onClick={() => setSelectedType("all")}
          >
            전체 ({summary?.eventCount ?? 0})
          </button>
          <button
            className={`timeline-filter-tab ${selectedType === "cashflow" ? "active" : ""}`}
            onClick={() => setSelectedType("cashflow")}
          >
            💸 통장 입출금·소비
          </button>
          <button
            className={`timeline-filter-tab ${selectedType === "trade" ? "active" : ""}`}
            onClick={() => setSelectedType("trade")}
          >
            📊 주식·ETF 체결
          </button>
          <button
            className={`timeline-filter-tab ${selectedType === "income" ? "active" : ""}`}
            onClick={() => setSelectedType("income")}
          >
            🎁 배당·이자 수취
          </button>
          <button
            className={`timeline-filter-tab ${selectedType === "savings" ? "active" : ""}`}
            onClick={() => setSelectedType("savings")}
          >
            🏦 적금 납입
          </button>
          <button
            className={`timeline-filter-tab ${selectedType === "payroll" ? "active" : ""}`}
            onClick={() => setSelectedType("payroll")}
          >
            📑 급여 명세서
          </button>
        </div>
      </div>

      {/* 4. 타임라인 피드 뷰 */}
      {isLoading ? (
        <div className="timeline-loading-state">
          <div className="spinner"></div>
          <p>금융 타임라인을 불러오는 중입니다...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="timeline-empty-state">
          <div className="empty-icon">📂</div>
          <h3>조회된 금융 이벤트가 없습니다</h3>
          <p>
            선택한 기간({selectedMonth === "all" ? "전체" : selectedMonth}) 또는 필터 조건에 해당하는 거래·체결 내역이
            없습니다.
          </p>
          <button
            className="empty-reset-btn"
            onClick={() => {
              setSelectedMonth(months[0] || "2026-09");
              setSelectedType("all");
              setSearchQuery("");
            }}
          >
            기본 필터로 초기화
          </button>
        </div>
      ) : (
        <div className="timeline-feed">
          {groups.map((group: TimelineDateGroup) => (
            <div key={group.date} className="timeline-date-group">
              {/* 일별 헤더 카드 */}
              <div className="timeline-date-header">
                <div className="timeline-date-title">
                  <span className="date-badge">
                    {group.date.slice(0, 4)}년 {group.date.slice(5, 7)}월 {group.date.slice(8, 10)}일
                  </span>
                  <span className="day-badge">({group.dayOfWeek})</span>
                </div>
                <div className="timeline-date-subtotal">
                  {group.subtotalIn > 0 && (
                    <span className="subtotal-in">+{group.subtotalIn.toLocaleString()}원</span>
                  )}
                  {group.subtotalOut > 0 && (
                    <span className="subtotal-out">-{group.subtotalOut.toLocaleString()}원</span>
                  )}
                </div>
              </div>

              {/* 일별 이벤트 목록 */}
              <div className="timeline-event-list">
                {group.events.map((ev: UnifiedFinancialEvent) => {
                  const isPositive = ev.direction === "in";
                  const isNegative = ev.direction === "out";

                  return (
                    <div key={ev.id} className={`timeline-event-card ${ev.type}`}>
                      {/* 이벤트 좌측 배지 & 시간 */}
                      <div className="event-badge-col">
                        <div className={`event-icon-badge ${ev.type}`}>
                          {ev.type === "income" && "💰"}
                          {ev.type === "expense" && "💳"}
                          {ev.type === "transfer" && "🔄"}
                          {ev.type === "trade_buy" && "📈"}
                          {ev.type === "trade_sell" && "📉"}
                          {ev.type === "dividend" && "💵"}
                          {ev.type === "interest" && "🪙"}
                          {ev.type === "savings_deposit" && "🏦"}
                          {ev.type === "payroll_statement" && "📜"}
                        </div>
                        <span className="event-time">{ev.time ? ev.time.slice(0, 5) : "—"}</span>
                      </div>

                      {/* 이벤트 본문 */}
                      <div className="event-body-col">
                        <div className="event-header-row">
                          <div className="event-title-wrap">
                            <span className="event-title">{ev.title}</span>
                            <span className={`event-type-tag ${ev.type}`}>
                              {ev.type === "income" && "수입"}
                              {ev.type === "expense" && "지출"}
                              {ev.type === "transfer" && "이체"}
                              {ev.type === "trade_buy" && "매수"}
                              {ev.type === "trade_sell" && "매도"}
                              {ev.type === "dividend" && "배당"}
                              {ev.type === "interest" && "이자"}
                              {ev.type === "savings_deposit" && "적금"}
                              {ev.type === "payroll_statement" && "급여명세"}
                            </span>
                          </div>

                          {/* 우측 금액 표시 */}
                          <div className="event-amount-wrap">
                            <span
                              className={`event-amount ${
                                isPositive ? "in" : isNegative ? "out" : "neutral"
                              }`}
                            >
                              {isPositive ? "+" : isNegative ? "-" : ""}
                              {ev.amount.toLocaleString()}
                              <span className="currency">원</span>
                            </span>
                            {ev.currency !== "KRW" && ev.originalAmount && (
                              <span className="event-original-amount">
                                {ev.originalAmount.toLocaleString()} {ev.currency}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 보조 정보: 부제, 계좌, 메모, 관련 링크 */}
                        <div className="event-meta-row">
                          <div className="event-tags">
                            {ev.accountName && (
                              <span className="event-meta-tag account">
                                🏛️ {ev.accountName}
                              </span>
                            )}
                            {ev.subtitle && (
                              <span className="event-meta-tag detail">{ev.subtitle}</span>
                            )}
                            {ev.category && ev.category !== "uncategorized" && (
                              <span className="event-meta-tag category">
                                #{ev.category}
                              </span>
                            )}
                            {ev.memo && (
                              <span className="event-meta-tag memo">💬 {ev.memo}</span>
                            )}
                          </div>

                          {/* 원본 화면 이동 링크 */}
                          <div className="event-link-wrap">
                            {ev.sourceType === "transaction" && (
                              <Link href="/accounts" className="event-origin-link">
                                통장내역 ↗
                              </Link>
                            )}
                            {ev.sourceType === "trade" && (
                              <Link href="/holdings" className="event-origin-link">
                                보유종목 ↗
                              </Link>
                            )}
                            {ev.sourceType === "income" && (
                              <Link href="/profile?menu=invest" className="event-origin-link">
                                투자내역 ↗
                              </Link>
                            )}
                            {ev.sourceType === "savings" && (
                              <Link href="/profile?menu=savings" className="event-origin-link">
                                적금대장 ↗
                              </Link>
                            )}
                            {ev.sourceType === "payroll" && (
                              <Link href="/profile?menu=pay" className="event-origin-link">
                                급여상세 ↗
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
