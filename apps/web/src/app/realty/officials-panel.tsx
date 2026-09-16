import {
  REALTY_OFFICIAL_ASSET,
  REALTY_OFFICIAL_FLOW_ROWS,
  REALTY_OFFICIAL_HOUSES,
  REALTY_OFFICIAL_METRO_HEADS,
  formatManwon,
  realtyOfficialCapitalAwayCount,
} from "@finvesting/core";

export function RealtyOfficialsPanel() {
  const a = REALTY_OFFICIAL_ASSET;
  return (
    <div className="official-panel">
      {/* 1. 고위공직자 재산 등록 및 증가 핵심 지표 블록 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>🎖️</span> 고위공직자 정기 재산 변동 통계
          </h4>
          <span className="realty-subblock-source">{a.source} (공개일 {a.published})</span>
        </div>
        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>👥</span> 공개 대상 고위공직자
            </div>
            <div className="sub-kpi-val highlight">{a.count.toLocaleString("ko-KR")}명</div>
            <p className="sub-kpi-sub">정부공직자윤리위원회 관할 행정부 고위직</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>💰</span> 1인당 평균 신고재산
            </div>
            <div className="sub-kpi-val highlight">{formatManwon(a.avgMan)}</div>
            <p className="sub-kpi-sub">전년 {formatManwon(a.prevAvgMan)} 대비 +{formatManwon(a.deltaMan)} 증가</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>📈</span> 재산 증가자 비율
            </div>
            <div className="sub-kpi-val warn" style={{ color: "#ea580c" }}>{a.upPct}%</div>
            <p className="sub-kpi-sub">증가 {a.up.toLocaleString("ko-KR")}명 · 감소 {a.down.toLocaleString("ko-KR")}명</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>📊</span> 재산 증가 주원인
            </div>
            <div className="sub-kpi-val">순재산 {a.netPct}%</div>
            <p className="sub-kpi-sub">저축·투자 등 {formatManwon(a.netMan)} (공시가 상승분 {formatManwon(a.appraisalMan)})</p>
          </div>
        </div>
      </div>

      {/* 2. 광역단체장 주택 보유 분포 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>🏛️</span> 광역단체장 주택 소재지 분포 분석
          </h4>
          <span className="realty-subblock-source">관보 공시 기준 (총 {REALTY_OFFICIAL_METRO_HEADS}명)</span>
        </div>
        <div className="table-wrap">
          <table className="realty-table">
            <thead>
              <tr>
                <th>분포 유형</th>
                <th className="num">인원</th>
                <th>설명</th>
              </tr>
            </thead>
            <tbody>
              {REALTY_OFFICIAL_FLOW_ROWS.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.label}</td>
                  <td className="num">{r.count}</td>
                  <td>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. 관할 외 수도권 주택 보유 현황 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>📍</span> 관할 외 수도권 주택 보유 공직자 명단
          </h4>
          <span className="realty-subblock-source">대한민국 전자관보 공시</span>
        </div>
        <div className="table-wrap">
          <table className="realty-table">
            <thead>
              <tr>
                <th>직위</th>
                <th>성명</th>
                <th>관할 구역</th>
                <th>주택 소재지</th>
                <th>소유 명의</th>
                <th>방향</th>
              </tr>
            </thead>
            <tbody>
              {REALTY_OFFICIAL_HOUSES.map((h) => (
                <tr key={`${h.office}-${h.name}`}>
                  <td style={{ fontWeight: 600 }}>{h.office}</td>
                  <td>{h.name}</td>
                  <td>{h.metroLabel}</td>
                  <td>{h.house}</td>
                  <td>{h.title}</td>
                  <td><span className="zone-chip warn">{h.flowLabel}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="starter-list" style={{ marginTop: 12 }}>
          <a className="starter" href={a.url} target="_blank" rel="noreferrer">인사혁신처 보도자료</a>
          <a className="starter" href={a.peti} target="_blank" rel="noreferrer">공직윤리시스템</a>
          <a className="starter" href={a.gwanbo} target="_blank" rel="noreferrer">대한민국 전자관보</a>
        </div>
      </div>
    </div>
  );
}
