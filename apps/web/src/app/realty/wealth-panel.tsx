import {
  REALTY_NTS_CGT,
  REALTY_OFFICIAL_ASSET,
  REALTY_WEALTH_GIFT,
  REALTY_WEALTH_LINKS,
  REALTY_WEALTH_METHODS,
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
      {/* 1. 자산 분위별 집중도 및 실물자산 비중 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>💎</span> 순자산 분위별 편중도 및 실물자산 비중
          </h4>
          <span className="realty-subblock-source">{w.source} ({w.asOf})</span>
        </div>
        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>👑</span> 상위 10% 순자산 점유율
            </div>
            <div className="sub-kpi-val warn" style={{ color: "#ea580c" }}>{w.topShare}%</div>
            <p className="sub-kpi-sub">전년비 +{w.topShareDeltaPp}%p 상승 · 하위 50% 순자산 총합 {w.bottom50Share}%</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>💰</span> 10분위 평균 순자산
            </div>
            <div className="sub-kpi-val highlight">{formatManwon(w.topAvgMan)}</div>
            <p className="sub-kpi-sub">전체 가구 평균 {formatManwon(w.avgNetMan)} (1분위 {formatManwon(w.bottomAvgMan)})</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏠</span> 자산 내 실물(부동산) 비중
            </div>
            <div className="sub-kpi-val highlight">{w.realShare}%</div>
            <p className="sub-kpi-sub">금융자산 비중 {w.finShare}% · 부동산 실보유 가구 {w.realHoldHh}%</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>📊</span> 순자산 지니계수
            </div>
            <div className="sub-kpi-val">{w.giniNet}</div>
            <p className="sub-kpi-sub">전년 {w.giniNetPrev} · 10억원 이상 자산 보유가구 {w.over10eok}%</p>
          </div>
        </div>
      </div>

      {/* 2. 부의 이전 및 세무 거래 채널 (증여·상속·종부세) */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>🔄</span> 부의 이전 및 과세 채널 (종부세·증여·상속)
          </h4>
          <span className="realty-subblock-source">국세청 종합부동산세 및 상속·증여세 확정 통계</span>
        </div>
        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏢</span> 법인 종부세 세액 비중
            </div>
            <div className="sub-kpi-val highlight">{fmtPct(ntsCgtCorpTaxShare())}</div>
            <p className="sub-kpi-sub">인원 비중 {fmtPct(ntsCgtCorpPeopleShare())} ({fmtManPeople(c.corpPeople)})</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>👥</span> 다주택 종부세 납세자
            </div>
            <div className="sub-kpi-val">{fmtManPeople(c.multiPeople)}</div>
            <p className="sub-kpi-sub">1주택자 {fmtManPeople(c.singlePeople)} · 서울 소재 납세자 {c.seoulSharePct}%</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🎁</span> 연간 증여세 결정 건수
            </div>
            <div className="sub-kpi-val highlight">{(g.giftCases / 10_000).toFixed(1)}만 건</div>
            <p className="sub-kpi-sub">세액 {g.giftTaxEok.toLocaleString("ko-KR")}억원 (상속·증여 총세액의 {(giftTaxShareOfEstate() * 100).toFixed(1)}%)</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>📜</span> 연간 상속세 과세 인원
            </div>
            <div className="sub-kpi-val">{fmtManPeople(g.inheritPeople)}</div>
            <p className="sub-kpi-sub">총 세액 {g.inheritTaxEok.toLocaleString("ko-KR")}억원 · 피상속인 기준</p>
          </div>
        </div>
      </div>

      {/* 3. 신탁 및 공직자 명의 구조 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>🏛️</span> 부동산 신탁 수탁고 및 자산 등록 구조
          </h4>
          <span className="realty-subblock-source">금융투자협회 신탁통계 & 인사혁신처 공직윤리시스템</span>
        </div>
        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏦</span> 부동산신탁사 수탁고
            </div>
            <div className="sub-kpi-val highlight">{t.realtyJo}조원</div>
            <p className="sub-kpi-sub">전체 신탁 {t.allJo}조원 중 {t.realtyShare}% 차지 (담보·개발 신탁 등)</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>📈</span> 공직자 재산 증가 주요인
            </div>
            <div className="sub-kpi-val">순재산 {o.netPct}%</div>
            <p className="sub-kpi-sub">저축·주식 등 {formatManwon(o.netMan)} (공시가 상승분 {formatManwon(o.appraisalMan)})</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>👤</span> 공직자 평균 명의 구조
            </div>
            <div className="sub-kpi-val">본인 {formatManwon(o.selfMan)}</div>
            <p className="sub-kpi-sub">배우자 {formatManwon(o.spouseMan)} · 직계가족 {formatManwon(o.kinMan)} (1인 평균 기준)</p>
          </div>
        </div>
      </div>

      {/* 4. 자산 이동 채널 요약 표 & 공식 링크 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>📋</span> 자산 이전 채널별 통계 산출 방식
          </h4>
          <span className="realty-subblock-source">공식 공표 데이터 산출 기준</span>
        </div>
        <div className="table-wrap">
          <table className="realty-table">
            <thead>
              <tr>
                <th>이전 방식</th>
                <th>공식 집계 창구</th>
                <th>통계적 정의 및 처리</th>
              </tr>
            </thead>
            <tbody>
              {REALTY_WEALTH_METHODS.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 650 }}>{row.label}</td>
                  <td><span className="zone-chip">{row.putLabel}</span></td>
                  <td>{row.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="starter-list" style={{ marginTop: 14 }}>
          <a className="starter" href={REALTY_WEALTH_LINKS.survey} target="_blank" rel="noreferrer">가계금융복지조사</a>
          <a className="starter" href={REALTY_WEALTH_LINKS.gift} target="_blank" rel="noreferrer">상속·증여세 통계</a>
          <a className="starter" href={REALTY_WEALTH_LINKS.tasis} target="_blank" rel="noreferrer">국세통계포털 TASIS</a>
          <a className="starter" href={REALTY_WEALTH_LINKS.trust} target="_blank" rel="noreferrer">신탁업 실적 공시</a>
          <a className="starter" href={REALTY_WEALTH_LINKS.rebBuyer} target="_blank" rel="noreferrer">부동산원 거래주체별</a>
          <a className="starter" href={REALTY_WEALTH_LINKS.dart} target="_blank" rel="noreferrer">전자공시 DART</a>
        </div>
      </div>
    </div>
  );
}
