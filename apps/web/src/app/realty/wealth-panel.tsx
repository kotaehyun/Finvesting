import {
  REALTY_NTS_CGT,
  REALTY_OFFICIAL_ASSET,
  REALTY_WEALTH_GIFT,
  REALTY_WEALTH_LINKS,
  REALTY_WEALTH_METHODS,
  REALTY_WEALTH_PRIVACY,
  REALTY_WEALTH_SHARE,
  REALTY_WEALTH_TRUST,
  fmtManPeople,
  fmtPct,
  formatManwon,
  giftTaxShareOfEstate,
  ntsCgtCorpPeopleShare,
  ntsCgtCorpTaxShare,
} from "@finvesting/core";

export function RealtyWealthPanel() {
  const w = REALTY_WEALTH_SHARE;
  const g = REALTY_WEALTH_GIFT;
  const t = REALTY_WEALTH_TRUST;
  const o = REALTY_OFFICIAL_ASSET;
  const c = REALTY_NTS_CGT;

  return (
    <div className="wealth-panel">
      <p className="muted" style={{ margin: "0 0 10px" }}>{REALTY_WEALTH_PRIVACY}</p>

      <h4 style={{ margin: "0 0 6px" }}>자산 비중(분위)</h4>
      <p className="muted" style={{ margin: "0 0 8px" }}>
        {w.source}. {w.asOf}. {w.note}
      </p>
      <div className="official-kpis">
        <div className="index-cell">
          <div className="muted">상위 10% 순자산</div>
          <div className="big" style={{ fontSize: 20 }}>{w.topShare}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>전년 +{w.topShareDeltaPp}%p · 하위 50% 합 {w.bottom50Share}%</p>
        </div>
        <div className="index-cell">
          <div className="muted">10분위 평균 순자산</div>
          <div className="big" style={{ fontSize: 20 }}>{formatManwon(w.topAvgMan)}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>1분위 {formatManwon(w.bottomAvgMan)} · 전체 평균 {formatManwon(w.avgNetMan)}</p>
        </div>
        <div className="index-cell">
          <div className="muted">실물 비중</div>
          <div className="big" style={{ fontSize: 20 }}>{w.realShare}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>금융 {w.finShare}% · 부동산 보유가구 {w.realHoldHh}%</p>
        </div>
        <div className="index-cell">
          <div className="muted">순자산 지니</div>
          <div className="big" style={{ fontSize: 20 }}>{w.giniNet}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>전년 {w.giniNetPrev} · 10억 이상 가구 {w.over10eok}%</p>
        </div>
      </div>

      <h4 style={{ margin: "16px 0 6px" }}>이동 방식(채널)</h4>
      <p className="muted" style={{ margin: "0 0 8px" }}>
        누가 옮겼는지가 아니라 어떤 창구로 집계되는지만 봅니다. 법정 공개 고위공직 증가분은 저축·주식 {o.netPct}% · 공시가 {o.appraisalPct}%입니다.
      </p>
      <div className="official-kpis">
        <div className="index-cell">
          <div className="muted">법인 종부세 세액</div>
          <div className="big" style={{ fontSize: 20 }}>{fmtPct(ntsCgtCorpTaxShare())}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>인원 {fmtPct(ntsCgtCorpPeopleShare())} · {fmtManPeople(c.corpPeople)}</p>
        </div>
        <div className="index-cell">
          <div className="muted">다주택 종부세</div>
          <div className="big" style={{ fontSize: 20 }}>{fmtManPeople(c.multiPeople)}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>1주택 {fmtManPeople(c.singlePeople)} · 서울 소재 {c.seoulSharePct}%</p>
        </div>
        <div className="index-cell">
          <div className="muted">증여세</div>
          <div className="big" style={{ fontSize: 20 }}>{(g.giftCases / 10_000).toFixed(1)}만 건</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>{g.giftTaxEok.toLocaleString("ko-KR")}억 · 상속·증여 세액 중 {(giftTaxShareOfEstate() * 100).toFixed(1)}%</p>
        </div>
        <div className="index-cell">
          <div className="muted">상속세</div>
          <div className="big" style={{ fontSize: 20 }}>{fmtManPeople(g.inheritPeople)}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>{g.inheritTaxEok.toLocaleString("ko-KR")}억 · {g.note}</p>
        </div>
      </div>
      <div className="official-kpis" style={{ marginTop: 12 }}>
        <div className="index-cell">
          <div className="muted">부동산신탁사 수탁</div>
          <div className="big" style={{ fontSize: 20 }}>{t.realtyJo}조</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>전체 신탁 {t.allJo}조 중 {t.realtyShare}% · {t.note}</p>
        </div>
        <div className="index-cell">
          <div className="muted">공개직 증가 요인</div>
          <div className="big" style={{ fontSize: 20 }}>순재산 {o.netPct}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>저축·주식 {formatManwon(o.netMan)} · 공시가 {formatManwon(o.appraisalMan)} · 법정 공개분만</p>
        </div>
        <div className="index-cell">
          <div className="muted">공개직 명의</div>
          <div className="big" style={{ fontSize: 20 }}>본인 {formatManwon(o.selfMan)}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>배우자 {formatManwon(o.spouseMan)} · 기타가족 {formatManwon(o.kinMan)} · 1인 평균</p>
        </div>
      </div>

      <h4 style={{ margin: "16px 0 6px" }}>채널 표</h4>
      <div className="table-wrap">
        <table className="realty-table">
          <thead>
            <tr>
              <th>방식</th>
              <th>넣기</th>
              <th>내용</th>
            </tr>
          </thead>
          <tbody>
            {REALTY_WEALTH_METHODS.map((row) => (
              <tr key={row.id}>
                <td>{row.label}</td>
                <td>{row.putLabel}</td>
                <td>{row.how}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="starter-list" style={{ marginTop: 10 }}>
        <a className="starter" href={REALTY_WEALTH_LINKS.survey} target="_blank" rel="noreferrer">가계금융복지조사</a>
        <a className="starter" href={REALTY_WEALTH_LINKS.gift} target="_blank" rel="noreferrer">상속·증여세</a>
        <a className="starter" href={REALTY_WEALTH_LINKS.tasis} target="_blank" rel="noreferrer">TASIS</a>
        <a className="starter" href={REALTY_WEALTH_LINKS.trust} target="_blank" rel="noreferrer">신탁업 실적</a>
        <a className="starter" href={REALTY_WEALTH_LINKS.rebBuyer} target="_blank" rel="noreferrer">거래주체별</a>
        <a className="starter" href={REALTY_WEALTH_LINKS.dart} target="_blank" rel="noreferrer">DART</a>
      </div>
    </div>
  );
}
