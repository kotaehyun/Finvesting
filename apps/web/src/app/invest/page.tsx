"use client";
import { useEffect, useState } from "react";
import {
  KOFIA_FUNDS_URL,
  KOFIA_MAIN_URL,
  MARKET_REF_LINKS,
  creditShare,
  kofiaFundsTotal,
  marginShare,
  millionWonToJo,
  tvSymbolOverviewSymbols,
  worldIndexById,
  type KofiaMarketFunds,
} from "@finvesting/core";
import { trpc } from "@/lib/trpc";
import { TvEmbed } from "./tv-embed";
import { SymbolSearch } from "./symbol-search";
import { Pnl } from "../pnl";

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

const pct = (n: number) => `${n >= 0 ? "+" : ""}${(n * 100).toFixed(2)}%`;
const num = (n: number, currency: string | null) =>
  `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}${currency ? ` ${currency}` : ""}`;
const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

type IndexRow = {
  id: string;
  label: string;
  close: number | null;
  changePct: number | null;
  currency: string | null;
  date: string | null;
  spark?: number[];
  href?: string | null;
  hrefLabel?: string | null;
};

function IndexSpark({ values, up }: { values: number[]; up: boolean | null }) {
  const w = 160;
  const h = 72;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = values.length === 1 ? w / 2 : (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.replace(",", " ")}`).join(" ");
  const last = pts[pts.length - 1];
  if (!last) return null;
  const area = `${d} L${last.split(",")[0]} ${h} L0 ${h} Z`;
  return (
    <svg className={`index-spark${up == null ? "" : up ? " up" : " down"}`} viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" aria-hidden="true">
      <path d={area} fill="currentColor" opacity="0.14" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const FUNDS_COLOR: Record<string, string> = {
  deposit: "#2563eb",
  credit: "#b45309",
  margin: "#b91c1c",
};

function jo(n: number) {
  return `${millionWonToJo(n).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}조원`;
}

function pct1(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function FundsDonut({ parts, center }: { parts: { id: string; value: number }[]; center: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  if (total <= 0) return null;
  const r = 42;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg className="funds-donut" viewBox="0 0 120 120" width="148" height="148" aria-hidden="true">
      {parts.map((p) => {
        const frac = p.value / total;
        const dash = frac * circ;
        const rot = (acc / total) * 360 - 90;
        acc += p.value;
        return (
          <circle
            key={p.id}
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={FUNDS_COLOR[p.id] ?? "#64748b"}
            strokeWidth="16"
            strokeDasharray={`${dash} ${circ - dash}`}
            transform={`rotate(${rot} 60 60)`}
          />
        );
      })}
      <circle cx="60" cy="60" r="33" fill="var(--card)" />
      <text x="60" y="58" textAnchor="middle" fontSize="16" fontWeight="700" fill="currentColor">{center}</text>
      <text x="60" y="76" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">비중</text>
    </svg>
  );
}

function FundsChart({ funds }: { funds: KofiaMarketFunds }) {
  const known = funds.slices.filter((s): s is { id: typeof s.id; label: string; millionWon: number } =>
    s.millionWon != null && s.millionWon > 0);
  const total = kofiaFundsTotal(funds);
  const mShare = marginShare(funds);
  const cShare = creditShare(funds);
  const headline = mShare != null ? pct1(mShare) : (cShare != null ? pct1(cShare) : "—");
  const headlineLabel = mShare != null ? "위탁매매 미수금" : "신용융자 (예탁금+신용)";

  return (
    <div className="funds-chart">
      <div className="funds-visual">
        <FundsDonut parts={known.map((s) => ({ id: s.id, value: s.millionWon }))} center={headline} />
        <div>
          <div className="big" style={{ fontSize: 28 }}>{headline}</div>
          <p className="muted" style={{ margin: "0 0 8px" }}>{headlineLabel}</p>
          {total != null && <p style={{ margin: "0 0 8px" }}>합 {jo(total)}</p>}
          {funds.asOf && <p className="muted" style={{ margin: 0 }}>기준일 {funds.asOf} · 단위 백만원</p>}
        </div>
      </div>
      {known.length > 0 && (
        <div className="mix-bar" style={{ marginTop: 12 }} aria-hidden="true">
          {known.map((s) => (
            <span
              key={s.id}
              className={`mix-${s.id}`}
              style={{ flex: s.millionWon }}
              title={`${s.label} ${jo(s.millionWon)}`}
            >
              {s.label} {total ? pct1(s.millionWon / total) : ""}
            </span>
          ))}
        </div>
      )}
      <ul className="funds-legend">
        {funds.slices.map((s) => (
          <li key={s.id}>
            <span className={`funds-swatch mix-${s.id}`} />
            {s.label}
            {" · "}
            {s.millionWon != null ? jo(s.millionWon) : "메인 공표에 없음"}
          </li>
        ))}
      </ul>
      {mShare == null && (
        <p className="muted" style={{ margin: "8px 0 0" }}>
          위탁매매 미수금은 금투협 메인 HTML에 없어 칸으로 둡니다. 숫자를 만들지 않습니다.
          {" "}
          <a href={KOFIA_FUNDS_URL} target="_blank" rel="noreferrer">증시자금 추이</a>
        </p>
      )}
    </div>
  );
}

function IndexCell({ i }: { i: IndexRow }) {
  const meta = worldIndexById(i.id);
  const href = i.href ?? meta?.href;
  const hrefLabel = i.hrefLabel ?? meta?.hrefLabel ?? "원문";
  const spark = i.spark ?? [];
  return (
    <div className="index-cell">
      <div className="muted">{i.label}</div>
      <div className="big" style={{ fontSize: 20 }}>
        {i.close != null ? num(i.close, i.currency) : "—"}
      </div>
      <div className={i.changePct == null ? "muted" : i.changePct >= 0 ? "up" : "down"}>
        {i.changePct != null ? pct(i.changePct) : (i.close != null ? "전일 대비 없음" : "아직 없음")}
      </div>
      {spark.length >= 2 && (
        <IndexSpark values={spark} up={i.changePct == null ? null : i.changePct >= 0} />
      )}
      {i.date && <div className="muted">{i.date}</div>}
      {href && (
        <a className="muted" href={href} target="_blank" rel="noreferrer">{hrefLabel}</a>
      )}
    </div>
  );
}

export default function InvestDashboard() {
  const theme = useTvTheme();
  const board = trpc.market.indexBoard.useQuery();
  const funds = trpc.market.kofiaFunds.useQuery();
  const holdings = trpc.trades.holdings.useQuery();
  const watch = trpc.market.watchlist.useQuery();
  const removeWatch = trpc.market.watchRemove.useMutation();
  const utils = trpc.useUtils();
  const [openPanel, setOpenPanel] = useState<"screener" | "calendar" | "links" | null>(null);

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
    symbols: tvSymbolOverviewSymbols(),
    chartOnly: false,
    locale: "kr",
    colorTheme: theme,
    autosize: true,
  };

  const open = holdings.data?.positions ?? [];
  const missingQuote = holdings.data?.totals.missingQuote ?? 0;
  const classRows = (holdings.data?.byClass ?? []).filter((c) => c.count > 0);
  const currencyRows = (holdings.data?.byCurrency ?? []).filter((c) => c.count > 0);
  const contrib = (holdings.data?.pnlContribution ?? []).slice(0, 6);
  const watchRows = watch.data ?? [];
  const asOf = board.data?.asOf;

  return (
    <div className="invest-page">
      <div className="page-head">
        <div>
          <h1 style={{ marginBottom: 4 }}>투자 대시보드</h1>
          <p className="muted" style={{ margin: 0 }}>
            {board.isLoading
              ? "지수를 불러오는 중…"
              : asOf
                ? `Yahoo 종가 · 거래일 ${asOf} · 실시간·호가가 아닙니다.`
                : "Yahoo 종가를 아직 모으지 못했습니다. 실시간·호가가 아닙니다."}
            {" "}
            국내 지수는 아래 Yahoo 숫자·그래프와 네이버 링크에서 봅니다.
          </p>
        </div>
        <div className="row">
          <a className="starter" href="/holdings">보유·체결</a>
          <a className="starter" href="/profile?menu=invest">투자내역</a>
          <a className="starter" href="/profile?menu=style">투자성향</a>
          <a className="starter" href="/markets">시장·수급·기술</a>
          <a className="starter" href="/realty">부동산</a>
        </div>
      </div>

      <SymbolSearch />

      <section className="card" style={{ margin: "0 0 16px" }}>
        <h3>주요 지수</h3>
        {board.isLoading && <p className="muted">불러오는 중…</p>}
        {board.error && <p>오류: {board.error.message}</p>}
        <div className="index-grid">
          {(board.data?.indices ?? []).map((i) => (
            <IndexCell key={i.id} i={i} />
          ))}
        </div>
        <p className="muted" style={{ margin: "12px 0 8px" }}>
          칸의 선은 Yahoo 종가(최근 거래일)입니다. 아래 큰 차트는 TradingView이며 실시간 호가가 아닙니다. 코스피·코스닥은 위젯에 넣지 않고 Yahoo 선과 네이버 링크로 봅니다.
        </p>
        {theme && <TvEmbed widget="symbol-overview" config={symbols} height={380} />}
      </section>

      <section className="card" style={{ margin: "0 0 16px" }}>
        <h3>증시자금 · 미수금 비중</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>
          금융투자협회 FreeSIS 메인. 예탁금·신용융자는 메인 칸, 위탁매매 미수금은 메인이 비면 그리지 않습니다.
          {" "}
          <a href={KOFIA_MAIN_URL} target="_blank" rel="noreferrer">금투협 메인</a>
        </p>
        {funds.isLoading && <p className="muted">불러오는 중…</p>}
        {funds.error && <p>오류: {funds.error.message}</p>}
        {funds.data && (funds.data.deposit != null || funds.data.credit != null)
          ? <FundsChart funds={funds.data} />
          : (!funds.isLoading && !funds.error && <p className="muted">아직 숫자가 없습니다. 워커 금투협 수집 또는 메인 페이지를 확인하세요.</p>)}
      </section>

      <section className="card" style={{ margin: "0 0 16px" }}>
        <h3>원자재</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>
          Yahoo 선물 종가입니다. 금·은·구리·WTI·브렌트. 두바이유는 Yahoo에 없어 빼 두었습니다. 실시간 호가가 아닙니다.
        </p>
        {board.isLoading && <p className="muted">불러오는 중…</p>}
        <div className="index-grid">
          {(board.data?.commodities ?? []).map((i) => (
            <IndexCell key={i.id} i={i} />
          ))}
        </div>
      </section>

      <section className="card" style={{ margin: "0 0 16px" }}>
        <h3>환율</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>
          Yahoo 종가입니다. 원/달러는 ECOS가 같은 날이면 ECOS. 실시간 호가가 아닙니다. 원문은 각 칸의 Investing.com.
        </p>
        {board.isLoading && <p className="muted">불러오는 중…</p>}
        <div className="index-grid">
          {(board.data?.fx ?? []).map((i) => (
            <IndexCell key={i.id} i={i} />
          ))}
        </div>
      </section>

      <div className="invest-board" style={{ marginBottom: 16 }}>
        <section className="card">
          <h3>내 보유</h3>
          {holdings.isLoading && <p className="muted">불러오는 중…</p>}
          {holdings.error && <p>오류: {holdings.error.message}</p>}
          {holdings.data && open.length === 0 && (
            <p className="muted" style={{ margin: 0 }}>보유 종목이 없습니다. <a href="/holdings">체결 입력</a></p>
          )}
          {open.length > 0 && holdings.data && (
            <>
              {missingQuote === open.length
                ? <p className="muted">시세가 없어 평가액을 표시하지 않습니다.</p>
                : (
                  <p>
                    평가 {won(holdings.data.totals.marketValueKrw)}
                    {" · "}평가손익 <Pnl n={holdings.data.totals.pnlKrw} />
                    <span className="muted"> · {open.length}종목</span>
                  </p>
                )}
              {missingQuote > 0 && missingQuote < open.length && (
                <p className="muted">시세 없는 {missingQuote}종목은 합계에 넣지 않았습니다.</p>
              )}
              <ul className="plain">
                {open.slice(0, 8).map((p) => (
                  <li key={`${p.accountId}-${p.instrumentId}`}>
                    {p.symbol}
                    {p.pnlKrw != null ? <> <Pnl n={p.pnlKrw} /></> : " · 시세 없음"}
                    <span className="muted"> · {p.name}</span>
                  </li>
                ))}
              </ul>
              {classRows.length > 0 && (
                <p className="muted" style={{ marginTop: 8 }}>
                  자산군{" "}
                  {classRows.map((c) => `${c.label} ${c.weight > 0 ? `${(c.weight * 100).toFixed(0)}%` : "시세 없음"}`).join(" · ")}
                </p>
              )}
              {currencyRows.length > 0 && (
                <p className="muted">
                  통화{" "}
                  {currencyRows.map((c) => `${c.currency} ${c.weight != null ? `${(c.weight * 100).toFixed(0)}%` : "시세 없음"}`).join(" · ")}
                </p>
              )}
              {contrib.length > 0 && (
                <p className="muted">평가손익 기여(시세 있는 종목): {contrib.map((p, i) => (
                  <span key={p.instrumentId}>{i > 0 ? " · " : ""}{p.symbol} <Pnl n={p.pnlKrw} /></span>
                ))}</p>
              )}
            </>
          )}
        </section>
        <section className="card">
          <h3>관심 종목</h3>
          {watch.isLoading && <p className="muted">불러오는 중…</p>}
          {watch.error && <p>오류: {watch.error.message}</p>}
          {watch.data && watchRows.length === 0 && (
            <p className="muted" style={{ margin: 0 }}>관심 종목이 없습니다. 위 검색에서 추가하세요. 시세는 다음 수집 때 붙습니다.</p>
          )}
          {watchRows.length > 0 && (
            <ul className="plain">
              {watchRows.map((w) => (
                <li key={w.id}>
                  {w.symbol}
                  {w.lastPrice != null ? ` ${num(w.lastPrice, w.currency)}` : " · 시세 없음"}
                  <span className="muted"> · {w.name}{w.lastDate ? ` · ${w.lastDate}` : ""}</span>
                  {" "}
                  <button
                    type="button"
                    className="link"
                    onClick={() => removeWatch.mutateAsync({ id: w.id }).then(() => utils.market.watchlist.invalidate())}
                    disabled={removeWatch.isPending}
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>미국 섹터 히트맵</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>TradingView 그림입니다. 내 보유와 별개이며 지연될 수 있습니다.</p>
        {theme && <TvEmbed widget="stock-heatmap" config={heatmap} height={420} lazy />}
      </section>

      <div className="fold-tabs" role="tablist" aria-label="자세한 시장 도구">
        {([
          ["screener", "스크리너"],
          ["calendar", "경제 캘린더"],
          ["links", "외부 참고"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={openPanel === id}
            className={`starter${openPanel === id ? " on" : ""}`}
            onClick={() => setOpenPanel((cur) => (cur === id ? null : id))}
          >
            {label}
          </button>
        ))}
      </div>

      {openPanel === "screener" && (
        <section className="card" style={{ marginTop: 12 }}>
          <h3>스크리너</h3>
          <p className="muted">미국 종목 스크리너. 내 보유 필터가 아닙니다.</p>
          {theme && <TvEmbed widget="screener" config={screener} height={480} lazy />}
        </section>
      )}
      {openPanel === "calendar" && (
        <section className="card" style={{ marginTop: 12 }}>
          <h3>경제 캘린더</h3>
          <p className="muted">TradingView 일정. 앱에 저장한 발표 일정과 별개입니다.</p>
          {theme && <TvEmbed widget="events" config={calendar} height={480} lazy />}
        </section>
      )}
      {openPanel === "links" && (
        <section className="card" style={{ marginTop: 12 }}>
          <h3>외부 참고 사이트</h3>
          <p className="muted" style={{ margin: "0 0 8px" }}>시세를 가져오지 않고 원문만 엽니다.</p>
          <div className="starter-list">
            {MARKET_REF_LINKS.map((l) => (
              <a key={l.id} className="starter" href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
            ))}
            <a className="starter" href="/opinions">오피니언 대시보드</a>
            <a className="starter" href="/fundamentals">Fundamentals</a>
            <a className="starter" href="/statements">재무제표</a>
          </div>
        </section>
      )}
    </div>
  );
}
