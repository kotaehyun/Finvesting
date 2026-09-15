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
      <p className="muted" style={{ margin: "0 0 10px" }}>
        사적 자산가·재벌·연예인·임원 명단은 없습니다. 4급 이상은 재산등록이지 공개가 아닙니다. 종부세 집계에서 고위공직자만 빼는 표도 없습니다.
        아래 성명은 공직자윤리법상 재산공개 대상(광역단체장)뿐입니다.
        {a.source}. 기준 {a.asOf}, 공개 {a.published}. 사이트는 긁지 않습니다.
      </p>
      <div className="official-kpis">
        <div className="index-cell">
          <div className="muted">공개 대상</div>
          <div className="big" style={{ fontSize: 20 }}>{a.count.toLocaleString("ko-KR")}명</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>행정부 관할. 국회·법원은 같은 시스템에서 따로.</p>
        </div>
        <div className="index-cell">
          <div className="muted">1인 평균</div>
          <div className="big" style={{ fontSize: 20 }}>{formatManwon(a.avgMan)}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>직전 {formatManwon(a.prevAvgMan)} → {formatManwon(a.deltaMan)} 증가</p>
        </div>
        <div className="index-cell">
          <div className="muted">재산 증가</div>
          <div className="big" style={{ fontSize: 20 }}>{a.upPct}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>{a.up.toLocaleString("ko-KR")}명 증가 · {a.down.toLocaleString("ko-KR")}명 감소</p>
        </div>
        <div className="index-cell">
          <div className="muted">증가 요인</div>
          <div className="big" style={{ fontSize: 18 }}>순재산 {a.netPct}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>저축·주식 {formatManwon(a.netMan)} · 공시가 {formatManwon(a.appraisalMan)}</p>
        </div>
      </div>

      <h4 style={{ margin: "16px 0 6px" }}>광역단체장 주택 방향</h4>
      <p className="muted" style={{ margin: "0 0 8px" }}>
        {REALTY_OFFICIAL_METRO_HEADS}명(대구 공석 제외). 관할이 아닌 서울·경기 주택 {realtyOfficialCapitalAwayCount()}명.
        개인 총액 순위가 아니라 소재 방향입니다. 원문은 관보.
      </p>
      <div className="table-wrap">
        <table className="realty-table">
          <thead>
            <tr>
              <th>방향</th>
              <th className="num">인원</th>
              <th>설명</th>
            </tr>
          </thead>
          <tbody>
            {REALTY_OFFICIAL_FLOW_ROWS.map((r) => (
              <tr key={r.id}>
                <td>{r.label}</td>
                <td className="num">{r.count}</td>
                <td>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 style={{ margin: "16px 0 6px" }}>확인된 소재</h4>
      <div className="table-wrap">
        <table className="realty-table">
          <thead>
            <tr>
              <th>직위</th>
              <th>성명</th>
              <th>관할</th>
              <th>주택 소재</th>
              <th>명의</th>
              <th>방향</th>
            </tr>
          </thead>
          <tbody>
            {REALTY_OFFICIAL_HOUSES.map((h) => (
              <tr key={`${h.office}-${h.name}`}>
                <td>{h.office}</td>
                <td>{h.name}</td>
                <td>{h.metroLabel}</td>
                <td>{h.house}</td>
                <td>{h.title}</td>
                <td>{h.flowLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="starter-list" style={{ marginTop: 10 }}>
        <a className="starter" href={a.url} target="_blank" rel="noreferrer">인사혁신처 보도</a>
        <a className="starter" href={a.peti} target="_blank" rel="noreferrer">공직윤리시스템</a>
        <a className="starter" href={a.gwanbo} target="_blank" rel="noreferrer">전자관보</a>
      </div>
    </div>
  );
}
