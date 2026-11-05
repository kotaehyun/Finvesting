import {
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
      {/* 1. 출산율 및 인구 이동 핵심 지표 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>👶</span> 합계출산율 및 국내 인구 이동 바롬터
          </h4>
          <span className="realty-subblock-source">국가데이터처 & 행정안전부 확정 공표</span>
        </div>
        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🍼</span> 전국 합계출산율
            </div>
            <div className="sub-kpi-val highlight">{last?.tfr.toFixed(2)}명</div>
            <RealtySpark values={tfr} up={up} />
            <p className="sub-kpi-sub">{REALTY_TFR_KOSTAT.asOf} 확정 (서울 {REALTY_TFR_KOSTAT.metros.find((m) => m.id === "seoul")?.tfr} · 전남 {REALTY_TFR_KOSTAT.metros.find((m) => m.id === "jeonnam")?.tfr})</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🚚</span> 연간 국내 이동 인구
            </div>
            <div className="sub-kpi-val">{(REALTY_MOVE_2025.movers / 10_000).toFixed(1)}만 명</div>
            <p className="sub-kpi-sub">이동률 {REALTY_MOVE_2025.ratePct}% (주택 사유 {REALTY_MOVE_2025.housingSharePct}%)</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>⚠️</span> 행안부 인구감소지역
            </div>
            <div className="sub-kpi-val alert" style={{ color: "#dc2626" }}>{realtyPopDeclineCount()}곳</div>
            <p className="sub-kpi-sub">관심 지역 {realtyPopWatchCount()}곳 지정 (서울은 해당 없음)</p>
          </div>
        </div>
      </div>

      {/* 2. 권역 순이동 및 시도 출산율 비교 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>🗺️</span> 권역별 순이동 및 17개 시도 출산율 현황
          </h4>
          <span className="realty-subblock-source">통계청 인구이동 및 출생통계</span>
        </div>
        <div className="people-split">
          <div className="table-wrap">
            <table className="realty-table">
              <thead>
                <tr>
                  <th>권역 구분</th>
                  <th className="num">순이동(명)</th>
                </tr>
              </thead>
              <tbody>
                {REALTY_MOVE_2025.regions.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.label}</td>
                    <td className="num" style={{ color: r.net > 0 ? "#dc2626" : "#2563eb", fontWeight: 700 }}>
                      {fmtNet(r.net)}
                    </td>
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
                  <th className="num">합계출산율</th>
                </tr>
              </thead>
              <tbody>
                {REALTY_TFR_KOSTAT.metros.map((m) => (
                  <tr key={m.id}>
                    <td>{m.label}</td>
                    <td className="num" style={{ fontWeight: 650 }}>{m.tfr.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="starter-list" style={{ marginTop: 12 }}>
          <a className="starter" href={REALTY_TFR_KOSTAT.url} target="_blank" rel="noreferrer">출생통계 원문</a>
          <a className="starter" href={REALTY_MOVE_2025.url} target="_blank" rel="noreferrer">인구이동 통계</a>
          <a className="starter" href="https://www.mois.go.kr/frt/sub/a06/b06/populationDecline/screen.do" target="_blank" rel="noreferrer">행안부 인구감소지역 고시</a>
        </div>
      </div>

      {/* 3. 인구감소 및 관심지역 목록 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>📉</span> 시도별 인구소멸 위험지역 분포 ({realtyPopDeclineCount()}곳)
          </h4>
          <span className="realty-subblock-source">행정안전부 고시</span>
        </div>
        <div className="decline-grid">
          {decline.map((m) => (
            <div key={m.id} className="decline-cell">
              <strong>{m.label} ({m.places.length}곳)</strong>
              <p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
                {m.places.map((p) => p.replace(`${m.label} `, "")).join(" · ")}
              </p>
            </div>
          ))}
        </div>
        <p className="muted" style={{ margin: "10px 0 0", fontSize: 12 }}>
          📌 <strong>관심지역:</strong> {REALTY_POP_WATCH.map((p) => p.label).join(" · ")}
        </p>
      </div>

      {/* 4. 전월세 점유 및 거래 비중 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>🏠</span> 전월세 점유율 및 거래 비중 (월세화 가속)
          </h4>
          <span className="realty-subblock-source">국토교통부 주택통계 & 주거실태조사</span>
        </div>
        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🔑</span> 주택 점유 임차 비중
            </div>
            <div className="sub-kpi-val highlight">{REALTY_TENURE.rent}%</div>
            <p className="sub-kpi-sub">자가 점유 {REALTY_TENURE.own}% (수도권 임차 비중 {REALTY_TENURE.sudoRent}%)</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🧾</span> 전월세 거래 중 월세 누계
            </div>
            <div className="sub-kpi-val warn" style={{ color: "#ea580c" }}>{REALTY_LEASE_TRADE.wolseYtd}%</div>
            <p className="sub-kpi-sub">전년 {REALTY_LEASE_TRADE.wolseYtdPrev}% 대비 +{REALTY_LEASE_TRADE.wolseYtdDelta}%p 증가</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏢</span> 아파트 거래 중 월세 비중
            </div>
            <div className="sub-kpi-val highlight">{REALTY_LEASE_TRADE.aptYtd}%</div>
            <p className="sub-kpi-sub">비아파트(빌라·오피스텔) 월세 비중 {REALTY_LEASE_TRADE.nonAptYtd}%</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>📍</span> 서울 월세 거래 비중
            </div>
            <div className="sub-kpi-val">{REALTY_LEASE_TRADE.seoulYtd}%</div>
            <p className="sub-kpi-sub">수도권 {REALTY_LEASE_TRADE.sudoYtd}% · 7월 월세 거래 비중 {(leaseJulyWolseShare() * 100).toFixed(1)}%</p>
          </div>
        </div>
        <div className="starter-list" style={{ marginTop: 12 }}>
          <a className="starter" href={REALTY_TENURE_LINKS.survey} target="_blank" rel="noreferrer">주거실태조사</a>
          <a className="starter" href={REALTY_TENURE_LINKS.stats} target="_blank" rel="noreferrer">국토부 주택통계</a>
        </div>
      </div>
    </div>
  );
}
