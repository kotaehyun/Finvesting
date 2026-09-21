"use client";
import { useEffect, useMemo, useState } from "react";
import {
  FUNDAMENTAL_FIELDS,
  evaluateFundamentalSignals,
  fiftyTwoWeekGauge,
  formatExtraValue,
  formatFundamentalValue,
  fundamentalLookups,
  fundamentalVenueLookups,
  isMoneyFundamentalSortKey,
  marketRegionFor,
  type FundamentalBoardRow,
  type FundamentalFieldId,
  type MarketRegion,
} from "@finvesting/core";
import { trpc } from "@/lib/trpc";
import { InvestTrail } from "../invest-trail";

type AssetFilter = "all" | "stock" | "etf";
type SortDirection = "asc" | "desc";

const ASSET_CLASS_LABELS: Record<string, string> = {
  all: "전체 자산",
  stock: "주식 (Stock)",
  etf: "ETF",
};

const MARKET_LABELS: Record<MarketRegion, string> = {
  all: "전체 시장",
  us: "미국 (US)",
  kr: "국내 (KRX)",
};

export default function FundamentalsPage() {
  const board = trpc.market.fundamentals.useQuery();
  const [assetFilter, setAssetFilter] = useState<AssetFilter>("all");
  const [marketFilter, setMarketFilter] = useState<MarketRegion>("all");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string>("date");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const rows: FundamentalBoardRow[] = board.data?.items ?? [];
  const loadStatus = board.data?.status;

  useEffect(() => {
    if (marketFilter === "all" && isMoneyFundamentalSortKey(sortKey)) {
      setSortKey("date");
      setSortDir("desc");
    }
  }, [marketFilter, sortKey]);

  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return rows.filter((r) => {
      if (assetFilter !== "all" && r.assetClass !== assetFilter) return false;
      if (marketFilter !== "all" && marketRegionFor(r.symbol, r.market) !== marketFilter) return false;
      if (!needle) return true;
      return `${r.symbol} ${r.name} ${r.market}`.toLowerCase().includes(needle);
    });
  }, [rows, assetFilter, marketFilter, q]);

  const sortedRows = useMemo(() => {
    const arr = [...filteredRows];
    const key = marketFilter === "all" && isMoneyFundamentalSortKey(sortKey) ? "date" : sortKey;
    arr.sort((a, b) => {
      let va: number | string | null | undefined = null;
      let vb: number | string | null | undefined = null;

      if (key === "symbol") {
        va = a.symbol;
        vb = b.symbol;
      } else if (key === "date") {
        va = a.date;
        vb = b.date;
      } else if (key === "ytdReturn") {
        va = a.extra.ytdReturn;
        vb = b.extra.ytdReturn;
      } else if (key === "netExpenseRatio") {
        va = a.extra.netExpenseRatio;
        vb = b.extra.netExpenseRatio;
      } else {
        va = (a as Record<string, unknown>)[key] as number | null | undefined;
        vb = (b as Record<string, unknown>)[key] as number | null | undefined;
      }

      // Nulls always sort to the end
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;

      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }

      const na = Number(va);
      const nb = Number(vb);
      return sortDir === "asc" ? na - nb : nb - na;
    });
    return arr;
  }, [filteredRows, sortKey, sortDir, marketFilter]);

  // 상단 4대 밸류에이션 통계 계산 (현재 표시 중인 주식 기준)
  const stats = useMemo(() => {
    const stocks = sortedRows.filter((r) => r.assetClass === "stock");
    const validPer = stocks.map((r) => r.per).filter((n): n is number => n != null && n > 0);
    const validPbr = stocks.map((r) => r.pbr).filter((n): n is number => n != null && n > 0);
    const validDiv = sortedRows.map((r) => r.dividendYield).filter((n): n is number => n != null && n > 0);
    const lowPbrCount = stocks.filter((r) => r.pbr != null && r.pbr > 0 && r.pbr < 1.0).length;

    const avgPer = validPer.length ? (validPer.reduce((a, b) => a + b, 0) / validPer.length).toFixed(1) : "—";
    const avgPbr = validPbr.length ? (validPbr.reduce((a, b) => a + b, 0) / validPbr.length).toFixed(2) : "—";
    const avgDiv = validDiv.length ? (validDiv.reduce((a, b) => a + b, 0) / validDiv.length).toFixed(2) : "—";

    return { avgPer, avgPbr, avgDiv, lowPbrCount, totalCount: sortedRows.length };
  }, [sortedRows]);

  function toggleSort(key: string) {
    if (marketFilter === "all" && isMoneyFundamentalSortKey(key)) return;
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function sortIndicator(key: string) {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  return (
    <div className="fund-page">
      <h1>Fundamentals · 기업 펀더멘털 대시보드</h1>
      <p className="muted">
        {marketFilter === "kr"
          ? "국내 종목 조회는 네이버 증권입니다. 표 숫자는 Yahoo 일 스냅샷입니다."
          : marketFilter === "us"
            ? "해외 종목 조회는 Yahoo Finance입니다. 표 숫자는 Yahoo 일 스냅샷입니다."
            : "국내는 네이버 증권, 해외는 Yahoo Finance로 조회합니다. 표 숫자는 Yahoo 일 스냅샷입니다."}
        {" "}공시 3표·감사의견은 재무제표 화면입니다.
        {marketFilter === "all" && " 전체 시장에서는 시총·매출·순익·EPS를 통화가 달라 크기 비교하지 않습니다. 미국 또는 국내 필터 후에 정렬하세요."}
      </p>
      <InvestTrail current="fundamentals" />
      <section className="card" style={{ margin: "0 0 16px" }}>
        <h3>펀더멘털 조회</h3>
        <p className="muted">
          {marketFilter === "kr"
            ? "한국 상장사만 네이버 시세와 카카오페이증권 홈으로 엽니다. Yahoo·EDGAR는 붙이지 않습니다."
            : marketFilter === "us"
              ? "미국·해외 종목만 Yahoo로 엽니다. 네이버·DART·카카오페이증권은 붙이지 않습니다."
              : "시장 필터로 국내·해외 조회 창구가 갈립니다. 카카오(035720)는 수집 기본 종목입니다."}
        </p>
        <div className="starter-list">
          {fundamentalVenueLookups(marketFilter).map((s) => (
            <a key={s.id} className="starter" href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
          ))}
        </div>
      </section>

      {/* 1. 상단 4대 밸류에이션 바롬터 KPI 카드 */}
      <div className="fund-kpi-grid">
        <div className="fund-kpi-card">
          <div className="fund-kpi-title">
            <span>📊</span> 평균 P/E (주가수익비율)
          </div>
          <div className="fund-kpi-val highlight">{stats.avgPer}배</div>
          <p className="fund-kpi-sub">표시 주식 평균 PER (동일 가중)</p>
        </div>

        <div className="fund-kpi-card">
          <div className="fund-kpi-title">
            <span>🏷️</span> 평균 P/B (주가순자산비율)
          </div>
          <div className="fund-kpi-val">{stats.avgPbr}배</div>
          <p className="fund-kpi-sub">순자산가치 대비 평가 배수</p>
        </div>

        <div className="fund-kpi-card">
          <div className="fund-kpi-title">
            <span>💰</span> 평균 배당수익률
          </div>
          <div className="fund-kpi-val" style={{ color: "#10b981" }}>{stats.avgDiv}%</div>
          <p className="fund-kpi-sub">배당 지급 종목 기준 평균 수익률</p>
        </div>

        <div className="fund-kpi-card">
          <div className="fund-kpi-title">
            <span>💎</span> 저PBR 기업 (PBR &lt; 1.0)
          </div>
          <div className="fund-kpi-val" style={{ color: "#3b82f6" }}>{stats.lowPbrCount}개사</div>
          <p className="fund-kpi-sub">청산가치 이하 저평가 밸류업 대상</p>
        </div>
      </div>

      {/* 2. 인터랙티브 필터 컨트롤 바 */}
      <div className="row" style={{ marginBottom: 14, gap: 10 }}>
        {/* 자산군 필터 */}
        <div className="row" style={{ gap: 4 }}>
          {(["all", "stock", "etf"] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={`starter${assetFilter === id ? " on" : ""}`}
              onClick={() => setAssetFilter(id)}
            >
              {ASSET_CLASS_LABELS[id]}
            </button>
          ))}
        </div>

        {/* 시장 필터 */}
        <div className="row" style={{ gap: 4 }}>
          {(["all", "us", "kr"] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={`starter${marketFilter === id ? " on" : ""}`}
              onClick={() => setMarketFilter(id)}
            >
              {MARKET_LABELS[id]}
            </button>
          ))}
        </div>

        {/* 검색 인풋 */}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="티커, 종목명, 시장 검색..."
          style={{ minWidth: 200, flex: 1 }}
        />
      </div>

      {board.isLoading && <p className="muted">데이터를 불러오는 중…</p>}
      {board.error && <p className="warn">오류가 발생했습니다: {board.error.message}</p>}
      {loadStatus === "unavailable" && (
        <div className="card" style={{ padding: 24, textAlign: "center", margin: "20px 0" }}>
          <p style={{ fontSize: 15, marginBottom: 8 }}>DB 연결 불가</p>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>펀더멘털 스냅샷을 불러올 수 없습니다. Postgres가 켜져 있는지 확인하세요. 고정 샘플은 쓰지 않습니다.</p>
        </div>
      )}
      {loadStatus === "empty" && (
        <div className="card" style={{ padding: 24, textAlign: "center", margin: "20px 0" }}>
          <p className="muted" style={{ fontSize: 15, marginBottom: 12 }}>
            수집된 펀더멘털 스냅샷이 없습니다. 관심 종목을 추가한 뒤 worker로 Yahoo를 모으세요.
          </p>
          <p className="muted" style={{ fontSize: 13 }}>
            <code>pnpm --filter @finvesting/worker run:once</code>
          </p>
        </div>
      )}

      {loadStatus === "ok" && !sortedRows.length && (
        <p className="muted">선택한 필터 조건에 부합하는 종목이 없습니다.</p>
      )}

      {/* 3. 펀더멘털 스냅샷 데이터 테이블 */}
      {!!sortedRows.length && (
        <div className="table-wrap">
          <table className="fund-table">
            <thead>
              <tr>
                <th>
                  <button type="button" className={`sort-btn${sortKey === "symbol" ? " active" : ""}`} onClick={() => toggleSort("symbol")}>
                    종목 / Ticker{sortIndicator("symbol")}
                  </button>
                </th>
                <th>
                  <button type="button" className={`sort-btn${sortKey === "date" ? " active" : ""}`} onClick={() => toggleSort("date")}>
                    기준일{sortIndicator("date")}
                  </button>
                </th>
                {FUNDAMENTAL_FIELDS.map((f) => (
                  <th key={f.id} className="num">
                    <button
                      type="button"
                      className={`sort-btn${sortKey === f.id ? " active" : ""}`}
                      onClick={() => toggleSort(f.id)}
                      disabled={marketFilter === "all" && isMoneyFundamentalSortKey(f.id)}
                      title={marketFilter === "all" && isMoneyFundamentalSortKey(f.id) ? "전체 시장에서는 통화가 다른 금액을 정렬하지 않습니다" : undefined}
                    >
                      {f.label}{sortIndicator(f.id)}
                    </button>
                  </th>
                ))}
                <th className="num">52주 가격대 (최저–최고)</th>
                <th className="num">
                  <button type="button" className={`sort-btn${sortKey === "ytdReturn" ? " active" : ""}`} onClick={() => toggleSort("ytdReturn")}>
                    YTD 수익률{sortIndicator("ytdReturn")}
                  </button>
                </th>
                <th className="num">
                  <button type="button" className={`sort-btn${sortKey === "netExpenseRatio" ? " active" : ""}`} onClick={() => toggleSort("netExpenseRatio")}>
                    총보수비율{sortIndicator("netExpenseRatio")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r) => {
                const signals = evaluateFundamentalSignals(r);
                const lookups = fundamentalLookups(r.symbol, r.market);
                const primary = lookups.find((l) => l.primary) ?? lookups[0];
                const extras = lookups.filter((l) => !l.primary);

                const low = r.extra.fiftyTwoWeekLow;
                const high = r.extra.fiftyTwoWeekHigh;
                const rangePct = fiftyTwoWeekGauge(r);

                return (
                  <tr key={r.instrumentId}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                        <a href={primary?.url} target="_blank" rel="noreferrer" style={{ fontWeight: 700, fontSize: 15 }}>
                          {r.symbol}
                        </a>
                        {extras.map((l) => (
                          <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="fund-link-pill" title={l.label}>
                            {l.label}
                          </a>
                        ))}
                      </div>

                      <div className="muted" style={{ marginTop: 2 }}>
                        {r.name} · {r.assetClass.toUpperCase()} · {r.market}
                      </div>

                      {/* 투자 신호 뱃지 */}
                      {signals.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          {signals.map((s) => (
                            <span key={s.id} className={`fund-signal-tag ${s.tone}`}>
                              {s.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="muted">{r.date}</td>

                    {FUNDAMENTAL_FIELDS.map((f) => (
                      <td key={f.id} className="num">
                        {cell(f.id, r[f.id], r.currency)}
                      </td>
                    ))}

                    <td className="num">
                      <div className="fund-range-wrap">
                        <span className="muted">
                          {low != null && high != null
                            ? `${low.toLocaleString("en-US")} – ${high.toLocaleString("en-US")}`
                            : "—"}
                        </span>
                        {rangePct != null && (
                          <>
                            <div
                              className="fund-range-bar"
                              title={`종가 ${r.lastPrice?.toLocaleString()} ${r.currency} · ${r.lastPriceDate ?? ""} · ${r.lastPriceSource ?? ""} · 52주 위치 ${rangePct}%`}
                            >
                              <div className="fund-range-fill" style={{ width: `${rangePct}%` }} />
                            </div>
                            <span className="muted" style={{ fontSize: 11 }}>
                              {r.lastPrice?.toLocaleString()} {r.currency}
                              {r.lastPriceDate ? ` · ${r.lastPriceDate}` : ""}
                              {r.lastPriceSource ? ` · ${r.lastPriceSource}` : ""}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="num">
                      {r.extra.ytdReturn != null ? (
                        <span className={r.extra.ytdReturn > 0 ? "up" : r.extra.ytdReturn < 0 ? "down" : ""}>
                          {formatExtraValue("ytdReturn", r.extra.ytdReturn, r.currency)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="num">
                      {r.extra.netExpenseRatio != null
                        ? formatExtraValue("netExpenseRatio", r.extra.netExpenseRatio, r.currency)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function cell(id: FundamentalFieldId, n: number | null, currency: string) {
  if (n == null) return "—";
  return formatFundamentalValue(id, n, currency);
}
