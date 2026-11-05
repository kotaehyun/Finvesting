"use client";
import {
  REALTY_METROS,
  eokToJo,
  realtyMetroForPlace,
  type MetroLoanRankRow,
  type RealtyMetroId,
} from "@finvesting/core";
import { RealtySpark } from "./spark";

type MetroPack = {
  id: RealtyMetroId;
  label: string;
  date: string | null;
  latest: number | null;
  latestJo: number | null;
  yoy: number | null;
  mom: number | null;
  housing: number | null;
  housingJo: number | null;
  housingShare: number | null;
  shareOfKr: number | null;
  npl: number | null;
  nplDate: string | null;
  total: { date: string; value: number }[];
  yoySeries: { date: string; value: number }[];
  shareSeries: { date: string; value: number }[];
};

type Loans = {
  note: string;
  asOf: string | null;
  kr: { date: string; latestJo: number } | null;
  rank: MetroLoanRankRow[];
  metros: Record<RealtyMetroId, MetroPack>;
};

function jo(n: number) {
  return `${n.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}조`;
}

function pct(n: number) {
  const s = (n * 100).toFixed(1);
  return `${n > 0 ? "+" : ""}${s}%`;
}

function sharePct(n: number | null | undefined) {
  if (n == null) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function ym(d: string | null) {
  return d ? d.slice(0, 7) : "";
}

export function RealtyLoanPanel({
  focusId,
  focusLabel,
  loans,
  loading,
  onFocus,
}: {
  focusId: string | null;
  focusLabel: string | null;
  loans: Loans | undefined;
  loading: boolean;
  onFocus: (id: string, label: string) => void;
}) {
  const metroId = focusId ? realtyMetroForPlace(focusId) : null;
  const pack = metroId && loans ? loans.metros[metroId] : null;
  const rank = loans?.rank ?? REALTY_METROS.map((m) => ({
    id: m.id,
    label: m.label,
    latest: null,
    shareOfKr: null,
    rank: null,
  }));
  const maxShare = Math.max(...rank.map((r) => r.shareOfKr ?? 0), 0.01);

  return (
    <aside className="realty-loan-panel">
      <h4>가계대출 어디가 많은지</h4>
      <p className="muted">예금은행 광역시도 말잔의 전국 대비 비중입니다. 가계신용/GDP가 아닙니다.</p>
      <ol className="loan-rank">
        {rank.map((r) => {
          const on = metroId === r.id;
          const w = r.shareOfKr != null ? Math.max(6, (r.shareOfKr / maxShare) * 100) : 6;
          return (
            <li key={r.id}>
              <button type="button" className={`loan-rank-row${on ? " on" : ""}`} onClick={() => onFocus(r.id, r.label)}>
                <span className="loan-rank-n">{r.rank ?? "—"}</span>
                <span>{r.label}</span>
                <span className="loan-rank-track" aria-hidden="true">
                  <span className="loan-rank-bar" style={{ width: `${w}%` }} />
                </span>
                <strong>{sharePct(r.shareOfKr)}</strong>
                <span className="muted">{r.latest != null ? jo(eokToJo(r.latest)) : "—"}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <h4>대출 총액 · 증가율</h4>
      {!focusId && <p className="muted">도면에서 시·구를 고르면 그 광역시도 그래프가 나옵니다.</p>}
      {focusId && (
        <p className="loan-place">
          <strong>{focusLabel ?? focusId}</strong>
          <span className="muted"> · {pack?.label} 예금은행</span>
        </p>
      )}
      <p className="muted">{loans?.note ?? "시·구 가계대출 숫자는 없습니다."}</p>

      {loading && <p className="muted">불러오는 중…</p>}
      {focusId && pack && pack.latest == null && !loading && (
        <p className="muted">이 시도 시계열이 없습니다. worker ECOS를 한 번 돌리세요.</p>
      )}
      <div className="loan-charts">
        <div className="loan-chart">
          <div className="muted">가계대출 말잔</div>
          <div className="big" style={{ fontSize: 22 }}>{pack?.latestJo != null ? jo(pack.latestJo) : "—"}</div>
          <div className="muted">{ym(pack?.date ?? null)} · 전월 {pack?.mom != null ? pct(pack.mom) : "—"}</div>
          <RealtySpark values={pack?.total.map((p) => p.value) ?? []} up={pack?.mom == null ? null : pack.mom >= 0} />
        </div>
        <div className="loan-chart">
          <div className="muted">전년동월 증가율</div>
          <div className={`big ${pack?.yoy == null ? "" : pack.yoy >= 0 ? "up" : "down"}`} style={{ fontSize: 22 }}>
            {pack?.yoy != null ? pct(pack.yoy) : "—"}
          </div>
          <div className="muted">{ym(pack?.date ?? null)}</div>
          <RealtySpark values={pack?.yoySeries.map((p) => p.value) ?? []} up={pack?.yoy == null ? null : pack.yoy >= 0} />
        </div>
        <div className="loan-chart">
          <div className="muted">전국 대비 비중</div>
          <div className="big" style={{ fontSize: 22 }}>{sharePct(pack?.shareOfKr)}</div>
          <div className="muted">{ym(pack?.date ?? null)} · 예금은행 말잔</div>
          <RealtySpark values={pack?.shareSeries.map((p) => p.value) ?? []} up={null} />
        </div>
        <div className="loan-mini">
          <div>
            <div className="muted">주택관련</div>
            <div>{pack?.housingJo != null ? jo(pack.housingJo) : "—"}</div>
            <div className="muted">가계대출 대비 {sharePct(pack?.housingShare)}</div>
          </div>
          <div>
            <div className="muted">연체율</div>
            <div>{pack?.npl != null ? `${pack.npl.toFixed(2)}%` : "—"}</div>
          </div>
        </div>
        <div className="loan-chart">
          <div className="muted">가계신용 / GDP</div>
          <div className="big" style={{ fontSize: 18 }}>—</div>
          <RealtySpark values={[]} up={null} />
          <p className="muted" style={{ margin: "6px 0 0" }}>통계코드 확인 전. ECOS·통계청 원문을 엽니다. 지어내지 않습니다.</p>
        </div>
      </div>
      {loans?.kr && (
        <p className="muted" style={{ marginTop: 10 }}>전국 예금은행 가계 {jo(loans.kr.latestJo)} ({ym(loans.kr.date)})</p>
      )}
    </aside>
  );
}
