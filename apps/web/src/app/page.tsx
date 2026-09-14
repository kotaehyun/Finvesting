"use client";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const pct = (r: number) => `${(r * 100).toFixed(1)}%`;

export default function Dashboard() {
  const { data, isLoading, error } = trpc.dashboard.overview.useQuery();
  const news = trpc.market.latestNews.useQuery({ limit: 10 });
  const opinions = trpc.market.latestOpinions.useQuery({ limit: 6 });
  const [fixedOpen, setFixedOpen] = useState(false);

  if (isLoading) return <p>불러오는 중…</p>;
  if (error) return <p>오류: {error.message}</p>;
  if (!data) return null;
  const { assets, cashflow, guide, month, holdings, profile } = data;

  return (
    <>
      <h1>{month} 대시보드</h1>
      <div className="grid">
        <div className="card"><h3>순자산</h3><div className="big">{won(assets.net)}</div>
          <div className="muted">유동 {won(assets.liquid)} · 투자 {won(assets.invested)} (평가+예수금) · 부채 {won(assets.debt)}</div></div>
        <div className="card"><h3>이번 달 수입</h3><div className="big">{won(cashflow.income)}</div></div>
        <div className="card"><h3>소비율 / 저축·투자율</h3><div className="big">{pct(cashflow.spendingRate)} / {pct(cashflow.savingRate)}</div>
          <div className="muted">이번 달 거래 고정 {won(cashflow.fixedCost)} · 변동비 {won(cashflow.variableCost)}</div></div>
        {guide && (
          <div className="card"><h3>권장 배분 (월)</h3>
            <div>필수 {won(guide.needs)} · 여가 {won(guide.wants)}</div>
            <div>저축·투자 {won(guide.saveAndInvest)} → 예적금 {won(guide.ofWhichDeposit)} / 투자 {won(guide.ofWhichInvest)}</div>
            {guide.notes.map((n, i) => <div key={i} className="muted">• {n}</div>)}
            {profile && (
              <div style={{ marginTop: 8 }}>
                <button type="button" className="link arrow" aria-expanded={fixedOpen} onClick={() => setFixedOpen((v) => !v)}>
                  <span className="chev">{fixedOpen ? "▼" : "▶"}</span>
                  고정비 {won(profile.monthlyFixedCost)}
                </button>
                {fixedOpen && (
                  <ul className="plain" style={{ marginTop: 6 }}>
                    {profile.recurring.map((r) => (
                      <li key={r.name}>{r.name} <span className="muted">{won(r.amount)}</span></li>
                    ))}
                    {profile.otherFixed > 0 && <li>기타 고정비 <span className="muted">{won(profile.otherFixed)}</span></li>}
                    {!profile.recurring.length && profile.otherFixed === 0 && <li className="muted">세부내역 없음 — <a href="/profile?menu=fixed">프로필대장에서 추가</a></li>}
                  </ul>
                )}
              </div>
            )}
            <div className="muted" style={{ marginTop: 8 }}><a href="/profile">프로필대장에서 수정</a></div>
          </div>
        )}
        {!guide && <div className="card"><h3>권장 배분</h3><div className="muted">월 소득·고정비를 넣으면 표시됩니다. <a href="/profile">프로필대장</a></div></div>}
        {holdings.totals.openCount > 0 && (
          <div className="card"><h3>보유 평가손익</h3>
            <div className="big">{won(holdings.totals.pnlKrw)}</div>
            <div className="muted">평가 {won(holdings.totals.marketValueKrw)} · 원가 {won(holdings.totals.costKrw)} · {holdings.totals.openCount}종목</div>
            {holdings.totals.missingQuote > 0 && <div className="muted">시세 없는 종목 {holdings.totals.missingQuote} — worker 수집 후 반영</div>}
            <div className="muted" style={{ marginTop: 8 }}><a href="/holdings">보유·체결</a></div>
          </div>
        )}
        {holdings.totals.openCount === 0 && (
          <div className="card"><h3>보유</h3><div className="muted">체결이 없습니다. <a href="/holdings">보유·체결 입력</a></div></div>
        )}
        {assets.accountCount === 0 && (
          <div className="card"><h3>계좌</h3><div className="muted">등록된 계좌가 없습니다. <a href="/accounts">계좌·거래 가져오기</a></div></div>
        )}
      </div>
      <h2>투자 시장 <a href="/invest" className="muted" style={{ fontSize: 14, fontWeight: 600 }}>투자 대시보드 →</a></h2>
      <p className="muted">세계 지수·트레이딩뷰 차트·스크리너·경제캘린더. Investing.com·Finviz는 원문 링크.</p>
      <h2>최근 뉴스 <a href="/news" className="muted" style={{ fontSize: 14, fontWeight: 600 }}>뉴스 대시보드 →</a></h2>
      <ul>{news.data?.map((n) => <li key={n.id}><a href={n.url} target="_blank" rel="noreferrer">{n.title}</a> <span className="muted">{n.publisher}</span></li>)}</ul>
      <h2>오피니언 · 칼럼 <a href="/opinions" className="muted" style={{ fontSize: 14, fontWeight: 600 }}>오피니언 대시보드 →</a></h2>
      <ul>{opinions.data?.map((n) => <li key={n.id}><a href={n.url} target="_blank" rel="noreferrer">{n.title}</a> <span className="muted">{n.publisher}</span></li>)}</ul>
    </>
  );
}
