"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FUNDAMENTAL_FIELDS,
  evaluateFundamentalSignals,
  fiftyTwoWeekPosition,
  formatExtraValue,
  formatFundamentalValue,
  isKoreanSymbol,
  marketRegionFor,
  naverStockUrl,
  statementsUrl,
  yahooQuoteUrl,
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
  const [sortKey, setSortKey] = useState<string>("marketCap");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const filteredRows = useMemo(() => {
    const items: FundamentalBoardRow[] = board.data ?? [];
    const needle = q.trim().toLowerCase();

    return items.filter((r) => {
      if (assetFilter !== "all" && r.assetClass !== assetFilter) return false;
      if (marketFilter !== "all" && marketRegionFor(r.symbol, r.market) !== marketFilter) return false;
      if (!needle) return true;
      return `${r.symbol} ${r.name} ${r.market}`.toLowerCase().includes(needle);
    });
  }, [board.data, assetFilter, marketFilter, q]);

  const sortedRows = useMemo(() => {
    const arr = [...filteredRows];
    arr.sort((a, b) => {
      let va: number | string | null | undefined = null;
      let vb: number | string | null | undefined = null;

      if (sortKey === "symbol") {
        va = a.symbol;
        vb = b.symbol;
      } else if (sortKey === "date") {
        va = a.date;
        vb = b.date;
      } else if (sortKey === "ytdReturn") {
        va = a.extra.ytdReturn;
        vb = b.extra.ytdReturn;
      } else if (sortKey === "netExpenseRatio") {
        va = a.extra.netExpenseRatio;
        vb = b.extra.netExpenseRatio;
      } else {
        va = (a as Record<string, unknown>)[sortKey] as number | null | undefined;
        vb = (b as Record<string, unknown>)[sortKey] as number | null | undefined;
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
  }, [filteredRows, sortKey, sortDir]);

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
        Yahoo Finance 공식 일간 스냅샷 기반 밸류에이션 분석 터미널입니다.
        DART 및 SEC 정기보고서 전문과 외부 감사인의 감사의견은 Statements에서 확인하실 수 있습니다.
      </p>
      <InvestTrail current="fundamentals" />

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

      {board.isLoading && <p className="muted">데이터를 동기화하고 있습니다…</p>}
      {board.error && <p className="warn">오류가 발생했습니다: {board.error.message}</p>}

      {board.data && !board.data.length && (
        <div className="card" style={{ padding: 24, textAlign: "center", margin: "20px 0" }}>
          <p className="muted" style={{ fontSize: 15, marginBottom: 12 }}>
            수집된 펀더멘털 스냅샷이 없습니다. 관심 종목을 추가하거나 worker를 기동해 주세요.
          </p>
          <p className="muted" style={{ fontSize: 13 }}>
            <code>pnpm --filter @finvesting/worker run:once</code> 명령어로 시세를 즉시 수집할 수 있습니다.
          </p>
        </div>
      )}

      {board.data && board.data.length > 0 && !sortedRows.length && (
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
                const naverUrl = naverStockUrl(r.symbol);
                const stUrl = statementsUrl(r.symbol);
                const chatPrompt = `${r.name}(${r.symbol})의 펀더멘털 수치와 밸류에이션을 분석하고 투자 매력도를 평가해줘.`;

                const low = r.extra.fiftyTwoWeekLow;
                const high = r.extra.fiftyTwoWeekHigh;
                const rangePct = fiftyTwoWeekPosition(low, high, low != null && high != null ? (low + high) / 2 : undefined);

                return (
                  <tr key={r.instrumentId}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                        <a href={yahooQuoteUrl(r.symbol)} target="_blank" rel="noreferrer" style={{ fontWeight: 700, fontSize: 15 }}>
                          {r.symbol}
                        </a>
                        {naverUrl && (
                          <a href={naverUrl} target="_blank" rel="noreferrer" className="fund-link-pill" title="네이버 증권 시세 바로가기">
                            네이버
                          </a>
                        )}
                        <Link href={stUrl} className="fund-link-pill" title="DART/EDGAR 재무제표 및 감사의견 열람">
                          재무제표
                        </Link>
                        <Link href={`/chat?q=${encodeURIComponent(chatPrompt)}`} className="fund-link-pill" title="AI 투자비서에게 종목 분석 질문">
                          AI 분석
                        </Link>
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
                          <div className="fund-range-bar" title={`52주 범위 내 위치: 약 ${rangePct}%`}>
                            <div className="fund-range-fill" style={{ width: `${rangePct}%` }} />
                          </div>
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
