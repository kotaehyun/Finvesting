import {
  INCOME_HOUSING_TONE_LABEL,
  REALTY_CAPITAL_IDS,
  REALTY_EMPTY,
  REALTY_EMPTY_BY_TYPE,
  REALTY_GINI,
  REALTY_KR_VACANCY,
  REALTY_METROS,
  REALTY_PIR,
  REALTY_STRESS_LINKS,
  REALTY_STRESS_METROS,
  REALTY_VACANCY,
  REALTY_VACANCY_DEF,
  emptyAptShare,
  fmtDeltaPp,
  fmtRate,
  incomeHousingTone,
  isCapitalMetro,
  pirVsNational,
  vsKr,
  type RealtyMetroId,
} from "@finvesting/core";

type NplRow = { id: RealtyMetroId; npl: number | null; nplDate: string | null };

export function RealtyStressPanel({
  focusId,
  npl,
}: {
  focusId: RealtyMetroId | null;
  npl: NplRow[];
}) {
  const capital = REALTY_STRESS_METROS.filter((r) => isCapitalMetro(r.id));
  const nplBy = new Map(npl.map((r) => [r.id, r]));
  const pirSudoVs = pirVsNational(REALTY_PIR.sudo);
  const pirSeoulVs = pirVsNational(13.9);
  const sudoTone = incomeHousingTone(pirSudoVs);
  const seoulTone = incomeHousingTone(pirSeoulVs);

  return (
    <div className="stress-panel">
      {/* 1. 상업용 부동산 공실 및 주거 스트레스 핵심 지표 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>🏬</span> 상업용 부동산 공실 및 주거 스트레스 핵심 지표
          </h4>
          <span className="realty-subblock-source">한국부동산원 및 주거실태조사</span>
        </div>
        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏢</span> 전국 오피스 공실률
            </div>
            <div className="sub-kpi-val highlight">{fmtRate(REALTY_KR_VACANCY.office)}</div>
            <p className="sub-kpi-sub">{REALTY_VACANCY.asOf} 기준 · 서울 공실률 {fmtRate(5.1)}</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏪</span> 전국 중대형 상가 공실
            </div>
            <div className="sub-kpi-val">{fmtRate(REALTY_KR_VACANCY.midShop)}</div>
            <p className="sub-kpi-sub">소규모 {fmtRate(REALTY_KR_VACANCY.smallShop)} · 집합상가 {fmtRate(REALTY_KR_VACANCY.retail)}</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏚️</span> 빈집(미거주 주택) 비율
            </div>
            <div className="sub-kpi-val warn" style={{ color: "#ea580c" }}>{fmtRate(REALTY_EMPTY.kr2025)}</div>
            <p className="sub-kpi-sub">{REALTY_EMPTY.houses2025.toLocaleString("ko-KR")}호 · 아파트 미거주 {fmtRate(emptyAptShare())}</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>📊</span> 소득 대비 주택가격(PIR)
            </div>
            <div className="sub-kpi-val highlight">{REALTY_PIR.kr}배</div>
            <p className="sub-kpi-sub">전국 중위소득 기준 (수도권 {REALTY_PIR.sudo}배 · 서울 13.9배)</p>
          </div>
        </div>
      </div>

      {/* 2. 주택 유형별 빈집 현황 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>🏘️</span> 주택 유형별 빈집(미거주) 분포 현황
          </h4>
          <span className="realty-subblock-source">{REALTY_EMPTY.source}</span>
        </div>
        <div className="sub-kpi-grid">
          {REALTY_EMPTY_BY_TYPE.map((t) => (
            <div key={t.id} className="sub-kpi-card">
              <div className="sub-kpi-title">
                <span>{t.id === "apt" ? "🏢" : t.id === "multi" ? "🏬" : "🏠"}</span> {t.label} 미거주율
              </div>
              <div className="sub-kpi-val highlight">{t.share.toFixed(1)}%</div>
              <p className="sub-kpi-sub">{t.id === "apt" ? "전국 평균(8.5%) 대비 양호" : "전국 평균(8.5%) 대비 공실 위험 높음"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 소득 불평등 지니계수 및 상대 PIR 부담도 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>⚖️</span> 소득 불평등(지니) 및 지역별 주거비 부담도(PIR/RIR)
          </h4>
          <span className="realty-subblock-source">{REALTY_GINI.source}</span>
        </div>
        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>📉</span> 지니계수 (처분가능소득)
            </div>
            <div className="sub-kpi-val highlight">{REALTY_GINI.disposable}</div>
            <p className="sub-kpi-sub">시장소득 {REALTY_GINI.market} · 5분위 배율 {REALTY_GINI.quintile}배 (전년 {REALTY_GINI.prevDisposable})</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏙️</span> 수도권 상대 PIR 부담
            </div>
            <div className="sub-kpi-val warn" style={{ color: "#ea580c" }}>{sudoTone ? INCOME_HOUSING_TONE_LABEL[sudoTone] : "—"}</div>
            <p className="sub-kpi-sub">수도권 {REALTY_PIR.sudo}배 (전국 대비 {pirSudoVs?.toFixed(2)}배 수준)</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏛️</span> 서울 상대 PIR 부담
            </div>
            <div className="sub-kpi-val warn" style={{ color: "#ea580c" }}>{seoulTone ? INCOME_HOUSING_TONE_LABEL[seoulTone] : "—"}</div>
            <p className="sub-kpi-sub">서울 13.9배 (전국 대비 {pirSeoulVs?.toFixed(2)}배 초고부담)</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>💳</span> 임차가구 RIR (월세 부담률)
            </div>
            <div className="sub-kpi-val highlight">{REALTY_PIR.rir}%</div>
            <p className="sub-kpi-sub">소득 대비 임대료 중위 비율 (자가 보유율 {REALTY_PIR.own}%)</p>
          </div>
        </div>
      </div>

      {/* 4. 수도권 주요 지역 공실 및 PIR 비교 표 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>🏙️</span> 수도권(서울·경기·인천) 상업용 공실 및 주택 PIR 비교
          </h4>
          <span className="realty-subblock-source">한국부동산원 및 주거실태조사</span>
        </div>
        <div className="table-wrap">
          <table className="realty-table">
            <thead>
              <tr>
                <th>지역</th>
                <th className="num">오피스</th>
                <th className="num">중대형</th>
                <th className="num">빈집 2024</th>
                <th className="num">PIR</th>
                <th>전국 대비 공실</th>
              </tr>
            </thead>
            <tbody>
              {capital.map((r) => (
                <tr key={r.id} className={focusId === r.id ? "on" : undefined}>
                  <td>{REALTY_METROS.find((m) => m.id === r.id)?.label}</td>
                  <td className="num">{fmtRate(r.office)}</td>
                  <td className="num">{fmtRate(r.midShop)}</td>
                  <td className="num">{fmtRate(r.empty)}</td>
                  <td className="num">{r.pir != null ? `${r.pir}배` : "—"}</td>
                  <td>{fmtDeltaPp(vsKr(r.office, REALTY_KR_VACANCY.office))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. 전국 17개 시도별 종합 공실·빈집·연체 현황 표 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>🗺️</span> 전국 17개 시도별 상가·오피스 공실률 및 빈집 현황
          </h4>
          <span className="realty-subblock-source">통계청 주택총조사 및 부동산원 상업용 임대동향</span>
        </div>
        <div className="table-wrap">
          <table className="realty-table">
            <thead>
              <tr>
                <th>시도</th>
                <th className="num">오피스</th>
                <th className="num">중대형</th>
                <th className="num">소규모</th>
                <th className="num">집합</th>
                <th className="num">빈집</th>
                <th className="num">PIR</th>
                <th className="num">연체</th>
              </tr>
            </thead>
            <tbody>
              {REALTY_STRESS_METROS.map((r) => {
                const np = nplBy.get(r.id);
                return (
                  <tr key={r.id} className={focusId === r.id ? "on" : undefined}>
                    <td>{REALTY_METROS.find((m) => m.id === r.id)?.label}{REALTY_CAPITAL_IDS.includes(r.id) ? " ·수도권" : ""}</td>
                    <td className="num">{fmtRate(r.office)}</td>
                    <td className="num">{fmtRate(r.midShop)}</td>
                    <td className="num">{fmtRate(r.smallShop)}</td>
                    <td className="num">{fmtRate(r.retail)}</td>
                    <td className="num">{fmtRate(r.empty)}</td>
                    <td className="num">{r.pir != null ? `${r.pir}` : "—"}</td>
                    <td className="num">{np?.npl != null ? `${np.npl.toFixed(2)}%` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="starter-list" style={{ marginTop: 12 }}>
          <a className="starter" href={REALTY_STRESS_LINKS.reb} target="_blank" rel="noreferrer">부동산원 공실 보도</a>
          <a className="starter" href={REALTY_STRESS_LINKS.empty2025} target="_blank" rel="noreferrer">2025 빈집 통계</a>
          <a className="starter" href={REALTY_STRESS_LINKS.emptyKosis} target="_blank" rel="noreferrer">KOSIS 시도 빈집</a>
          <a className="starter" href={REALTY_STRESS_LINKS.pir} target="_blank" rel="noreferrer">주거실태조사 PIR</a>
          <a className="starter" href={REALTY_STRESS_LINKS.gini} target="_blank" rel="noreferrer">가계금융복지 지니</a>
          <a className="starter" href={REALTY_STRESS_LINKS.auction} target="_blank" rel="noreferrer">법원경매정보</a>
        </div>
      </div>
    </div>
  );
}
