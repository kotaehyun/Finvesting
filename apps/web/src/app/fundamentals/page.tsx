"use client";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  FUNDAMENTAL_FIELDS,
  buildValuationTriangle,
  hasValuationTriangleMetrics,
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
import { ValuationTriangleChart } from "./valuation-triangle-chart";

type AssetFilter = "all" | "stock" | "etf";
type SortDirection = "asc" | "desc";
type FundTab = "triangle" | "board";

const ASSET_CLASS_LABELS: Record<string, string> = {
  all: "전체 자산",
  stock: "주식",
  etf: "ETF",
};

const MARKET_LABELS: Record<MarketRegion, string> = {
  all: "전체 시장",
  us: "미국",
  kr: "국내",
};

export default function FundamentalsPage() {
  const board = trpc.market.fundamentals.useQuery();
  const explain = trpc.market.explainFundamentals.useMutation();
  const [assetFilter, setAssetFilter] = useState<AssetFilter>("stock");
  const [marketFilter, setMarketFilter] = useState<MarketRegion>("all");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string>("date");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<FundTab>("triangle");
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
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? Number(va) - Number(vb) : Number(vb) - Number(va);
    });
    // 삼각 가능한 주식을 목록 위로 (메뉴에서 바로 고르기 쉽게)
    arr.sort((a, b) => {
      const aa = a.assetClass === "stock" && hasValuationTriangleMetrics(a) ? 0 : 1;
      const bb = b.assetClass === "stock" && hasValuationTriangleMetrics(b) ? 0 : 1;
      return aa - bb;
    });
    return arr;
  }, [filteredRows, sortKey, sortDir, marketFilter]);

  const stats = useMemo(() => {
    const stocks = sortedRows.filter((r) => r.assetClass === "stock");
    const validPer = stocks.map((r) => r.per).filter((n): n is number => n != null && n > 0);
    const validPbr = stocks.map((r) => r.pbr).filter((n): n is number => n != null && n > 0);
    const triangleOk = stocks.filter((r) => hasValuationTriangleMetrics(r)).length;
    const avgPer = validPer.length ? (validPer.reduce((a, b) => a + b, 0) / validPer.length).toFixed(1) : "—";
    const avgPbr = validPbr.length ? (validPbr.reduce((a, b) => a + b, 0) / validPbr.length).toFixed(2) : "—";
    return { avgPer, avgPbr, triangleOk, totalCount: sortedRows.length };
  }, [sortedRows]);

  const selected = useMemo(() => {
    if (selectedId) {
      const hit = sortedRows.find((r) => r.instrumentId === selectedId);
      if (hit) return hit;
    }
    return sortedRows.find((r) => r.assetClass === "stock" && hasValuationTriangleMetrics(r))
      ?? sortedRows[0]
      ?? null;
  }, [sortedRows, selectedId]);

  const triangle = useMemo(() => {
    if (!selected || selected.assetClass !== "stock") {
      return buildValuationTriangle({ roe: null, per: null, pbr: null });
    }
    const peers = sortedRows
      .filter((r) => r.assetClass === "stock")
      .map((r) => ({ roe: r.roe, per: r.per, pbr: r.pbr }));
    return buildValuationTriangle(
      { roe: selected.roe, per: selected.per, pbr: selected.pbr },
      peers,
    );
  }, [selected, sortedRows]);

  function toggleSort(key: string) {
    if (marketFilter === "all" && isMoneyFundamentalSortKey(key)) return;
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function sortIndicator(key: string) {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  const pathLabel = [
    MARKET_LABELS[marketFilter],
    ASSET_CLASS_LABELS[assetFilter],
    selected?.symbol,
  ].filter(Boolean).join(" · ");

  return (
    <div className="erp wehago">
      <div className="erp-titlebar">
        <h1>
          <span className="wehago-mark" aria-hidden>펀더</span>
          기업 숫자 한눈에
          <span className="path">Fundamentals · {pathLabel}</span>
        </h1>
        <div className="wehago-title-meta">
          <a href="/statements">재무제표</a>
          <a href="/tax">세금/연말정산</a>
          <a href="/accounting">돈 기록(전표)</a>
        </div>
      </div>

      <div className="erp-toolbar">
        {(["all", "us", "kr"] as const).map((id) => (
          <button
            key={id}
            type="button"
            className={marketFilter === id ? "primary" : ""}
            onClick={() => setMarketFilter(id)}
          >
            {MARKET_LABELS[id]}
          </button>
        ))}
        <span className="sep" />
        {(["stock", "etf", "all"] as const).map((id) => (
          <button
            key={id}
            type="button"
            className={assetFilter === id ? "primary" : ""}
            onClick={() => setAssetFilter(id)}
          >
            {ASSET_CLASS_LABELS[id]}
          </button>
        ))}
        <span className="sep" />
        <label>
          검색
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="AAPL, 005930…"
            aria-label="펀더멘털 종목 검색"
            autoComplete="off"
            style={{ width: 160, marginLeft: 6 }}
          />
        </label>
        <span className="sep" />
        <button
          type="button"
          className={tab === "triangle" ? "primary" : ""}
          onClick={() => setTab("triangle")}
        >
          ROE·PER·PBR 그림
        </button>
        <button
          type="button"
          className={tab === "board" ? "primary" : ""}
          onClick={() => setTab("board")}
        >
          숫자 표
        </button>
        <span className="sep" />
        <button
          type="button"
          className="primary"
          disabled={!selected || explain.isPending || loadStatus !== "ok"}
          onClick={() => {
            if (!selected) return;
            setTab("triangle");
            explain.mutate({ instrumentId: selected.instrumentId });
          }}
        >
          {explain.isPending ? "분석 중…" : "AI 분석"}
        </button>
        <span className="sep" />
        {fundamentalVenueLookups(marketFilter).map((s) => (
          <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="erp-toolbar-link">
            {s.label}
          </a>
        ))}
        <span className="erp-hint" style={{ margin: "0 0 0 auto" }}>
          하루 기준 숫자 · 자세한 공시 표는 재무제표
        </span>
      </div>

      {board.isLoading && <p className="erp-hint" style={{ padding: "8px 12px" }}>불러오는 중…</p>}
      {board.error && <p className="erp-caution" style={{ margin: 8 }}>오류: {board.error.message}</p>}
      {loadStatus === "unavailable" && (
        <p className="erp-caution" style={{ margin: 8 }}>DB 연결 불가. 고정 샘플은 쓰지 않습니다.</p>
      )}
      {loadStatus === "empty" && (
        <p className="erp-hint" style={{ padding: "8px 12px" }}>
          수집된 펀더멘털이 없습니다. `pnpm --filter @finvesting/worker run:once`
        </p>
      )}

      {loadStatus === "ok" && (
        <div className="erp-body statements-erp-body">
          <nav className="erp-menu statements-menu" aria-label="펀더멘털 종목">
            <h2>종목 · {sortedRows.length}</h2>
            <div className="statements-tree">
              {!sortedRows.length && (
                <p className="erp-hint" style={{ padding: "8px 12px", color: "#9bb8cc" }}>필터에 맞는 종목 없음</p>
              )}
              {sortedRows.map((r) => {
                const on = selected?.instrumentId === r.instrumentId;
                return (
                  <button
                    key={r.instrumentId}
                    type="button"
                    className={`lv3 fund-menu-item${on ? " on" : ""}`}
                    onClick={() => {
                      setSelectedId(r.instrumentId);
                      setTab("triangle");
                      explain.reset();
                    }}
                    title={r.name}
                  >
                    <span className="fund-menu-sym">{r.symbol}</span>
                    <span className="fund-menu-name">{r.name}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="erp-work">
            {!sortedRows.length ? (
              <p className="erp-hint" style={{ padding: 12 }}>선택한 필터에 맞는 종목이 없습니다.</p>
            ) : tab === "triangle" && selected ? (
              <>
                <p className="erp-plain-lead">
                  한눈에: 회사가 얼마나 벌고(ROE)·주가가 비싼지(PER·PBR)를 그림으로 봅니다. 투자 점수가 아닙니다.
                </p>
                <div className="wehago-kpis fund-compact-kpi">
                  <div className="wehago-kpi">
                    <span className="k">종목 수</span>
                    <span className="v">{stats.totalCount}</span>
                  </div>
                  <div className="wehago-kpi">
                    <span className="k">평균 주가수익비율(P/E)</span>
                    <span className="v">{stats.avgPer}</span>
                  </div>
                  <div className="wehago-kpi">
                    <span className="k">평균 주가순자산(P/B)</span>
                    <span className="v">{stats.avgPbr}</span>
                  </div>
                  <div className="wehago-kpi">
                    <span className="k">그림 가능한 종목</span>
                    <span className="v">{stats.triangleOk}</span>
                  </div>
                </div>

                <div className="statements-erp-main fund-triangle-layout">
                  <div className="erp-panel" style={{ padding: "8px 12px" }}>
                    <ValuationTriangleChart
                      title={`${selected.symbol} · ${selected.name}`}
                      triangle={
                        selected.assetClass !== "stock"
                          ? {
                              status: "empty",
                              axes: [],
                              scaleNote: "이 그림은 주식만 그립니다. 숫자 표를 보세요.",
                            }
                          : triangle
                      }
                      currency={selected.currency}
                      derived={Boolean(selected.extra.perDerived || selected.extra.pbrDerived)}
                    />

                    <SelectedFundDetail row={selected} />
                  </div>

                  <aside className="statements-erp-side" aria-label="선택 종목">
                    <div className="statements-side-card">
                      <h3>고른 종목</h3>
                      <div className="body">
                        <table className="erp-props">
                          <tbody>
                            <tr><th>코드</th><td className="ro">{selected.symbol}</td></tr>
                            <tr><th>시장</th><td className="ro">{selected.market}</td></tr>
                            <tr><th>기준일</th><td className="ro">{selected.date}</td></tr>
                            <tr><th>P/E</th><td className="ro num">{cell("per", selected.per, selected.currency)}</td></tr>
                            <tr><th>P/B</th><td className="ro num">{cell("pbr", selected.pbr, selected.currency)}</td></tr>
                            <tr><th>ROE</th><td className="ro num">{cell("roe", selected.roe, selected.currency)}</td></tr>
                            <tr><th>시총</th><td className="ro num">{cell("marketCap", selected.marketCap, selected.currency)}</td></tr>
                            <tr><th>배당</th><td className="ro num">{cell("dividendYield", selected.dividendYield, selected.currency)}</td></tr>
                          </tbody>
                        </table>
                        {(selected.extra.perDerived || selected.extra.pbrDerived) && (
                          <p className="erp-hint">빈 P/E·P/B는 시총·순이익·ROE로 채운 추정값입니다.</p>
                        )}
                        <div className="erp-slip">
                          <button
                            type="button"
                            className="primary"
                            disabled={explain.isPending}
                            onClick={() => explain.mutate({ instrumentId: selected.instrumentId })}
                          >
                            {explain.isPending ? "분석 중…" : "AI 분석"}
                          </button>
                          {fundamentalLookups(selected.symbol, selected.market).map((l) => (
                            <a key={l.id} href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
                          ))}
                          <a href={`/statements?q=${encodeURIComponent(selected.symbol)}`}>재무제표</a>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>

                {explain.error && (
                  <p className="erp-caution" style={{ margin: "8px 12px" }}>오류: {explain.error.message}</p>
                )}
                {explain.data?.status === "unavailable" && (
                  <p className="erp-caution" style={{ margin: "8px 12px" }}>
                    로컬 AI를 쓸 수 없습니다. {explain.data.reason}
                  </p>
                )}
                {explain.data?.status === "ok" && (
                  <div className="erp-panel" style={{ padding: "8px 12px 16px" }}>
                    <h3>
                      AI 분석 · {explain.data.provider} · {explain.data.symbol} · {explain.data.date}
                    </h3>
                    <p className="erp-hint">저장된 스냅샷 숫자만 읽습니다. 매수·매도 권유가 아닙니다.</p>
                    <div className="md erp-memo" style={{ minHeight: 120 }}>
                      <ReactMarkdown>{explain.data.reading}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="erp-panel" style={{ padding: 12 }}>
                <p className="erp-plain-lead">한눈에: 여러 종목 숫자를 표로 비교합니다. 행을 누르면 그림 화면으로 갑니다.</p>
                <h3>숫자 표 · {sortedRows.length}종</h3>
                <p className="erp-hint">행을 누르면 ROE·PER·PBR 그림으로 이동합니다.</p>
                <div className="table-wrap">
                  <table className="erp-grid fund-erp-table">
                    <thead>
                      <tr>
                        <th>
                          <button type="button" className="link" onClick={() => toggleSort("symbol")}>
                            종목{sortIndicator("symbol")}
                          </button>
                        </th>
                        <th>
                          <button type="button" className="link" onClick={() => toggleSort("date")}>
                            기준일{sortIndicator("date")}
                          </button>
                        </th>
                        {FUNDAMENTAL_FIELDS.map((f) => (
                          <th key={f.id} className="num">
                            <button
                              type="button"
                              className="link"
                              onClick={() => toggleSort(f.id)}
                              disabled={marketFilter === "all" && isMoneyFundamentalSortKey(f.id)}
                            >
                              {f.label}{sortIndicator(f.id)}
                            </button>
                          </th>
                        ))}
                        <th className="num">52주</th>
                        <th className="num">
                          <button type="button" className="link" onClick={() => toggleSort("ytdReturn")}>
                            YTD{sortIndicator("ytdReturn")}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((r) => {
                        const signals = evaluateFundamentalSignals(r);
                        const rangePct = fiftyTwoWeekGauge(r);
                        const on = selected?.instrumentId === r.instrumentId;
                        return (
                          <tr
                            key={r.instrumentId}
                            className={on ? "sel on" : ""}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setSelectedId(r.instrumentId);
                              setTab("triangle");
                              explain.reset();
                            }}
                          >
                            <td className="ro">
                              <strong>{r.symbol}</strong>
                              <div className="erp-hint" style={{ margin: 0 }}>{r.name}</div>
                              {(r.extra.perDerived || r.extra.pbrDerived) && (
                                <span className="tax-tag accent" style={{ textTransform: "none" }}>시총추정</span>
                              )}
                              {signals.map((s) => (
                                <span key={s.id} className="fund-signal-tag info" style={{ marginLeft: 4 }}>{s.label}</span>
                              ))}
                            </td>
                            <td className="ro">{r.date}</td>
                            {FUNDAMENTAL_FIELDS.map((f) => (
                              <td key={f.id} className="ro num">{cell(f.id, r[f.id], r.currency)}</td>
                            ))}
                            <td className="ro num">{rangePct != null ? `${rangePct}%` : "—"}</td>
                            <td className="ro num">
                              {r.extra.ytdReturn != null
                                ? formatExtraValue("ytdReturn", r.extra.ytdReturn, r.currency)
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function cell(id: FundamentalFieldId, n: number | null, currency: string) {
  if (n == null) return "—";
  return formatFundamentalValue(id, n, currency);
}

const FIELD_LABEL_KO: Record<FundamentalFieldId, string> = {
  marketCap: "시가총액",
  per: "P/E",
  forwardPer: "예상 P/E",
  pbr: "P/B",
  eps: "EPS",
  roe: "ROE",
  dividendYield: "배당수익률",
  revenueTtm: "매출(TTM)",
  netIncomeTtm: "순이익(TTM)",
  debtToEquity: "D/E",
  beta: "베타",
};

const VALUATION_IDS: FundamentalFieldId[] = ["per", "forwardPer", "pbr", "roe", "dividendYield"];
const SIZE_IDS: FundamentalFieldId[] = ["marketCap", "revenueTtm", "netIncomeTtm", "eps", "debtToEquity", "beta"];

function SelectedFundDetail({ row }: { row: FundamentalBoardRow }) {
  const signals = evaluateFundamentalSignals(row);
  const rangePct = fiftyTwoWeekGauge(row);
  const cur = row.currency;

  return (
    <div className="statements-erp-grids fund-detail-grids" aria-label="선택 종목 상세">
      <section className="wehago-widget">
        <h3>비싸 보이나</h3>
        <table className="erp-props">
          <tbody>
            {VALUATION_IDS.map((id) => (
              <tr key={id}>
                <th>{FIELD_LABEL_KO[id]}</th>
                <td className="ro num">{cell(id, row[id], cur)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {signals.length > 0 && (
          <div className="fund-detail-signals">
            {signals.map((s) => (
              <span key={s.id} className={`fund-signal-tag ${s.tone}`}>{s.label}</span>
            ))}
          </div>
        )}
        {(row.extra.perDerived || row.extra.pbrDerived) && (
          <p className="erp-hint" style={{ margin: "6px 10px 8px" }}>시총추정 PER·PBR 포함</p>
        )}
      </section>

      <section className="wehago-widget">
        <h3>회사 규모·이익</h3>
        <table className="erp-props">
          <tbody>
            {SIZE_IDS.map((id) => (
              <tr key={id}>
                <th>{FIELD_LABEL_KO[id]}</th>
                <td className="ro num">{cell(id, row[id], cur)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="wehago-widget">
        <h3>주가 위치</h3>
        <table className="erp-props">
          <tbody>
            <tr>
              <th>현재가</th>
              <td className="ro num">
                {row.lastPrice != null
                  ? `${row.lastPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${cur}`
                  : "—"}
              </td>
            </tr>
            <tr>
              <th>가격일</th>
              <td className="ro">{row.lastPriceDate ?? "—"}</td>
            </tr>
            <tr>
              <th>YTD</th>
              <td className="ro num">
                {row.extra.ytdReturn != null
                  ? formatExtraValue("ytdReturn", row.extra.ytdReturn, cur)
                  : "—"}
              </td>
            </tr>
            <tr>
              <th>평균거래량</th>
              <td className="ro num">
                {row.extra.averageVolume != null
                  ? formatExtraValue("averageVolume", row.extra.averageVolume, cur)
                  : "—"}
              </td>
            </tr>
            <tr>
              <th>52주 저</th>
              <td className="ro num">
                {row.extra.fiftyTwoWeekLow != null
                  ? row.extra.fiftyTwoWeekLow.toLocaleString("en-US", { maximumFractionDigits: 2 })
                  : "—"}
              </td>
            </tr>
            <tr>
              <th>52주 고</th>
              <td className="ro num">
                {row.extra.fiftyTwoWeekHigh != null
                  ? row.extra.fiftyTwoWeekHigh.toLocaleString("en-US", { maximumFractionDigits: 2 })
                  : "—"}
              </td>
            </tr>
          </tbody>
        </table>
        {rangePct != null && (
          <div className="fund-range-wrap" style={{ margin: "8px 10px 10px" }}>
            <div className="erp-hint" style={{ margin: "0 0 4px" }}>52주 구간 {rangePct}%</div>
            <div className="fund-range-bar" aria-label={`52주 구간 ${rangePct}%`}>
              <div className="fund-range-fill" style={{ width: `${rangePct}%` }} />
            </div>
          </div>
        )}
        {row.assetClass === "etf" && (
          <table className="erp-props">
            <tbody>
              <tr>
                <th>보수</th>
                <td className="ro num">
                  {row.extra.netExpenseRatio != null
                    ? formatExtraValue("netExpenseRatio", row.extra.netExpenseRatio, cur)
                    : "—"}
                </td>
              </tr>
              <tr>
                <th>순자산</th>
                <td className="ro num">
                  {row.extra.netAssets != null
                    ? formatExtraValue("netAssets", row.extra.netAssets, cur)
                    : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
