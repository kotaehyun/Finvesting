import {
  REALTY_AUCTION,
  REALTY_BANKRUPTCY_CAUSES,
  REALTY_CARD_LINKS,
  REALTY_CARD_NPL,
  REALTY_CRE_NPL,
  REALTY_CRE_YIELD,
  REALTY_DISTRESS_LINKS,
  REALTY_DISTRESS_SLOTS,
  REALTY_HH_NPL,
  REALTY_INSOLVENCY_LINKS,
  REALTY_INSOLVENCY_SLOTS,
  REALTY_INSOLVENCY_STATS,
  REALTY_REVOLVING,
  REALTY_RTI,
  REALTY_YOUNG_LEVERAGE,
  auctionYoyPct,
  eokToJo1,
  insolvencyFiledTotal,
  rehabilitationYoyPct,
  revolvingShareOfCardCredit,
} from "@finvesting/core";

export function RealtyDistressPanel() {
  const y = REALTY_YOUNG_LEVERAGE;
  const a = REALTY_AUCTION;
  const c = REALTY_CRE_YIELD;
  const n = REALTY_HH_NPL;
  const cre = REALTY_CRE_NPL;
  const ins = REALTY_INSOLVENCY_STATS;

  return (
    <div className="distress-panel">
      {/* 1. 가계 상환능력 & 고위험 부채 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>🛡️</span> 가계 상환능력 및 고위험 부채 지표
          </h4>
          <span className="realty-subblock-source">{n.source}</span>
        </div>
        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏠</span> 가계대출 연체율
            </div>
            <div className="sub-kpi-val warn" style={{ color: "#ea580c" }}>{n.household.toFixed(2)}%</div>
            <p className="sub-kpi-sub">주담대 {n.mortgage.toFixed(2)}% · 기타대출 {n.other.toFixed(2)}%</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>⚠️</span> 고위험가구 청년 비중
            </div>
            <div className="sub-kpi-val alert" style={{ color: "#dc2626" }}>{y.youthShare}%</div>
            <p className="sub-kpi-sub">{y.asOf} 기준 총 {(y.households / 10_000).toFixed(1)}만 가구</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>📍</span> 서울 30대 이하 매매 비중
            </div>
            <div className="sub-kpi-val highlight">{y.seoulBuyerYouth}%</div>
            <p className="sub-kpi-sub">{y.seoulBuyerAsOf} 서울 아파트 매매 거래 기준</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏪</span> 자영업자 차주 연체율
            </div>
            <div className="sub-kpi-val warn" style={{ color: "#ea580c" }}>{n.selfEmp.toFixed(2)}%</div>
            <p className="sub-kpi-sub">취약 자영업 {n.selfEmpWeak.toFixed(2)}% · 기업대출 {n.firm.toFixed(2)}%</p>
          </div>
        </div>
      </div>

      {/* 2. 카드 연체 & 리볼빙 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>💳</span> 신용카드 연체 및 리볼빙 건전성 지표
          </h4>
          <span className="realty-subblock-source">{REALTY_CARD_NPL.source}</span>
        </div>
        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>💳</span> 전업 카드사 총 연체율
            </div>
            <div className="sub-kpi-val warn" style={{ color: "#ea580c" }}>{REALTY_CARD_NPL.all.toFixed(2)}%</div>
            <p className="sub-kpi-sub">전년말 대비 +{REALTY_CARD_NPL.allDelta.toFixed(2)}%p (카드채권 {REALTY_CARD_NPL.card.toFixed(2)}%)</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>📉</span> 카드대출 연체율
            </div>
            <div className="sub-kpi-val alert" style={{ color: "#dc2626" }}>{REALTY_CARD_NPL.loan.toFixed(2)}%</div>
            <p className="sub-kpi-sub">신용판매 {REALTY_CARD_NPL.sales.toFixed(2)}% · 비카드 여전 {REALTY_CARD_NPL.nonCard.toFixed(2)}%</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🔄</span> 리볼빙 잔액 비중
            </div>
            <div className="sub-kpi-val highlight">{(revolvingShareOfCardCredit() * 100).toFixed(1)}%</div>
            <p className="sub-kpi-sub">총 잔액 {eokToJo1(REALTY_REVOLVING.revolveEok).toFixed(2)}조원 (신용 익스포저 대비)</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>💸</span> 평균 리볼빙 수수료율
            </div>
            <div className="sub-kpi-val alert" style={{ color: "#dc2626" }}>{REALTY_REVOLVING.feePct}%</div>
            <p className="sub-kpi-sub">현금서비스 {REALTY_REVOLVING.cashFeePct}% · 카드론 {REALTY_REVOLVING.cardLoanFeePct}%</p>
          </div>
        </div>
        <div className="starter-list" style={{ marginTop: 12 }}>
          <a className="starter" href={REALTY_CARD_LINKS.fss} target="_blank" rel="noreferrer">금융감독원 여전사 실적</a>
          <a className="starter" href={REALTY_CARD_LINKS.crefia} target="_blank" rel="noreferrer">여신금융협회 공시</a>
          <a className="starter" href={REALTY_CARD_LINKS.revolving} target="_blank" rel="noreferrer">리볼빙 금리 비교</a>
        </div>
      </div>

      {/* 3. 법원 경매 및 보증 사고 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>⚖️</span> 법원 경매 신청 및 전세보증 사고
          </h4>
          <span className="realty-subblock-source">{a.source}</span>
        </div>
        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏛️</span> 대법원 경매 신청 (2025)
            </div>
            <div className="sub-kpi-val highlight">{(a.filed / 10_000).toFixed(1)}만 건</div>
            <p className="sub-kpi-sub">2024년 {(a.filed2024 / 10_000).toFixed(1)}만 건 대비 +{auctionYoyPct().toFixed(1)}% 증가</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🔨</span> 경매 유찰·매각률
            </div>
            <div className="sub-kpi-val">—</div>
            <p className="sub-kpi-sub">{REALTY_DISTRESS_SLOTS.find((s) => s.id === "fail")?.need}</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏢</span> 수도권·지방 유찰
            </div>
            <div className="sub-kpi-val">—</div>
            <p className="sub-kpi-sub">민간 경매 사이트를 긁지 않습니다. 법원경매정보 원문.</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🛡️</span> HUG 전세보증 강제경매 회수
            </div>
            <div className="sub-kpi-val highlight">{(a.hug / 10_000).toFixed(1)}만 건</div>
            <p className="sub-kpi-sub">신청 대비 {a.hugShare}% 점유 · 회수율 {a.hugRecover}% (전년 {a.hugRecoverPrev}%)</p>
          </div>
        </div>
        <div className="starter-list" style={{ marginTop: 12 }}>
          <a className="starter" href={REALTY_DISTRESS_LINKS.auction} target="_blank" rel="noreferrer">대법원 법원경매정보</a>
        </div>
      </div>

      {/* 4. 법원 개인회생·파산 (공표만) */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>🚨</span> 개인회생·파산 신청과 파탄원인
          </h4>
          <span className="realty-subblock-source">{ins.source}</span>
        </div>
        <p className="muted" style={{ margin: "0 0 10px" }}>{ins.causeNote}</p>

        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">개인회생 신청 2025</div>
            <div className="sub-kpi-val highlight">{(ins.rehabilitationFiled / 10_000).toFixed(1)}만</div>
            <p className="sub-kpi-sub">2024 {(ins.rehabilitationFiledPrev / 10_000).toFixed(1)}만 · 전년비 {rehabilitationYoyPct().toFixed(1)}%</p>
          </div>
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">개인파산 신청 2025</div>
            <div className="sub-kpi-val">{(ins.bankruptcyFiled / 10_000).toFixed(1)}만</div>
            <p className="sub-kpi-sub">2024 {(ins.bankruptcyFiledPrev / 10_000).toFixed(1)}만 · 합 { (insolvencyFiledTotal() / 10_000).toFixed(1)}만</p>
          </div>
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">신복위 채무조정 확정</div>
            <div className="sub-kpi-val">{(ins.debtAdjustmentSettled / 10_000).toFixed(1)}만</div>
            <p className="sub-kpi-sub">{ins.debtAdjustmentAsOf} · {ins.debtAdjustmentSource} · 접수 아님</p>
          </div>
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">파탄원인</div>
            <div className="sub-kpi-val">중복</div>
            <p className="sub-kpi-sub">{ins.causeAsOf} 개인파산. 합 100% 아님 · 주담대 칸 없음</p>
          </div>
        </div>

        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table className="realty-table">
            <thead>
              <tr>
                <th>파탄원인 (중복응답)</th>
                <th className="num">비중</th>
                <th>설명</th>
              </tr>
            </thead>
            <tbody>
              {REALTY_BANKRUPTCY_CAUSES.map((cause) => (
                <tr key={cause.id}>
                  <td style={{ fontWeight: 600 }}>{cause.label}</td>
                  <td className="num">{cause.share.toFixed(2)}%</td>
                  <td>{cause.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sub-kpi-grid" style={{ marginTop: 14 }}>
          {REALTY_INSOLVENCY_SLOTS.map((s) => (
            <div key={s.id} className="sub-kpi-card">
              <div className="sub-kpi-title">{s.label}</div>
              <div className="sub-kpi-val">—</div>
              <p className="sub-kpi-sub">{s.need}</p>
            </div>
          ))}
        </div>

        <div className="starter-list" style={{ marginTop: 12 }}>
          <a className="starter" href={REALTY_INSOLVENCY_LINKS.slbPdf} target="_blank" rel="noreferrer">서울회생법원 파산 통계 PDF</a>
          <a className="starter" href={REALTY_INSOLVENCY_LINKS.slbCourt} target="_blank" rel="noreferrer">서울회생법원</a>
          <a className="starter" href={REALTY_INSOLVENCY_LINKS.ccrs} target="_blank" rel="noreferrer">신용회복위원회</a>
          <a className="starter" href={REALTY_INSOLVENCY_LINKS.kofiaMisu} target="_blank" rel="noreferrer">금투협 미수금</a>
          <a className="starter" href={REALTY_INSOLVENCY_LINKS.scourtInsolvency} target="_blank" rel="noreferrer">2025 사법연감 보도</a>
        </div>
      </div>

      {/* 5. 상업용 부동산 & 부채 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>🏢</span> 상업용 부동산 및 임대업 부채 건전성
          </h4>
          <span className="realty-subblock-source">금융감독원 / 한국은행</span>
        </div>
        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏗️</span> 부동산업 대출 연체율
            </div>
            <div className="sub-kpi-val warn" style={{ color: "#ea580c" }}>{cre.realEstate.toFixed(2)}%</div>
            <p className="sub-kpi-sub">전 업종 평균 {cre.all.toFixed(2)}% (잔액 비중 {cre.realEstateShare}%)</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏬</span> 도소매업 대출 연체율
            </div>
            <div className="sub-kpi-val warn" style={{ color: "#ea580c" }}>{cre.retail.toFixed(2)}%</div>
            <p className="sub-kpi-sub">잔액 비중 {cre.retailShare}% (상권 침체 지표)</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>📊</span> 비주택 담보 RTI 가이드라인
            </div>
            <div className="sub-kpi-val highlight">{REALTY_RTI.nonHousing}배</div>
            <p className="sub-kpi-sub">주택 담보 {REALTY_RTI.housing}배 (금융위 임대업이자상환비율)</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏦</span> 비은행권 기업 연체율
            </div>
            <div className="sub-kpi-val alert" style={{ color: "#dc2626" }}>{n.nonbankFirm.toFixed(2)}%</div>
            <p className="sub-kpi-sub">은행권 기업 {n.bankFirm.toFixed(2)}% 대비 3.7배 수준</p>
          </div>
        </div>
      </div>

      {/* 6. 상가 임대수익률 */}
      <div className="realty-subblock-card">
        <div className="realty-subblock-head">
          <h4 className="realty-subblock-title">
            <span>🏪</span> 상업용 부동산 분기 투자수익률
          </h4>
          <span className="realty-subblock-source">{c.source}</span>
        </div>
        <div className="sub-kpi-grid">
          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏢</span> 오피스 분기 투자수익률
            </div>
            <div className="sub-kpi-val highlight">{c.officeQ.toFixed(2)}%</div>
            <p className="sub-kpi-sub">연환산 {c.officeY.toFixed(2)}% · 평균 임대료 {c.officeRent}천원/㎡</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏬</span> 중대형 상가 수익률
            </div>
            <div className="sub-kpi-val">{c.midShopQ.toFixed(2)}%</div>
            <p className="sub-kpi-sub">연환산 {c.midShopY.toFixed(2)}% · 평균 임대료 {c.midShopRent}천원/㎡</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🏪</span> 소규모 상가 수익률
            </div>
            <div className="sub-kpi-val">{c.smallShopQ.toFixed(2)}%</div>
            <p className="sub-kpi-sub">연환산 {c.smallShopY.toFixed(2)}% · 평균 임대료 {c.smallShopRent}천원/㎡</p>
          </div>

          <div className="sub-kpi-card">
            <div className="sub-kpi-title">
              <span>🛍️</span> 집합 상가 수익률
            </div>
            <div className="sub-kpi-val highlight">{c.retailQ.toFixed(2)}%</div>
            <p className="sub-kpi-sub">권리금 유비율 {c.keyMoneyShare}% · 평균 {(c.keyMoney / 10_000).toLocaleString("ko-KR")}만원</p>
          </div>
        </div>
        <div className="starter-list" style={{ marginTop: 12 }}>
          <a className="starter" href={REALTY_DISTRESS_LINKS.fsrJun} target="_blank" rel="noreferrer">금융안정보고서</a>
          <a className="starter" href={REALTY_DISTRESS_LINKS.fscRti} target="_blank" rel="noreferrer">RTI 가이드라인</a>
          <a className="starter" href={REALTY_DISTRESS_LINKS.reb} target="_blank" rel="noreferrer">한국부동산원 통계</a>
          <a className="starter" href={REALTY_DISTRESS_LINKS.sg} target="_blank" rel="noreferrer">상권정보시스템</a>
        </div>
      </div>
    </div>
  );
}
