import {
  REALTY_AGE_SHARES,
  REALTY_BIRTH_AGE,
  REALTY_CLAIM_MIX,
  REALTY_CLAIMS,
  REALTY_CENSUS_2025,
  REALTY_COHORT_LINKS,
  REALTY_COHORT_SLOTS,
  REALTY_HOUSING_COHORT,
  REALTY_MARRY_2025,
  familyFormationShare,
  modalAgeLabel,
  modalAgeShare,
  realtyClaimsForTitle,
} from "@finvesting/core";

type NewsItem = { id: string; title: string; url: string; publisher: string | null };

export function RealtyClaimsPanel({ items }: { items: NewsItem[] }) {
  const maxShare = modalAgeShare();
  const family = familyFormationShare();
  const h = REALTY_HOUSING_COHORT;
  const m = REALTY_MARRY_2025;
  const c = REALTY_CENSUS_2025;

  return (
    <div className="claims-panel">
      <p className="muted" style={{ margin: "0 0 10px" }}>
        전국 평균·중위연령만 보면 시장이 왜곡됩니다. 인구 최빈은 {modalAgeLabel()}({maxShare}%)이고, 혼인·출산은 {m.peakBand}세에 몰립니다.
        유튜브 본문은 긁지 않습니다. 과장·일부만·확인필요로만 나눕니다.
      </p>

      <h4 style={{ margin: "0 0 6px" }}>평균의 함정 · 혼인·출산 연령</h4>
      <p className="muted" style={{ margin: "0 0 8px" }}>
        {c.source}. 중위 {c.medianAge}세. 30·40대 합 {family.toFixed(1)}%가 혼인·출산·신혼 주택의 중심입니다. 막대 주황이 그 구간입니다.
      </p>
      <div className="age-bars" aria-label="연령대 인구 비중">
        {REALTY_AGE_SHARES.map((r) => (
          <div key={r.id} className={`age-bar${r.family ? " family" : ""}`}>
            <span className="age-bar-label">{r.label}</span>
            <span className="age-bar-track">
              <span className="age-bar-fill" style={{ width: `${Math.round((r.share / maxShare) * 100)}%` }} />
            </span>
            <span className="age-bar-n">{r.share}%</span>
          </div>
        ))}
      </div>
      <div className="official-kpis" style={{ marginTop: 12 }}>
        <div className="index-cell">
          <div className="muted">초혼 (여·남)</div>
          <div className="big" style={{ fontSize: 20 }}>{m.firstAgeF} · {m.firstAgeM}세</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>{m.peakBand}세 혼인율 최고 여 {m.peakF} · 남 {m.peakM}(1천 명당)</p>
        </div>
        <div className="index-cell">
          <div className="muted">모 출산연령</div>
          <div className="big" style={{ fontSize: 20 }}>{REALTY_BIRTH_AGE.mother}세</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            {REALTY_BIRTH_AGE.peakBand}세 출산율 {REALTY_BIRTH_AGE.peakRate}(여 1천 명당) · 첫째 {REALTY_BIRTH_AGE.first}세 · 35세 이상 {REALTY_BIRTH_AGE.mother35Share}%
          </p>
        </div>
        <div className="index-cell">
          <div className="muted">30대 미혼</div>
          <div className="big" style={{ fontSize: 20 }}>{c.single30}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>40대 {c.single40}% · 서울 18세+ 미혼 {c.seoulSingle}%</p>
        </div>
        <div className="index-cell">
          <div className="muted">청년 자가점유</div>
          <div className="big" style={{ fontSize: 20 }}>{h.youthOwn}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>{h.youth} · 전체 {h.generalOwn}% · 신혼 {h.newlywedOwn}%</p>
        </div>
      </div>
      <div className="official-kpis" style={{ marginTop: 12 }}>
        <div className="index-cell">
          <div className="muted">신혼 PIR</div>
          <div className="big" style={{ fontSize: 20 }}>{h.newlywedPir.toFixed(1)}배</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>{h.newlywed} · 청년도 {h.youthPir.toFixed(1)}배 · 고령 {h.elderPir.toFixed(1)}배</p>
        </div>
        <div className="index-cell">
          <div className="muted">신혼 아파트</div>
          <div className="big" style={{ fontSize: 20 }}>{h.newlywedApt}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>청년 {h.youthApt.toFixed(1)}% · 일반 {h.generalApt.toFixed(1)}%</p>
        </div>
        <div className="index-cell">
          <div className="muted">첫 집까지</div>
          <div className="big" style={{ fontSize: 20 }}>{h.firstYears}년</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>가구주 된 뒤. 최근 4년 생애최초 가구주 {h.firstAge}세</p>
        </div>
        <div className="index-cell">
          <div className="muted">혼인 건수</div>
          <div className="big" style={{ fontSize: 20 }}>{(m.count / 10_000).toFixed(0)}만</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>+{m.yoyPct}% · 조혼인율 {m.crude}</p>
        </div>
      </div>
      <div className="index-grid" style={{ marginTop: 12 }}>
        {REALTY_COHORT_SLOTS.map((s) => (
          <div key={s.id} className="index-cell">
            <div className="muted">{s.label}</div>
            <div className="big" style={{ fontSize: 18 }}>—</div>
            <p className="muted" style={{ margin: "6px 0 0" }}>{s.need}</p>
          </div>
        ))}
      </div>
      <div className="starter-list" style={{ marginTop: 10 }}>
        <a className="starter" href={REALTY_COHORT_LINKS.census} target="_blank" rel="noreferrer">2025 총조사</a>
        <a className="starter" href={REALTY_COHORT_LINKS.marry} target="_blank" rel="noreferrer">혼인·이혼</a>
        <a className="starter" href={REALTY_COHORT_LINKS.birth} target="_blank" rel="noreferrer">출생통계</a>
        <a className="starter" href={REALTY_COHORT_LINKS.housing} target="_blank" rel="noreferrer">주거실태조사</a>
        <a className="starter" href={REALTY_COHORT_LINKS.rebAge} target="_blank" rel="noreferrer">매입 연령대 (부동산원)</a>
      </div>

      <div className="mix-wrap" style={{ marginTop: 16 }}>
        <div className="mix-bar" aria-hidden="true">
          <span className="mix-apt" style={{ flex: REALTY_CLAIM_MIX.apt }}>아파트 {REALTY_CLAIM_MIX.apt}</span>
          <span className="mix-other" style={{ flex: REALTY_CLAIM_MIX.other }}>다가구·빌라·연립 {REALTY_CLAIM_MIX.other}</span>
        </div>
        <p className="muted" style={{ margin: "6px 0 0" }}>{REALTY_CLAIM_MIX.note}</p>
      </div>
      <div className="claim-grid">
        {REALTY_CLAIMS.map((claim) => (
          <article key={claim.id} className={`claim-card ${claim.verdict}`}>
            <div className="claim-buzz">“{claim.buzz}”</div>
            <p className="muted" style={{ margin: "8px 0" }}>{claim.official}</p>
            {claim.facts && claim.facts.length > 0 && (
              <ul className="claim-facts">
                {claim.facts.map((f) => (
                  <li key={f.label}><strong>{f.label}</strong> {f.value}</li>
                ))}
              </ul>
            )}
            <span className={`claim-tag ${claim.verdict}`}>{claim.verdictLabel}</span>
          </article>
        ))}
      </div>
      {items.length > 0 && (
        <>
          <h4 style={{ margin: "16px 0 6px" }}>기사 제목과 맞춰 보기</h4>
          <ul className="plain">
            {items.slice(0, 8).map((n) => {
              const hits = realtyClaimsForTitle(n.title);
              return (
                <li key={n.id} className="news-item">
                  <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
                  <div className="muted">
                    {n.publisher}
                    {hits.length ? ` · ${hits.map((hit) => hit.verdictLabel).join(" · ")}` : " · 매칭 없음"}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
