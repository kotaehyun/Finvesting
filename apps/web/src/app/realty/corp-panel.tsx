import {
  REALTY_CORP_BUYER_NOTE,
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
      <p className="muted" style={{ margin: "0 0 10px" }}>
        연예인·4급 실명, 개인 법인 등기는 넣지 않습니다. 법인 명의 투기는 종부세 납세자 유형과 거래주체 집계로만 봅니다. 투기라고 단정하지 않습니다.
      </p>
      <div className="official-kpis">
        <div className="index-cell">
          <div className="muted">법인 주택분 종부세</div>
          <div className="big" style={{ fontSize: 20 }}>{fmtManPeople(c.corpPeople)}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>{c.corpPeopleDelta}명 ({c.corpYoyPct}%) · 세액 {c.corpTaxEok.toLocaleString("ko-KR")}억 ({c.corpTaxYoyPct}%)</p>
        </div>
        <div className="index-cell">
          <div className="muted">인원 비중</div>
          <div className="big" style={{ fontSize: 20 }}>{fmtPct(ntsCgtCorpPeopleShare())}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>주택분 {fmtManPeople(c.housingPeople)} 중 법인</p>
        </div>
        <div className="index-cell">
          <div className="muted">세액 비중</div>
          <div className="big" style={{ fontSize: 20 }}>{fmtPct(ntsCgtCorpTaxShare())}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>주택분 {c.housingTaxEok.toLocaleString("ko-KR")}억 중 법인 {c.corpTaxEok.toLocaleString("ko-KR")}억</p>
        </div>
        <div className="index-cell">
          <div className="muted">1인당 고지(법인)</div>
          <div className="big" style={{ fontSize: 20 }}>{fmtManWon(corpHead)}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>개인 {fmtManWon(personHead)} · 고지액이지 시세가 아닙니다</p>
        </div>
      </div>

      <h4 style={{ margin: "16px 0 6px" }}>데이터에 넣는 방법</h4>
      <div className="table-wrap">
        <table className="realty-table">
          <thead>
            <tr>
              <th>집단</th>
              <th>넣기</th>
              <th>방법</th>
            </tr>
          </thead>
          <tbody>
            {REALTY_CORP_CHANNELS.map((row) => (
              <tr key={row.id}>
                <td>{row.group}</td>
                <td>{row.putLabel}</td>
                <td>{row.how}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ margin: "8px 0 0" }}>{REALTY_CORP_BUYER_NOTE}</p>
      <div className="starter-list" style={{ marginTop: 10 }}>
        <a className="starter" href={c.url} target="_blank" rel="noreferrer">기재부 종부세 고지</a>
        <a className="starter" href={REALTY_CORP_LINKS.cgtFile} target="_blank" rel="noreferrer">종부세 파일 (data.go.kr)</a>
        <a className="starter" href={REALTY_CORP_LINKS.rebBuyer} target="_blank" rel="noreferrer">거래주체별 (부동산원)</a>
        <a className="starter" href={REALTY_CORP_LINKS.tasis} target="_blank" rel="noreferrer">TASIS</a>
        <a className="starter" href={REALTY_CORP_LINKS.ethics} target="_blank" rel="noreferrer">등록≠공개 (정책브리핑)</a>
        <a className="starter" href={REALTY_CORP_LINKS.petiReg} target="_blank" rel="noreferrer">재산등록 안내</a>
        <a className="starter" href={REALTY_CORP_LINKS.dart} target="_blank" rel="noreferrer">DART</a>
        <a className="starter" href={REALTY_CORP_LINKS.iros} target="_blank" rel="noreferrer">인터넷등기소</a>
      </div>
    </div>
  );
}
