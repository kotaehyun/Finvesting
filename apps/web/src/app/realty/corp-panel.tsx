import {
  REALTY_CORP_CHANNELS,
  REALTY_CORP_LINKS,
  REALTY_NTS_CGT,
  fmtManPeople,
  fmtPct,
  ntsCgtCorpPeopleShare,
  ntsCgtCorpTaxShare,
  ntsCgtWonPerHead,
} from "@finvesting/core";

function fmtManWon(won: number | null): string {
  if (won == null) return "—";
  const man = Math.round(won / 10_000);
  return `${man.toLocaleString("ko-KR")}만 원`;
}

export function RealtyCorpPanel() {
  const c = REALTY_NTS_CGT;
  const corpHead = ntsCgtWonPerHead(c.corpTaxEok, c.corpPeople);
  const personHead = ntsCgtWonPerHead(c.personalTaxEok, c.personalPeople);

  return (
    <div className="corp-panel">
      {/* 1. 법인 주택분 종부세 핵심 지표 블록 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>🏢</span> 법인 명의 주택 보유 및 종부세 부담 지표
          </h4>
          <span className="realty-subblock-source">국세청 종부세 납세자 유형 집계</span>
        </div>
        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏛️</span> 법인 주택분 종부세 인원
            </div>
            <div className="sub-kpi-val highlight">{fmtManPeople(c.corpPeople)}</div>
            <p className="sub-kpi-sub">{c.corpPeopleDelta}명 ({c.corpYoyPct}%) · 총 세액 {c.corpTaxEok.toLocaleString("ko-KR")}억원</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>👥</span> 전체 납세자 중 법인 인원 비중
            </div>
            <div className="sub-kpi-val">{fmtPct(ntsCgtCorpPeopleShare())}</div>
            <p className="sub-kpi-sub">총 주택분 인원 {fmtManPeople(c.housingPeople)} 중 법인 점유율</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>💰</span> 전체 세액 중 법인 납부 비중
            </div>
            <div className="sub-kpi-val warn" style={{ color: "#ea580c" }}>{fmtPct(ntsCgtCorpTaxShare())}</div>
            <p className="sub-kpi-sub">총 세액 {c.housingTaxEok.toLocaleString("ko-KR")}억원 중 법인이 {c.corpTaxEok.toLocaleString("ko-KR")}억원 부담</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>⚖️</span> 법인 1사당 평균 고지세액
            </div>
            <div className="sub-kpi-val highlight">{fmtManWon(corpHead)}</div>
            <p className="sub-kpi-sub">개인 1인당 평균 고지액 {fmtManWon(personHead)} 대비 대폭 상회</p>
          </div>
        </div>
      </div>

      {/* 2. 법인 거래 통계 처리 방식 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>📋</span> 법인 거래 및 명의 데이터 분류 기준
          </h4>
          <span className="realty-subblock-source">통계청 및 국토교통부 집계 기준</span>
        </div>
        <div className="table-wrap">
          <table className="realty-table">
            <thead>
              <tr>
                <th>집단 구분</th>
                <th>반영 상태</th>
                <th>통계 수집 및 처리 방법</th>
              </tr>
            </thead>
            <tbody>
              {REALTY_CORP_CHANNELS.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 600 }}>{row.group}</td>
                  <td><span className="zone-chip">{row.putLabel}</span></td>
                  <td>{row.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="starter-list" style={{ marginTop: 12 }}>
          <a className="starter" href={REALTY_CORP_LINKS.rebBuyer} target="_blank" rel="noreferrer">부동산원 법인 거래</a>
          <a className="starter" href={REALTY_CORP_LINKS.tasis} target="_blank" rel="noreferrer">TASIS 종부세</a>
        </div>
      </div>
    </div>
  );
}
