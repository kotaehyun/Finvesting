"use client";
import { trpc } from "@/lib/trpc";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const pct = (r: number) => `${(r * 100).toFixed(1)}%`;

export default function Dashboard() {
  const { data, isLoading, error } = trpc.dashboard.overview.useQuery();
  const news = trpc.market.latestNews.useQuery({ limit: 10 });

  if (isLoading) return <p>불러오는 중…</p>;
  if (error) return <p>오류: {error.message}</p>;
  if (!data) return null;
  const { assets, cashflow, guide, month } = data;

  return (
    <>
      <h1>{month} 대시보드</h1>
      <div className="grid">
        <div className="card"><h3>순자산</h3><div className="big">{won(assets.net)}</div>
          <div className="muted">유동 {won(assets.liquid)} · 투자 {won(assets.invested)} · 부채 {won(assets.debt)}</div></div>
        <div className="card"><h3>이번 달 수입</h3><div className="big">{won(cashflow.income)}</div></div>
        <div className="card"><h3>소비율 / 저축·투자율</h3><div className="big">{pct(cashflow.spendingRate)} / {pct(cashflow.savingRate)}</div>
          <div className="muted">고정비 {won(cashflow.fixedCost)} · 변동비 {won(cashflow.variableCost)}</div></div>
        {guide && (
          <div className="card"><h3>권장 배분 (월)</h3>
            <div>필수 {won(guide.needs)} · 여가 {won(guide.wants)}</div>
            <div>저축·투자 {won(guide.saveAndInvest)} → 예적금 {won(guide.ofWhichDeposit)} / 투자 {won(guide.ofWhichInvest)}</div>
            {guide.notes.map((n, i) => <div key={i} className="muted">• {n}</div>)}
          </div>
        )}
        {!guide && <div className="card"><h3>권장 배분</h3><div className="muted">financial_profiles에 월 소득·고정비를 입력하면 표시됩니다.</div></div>}
      </div>
      <h2>최근 뉴스</h2>
      <ul>{news.data?.map((n) => <li key={n.id}><a href={n.url} target="_blank" rel="noreferrer">{n.title}</a> <span className="muted">{n.publisher}</span></li>)}</ul>
    </>
  );
}
