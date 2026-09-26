"use client";
import { useMemo, useState } from "react";
import { pnlTone, signedWon } from "@finvesting/core";
import { trpc } from "@/lib/trpc";
import { Pnl } from "./pnl";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const pct = (r: number) => `${(r * 100).toFixed(1)}%`;

function kstMonth() {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 7);
}

function monthOptions(count = 12) {
  const cur = kstMonth();
  const [y0, m0] = cur.split("-").map(Number) as [number, number];
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y0, m0 - 1 - i, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

const CHAT_Q = "내 현재 재무 상태를 컨텍스트 숫자만으로 짧게 정리해 줘. 순자산은 오늘 잔액 기준이고, 선택한 달의 수입·소비·저축은 거래 원장 기준이다. 없는 값은 없다고 해.";

export default function Dashboard() {
  const months = useMemo(() => monthOptions(), []);
  const [month, setMonth] = useState(kstMonth);
  const { data, isLoading, error } = trpc.dashboard.overview.useQuery({ month });
  const news = trpc.market.latestNews.useQuery({ limit: 3 });

  if (isLoading) return <p>불러오는 중…</p>;
  if (error) return <p>오류: {error.message}</p>;
  if (!data) return null;

  const { assets, cashflow, guide, holdings, profile, txnCount, uncategorizedCount, quoteAsOf, upcoming, isCurrentMonth, asOf } = data;
  const spent = cashflow.fixedCost + cashflow.variableCost;
  const emptyLedger = txnCount === 0;
  const noHoldings = holdings.totals.openCount === 0;
  const freshStart = assets.accountCount === 0 && noHoldings;
  const classRows = holdings.byClass.filter((c) => c.count > 0);
  const currencyRows = holdings.byCurrency.filter((c) => c.count > 0);
  const contrib = holdings.pnlContribution.slice(0, 5);
  const todos: Array<{ href: string; label: string }> = [];
  if (uncategorizedCount > 0) {
    todos.push({ href: "/accounts", label: `미분류 거래 ${uncategorizedCount}건` });
  }
  if (holdings.totals.missingQuote > 0) {
    todos.push({ href: "/holdings", label: `시세 없는 보유 ${holdings.totals.missingQuote}종목` });
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 style={{ marginBottom: 4 }}>홈</h1>
          <p className="muted" style={{ margin: 0 }}>
            조회 {month}
            {" · "}
            화면 기준 {asOf} (한국)
            {quoteAsOf ? ` · 보유 시세 ${quoteAsOf}` : ""}
          </p>
        </div>
        <div className="row">
          <label className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            조회 월
            <select aria-label="조회 월" value={month} onChange={(e) => setMonth(e.target.value)}>
              {months.map((m) => (
                <option key={m} value={m}>{m}{m === kstMonth() ? " (이번 달)" : ""}</option>
              ))}
            </select>
          </label>
          <a className="starter" href="/accounts">내역 가져오기</a>
          <a className="starter" href="/erp">사업 업무</a>
        </div>
      </div>

      {freshStart && (
        <div className="card onboarding" style={{ marginBottom: 16 }}>
          <h3>시작하기</h3>
          <p className="muted" style={{ margin: "0 0 8px" }}>계좌와 거래를 넣으면 순자산·현금흐름이 채워집니다. 보유는 체결을 입력한 뒤 시세를 모으면 평가손익이 나옵니다.</p>
          <div className="row">
            <a href="/accounts">계좌·거래</a>
            <a href="/holdings">보유·체결</a>
            <a href="/profile">프로필대장</a>
          </div>
        </div>
      )}

      <div className="grid">
        <div className="card">
          <h3>현재 순자산</h3>
          <div className="big">{won(assets.net)}</div>
          <div className="muted">유동 {won(assets.liquid)} · 투자 {won(assets.invested)} · 부채 {won(assets.debt)}</div>
          {!isCurrentMonth && (
            <p className="muted" style={{ margin: "8px 0 0" }}>월말 잔액 기록이 없어 {month}의 순자산은 표시하지 않습니다. 위 숫자는 오늘 계좌 잔액입니다.</p>
          )}
        </div>
        <div className="card">
          <h3>{isCurrentMonth ? "이번 달 소비" : `${month} 소비`}</h3>
          {emptyLedger
            ? <p className="muted" style={{ margin: 0 }}>이 달 거래 없음</p>
            : (
              <>
                <div className="big">{won(spent)}</div>
                <div className="muted">고정 {won(cashflow.fixedCost)} · 변동 {won(cashflow.variableCost)}</div>
              </>
            )}
        </div>
        <div className="card">
          <h3>{isCurrentMonth ? "이번 달 저축·투자 실행액" : `${month} 저축·투자 실행액`}</h3>
          {emptyLedger
            ? <p className="muted" style={{ margin: 0 }}>이 달 거래 없음</p>
            : (
              <>
                <div className="big">{won(cashflow.savingAndInvest)}</div>
                <div className="muted">거래에서 저축·투자로 분류한 출금</div>
              </>
            )}
        </div>
        <div className="card">
          <h3>보유 평가손익</h3>
          {noHoldings
            ? <p className="muted" style={{ margin: 0 }}>보유 종목 없음</p>
            : holdings.totals.missingQuote === holdings.totals.openCount
              ? <p className="muted" style={{ margin: 0 }}>시세가 없어 평가손익을 계산하지 못했습니다. <a href="/holdings">보유</a></p>
              : (
                <>
                  <div className={`big ${pnlTone(holdings.totals.pnlKrw)}`}>{signedWon(holdings.totals.pnlKrw)}</div>
                  <div className="muted">평가 {won(holdings.totals.marketValueKrw)} · 원가 {won(holdings.totals.costKrw)} · {holdings.totals.openCount}종목</div>
                  {holdings.totals.missingQuote > 0 && (
                    <div className="muted">시세 없는 {holdings.totals.missingQuote}종목은 합계에 넣지 않았습니다.</div>
                  )}
                </>
              )}
        </div>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h3>{isCurrentMonth ? "이번 달 현금흐름" : `${month} 현금흐름`}</h3>
        {emptyLedger
          ? <p className="muted" style={{ margin: 0 }}>이 달 거래가 없습니다. 통장 잔액과 다른 숫자입니다.</p>
          : (
            <>
              <div className="flow">
                <div><span className="muted">수입</span><strong>{won(cashflow.income)}</strong></div>
                <div className="muted">→</div>
                <div><span className="muted">소비</span><strong>{won(spent)}</strong></div>
                <div className="muted">→</div>
                <div><span className="muted">저축·투자</span><strong>{won(cashflow.savingAndInvest)}</strong></div>
                <div className="muted">→</div>
                <div><span className="muted">남은 금액</span><strong>{won(cashflow.net)}</strong></div>
              </div>
              <p className="muted" style={{ margin: "8px 0 0" }}>
                남은 금액은 이 달 거래로 계산한 월 현금흐름입니다. 통장 잔액({won(assets.liquid)})과 같지 않습니다.
                {cashflow.income > 0 ? ` 소비율 ${pct(cashflow.spendingRate)} · 저축·투자율 ${pct(cashflow.savingRate)}.` : " 수입 분류 거래가 없어 비율은 표시하지 않습니다."}
              </p>
            </>
          )}
        {guide && !emptyLedger && (
          <p style={{ margin: "10px 0 0" }}>
            저축·투자 목표 {won(guide.saveAndInvest)} 대비 실행액 {won(cashflow.savingAndInvest)}
            {profile && <> · <a href="/profile">프로필대장</a></>}
          </p>
        )}
      </section>

      {(classRows.length > 0 || currencyRows.length > 0 || contrib.length > 0) && (
        <div className="grid" style={{ marginTop: 16 }}>
          {classRows.length > 0 && (
            <div className="card">
              <h3>자산군 비중</h3>
              <p className="muted" style={{ margin: "0 0 8px" }}>시세가 있는 평가액 기준. 평가손익이지 기간 수익률이 아닙니다.</p>
              <ul className="plain">
                {classRows.map((c) => (
                  <li key={c.assetClass}>
                    {c.label} {c.weight > 0 ? pct(c.weight) : "시세 없음"}
                    <span className="muted"> · {c.count}종목</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {currencyRows.length > 0 && (
            <div className="card">
              <h3>통화 비중</h3>
              <ul className="plain">
                {currencyRows.map((c) => (
                  <li key={c.currency}>
                    {c.currency}{" "}
                    {c.weight != null ? pct(c.weight) : "시세 없음"}
                    <span className="muted"> · {c.count}종목</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {contrib.length > 0 && (
            <div className="card">
              <h3>종목별 평가손익</h3>
              <p className="muted" style={{ margin: "0 0 8px" }}>실현손익·기간 수익률이 아닙니다.</p>
              <ul className="plain">
                {contrib.map((p) => (
                  <li key={p.instrumentId}>
                    {p.symbol} <Pnl n={p.pnlKrw} />
                    <span className="muted"> · {p.name}</span>
                  </li>
                ))}
              </ul>
              <div className="muted"><a href="/holdings">보유 전체</a></div>
            </div>
          )}
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="card" style={{ marginTop: 16 }}>
          <h3>{month} 예정</h3>
          <p className="muted" style={{ margin: "0 0 8px" }}>프로필에 적어 둔 예정일입니다. 통장 거래와 같지 않습니다.</p>
          <ul className="plain">
            {upcoming.map((u) => (
              <li key={`${u.kind}-${u.title}`}>
                <a href={u.href}>{u.title}</a>
                <span className="muted"> · {u.scheduledOn}</span>
                {u.amount != null && <span> · 예정 {won(u.amount)}</span>}
                {u.kind === "savings_pay" && (
                  u.actualAmount != null
                    ? <span className="muted"> · 실제 납입 {won(u.actualAmount)}</span>
                    : <span className="muted"> · 실제 납입 기록 없음</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid" style={{ marginTop: 16 }}>
        <section className="card">
          <h3>확인할 일</h3>
          {todos.length === 0
            ? <p className="muted" style={{ margin: 0 }}>지금 확인할 항목이 없습니다.</p>
            : (
              <ul className="plain todo-list">
                {todos.map((t) => (
                  <li key={t.href}><a href={t.href}>{t.label}</a></li>
                ))}
              </ul>
            )}
        </section>
        <section className="card">
          <h3>주요 뉴스 <a href="/news" className="muted">전체 보기</a></h3>
          {news.isLoading && <p className="muted">불러오는 중…</p>}
          {news.error && <p>오류: {news.error.message}</p>}
          {news.data && news.data.length === 0 && <p className="muted" style={{ margin: 0 }}>수집된 뉴스가 없습니다.</p>}
          <ul className="plain news-list">
            {news.data?.map((n) => (
              <li key={n.id} className="news-item">
                <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
                {n.publisher && <div className="muted">{n.publisher}</div>}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p style={{ marginTop: 20 }}>
        <a className="starter" href={`/chat?q=${encodeURIComponent(CHAT_Q)}`}>현재 재무 상태 묻기</a>
      </p>
    </>
  );
}
