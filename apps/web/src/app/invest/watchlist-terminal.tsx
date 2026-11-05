"use client";

import { useMemo, useState } from "react";
import {
  filterWatchlist,
  formatChangePct,
  sortWatchlist,
  summarizeWatchlist,
  type WatchlistItem,
  type WatchlistMarketFilter,
  type WatchlistSortKey,
} from "@finvesting/core";
import { trpc } from "@/lib/trpc";

const PRESET_STOCKS = [
  { symbol: "005930", name: "삼성전자", market: "KRX", assetClass: "stock", currency: "KRW" },
  { symbol: "000660", name: "SK하이닉스", market: "KRX", assetClass: "stock", currency: "KRW" },
  { symbol: "360750", name: "TIGER 미국S&P500", market: "KRX", assetClass: "etf", currency: "KRW" },
  { symbol: "AAPL", name: "Apple Inc.", market: "NASDAQ", assetClass: "stock", currency: "USD" },
  { symbol: "NVDA", name: "NVIDIA Corp.", market: "NASDAQ", assetClass: "stock", currency: "USD" },
  { symbol: "BTC-USD", name: "비트코인", market: "UPBIT", assetClass: "crypto", currency: "KRW" },
] as const;

function fmtMoney(n: number | null | undefined, currency: string) {
  if (n == null || !Number.isFinite(n)) return "-";
  if (currency === "KRW") {
    return `${Math.round(n).toLocaleString("ko-KR")}원`;
  }
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function fmtVolume(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return "-";
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억주`;
  if (v >= 10000) return `${(v / 10000).toFixed(1)}만주`;
  return `${v.toLocaleString("ko-KR")}주`;
}

function fmtMarketCap(v: number | null | undefined, currency: string) {
  if (v == null || !Number.isFinite(v)) return null;
  if (currency === "KRW") {
    if (v >= 1_000_000_000_000) return `${(v / 1_000_000_000_000).toFixed(1)}조원`;
    if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(0)}억원`;
  } else {
    if (v >= 1_000_000_000_000) return `$${(v / 1_000_000_000_000).toFixed(2)}T`;
    if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  }
  return null;
}

