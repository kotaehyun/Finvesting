import { REALTY_TENURE_DETAIL, realtyMetroForPlace, realtyMetroLabel } from "@finvesting/core";

const CAPITAL = new Set(["seoul", "incheon", "gyeonggi"]);

function pct(n: number | null) {
  return n == null ? "—" : `${n.toFixed(1)}%`;
}

function Stack({ own, rent, free }: { own: number | null; rent: number; free: number | null }) {
  if (own == null || free == null) return null;
  return (
    <span className="tenure-stack" aria-hidden>
      <i className="own" style={{ width: `${own}%` }} />
      <i className="rent" style={{ width: `${rent}%` }} />
      <i className="free" style={{ width: `${free}%` }} />
    </span>
  );
}

export function RealtyTenureDetail({ focusId, focusCode }: { focusId: string | null; focusCode: string | null }) {
  const detail = REALTY_TENURE_DETAIL;
  const metroId = focusId ? realtyMetroForPlace(focusId) : null;
  const label = metroId ? realtyMetroLabel(metroId) : null;
  const district = Boolean(focusId && metroId && (focusId !== metroId || (focusCode && focusCode !== focusId)));
  const capital = detail.sidos.filter((s) => CAPITAL.has(s.id));
  const local = detail.sidos.filter((s) => !CAPITAL.has(s.id));

  return (
    <section className="tenure-detail" aria-label="2024년 자가와 전월세 점유">
      <h3>2024년 점유 · 자가와 전월세</h3>
      <p className="tenure-note">
        {detail.rentMeans} {detail.missing}
      </p>
      <p className="tenure-key"><i className="own" /> 자가 <i className="rent" /> 임차(전세+월세) <i className="free" /> 무상</p>

      <h4>일반가구</h4>
      <div className="tenure-regions">
        {detail.regions.map((r) => (
          <div key={r.id} className="tenure-cell">
            <strong>{r.label}</strong>
            <Stack own={r.own} rent={r.rent} free={r.free} />
            <small>자가 {pct(r.own)} · 임차 {pct(r.rent)} · 무상 {r.free == null ? "데이터 없음" : pct(r.free)}</small>
            <small>자가보유 {pct(r.hold)}</small>
          </div>
        ))}
      </div>

      <h4>청년·신혼·고령</h4>
      <div className="tenure-cohorts">
        {detail.cohorts.map((c) => (
          <div key={c.id} className="tenure-cohort">
            <strong>{c.label}</strong>
            <small>{c.who}</small>
            {c.areas.map((a) => (
              <p key={a.id}>
                {a.label} 자가 {pct(a.own)} · 임차 {pct(a.rent)}
              </p>
            ))}
          </div>
        ))}
      </div>

      <h4>가구주 연령 · 전국</h4>
      <div className="tenure-ages">
        {detail.ages.map((a) => (
          <div key={a.id} className="tenure-age" title={`${a.label} 자가 ${pct(a.own)} 임차 ${pct(a.rent)} 무상 ${pct(a.free)}`}>
            <span className="tenure-age-bars">
              {a.own == null ? null : <i className="own" style={{ height: `${Math.max(2, (a.own / 100) * 72)}px` }} />}
              <i className="rent" style={{ height: `${Math.max(2, (a.rent / 100) * 72)}px` }} />
            </span>
            <small>{a.label.replace("세", "")}</small>
            <small>{a.own == null ? "자가 —" : pct(a.own)}</small>
          </div>
        ))}
      </div>
      <p className="tenure-note">20세 미만 자가는 표에 ‘-’입니다. 청년(만19–34세)과 20–29세는 다른 칸입니다.</p>

      <h4>가구주 성별 · 전국</h4>
      <div className="tenure-sex">
        {detail.sex.map((s) => (
          <p key={s.id}>{s.label} 자가 {pct(s.own)} · 임차 {pct(s.rent)} · 무상 {pct(s.free)}</p>
        ))}
      </div>

      <h4>{label ? `${label} 점유` : "시도 점유"}</h4>
      <p className="tenure-note">
        {label
          ? `${label} 자가 ${pct(detail.sidos.find((s) => s.id === metroId)?.own ?? null)} · 임차 ${pct(detail.sidos.find((s) => s.id === metroId)?.rent ?? null)} · 무상 ${pct(detail.sidos.find((s) => s.id === metroId)?.free ?? null)}.${district ? " 구·시 칸은 없습니다." : ""}`
          : "지역을 고르면 그 시도가 표시됩니다. 구·시 칸은 없습니다."}
      </p>
      <div className="tenure-sidos">
        <div>
          <small>수도권</small>
          {capital.map((s) => (
            <span key={s.id} className={s.id === metroId ? "on" : undefined}>{s.label} {pct(s.own)} / {pct(s.rent)}</span>
          ))}
        </div>
        <div>
          <small>지방</small>
          {local.map((s) => (
            <span key={s.id} className={s.id === metroId ? "on" : undefined}>{s.label} {pct(s.own)} / {pct(s.rent)}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
