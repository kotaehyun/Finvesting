import {
  REALTY_NTS_CGT,
  REALTY_NTS_CGT_METROS,
  fmtManPeople,
  fmtPct,
  ntsCgtDelta,
  ntsCgtRestDelta,
  ntsCgtSeoulOfGrowth,
  ntsCgtShare,
  ntsCgtSudoDelta,
  ntsCgtSudoNow,
} from "@finvesting/core";

export function RealtyNtsPanel() {
  const c = REALTY_NTS_CGT;
  const seoul = REALTY_NTS_CGT_METROS.find((r) => r.id === "seoul");
  const sudoNow = ntsCgtSudoNow();
  const maxNow = Math.max(...REALTY_NTS_CGT_METROS.map((r) => r.now));

  return (
    <div className="nts-panel">
      {/* 1. 종합부동산세 핵심 지표 블록 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>🏛️</span> 고가주택 종합부동산세 고지 핵심 지표
          </h4>
          <span className="realty-subblock-source">{c.source} 확정 고지 통계</span>
        </div>
        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏠</span> 주택분 종부세 고지 인원
            </div>
            <div className="sub-kpi-val highlight">{fmtManPeople(c.housingPeople)}</div>
            <p className="sub-kpi-sub">전년비 +{fmtManPeople(c.housingYoyPeople)} (+{c.housingYoyPct}%) · 결정세액 {c.housingTaxEok.toLocaleString("ko-KR")}억원</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>📍</span> 서울 소재 납세자 비중
            </div>
            <div className="sub-kpi-val highlight">{c.seoulSharePct}%</div>
            <p className="sub-kpi-sub">서울 {seoul ? fmtManPeople(seoul.now) : "—"} (전년대비 증가율 +{seoul?.yoyPct}%)</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏙️</span> 수도권 전체 집중도
            </div>
            <div className="sub-kpi-val warn" style={{ color: "#ea580c" }}>{c.sudoSharePct}%</div>
            <p className="sub-kpi-sub">수도권 총 {fmtManPeople(sudoNow)} (서울·경기·인천 집중)</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>📈</span> 증가분의 서울 쏠림률
            </div>
            <div className="sub-kpi-val highlight">{fmtPct(ntsCgtSeoulOfGrowth())}</div>
            <p className="sub-kpi-sub">전국 순증가 {fmtManPeople(c.housingYoyPeople)} 중 서울이 {seoul ? fmtManPeople(ntsCgtDelta(seoul)) : "—"} 차지</p>
          </div>
        </div>
      </div>

      {/* 2. 지역별 종부세 인원 및 비중 비교 표 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>📊</span> 권역별 주택분 종부세 고지 인원 현황
          </h4>
          <span className="realty-subblock-source">기획재정부 및 국세청 공표 자료</span>
        </div>
        <div className="table-wrap">
          <table className="realty-table">
            <thead>
              <tr>
                <th>지역</th>
                <th className="num">2024년</th>
                <th className="num">2025년</th>
                <th>전국 비중</th>
                <th className="num">증감</th>
                <th className="num">증가율</th>
              </tr>
            </thead>
            <tbody>
              {REALTY_NTS_CGT_METROS.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.label}</td>
                  <td className="num">{fmtManPeople(r.prev)}</td>
                  <td className="num">{fmtManPeople(r.now)}</td>
                  <td>
                    <span className="loan-rank-track" style={{ minWidth: 72 }}>
                      <span className="loan-rank-bar" style={{ width: `${Math.round((r.now / maxNow) * 100)}%` }} />
                    </span>
                    <span style={{ marginLeft: 8 }}>{fmtPct(ntsCgtShare(r.now))}</span>
                  </td>
                  <td className="num">+{fmtManPeople(ntsCgtDelta(r))}</td>
                  <td className="num" style={{ color: "#dc2626" }}>+{r.yoyPct.toFixed(1)}%</td>
                </tr>
              ))}
              <tr style={{ background: "color-mix(in srgb, var(--accent) 8%, var(--card))", fontWeight: 700 }}>
                <td>수도권 합계</td>
                <td className="num">—</td>
                <td className="num">{fmtManPeople(sudoNow)}</td>
                <td>{fmtPct(ntsCgtShare(sudoNow))}</td>
                <td className="num">+{fmtManPeople(ntsCgtSudoDelta())}</td>
                <td className="num">—</td>
              </tr>
              <tr>
                <td>비수도권 합계</td>
                <td className="num">—</td>
                <td className="num">{fmtManPeople(c.housingPeople - sudoNow)}</td>
                <td>{fmtPct(ntsCgtShare(c.housingPeople - sudoNow))}</td>
                <td className="num">+{fmtManPeople(ntsCgtRestDelta())}</td>
                <td className="num">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
