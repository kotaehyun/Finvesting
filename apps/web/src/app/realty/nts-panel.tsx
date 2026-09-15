import {
  REALTY_NTS_CGT,
  REALTY_NTS_CGT_METROS,
  REALTY_NTS_TRANSFER_NOTE,
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
      <p className="muted" style={{ margin: "0 0 10px" }}>
        개인 세금·자산 조회는 하지 않습니다. 고위공직자만 뺀 명단도 없습니다.
        숫자는 {c.source}(국세청 고지). 종부세 대상은 공시가 합이 문턱을 넘는 주택·토지입니다. 이사 숫자가 아니라 고가주택 세금이 어디에 몰리는지입니다.
      </p>
      <div className="official-kpis">
        <div className="index-cell">
          <div className="muted">주택분 종부세</div>
          <div className="big" style={{ fontSize: 20 }}>{fmtManPeople(c.housingPeople)}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>전년 +{fmtManPeople(c.housingYoyPeople)} ({c.housingYoyPct}%) · 세액 {c.housingTaxEok.toLocaleString("ko-KR")}억</p>
        </div>
        <div className="index-cell">
          <div className="muted">서울 비중</div>
          <div className="big" style={{ fontSize: 20 }}>{c.seoulSharePct}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>{seoul ? fmtManPeople(seoul.now) : "—"} · 증가율 {seoul?.yoyPct}%</p>
        </div>
        <div className="index-cell">
          <div className="muted">수도권 비중</div>
          <div className="big" style={{ fontSize: 20 }}>{c.sudoSharePct}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>{fmtManPeople(sudoNow)} · 서울·경기·인천</p>
        </div>
        <div className="index-cell">
          <div className="muted">증가분의 서울</div>
          <div className="big" style={{ fontSize: 20 }}>{fmtPct(ntsCgtSeoulOfGrowth())}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>전국 주택분 인원 증가 {fmtManPeople(c.housingYoyPeople)} 중 서울 {seoul ? fmtManPeople(ntsCgtDelta(seoul)) : "—"}</p>
        </div>
      </div>

      <h4 style={{ margin: "16px 0 6px" }}>주택분 종부세 인원 방향</h4>
      <p className="muted" style={{ margin: "0 0 8px" }}>
        기재부가 수치를 밝힌 곳만. 공시가 상승으로 문턱을 넘는 사람이 늘 수 있어, 전입이 아닙니다.
        비수도권 증가분은 전국 증가 − 수도권 증가입니다. 지역 인원은 만 명 단위라 그 차이는 반올림 잔여일 수 있습니다.
      </p>
      <div className="table-wrap">
        <table className="realty-table">
          <thead>
            <tr>
              <th>지역</th>
              <th className="num">2024</th>
              <th className="num">2025</th>
              <th>비중</th>
              <th className="num">증감</th>
              <th className="num">증가율</th>
            </tr>
          </thead>
          <tbody>
            {REALTY_NTS_CGT_METROS.map((r) => (
              <tr key={r.id}>
                <td>{r.label}</td>
                <td className="num">{fmtManPeople(r.prev)}</td>
                <td className="num">{fmtManPeople(r.now)}</td>
                <td>
                  <span className="loan-rank-track" style={{ minWidth: 72 }}>
                    <span className="loan-rank-bar" style={{ width: `${Math.round((r.now / maxNow) * 100)}%` }} />
                  </span>
                  <span style={{ marginLeft: 8 }}>{fmtPct(ntsCgtShare(r.now))}</span>
                </td>
                <td className="num">+{fmtManPeople(ntsCgtDelta(r))}</td>
                <td className="num">+{r.yoyPct.toFixed(1)}%</td>
              </tr>
            ))}
            <tr>
              <td>수도권 합</td>
              <td className="num">—</td>
              <td className="num">{fmtManPeople(sudoNow)}</td>
              <td>{fmtPct(ntsCgtShare(sudoNow))}</td>
              <td className="num">+{fmtManPeople(ntsCgtSudoDelta())}</td>
              <td className="num">—</td>
            </tr>
            <tr>
              <td>그 밖(계산)</td>
              <td className="num">—</td>
              <td className="num">{fmtManPeople(c.housingPeople - sudoNow)}</td>
              <td>{fmtPct(ntsCgtShare(c.housingPeople - sudoNow))}</td>
              <td className="num">+{fmtManPeople(ntsCgtRestDelta())}</td>
              <td className="num">—</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 style={{ margin: "16px 0 6px" }}>세금 종류로 본 칸</h4>
      <div className="index-grid">
        <div className="index-cell">
          <div className="muted">다주택 종부세</div>
          <div className="big" style={{ fontSize: 18 }}>{fmtManPeople(c.multiPeople)}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>+{c.multiYoyPct}% · {c.multiTaxEok.toLocaleString("ko-KR")}억. 1주택 {fmtManPeople(c.singlePeople)}</p>
        </div>
        <div className="index-cell">
          <div className="muted">양도세 물건지</div>
          <div className="big" style={{ fontSize: 18 }}>—</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>{REALTY_NTS_TRANSFER_NOTE}</p>
        </div>
        <div className="index-cell">
          <div className="muted">고가주택 양도</div>
          <div className="big" style={{ fontSize: 18 }}>—</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>실가 12억 초과. TASIS 소재지 표. 홈택스 개인 조회 없음.</p>
        </div>
      </div>
      <div className="starter-list" style={{ marginTop: 10 }}>
        <a className="starter" href={c.url} target="_blank" rel="noreferrer">기재부 고지 요약</a>
        <a className="starter" href={c.yonhap} target="_blank" rel="noreferrer">지역 인원 (연합뉴스 인용)</a>
        <a className="starter" href={c.tasis} target="_blank" rel="noreferrer">국세통계포털</a>
        <a className="starter" href={c.transfer} target="_blank" rel="noreferrer">양도세 소재지 (data.go.kr)</a>
        <a className="starter" href={c.luxury} target="_blank" rel="noreferrer">고가주택 양도</a>
        <a className="starter" href={c.nts} target="_blank" rel="noreferrer">국세청 종부세 개요</a>
      </div>
    </div>
  );
}
