"use client";
import {
  REALTY_METROS,
  eokToJo,
  realtyMetroForPlace,
  type MetroLoanRankRow,
  type RealtyMetroId,
} from "@finvesting/core";
export function RealtyMapLoanCard({
  focusId,
  focusLabel,
  loans,
}: {
  focusId: string | null;
  focusLabel: string | null;
  loans: Loans | undefined;
}) {
  const metroId = focusId ? realtyMetroForPlace(focusId) : null;
  const pack = metroId && loans ? loans.metros[metroId] : null;
  const balance = (pack?.total ?? []).map((p) => ({ date: p.date, value: eokToJo(p.value) }));
  const yoyPct = pack?.yoy == null ? null : pack.yoy * 100;
  if (!focusId) return null;
  const label = pack?.label ?? focusLabel ?? "광역시도";
  if (balance.length < 1) {
    return (
      <div className="realty-skyline">
        <span className="sky-name">{label}</span>
        <span className="sky-note">시계열이 없습니다</span>
      </div>
    );
  }
  const years = yearEnds(balance);
  const vals = years.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const ceiling = metroCeiling(loans) || max;
  const cap = Math.max(22, (max / ceiling) * SKY_MAX);
  return (
    <div className="realty-skyline">
      <div className="sky-row" key={focusId} style={{ ["--sky-cap" as string]: `${SKY_MAX}px` }}>
        {years.map((p, i) => {
          const t = (p.value - min) / span;
          const h = Math.max(12, cap * (0.42 + 0.58 * t));
          const last = i === years.length - 1;
          return (
            <span key={p.date} className="sky-bldg">
              <em>{joDigits(p.value)}</em>
              <i
                className={last ? "sky-tower on" : "sky-tower"}
                style={{ height: h, ["--h" as string]: `${h}px`, animationDelay: `${i * 70}ms` }}
                title={`${p.date.slice(0, 7)} ${p.value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}조`}
              />
              <small>{p.date.slice(0, 4)}</small>
            </span>
          );
        })}
      </div>
      <span className="sky-name">{label}</span>
      {yoyPct != null && (
        <span className={yoyPct >= 0 ? "sky-yoy up" : "sky-yoy down"}>
          전년동월 {yoyPct >= 0 ? "+" : ""}{yoyPct.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%
        </span>
      )}
    </div>
  );
}

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

const SKY_MAX = 156;

function joDigits(n: number) {
  const small = n < 20;
  return n.toLocaleString("ko-KR", { minimumFractionDigits: small ? 1 : 0, maximumFractionDigits: small ? 1 : 0 });
}

function yearEnds(points: { date: string; value: number }[]) {
  const last = new Map<string, { date: string; value: number }>();
  for (const p of points) {
    const y = p.date.slice(0, 4);
    const prev = last.get(y);
    if (!prev || p.date > prev.date) last.set(y, p);
  }
  return [...last.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function metroCeiling(loans: Loans | undefined) {
  if (!loans) return 0;
  let ceiling = 0;
  for (const metro of Object.values(loans.metros)) {
    for (const p of metro.total) ceiling = Math.max(ceiling, eokToJo(p.value));
  }
  return ceiling;
}

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

  const hasShare = rank.some((r) => r.shareOfKr != null);
  const hasSeries = pack != null && (pack.latest != null || pack.yoy != null || pack.shareOfKr != null);

  return (
    <aside className="realty-loan-panel">
      <div className="loan-panel-head">
        <h4>{focusLabel ?? "시도별 가계대출"}</h4>
        <p className="muted">
          {focusId
            ? `${pack?.label ?? "광역시도"} 예금은행 말잔. 시·구 숫자는 없습니다.`
            : (loans?.note ?? "도면의 지역을 누르면 그 자리에서 말잔 빌딩이 올라옵니다.")}
        </p>
      </div>

      {loading && <p className="muted">불러오는 중…</p>}

      {focusId && (
        <div className="loan-hero">
          <div className="loan-hero-nums">
            <div>
              <span className="muted">말잔</span>
              <strong>{pack?.latestJo != null ? jo(pack.latestJo) : "—"}</strong>
              <span className="muted">{pack?.date ? `${ym(pack.date)} · ` : ""}전월 {pack?.mom != null ? pct(pack.mom) : "—"}</span>
            </div>
            <div>
              <span className="muted">전년동월</span>
              <strong className={pack?.yoy == null ? "" : pack.yoy >= 0 ? "up" : "down"}>
                {pack?.yoy != null ? pct(pack.yoy) : "—"}
              </strong>
              <span className="muted">{ym(pack?.date ?? null)}</span>
            </div>
          </div>
        </div>
      )}
      {!focusId && !loading && (
        <p className="muted loan-hint">도면의 지역을 누르면 그 자리에서 말잔 빌딩이 올라옵니다.</p>
      )}

      {hasShare ? (
        <ol className="loan-rank">
          {rank.map((r) => {
            const on = metroId === r.id;
            const w = r.shareOfKr != null ? Math.max(6, (r.shareOfKr / maxShare) * 100) : 0;
            return (
              <li key={r.id}>
                <button type="button" className={`loan-rank-row${on ? " on" : ""}`} onClick={() => onFocus(r.id, r.label)}>
                  <span className="loan-rank-n">{r.rank ?? ""}</span>
                  <span>{r.label}</span>
                  <span className="loan-rank-track" aria-hidden="true">
                    {w > 0 ? <span className="loan-rank-bar" style={{ width: `${w}%` }} /> : null}
                  </span>
                  <strong>{sharePct(r.shareOfKr)}</strong>
                  <span className="muted">{r.latest != null ? jo(eokToJo(r.latest)) : ""}</span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="loan-metro-picks" aria-label="광역시도">
          {rank.map((r) => (
            <button
              type="button"
              key={r.id}
              className={metroId === r.id ? "on" : ""}
              onClick={() => onFocus(r.id, r.label)}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      <div className="loan-detail">
        {hasSeries && pack && (
          <p className="muted">
            주택관련 {pack.housingJo != null ? jo(pack.housingJo) : "—"}
            {" · "}가계대출 대비 {sharePct(pack.housingShare)}
            {" · "}연체율 {pack.npl != null ? `${pack.npl.toFixed(2)}%` : "—"}
            {" · "}전국 비중 {sharePct(pack.shareOfKr)}
          </p>
        )}
        {loans?.kr && (
          <p className="muted">전국 예금은행 가계 {jo(loans.kr.latestJo)} ({ym(loans.kr.date)})</p>
        )}
        <p className="muted">가계신용/GDP는 통계코드 확인 전이라 비워 둡니다.</p>
      </div>
    </aside>
  );
}
