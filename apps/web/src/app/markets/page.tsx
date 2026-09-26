"use client";
import { useEffect, useState } from "react";
import { FLOW_REF_LINKS, TA_LESSONS } from "@finvesting/core";
import { trpc } from "@/lib/trpc";
import { TvEmbed } from "../invest/tv-embed";
import { SymbolSearch } from "../invest/symbol-search";

function useTvTheme() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setTheme(mq.matches ? "dark" : "light");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return theme;
}

function fmtAt(v: Date | string | null | undefined) {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MarketsPage() {
  const theme = useTvTheme();
  const infl = trpc.market.inflationMap.useQuery();
  const rates = trpc.market.policyRateMap.useQuery();
  const crypto = trpc.market.newsFeed.useQuery({ category: "crypto", limit: 8 });
  const fx = trpc.market.newsFeed.useQuery({ category: "fx", limit: 8 });
  const [open, setOpen] = useState<string | null>("volume");

  const volMap = {
    dataSource: "SPX500",
    blockSize: "market_cap_basic",
    blockColor: "relative_volume_10d_calc",
    grouping: "sector",
    locale: "kr",
    colorTheme: theme,
    hasTopBar: true,
    isDataSetEnabled: true,
  };
  const cryptoMap = {
    dataSource: "Crypto",
    blockSize: "market_cap_calc",
    blockColor: "24h_close_change|5",
    locale: "kr",
    colorTheme: theme,
    hasTopBar: true,
  };
  const forexMap = {
    currencies: ["EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD", "CNY", "KRW"],
    colorTheme: theme,
    locale: "kr",
    isTransparent: false,
  };
  const taBtc = {
    interval: "1D",
    colorTheme: theme,
    isTransparent: false,
    symbol: "BITSTAMP:BTCUSD",
    showIntervalTabs: true,
    displayMode: "single",
    locale: "kr",
  };
  const taSpx = {
    ...taBtc,
    symbol: "SP:SPX", // FOREXCOM:SPXUSD 는 이 위젯에서 「데이터 없음」
  };

  return (
    <div className="markets-page">
      <div className="page-head">
        <div>
          <h1 style={{ marginBottom: 4 }}>시장</h1>
          <p className="muted" style={{ margin: 0 }}>
            거래량·수급·물가·금리·크립토·외환·기술분석을 한곳에 둡니다. 수급 숫자는 거래소 원문, 물가는 세계은행 연간 CPI, 금리는 BIS 정책금리, 히트맵은 TradingView입니다. 매매 권유가 아닙니다.
          </p>
        </div>
        <div className="row">
          <a className="starter" href="/invest">투자 대시보드</a>
          <a className="starter" href="/news">뉴스</a>
        </div>
      </div>

      <SymbolSearch />

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>인플레이션 맵</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>
          세계은행 연간 소비자물가 상승률(%). {infl.data?.asOf ? `기준 연 ${infl.data.asOf.slice(0, 4)}` : "아직 수집 전"} · 국가 도형이 아니라 칸입니다.
        </p>
        {infl.isLoading && <p className="muted">불러오는 중…</p>}
        {infl.error && <p>오류: {infl.error.message}</p>}
        <div className="infl-grid">
          {(infl.data?.items ?? []).map((c) => (
            <div key={c.iso2} className={`infl-cell${c.tone ? ` ${c.tone}` : ""}`}>
              <div className="muted">{c.label}</div>
              <div className="big" style={{ fontSize: 20 }}>
                {c.value != null ? `${c.value.toFixed(1)}%` : "—"}
              </div>
              {c.date && <div className="muted">{c.date.slice(0, 4)}</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>세계 금리 맵</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>
          BIS 중앙은행 정책금리(%). {rates.data?.asOf ? `기준 ${rates.data.asOf.slice(0, 7)}` : "아직 수집 전"} · 국가 도형이 아니라 칸입니다. 독일·프랑스·이탈리아는 국내 시계열이 끊겨 유로(ECB)를 씁니다.
        </p>
        {rates.isLoading && <p className="muted">불러오는 중…</p>}
        {rates.error && <p>오류: {rates.error.message}</p>}
        <div className="infl-grid">
          {(rates.data?.items ?? []).map((c) => (
            <div key={c.iso2} className={`infl-cell${c.tone ? ` ${c.tone}` : ""}`}>
              <div className="muted">{c.label}{c.via === "ecb" ? " · ECB" : ""}</div>
              <div className="big" style={{ fontSize: 20 }}>
                {c.value != null ? `${c.value.toFixed(2)}%` : "—"}
              </div>
              {c.date && <div className="muted">{c.date.slice(0, 7)}</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>거래량 히트맵</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>미국 주식 상대거래량(TradingView). 코스피 거래량은 이 그림에 없습니다.</p>
        {theme && <TvEmbed widget="stock-heatmap" config={volMap} height={380} lazy />}
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>외국인·기관 수급</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>
          네이버·HTS 숫자는 긁지 않습니다. 한국거래소 투자자별 거래실적 원문을 엽니다. 공공데이터 키가 생기면 우리 표로 옮깁니다.
        </p>
        <div className="starter-list">
          {FLOW_REF_LINKS.map((l) => (
            <a key={l.id} className="starter" href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
          ))}
        </div>
      </section>

      <div className="invest-board" style={{ marginBottom: 16 }}>
        <section className="card">
          <h3>크립토 히트맵</h3>
          <p className="muted">TradingView. 업비트 보유와 별개입니다.</p>
          {theme && <TvEmbed widget="crypto-coins-heatmap" config={cryptoMap} height={360} lazy />}
        </section>
        <section className="card">
          <h3>외환 히트맵</h3>
          <p className="muted">TradingView 통화 강약. 우리 환율 칸(Yahoo)과 별개입니다.</p>
          {theme && <TvEmbed widget="forex-heat-map" config={forexMap} height={360} lazy />}
        </section>
      </div>

      <div className="invest-board" style={{ marginBottom: 16 }}>
        <section className="card">
          <h3>크립토 뉴스</h3>
          <p className="muted">CoinDesk·Cointelegraph 제목·링크·요약.</p>
          {crypto.isLoading && <p className="muted">불러오는 중…</p>}
          <ul className="plain">
            {(crypto.data?.items ?? []).slice(0, 6).map((n) => (
              <li key={n.id} className="news-item">
                <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
                <div className="muted">{n.publisher} {fmtAt(n.publishedAt)}</div>
              </li>
            ))}
          </ul>
          {!crypto.isLoading && !(crypto.data?.items?.length) && <p className="muted">수집 전이면 worker RSS를 한 번 돌리세요.</p>}
        </section>
        <section className="card">
          <h3>외환 뉴스</h3>
          <p className="muted">FXStreet 제목·링크·요약.</p>
          {fx.isLoading && <p className="muted">불러오는 중…</p>}
          <ul className="plain">
            {(fx.data?.items ?? []).slice(0, 6).map((n) => (
              <li key={n.id} className="news-item">
                <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
                <div className="muted">{n.publisher} {fmtAt(n.publishedAt)}</div>
              </li>
            ))}
          </ul>
          {!fx.isLoading && !(fx.data?.items?.length) && <p className="muted">수집 전이면 worker RSS를 한 번 돌리세요.</p>}
        </section>
      </div>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>기술분석</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>TradingView 요약 + 우리 설명. 신호로 쓰지 마세요.</p>
        <div className="invest-board">
          {theme && <TvEmbed widget="technical-analysis" config={taSpx} height={400} lazy />}
          {theme && <TvEmbed widget="technical-analysis" config={taBtc} height={400} lazy />}
        </div>
        <div className="fold-tabs" role="tablist" aria-label="기술 설명" style={{ marginTop: 12 }}>
          {TA_LESSONS.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`starter${open === l.id ? " on" : ""}`}
              onClick={() => setOpen((cur) => (cur === l.id ? null : l.id))}
            >
              {l.title}
            </button>
          ))}
        </div>
        {TA_LESSONS.filter((l) => l.id === open).map((l) => (
          <p key={l.id} style={{ marginTop: 12 }}>{l.body}</p>
        ))}
      </section>
    </div>
  );
}
