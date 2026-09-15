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
      <p className="muted" style={{ margin: "0 0 10px" }}>
        공실은 상가·오피스(부동산원), 빈집은 주택총조사, 소득 대비는 주거실태조사 PIR입니다.{" "}
        {REALTY_VACANCY_DEF.rule} {REALTY_VACANCY_DEF.note}
      </p>
      <div className="official-kpis">
        <div className="index-cell">
          <div className="muted">전국 오피스 공실</div>
          <div className="big" style={{ fontSize: 20 }}>{fmtRate(REALTY_KR_VACANCY.office)}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>{REALTY_VACANCY.asOf} · 서울 {fmtRate(5.1)}</p>
        </div>
        <div className="index-cell">
          <div className="muted">전국 중대형 상가</div>
          <div className="big" style={{ fontSize: 20 }}>{fmtRate(REALTY_KR_VACANCY.midShop)}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>소규모 {fmtRate(REALTY_KR_VACANCY.smallShop)} · 집합 {fmtRate(REALTY_KR_VACANCY.retail)}</p>
        </div>
        <div className="index-cell">
          <div className="muted">빈집(미거주)</div>
          <div className="big" style={{ fontSize: 20 }}>{fmtRate(REALTY_EMPTY.kr2025)}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>2025 {REALTY_EMPTY.houses2025.toLocaleString("ko-KR")}호 · 아파트 {fmtRate(emptyAptShare())}</p>
        </div>
        <div className="index-cell">
          <div className="muted">소득 대비 PIR</div>
          <div className="big" style={{ fontSize: 20 }}>{REALTY_PIR.kr}배</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>수도권 {REALTY_PIR.sudo}배 · 서울 13.9배</p>
        </div>
      </div>

      <h4 style={{ margin: "16px 0 6px" }}>빈집 유형 · 법인 자가</h4>
      <p className="muted" style={{ margin: "0 0 8px" }}>
        {REALTY_EMPTY.source}. 아파트 미거주가 가장 낮습니다. 사람이 살면 법인이 보유해도 빈집이 아닙니다.
      </p>
      <div className="official-kpis">
        {REALTY_EMPTY_BY_TYPE.map((t) => (
          <div key={t.id} className="index-cell">
            <div className="muted">{t.label}</div>
            <div className="big" style={{ fontSize: 20 }}>{t.share.toFixed(1)}%</div>
            <p className="muted" style={{ margin: "6px 0 0" }}>{t.id === "apt" ? "전체 8.5%보다 낮음" : "전체 8.5%보다 높음"}</p>
          </div>
        ))}
      </div>

      <h4 style={{ margin: "16px 0 6px" }}>지니 · 소득 대비 위험(상대)</h4>
      <p className="muted" style={{ margin: "0 0 8px" }}>
        {REALTY_GINI.source}. 처분가능 지니 {REALTY_GINI.disposable}(전년 {REALTY_GINI.prevDisposable}).
        PIR 상대치는 지역 PIR ÷ 전국 {REALTY_PIR.kr}입니다. 국토부 등급이 아닙니다.
      </p>
      <div className="official-kpis">
        <div className="index-cell">
          <div className="muted">지니(처분가능)</div>
          <div className="big" style={{ fontSize: 20 }}>{REALTY_GINI.disposable}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>시장소득 {REALTY_GINI.market} · 5분위 {REALTY_GINI.quintile}배</p>
        </div>
        <div className="index-cell">
          <div className="muted">수도권 PIR</div>
          <div className="big" style={{ fontSize: 20 }}>{sudoTone ? INCOME_HOUSING_TONE_LABEL[sudoTone] : "—"}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>전국 대비 {pirSudoVs?.toFixed(2)}배</p>
        </div>
        <div className="index-cell">
          <div className="muted">서울 PIR</div>
          <div className="big" style={{ fontSize: 20 }}>{seoulTone ? INCOME_HOUSING_TONE_LABEL[seoulTone] : "—"}</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>13.9 / {REALTY_PIR.kr} = {pirSeoulVs?.toFixed(2)}</p>
        </div>
        <div className="index-cell">
          <div className="muted">임차 RIR</div>
          <div className="big" style={{ fontSize: 20 }}>{REALTY_PIR.rir}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>월소득 대비 월임대료 중위 · 자가보유 {REALTY_PIR.own}%</p>
        </div>
      </div>

      <h4 style={{ margin: "16px 0 6px" }}>수도권 3곳</h4>
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

      <h4 style={{ margin: "16px 0 6px" }}>시도 공실 · 빈집</h4>
      <p className="muted" style={{ margin: "0 0 8px" }}>{REALTY_EMPTY.note} {REALTY_PIR.note}</p>
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
      <div className="starter-list" style={{ marginTop: 10 }}>
        <a className="starter" href={REALTY_STRESS_LINKS.reb} target="_blank" rel="noreferrer">부동산원 공실 보도</a>
        <a className="starter" href={REALTY_STRESS_LINKS.empty2025} target="_blank" rel="noreferrer">2025 빈집</a>
        <a className="starter" href={REALTY_STRESS_LINKS.emptyKosis} target="_blank" rel="noreferrer">시도 빈집 비율</a>
        <a className="starter" href={REALTY_STRESS_LINKS.pir} target="_blank" rel="noreferrer">주거실태조사</a>
        <a className="starter" href={REALTY_STRESS_LINKS.gini} target="_blank" rel="noreferrer">가계금융복지 지니</a>
        <a className="starter" href={REALTY_STRESS_LINKS.auction} target="_blank" rel="noreferrer">법원경매정보</a>
      </div>
    </div>
  );
}
