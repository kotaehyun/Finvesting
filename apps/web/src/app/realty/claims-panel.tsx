import {
  REALTY_AGE_SHARES,
  REALTY_BIRTH_AGE,
  REALTY_CLAIM_MIX,
  REALTY_CLAIMS,
  REALTY_CENSUS_2025,
  REALTY_COHORT_LINKS,
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
      {/* 1. 연령대별 인구 분포 & 평균의 함정 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>📊</span> 연령대별 인구 분포 & 평균의 왜곡
          </h4>
          <span className="realty-subblock-source">{c.source} (중위연령 {c.medianAge}세)</span>
        </div>
        <p className="muted" style={{ margin: "0 0 10px", fontSize: 13 }}>
          인구 최빈 구간은 {modalAgeLabel()}({maxShare}%)이며, 주택 실수요의 핵심인 30·40대 비중은 {family.toFixed(1)}%(주황색)입니다.
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
      </div>

      {/* 2. 혼인 & 출산 핵심 생애 코호트 블록 (카드 그리드) */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>💍</span> 혼인 및 출산 핵심 생애 코호트 지표
          </h4>
          <span className="realty-subblock-source">통계청 인구동향조사</span>
        </div>
        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>👰</span> 평균 초혼 연령
            </div>
            <div className="sub-kpi-val highlight">여 {m.firstAgeF} · 남 {m.firstAgeM}세</div>
            <p className="sub-kpi-sub">{m.peakBand}세 혼인율 최고 (여 {m.peakF} · 남 {m.peakM}건/1천명)</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>👶</span> 평균 모 출산 연령
            </div>
            <div className="sub-kpi-val">평균 {REALTY_BIRTH_AGE.mother}세</div>
            <p className="sub-kpi-sub">첫째아 {REALTY_BIRTH_AGE.first}세 · 35세 이상 출산 {REALTY_BIRTH_AGE.mother35Share}%</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>👤</span> 30대 미혼율
            </div>
            <div className="sub-kpi-val warn" style={{ color: "#ea580c" }}>{c.single30}%</div>
            <p className="sub-kpi-sub">40대 미혼 {c.single40}% · 서울 성인 미혼율 {c.seoulSingle}%</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🔔</span> 연간 혼인 건수
            </div>
            <div className="sub-kpi-val">{(m.count / 10_000).toFixed(0)}만 건</div>
            <p className="sub-kpi-sub">전년비 +{m.yoyPct}% 반등 · 조혼인율 {m.crude}</p>
          </div>
        </div>
      </div>

      {/* 3. 청년·신혼 주거 실태 및 내집마련 블록 (카드 그리드) */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>🏠</span> 청년·신혼부부 주거 실태 및 내집마련
          </h4>
          <span className="realty-subblock-source">국토교통부 주거실태조사</span>
        </div>
        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🔑</span> 신혼부부 자가점유율
            </div>
            <div className="sub-kpi-val">{h.newlywedOwn}%</div>
            <p className="sub-kpi-sub">청년 독립가구 {h.youthOwn}% · 일반 전체 {h.generalOwn}%</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>📈</span> 신혼부부 소득대비 집값(PIR)
            </div>
            <div className="sub-kpi-val highlight">{h.newlywedPir.toFixed(1)}배</div>
            <p className="sub-kpi-sub">청년 가구 {h.youthPir.toFixed(1)}배 · 고령 가구 {h.elderPir.toFixed(1)}배</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏢</span> 신혼부부 아파트 거주 비중
            </div>
            <div className="sub-kpi-val highlight">{h.newlywedApt}%</div>
            <p className="sub-kpi-sub">청년 가구 {h.youthApt.toFixed(1)}% · 일반 전체 {h.generalApt.toFixed(1)}%</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>⏳</span> 생애 첫 집 마련 기간
            </div>
            <div className="sub-kpi-val">{h.firstYears}년</div>
            <p className="sub-kpi-sub">독립 가구주 기준 (최근 4년 생애최초 가구주 평균 {h.firstAge}세)</p>
          </div>
        </div>
        <div className="starter-list" style={{ marginTop: 12 }}>
          <a className="starter" href={REALTY_COHORT_LINKS.census} target="_blank" rel="noreferrer">인구주택총조사</a>
          <a className="starter" href={REALTY_COHORT_LINKS.marry} target="_blank" rel="noreferrer">혼인·이혼 통계</a>
          <a className="starter" href={REALTY_COHORT_LINKS.birth} target="_blank" rel="noreferrer">출생 통계</a>
          <a className="starter" href={REALTY_COHORT_LINKS.housing} target="_blank" rel="noreferrer">주거실태조사</a>
          <a className="starter" href={REALTY_COHORT_LINKS.rebAge} target="_blank" rel="noreferrer">부동산원 매입자 연령대</a>
        </div>
      </div>

      {/* 4. 시중 11대 통설 vs 공식 통계 팩트 대조 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>⚖️</span> 시중 11대 통설 vs 공식 통계 팩트 대조
          </h4>
          <span className="realty-subblock-source">통계청 · 한국은행 교차 검증</span>
        </div>
        <div className="mix-wrap" style={{ margin: "0 0 14px" }}>
          <div className="mix-bar" aria-hidden="true">
            <span className="mix-apt" style={{ flex: REALTY_CLAIM_MIX.apt }}>아파트 {REALTY_CLAIM_MIX.apt}</span>
            <span className="mix-other" style={{ flex: REALTY_CLAIM_MIX.other }}>다가구·빌라·연립 {REALTY_CLAIM_MIX.other}</span>
          </div>
          <p className="muted" style={{ margin: "6px 0 0", fontSize: 12 }}>{REALTY_CLAIM_MIX.note}</p>
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
      </div>

      {/* 5. 언론 기사 헤드라인 팩트 매칭 */}
      {items.length > 0 && (
        <div className="realty-subblock-card">
          <div className="realty-subblock-head">
            <h4 className="realty-subblock-title">
              <span>📰</span> 주요 뉴스 헤드라인 팩트 매칭
            </h4>
            <span className="realty-subblock-source">실시간 RSS 분석</span>
          </div>
          <ul className="plain">
            {items.slice(0, 8).map((n) => {
              const hits = realtyClaimsForTitle(n.title);
              return (
                <li key={n.id} className="news-item">
                  <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    {n.publisher}
                    {hits.length ? ` · ${hits.map((hit) => hit.verdictLabel).join(" · ")}` : " · 공식 통계 매칭 없음"}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