export function WatchlistTerminal() {
  const watch = trpc.market.watchlist.useQuery();
  const remove = trpc.market.watchRemove.useMutation();
  const updateNote = trpc.market.watchUpdateNote.useMutation();
  const addPreset = trpc.market.watchAddPreset.useMutation();
  const utils = trpc.useUtils();

  const [marketFilter, setMarketFilter] = useState<WatchlistMarketFilter>("all");
  const [sortKey, setSortKey] = useState<WatchlistSortKey>("added_desc");
  const [searchQuery, setSearchQuery] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const rawItems = (watch.data ?? []) as WatchlistItem[];

  const filteredItems = useMemo(() => {
    const filtered = filterWatchlist(rawItems, {
      market: marketFilter,
      query: searchQuery,
    });
    return sortWatchlist(filtered, sortKey);
  }, [rawItems, marketFilter, searchQuery, sortKey]);

  const summary = useMemo(() => summarizeWatchlist(rawItems), [rawItems]);

  const watchedSymbolSet = useMemo(
    () => new Set(rawItems.map((item) => `${item.symbol}|${item.market}`)),
    [rawItems],
  );

  function startEditNote(item: WatchlistItem) {
    setEditingId(item.id);
    setNoteDraft(item.note ?? "");
  }

  async function handleSaveNote(id: string) {
    try {
      await updateNote.mutateAsync({ id, note: noteDraft });
      setEditingId(null);
      await utils.market.watchlist.invalidate();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function handleAddPreset(preset: (typeof PRESET_STOCKS)[number]) {
    try {
      const res = await addPreset.mutateAsync({
        symbol: preset.symbol,
        market: preset.market,
        name: preset.name,
        assetClass: preset.assetClass,
        currency: preset.currency,
      });
      setMsg(res.already ? `${res.symbol}은 이미 등록되어 있습니다.` : `${res.name}(${res.symbol})을 관심 종목에 추가했습니다.`);
      await utils.market.watchlist.invalidate();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function handleRemove(id: string, name: string) {
    if (!confirm(`'${name}' 종목을 관심 목록에서 삭제하시겠습니까?`)) return;
    try {
      await remove.mutateAsync({ id });
      await utils.market.watchlist.invalidate();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <section className="card" style={{ marginBottom: 16 }}>
      {/* 1. 상단 바: 타이틀 & 마켓 서머리 바롬터 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--fg)" }}>
            관심 종목 터미널 (Watchlist Terminal)
          </h3>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            2단계 Market Terminal: 관심 종목의 전일대비 등락률, 펀더멘털 스냅샷, 관련 뉴스 매핑 및 분석 메모를 실시간 관리합니다.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, fontSize: 13, background: "var(--bg)", padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
            <span>전체 <strong>{summary.total}</strong></span>
            <span style={{ color: "#dc2626" }}>▲ 상승 <strong>{summary.upCount}</strong></span>
            <span style={{ color: "#2563eb" }}>▼ 하락 <strong>{summary.downCount}</strong></span>
            <span style={{ color: "var(--muted)" }}>보합 <strong>{summary.flatCount}</strong></span>
          </div>
          <button
            type="button"
            className="starter"
            style={{ padding: "6px 12px", fontSize: 12 }}
            onClick={() => utils.market.watchlist.invalidate()}
            disabled={watch.isFetching}
          >
            {watch.isFetching ? "새로고침 중…" : "🔄 시세 새로고침"}
          </button>
        </div>
      </div>

      {/* 2. 인기 추천 종목 퀵 추가 칩 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14, padding: "8px 12px", background: "var(--bg)", borderRadius: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>추천 프리셋:</span>
        {PRESET_STOCKS.map((preset) => {
          const isAdded = watchedSymbolSet.has(`${preset.symbol}|${preset.market}`);
          return (
            <button
              key={preset.symbol}
              type="button"
              disabled={isAdded || addPreset.isPending}
              onClick={() => handleAddPreset(preset)}
              style={{
                fontSize: 12,
                padding: "3px 8px",
                borderRadius: 6,
                background: isAdded ? "transparent" : "var(--card)",
                color: isAdded ? "var(--muted)" : "var(--fg)",
                border: "1px solid var(--border)",
                cursor: isAdded ? "default" : "pointer",
                opacity: isAdded ? 0.6 : 1,
              }}
            >
              {isAdded ? `✓ ${preset.name}` : `+ ${preset.name}`}
            </button>
          );
        })}
      </div>

      {/* 3. 필터 & 정렬 & 검색 컨트롤 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(
            [
              ["all", "전체"],
              ["KRX", "국내 (KRX)"],
              ["US", "해외 (미국)"],
              ["UPBIT", "가상자산 (UPBIT)"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`starter${marketFilter === key ? " on" : ""}`}
              style={{ padding: "5px 10px", fontSize: 12 }}
              onClick={() => setMarketFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="심볼, 종목명, 메모 검색…"
            style={{ padding: "6px 10px", fontSize: 13, width: 170 }}
          />

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as WatchlistSortKey)}
            style={{ padding: "6px 10px", fontSize: 12 }}
          >
            <option value="added_desc">최신 등록순</option>
            <option value="change_desc">등락률 높은순 (상승)</option>
            <option value="change_asc">등락률 낮은순 (하락)</option>
            <option value="name_asc">종목명 가나다순</option>
          </select>
        </div>
      </div>

      {msg && (
        <div style={{ padding: "8px 12px", background: "var(--user)", borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
          {msg}
        </div>
      )}

      {/* 4. 메인 리스트 테이블 / 카드 */}
      {watch.isLoading && <p className="muted">관심 종목을 불러오는 중…</p>}
      {watch.error && <p style={{ color: "#dc2626" }}>오류: {watch.error.message}</p>}

      {watch.data && filteredItems.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 16px", border: "1px dashed var(--border)", borderRadius: 8 }}>
          <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600 }}>등록된 관심 종목이 없습니다.</p>
          <p className="muted" style={{ margin: "0 0 16px" }}>
            상단 [추천 프리셋] 버튼을 누르거나, 아래 [기업 검색]에서 종목을 검색하여 등록해보세요!
          </p>
        </div>
      )}

      {filteredItems.length > 0 && (
        <div style={{ display: "grid", gap: 10 }}>
          {filteredItems.map((item) => {
            const isEditing = editingId === item.id;
            const isNewsOpen = expandedNewsId === item.id;
            const changePct = item.changePct;
            const hasChange = changePct != null;
            const isUp = hasChange && changePct > 0;
            const isDown = hasChange && changePct < 0;

            const changeColor = isUp ? "#dc2626" : isDown ? "#2563eb" : "var(--muted)";
            const changeBg = isUp ? "rgba(220, 38, 38, 0.08)" : isDown ? "rgba(37, 99, 235, 0.08)" : "rgba(128, 128, 128, 0.08)";

            const naverUrl = item.market === "KRX" ? `https://finance.naver.com/item/main.naver?code=${item.symbol}` : null;
            const yahooUrl = `https://finance.yahoo.com/quote/${item.symbol}`;
            const dartUrl = item.market === "KRX" ? `https://dart.fss.or.kr/dsab007/main.do?textCrpNm=${encodeURIComponent(item.name)}` : null;

            const mcap = fmtMarketCap(item.marketCap, item.currency);

            return (
              <div
                key={item.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  background: "var(--card)",
                  transition: "border-color 0.15s ease",
                }}
              >
                {/* 1행: 종목 기본 정보 & 가격 & 등락률 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "var(--bg)", border: "1px solid var(--border)" }}>
                      {item.market}
                    </span>
                    <strong style={{ fontSize: 16 }}>{item.symbol}</strong>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</span>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {item.assetClass ? `· ${item.assetClass}` : ""}
                    </span>
                  </div>

                  {/* 가격 및 등락률 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "right" }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>
                        {fmtMoney(item.lastPrice, item.currency)}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>
                        {item.lastDate ? `${item.lastDate} 기준` : "시세 수집 대기"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        background: changeBg,
                        color: changeColor,
                        fontWeight: 700,
                        fontSize: 13,
                        minWidth: 70,
                        textAlign: "center",
                      }}
                    >
                      {formatChangePct(changePct)}
                    </div>
                  </div>
                </div>

                {/* 2행: 당일 고가/저가/거래량 & 펀더멘털 요약 */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12, margin: "8px 0 6px", color: "var(--muted)" }}>
                  {item.high != null && item.low != null && (
                    <span>
                      고가 {fmtMoney(item.high, item.currency)} · 저가 {fmtMoney(item.low, item.currency)}
                    </span>
                  )}
                  {item.volume != null && item.volume > 0 && (
                    <span>거래량 {fmtVolume(item.volume)}</span>
                  )}
                  {item.per != null && <span>PER <strong>{item.per.toFixed(1)}x</strong></span>}
                  {item.pbr != null && <span>PBR <strong>{item.pbr.toFixed(2)}x</strong></span>}
                  {item.roe != null && <span>ROE <strong>{(item.roe * 100).toFixed(1)}%</strong></span>}
                  {item.dividendYield != null && item.dividendYield > 0 && (
                    <span>배당 <strong>{(item.dividendYield * 100).toFixed(2)}%</strong></span>
                  )}
                  {mcap && <span>시총 {mcap}</span>}
                </div>

                {/* 3행: 사용자 투자 메모 인라인 에디터 */}
                <div style={{ marginTop: 6, padding: "6px 8px", background: "var(--bg)", borderRadius: 6, fontSize: 13 }}>
                  {isEditing ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        type="text"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="목표가, 매수/매도 검토 사유, 체크포인트 입력…"
                        style={{ flex: 1, padding: "4px 8px", fontSize: 12 }}
                        autoFocus
                      />
                      <button
                        type="button"
                        style={{ padding: "4px 10px", fontSize: 12 }}
                        onClick={() => handleSaveNote(item.id)}
                        disabled={updateNote.isPending}
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        className="starter"
                        style={{ padding: "4px 8px", fontSize: 12 }}
                        onClick={() => setEditingId(null)}
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: item.note ? "var(--fg)" : "var(--muted)" }}>
                        {item.note ? `📝 ${item.note}` : "✏️ 등록된 메모가 없습니다. 클릭하여 투자 노트를 추가하세요."}
                      </span>
                      <button
                        type="button"
                        className="link"
                        style={{ fontSize: 12, padding: "0 4px", color: "var(--accent)" }}
                        onClick={() => startEditNote(item)}
                      >
                        {item.note ? "수정" : "메모 추가"}
                      </button>
                    </div>
                  )}
                </div>

                {/* 4행: 하단 액션 바 (연관 뉴스 토글, 외부 링크, 삭제) */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 8, paddingTop: 6, borderTop: "1px solid var(--border)", fontSize: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {/* 뉴스 토글 버튼 */}
                    <button
                      type="button"
                      className="link"
                      style={{ fontSize: 12, fontWeight: 600, color: item.recentNews?.length ? "var(--accent)" : "var(--muted)" }}
                      onClick={() => setExpandedNewsId((cur) => (cur === item.id ? null : item.id))}
                    >
                      📰 관련 뉴스 {item.recentNews?.length ? `(${item.recentNews.length}건)` : "(0건)"} {isNewsOpen ? "▲" : "▼"}
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {naverUrl && (
                      <a href={naverUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "var(--muted)", fontSize: 12 }}>
                        네이버 증권 ↗
                      </a>
                    )}
                    <a href={yahooUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "var(--muted)", fontSize: 12 }}>
                      Yahoo Finance ↗
                    </a>
                    {dartUrl && (
                      <a href={dartUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "var(--muted)", fontSize: 12 }}>
                        DART 공시 ↗
                      </a>
                    )}
                    <button
                      type="button"
                      className="link"
                      style={{ color: "#dc2626", fontSize: 12, marginLeft: 6 }}
                      onClick={() => handleRemove(item.id, item.name)}
                      disabled={remove.isPending}
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {/* 아코디언 드로어: 관련 뉴스 목록 */}
                {isNewsOpen && (
                  <div style={{ marginTop: 10, padding: "8px 12px", background: "var(--bg)", borderRadius: 6, borderLeft: "3px solid var(--accent)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                      '{item.name}' 관련 최신 언론 보도
                    </div>
                    {item.recentNews && item.recentNews.length > 0 ? (
                      <ul className="plain" style={{ display: "grid", gap: 6 }}>
                        {item.recentNews.map((newsItem) => (
                          <li key={newsItem.id} style={{ fontSize: 13, lineHeight: 1.4 }}>
                            <a
                              href={newsItem.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ textDecoration: "none", color: "var(--fg)", fontWeight: 500 }}
                            >
                              • {newsItem.title}
                            </a>
                            <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>
                              {newsItem.publisher ?? "언론사"} · {newsItem.publishedAt ? newsItem.publishedAt.slice(0, 10) : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                        현재 수집된 기사 중 '{item.name}' 직접 언급 뉴스가 없습니다. (추가 수집 시 자동 연동됩니다)
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
