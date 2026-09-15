import {
  REALTY_JEONSE_SLOTS,
  REALTY_LEASE_TRADE,
  REALTY_MOVE_2025,
  REALTY_POP_WATCH,
  REALTY_TENURE,
  REALTY_TENURE_LINKS,
  REALTY_TFR_KOSTAT,
  leaseJulyWolseShare,
  realtyPopDeclineByMetro,
  realtyPopDeclineCount,
  realtyPopWatchCount,
} from "@finvesting/core";
import { RealtySpark } from "./spark";

function fmtNet(n: number) {
  const abs = Math.abs(n).toLocaleString("ko-KR");
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return abs;
}

export function RealtyPeoplePanel() {
  const tfr = REALTY_TFR_KOSTAT.national.map((p) => p.tfr);
  const last = REALTY_TFR_KOSTAT.national.at(-1);
  const prev = REALTY_TFR_KOSTAT.national.at(-2);
  const up = last && prev ? last.tfr > prev.tfr : null;
  const decline = realtyPopDeclineByMetro();

  return (
    <div className="people-panel">
      <div className="listing-grid">
        <article className="listing-cell">
          <div className="muted">합계출산율</div>
          <div className="big" style={{ fontSize: 22 }}>{last?.tfr.toFixed(2)}명</div>
          <div className="muted">{REALTY_TFR_KOSTAT.asOf} 확정 · 출생 {REALTY_TFR_KOSTAT.births.toLocaleString("ko-KR")}명</div>
          <RealtySpark values={tfr} up={up} />
          <p className="muted" style={{ margin: "6px 0 0" }}>
            {REALTY_TFR_KOSTAT.source}. 서울 {REALTY_TFR_KOSTAT.metros.find((m) => m.id === "seoul")?.tfr} · 전남 {REALTY_TFR_KOSTAT.metros.find((m) => m.id === "jeonnam")?.tfr}.
          </p>
        </article>
        <article className="listing-cell">
          <div className="muted">국내 이동</div>
          <div className="big" style={{ fontSize: 22 }}>{(REALTY_MOVE_2025.movers / 10_000).toFixed(1)}만 명</div>
          <div className="muted">이동률 {REALTY_MOVE_2025.ratePct}% · 주택 사유 {REALTY_MOVE_2025.housingSharePct}%</div>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            서울 전입 {REALTY_MOVE_2025.seoulFromGgPct}%는 경기, 전출 {REALTY_MOVE_2025.seoulToGgPct}%는 경기.
            세종 순이동 {REALTY_MOVE_2025.sejongNet}명(출범 후 첫 순유출).
          </p>
        </article>
        <article className="listing-cell">
          <div className="muted">인구감소지역</div>
          <div className="big" style={{ fontSize: 22 }}>{realtyPopDeclineCount()}곳</div>
          <div className="muted">관심 {realtyPopWatchCount()}곳 · 서울은 없음</div>
          <p className="muted" style={{ margin: "8px 0 0" }}>행안부 지정. 지정은 고시로 바뀝니다. 매수 신호가 아닙니다.</p>
        </article>
      </div>

      <h4 style={{ margin: "16px 0 6px" }}>권역 순이동 · 시도 순이동률</h4>
      <p className="muted" style={{ margin: "0 0 8px" }}>{REALTY_MOVE_2025.source}. 시도별 전입·전출 인원 표는 원문 PDF.</p>
      <div className="people-split">
        <div className="table-wrap">
          <table className="realty-table">
            <thead>
              <tr>
                <th>권역</th>
                <th className="num">순이동</th>
              </tr>
            </thead>
            <tbody>
              {REALTY_MOVE_2025.regions.map((r) => (
                <tr key={r.id}>
                  <td>{r.label}</td>
                  <td className="num">{fmtNet(r.net)}명</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-wrap">
          <table className="realty-table">
            <thead>
              <tr>
                <th>시도</th>
                <th className="num">순이동률</th>
              </tr>
            </thead>
            <tbody>
              {REALTY_MOVE_2025.rates.map((r) => (
                <tr key={r.id}>
                  <td>{r.label}</td>
                  <td className="num">{r.rate > 0 ? "+" : ""}{r.rate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-wrap">
          <table className="realty-table">
            <thead>
              <tr>
                <th>시도 출산율</th>
                <th className="num">명</th>
              </tr>
            </thead>
            <tbody>
              {REALTY_TFR_KOSTAT.metros.map((m) => (
                <tr key={m.id}>
                  <td>{m.label}</td>
                  <td className="num">{m.tfr.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="starter-list" style={{ marginTop: 10 }}>
        <a className="starter" href={REALTY_TFR_KOSTAT.url} target="_blank" rel="noreferrer">출생통계 원문</a>
        <a className="starter" href={REALTY_MOVE_2025.url} target="_blank" rel="noreferrer">인구이동 원문</a>
        <a className="starter" href="https://www.mois.go.kr/frt/sub/a06/b06/populationDecline/screen.do" target="_blank" rel="noreferrer">행안부 인구감소지역</a>
      </div>

      <h4 style={{ margin: "16px 0 6px" }}>인구감소 {realtyPopDeclineCount()} · 관심 {realtyPopWatchCount()}</h4>
      <div className="decline-grid">
        {decline.map((m) => (
          <div key={m.id} className="decline-cell">
            <strong>{m.label} {m.places.length}</strong>
            <p className="muted" style={{ margin: "4px 0 0" }}>{m.places.map((p) => p.replace(`${m.label} `, "")).join(" · ")}</p>
          </div>
        ))}
      </div>
      <p className="muted" style={{ margin: "10px 0 0" }}>
        관심지역: {REALTY_POP_WATCH.map((p) => p.label).join(" · ")}. 고시 제2025-78호, 2026-01-01 시행.
      </p>

      <h4 style={{ margin: "16px 0 6px" }}>전월세 비중</h4>
      <p className="muted" style={{ margin: "0 0 8px" }}>
        {REALTY_TENURE.source}. 점유 {REALTY_TENURE.asOf}. {REALTY_LEASE_TRADE.source} {REALTY_LEASE_TRADE.asOf} 누계.
        점유와 거래 건수는 다릅니다.
      </p>
      <div className="official-kpis">
        <div className="index-cell">
          <div className="muted">점유 임차(전월세)</div>
          <div className="big" style={{ fontSize: 20 }}>{REALTY_TENURE.rent}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>자가 {REALTY_TENURE.own}% · 무상 {REALTY_TENURE.free}% · 수도권 임차 {REALTY_TENURE.sudoRent}%</p>
        </div>
        <div className="index-cell">
          <div className="muted">거래 월세 누계</div>
          <div className="big" style={{ fontSize: 20 }}>{REALTY_LEASE_TRADE.wolseYtd}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>전년 {REALTY_LEASE_TRADE.wolseYtdPrev}% · +{REALTY_LEASE_TRADE.wolseYtdDelta}%p · 전세는 나머지</p>
        </div>
        <div className="index-cell">
          <div className="muted">아파트 거래 월세</div>
          <div className="big" style={{ fontSize: 20 }}>{REALTY_LEASE_TRADE.aptYtd}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>전년 {REALTY_LEASE_TRADE.aptYtdPrev}% · 비아파트 {REALTY_LEASE_TRADE.nonAptYtd}%</p>
        </div>
        <div className="index-cell">
          <div className="muted">서울 · 7월 건수</div>
          <div className="big" style={{ fontSize: 20 }}>{REALTY_LEASE_TRADE.seoulYtd}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            수도권 {REALTY_LEASE_TRADE.sudoYtd}% · 7월 월세 {(leaseJulyWolseShare() * 100).toFixed(1)}% ({REALTY_LEASE_TRADE.julyWolse.toLocaleString("ko-KR")}건)
          </p>
        </div>
      </div>
      <div className="index-grid" style={{ marginTop: 12 }}>
        {REALTY_JEONSE_SLOTS.map((s) => (
          <div key={s.id} className="index-cell">
            <div className="muted">{s.label}</div>
            <div className="big" style={{ fontSize: 18 }}>—</div>
            <p className="muted" style={{ margin: "6px 0 0" }}>{s.need}</p>
          </div>
        ))}
      </div>
      <div className="starter-list" style={{ marginTop: 10 }}>
        <a className="starter" href={REALTY_TENURE_LINKS.survey} target="_blank" rel="noreferrer">주거실태조사</a>
        <a className="starter" href={REALTY_TENURE_LINKS.stats} target="_blank" rel="noreferrer">7월 주택통계</a>
      </div>
    </div>
  );
}
