"use client";
import { useEffect, useState } from "react";
import { MARKET_REF_LINKS, tvTickerTapeSymbols } from "@finvesting/core";
import { trpc } from "@/lib/trpc";
import { TvEmbed } from "./tv-embed";

const TV = "https://s3.tradingview.com/external-embedding";

function useTvTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setTheme(mq.matches ? "dark" : "light");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return theme;
}

const pct = (n: number) => `${n >= 0 ? "+" : ""}${(n * 100).toFixed(2)}%`;
const num = (n: number, currency: string | null) =>
  `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}${currency ? ` ${currency}` : ""}`;

export default function InvestDashboard() {
  const theme = useTvTheme();
  const board = trpc.market.indexBoard.useQuery();
  const tape = {
    symbols: tvTickerTapeSymbols(),
    showSymbolLogo: true,
    colorTheme: theme,
    locale: "kr",
    isTransparent: false,
    displayMode: "adaptive",
  };
  const overview = {
    colorTheme: theme,
    locale: "kr",
    showChart: true,
    plotLineColorGrowing: "rgba(37, 99, 235, 1)",
    plotLineColorFalling: "rgba(220, 38, 38, 1)",
    tabs: [
      {
        title: "지수",
        symbols: tvTickerTapeSymbols().map((s) => ({ s: s.proName, d: s.title })),
      },
      {
        title: "환율",
        symbols: [
          { s: "FX_IDC:USDKRW", d: "USD/KRW" },
          { s: "FX:EURUSD", d: "EUR/USD" },
          { s: "FX:USDJPY", d: "USD/JPY" },
        ],
      },
    ],
  };
  const heatmap = {
    dataSource: "SPX500",
    blockSize: "market_cap_basic",
    blockColor: "change",
    grouping: "sector",
    locale: "kr",
    colorTheme: theme,
    exchanges: ["NASDAQ", "NYSE"],
    hasTopBar: true,
    isDataSetEnabled: true,
  };
  const screener = {
    market: "america",
    defaultColumn: "overview",
    defaultScreen: "most_capitalized",
    showToolbar: true,
    colorTheme: theme,
    locale: "kr",
  };
  const calendar = {
    colorTheme: theme,
    locale: "kr",
    importanceFilter: "-1,0,1",
    countryFilter: "kr,us,eu,jp,cn",
  };
  const symbols = {
    symbols: tvTickerTapeSymbols().slice(0, 6).map((s) => [s.proName, s.title]),
    chartOnly: false,
    locale: "kr",
    colorTheme: theme,
    autosize: true,
  };

  return (
    <div className="invest-page">
      <h1>투자 대시보드</h1>
      <p className="muted">
        세계 지수·차트·스크리너·경제캘린더는 TradingView 공식 위젯입니다. 숫자는 저장하지 않습니다.
        Investing.com·Finviz는 약관상 크롤링하지 않고 원문 링크만 둡니다. Seeking Alpha는 오피니언 RSS 제목만.
      </p>
      <div className="starter-list" style={{ margin: "12px 0 16px" }}>
        {MARKET_REF_LINKS.map((l) => (
          <a key={l.id} className="starter" href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
        ))}
        <a className="starter" href="/opinions">오피니언 대시보드</a>
        <a className="starter" href="/statements">재무제표</a>
      </div>

      <TvEmbed src={`${TV}/embed-widget-ticker-tape.js`} config={tape} height={72} />

      <section className="card" style={{ margin: "16px 0" }}>
        <h3>세계 지수 (Yahoo 수집)</h3>
        {board.isLoading && <p className="muted">불러오는 중…</p>}
        {board.error && <p>오류: {board.error.message}</p>}
        <div className="index-grid">
          {(board.data?.indices ?? []).map((i) => (
            <div key={i.id} className="index-cell">
              <div className="muted">{i.label}</div>
              <div className="big" style={{ fontSize: 20 }}>
                {i.close != null ? num(i.close, i.currency) : "—"}
              </div>
              <div className={i.changePct == null ? "muted" : i.changePct >= 0 ? "up" : "down"}>
                {i.changePct != null ? pct(i.changePct) : (i.close != null ? "전일 대비 없음" : "미수집")}
              </div>
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          worker Yahoo가 채웁니다. 비어 있으면 `pnpm --filter @finvesting/worker run:once` 후 다시 보세요. 실시간은 위 티커.
        </p>
      </section>

      <div className="invest-board">
        <section className="card">
          <h3>마켓 개요</h3>
          <TvEmbed src={`${TV}/embed-widget-market-overview.js`} config={overview} height={420} />
        </section>
        <section className="card">
          <h3>미국 섹터 히트맵</h3>
          <TvEmbed src={`${TV}/embed-widget-stock-heatmap.js`} config={heatmap} height={420} />
        </section>
      </div>

      <section className="card" style={{ margin: "16px 0" }}>
        <h3>지수 차트</h3>
        <TvEmbed src={`${TV}/embed-widget-symbol-overview.js`} config={symbols} height={360} />
      </section>

      <div className="invest-board">
        <section className="card">
          <h3>스크리너</h3>
          <TvEmbed src={`${TV}/embed-widget-screener.js`} config={screener} height={480} />
        </section>
        <section className="card">
          <h3>경제 캘린더</h3>
          <TvEmbed src={`${TV}/embed-widget-events.js`} config={calendar} height={480} />
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h3>Seeking Alpha <a href="/opinions" className="muted">더 보기</a></h3>
        <ul className="plain news-list">
          {(board.data?.seekingAlpha ?? []).map((n) => (
            <li key={n.id} className="news-item">
              <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
              <div className="muted">{n.publisher ?? "Seeking Alpha"}</div>
            </li>
          ))}
          {!board.data?.seekingAlpha?.length && <li className="muted">오피니언 RSS 수집 후 표시됩니다.</li>}
        </ul>
      </section>
    </div>
  );
}
