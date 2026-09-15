import {
  REALTY_AUCTION,
  REALTY_CARD_LINKS,
  REALTY_CARD_NPL,
  REALTY_CRE_NPL,
  REALTY_CRE_YIELD,
  REALTY_DISTRESS_LINKS,
  REALTY_DISTRESS_SLOTS,
  REALTY_HH_NPL,
  REALTY_REVOLVING,
  REALTY_RTI,
  REALTY_YOUNG_LEVERAGE,
  auctionYoyPct,
  eokToJo1,
  revolvingShareOfCardCredit,
} from "@finvesting/core";

export function RealtyDistressPanel() {
  const y = REALTY_YOUNG_LEVERAGE;
  const a = REALTY_AUCTION;
  const c = REALTY_CRE_YIELD;
  const n = REALTY_HH_NPL;
  const cre = REALTY_CRE_NPL;

  return (
    <div className="distress-panel">
      <p className="muted" style={{ margin: "0 0 10px" }}>
        상환은 한은 연체·고위험가구, 카드는 금감원 연체·협회 리볼빙, 경매는 대법원 신청 건수, 꼬마·중형 빌딩은 기업 부동산업 연체와 부동산원 상가 수익률입니다.
        급매 호수·유찰률 월별·상권 점포 매출은 안 긁습니다.
      </p>

      <h4 style={{ margin: "0 0 6px" }}>상환능력 · 영끌 고위험</h4>
      <p className="muted" style={{ margin: "0 0 8px" }}>
        {n.source}. 고위험은 DSR {y.dsrCut}% 초과이면서 자산대비부채 {y.dtaCut}% 초과입니다. ‘영끌’은 공식 명칭이 아닙니다.
      </p>
      <div className="official-kpis">
        <div className="index-cell">
          <div className="muted">가계 연체</div>
          <div className="big" style={{ fontSize: 20 }}>{n.household.toFixed(2)}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>주담대 {n.mortgage.toFixed(2)}% · 기타 {n.other.toFixed(2)}%</p>
        </div>
        <div className="index-cell">
          <div className="muted">고위험가구 청년</div>
          <div className="big" style={{ fontSize: 20 }}>{y.youthShare}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>2020년 {y.youthShare2020}% → {y.asOf} · 가구 {(y.households / 10_000).toFixed(1)}만</p>
        </div>
        <div className="index-cell">
          <div className="muted">서울 매매 30대↓</div>
          <div className="big" style={{ fontSize: 20 }}>{y.seoulBuyerYouth}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>{y.seoulBuyerAsOf} · {y.seoulBuyerNote}</p>
        </div>
        <div className="index-cell">
          <div className="muted">자영업 연체</div>
          <div className="big" style={{ fontSize: 20 }}>{n.selfEmp.toFixed(2)}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>취약 자영업 {n.selfEmpWeak.toFixed(2)}% · 기업 전체 {n.firm.toFixed(2)}%</p>
        </div>
      </div>

      <h4 style={{ margin: "16px 0 6px" }}>카드 연체 · 리볼빙</h4>
      <p className="muted" style={{ margin: "0 0 8px" }}>
        {REALTY_CARD_NPL.source}. {REALTY_REVOLVING.source}. 리볼빙(결제성, 흔히 리빙볼)은 일부만 갚고 넘기는 잔액입니다.
      </p>
      <div className="official-kpis">
        <div className="index-cell">
          <div className="muted">카드사 연체</div>
          <div className="big" style={{ fontSize: 20 }}>{REALTY_CARD_NPL.all.toFixed(2)}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>전년말 +{REALTY_CARD_NPL.allDelta.toFixed(2)}%p · 카드채권 {REALTY_CARD_NPL.card.toFixed(2)}%</p>
        </div>
        <div className="index-cell">
          <div className="muted">카드대출 연체</div>
          <div className="big" style={{ fontSize: 20 }}>{REALTY_CARD_NPL.loan.toFixed(2)}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>신용판매 {REALTY_CARD_NPL.sales.toFixed(2)}% · 비카드 여전 {REALTY_CARD_NPL.nonCard.toFixed(2)}%</p>
        </div>
        <div className="index-cell">
          <div className="muted">리볼빙 비율</div>
          <div className="big" style={{ fontSize: 20 }}>{(revolvingShareOfCardCredit() * 100).toFixed(1)}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            잔액 {eokToJo1(REALTY_REVOLVING.revolveEok).toFixed(2)}조 · 카드론+현금+리볼빙 대비
          </p>
        </div>
        <div className="index-cell">
          <div className="muted">리볼빙 수수료</div>
          <div className="big" style={{ fontSize: 20 }}>{REALTY_REVOLVING.feePct}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            현금 {REALTY_REVOLVING.cashFeePct}% · 카드론 {REALTY_REVOLVING.cardLoanFeePct}% · {eokToJo1(REALTY_REVOLVING.cashEok).toFixed(2)}조
          </p>
        </div>
      </div>
      <div className="starter-list" style={{ marginTop: 10 }}>
        <a className="starter" href={REALTY_CARD_LINKS.fss} target="_blank" rel="noreferrer">금감원 여전사 실적</a>
        <a className="starter" href={REALTY_CARD_LINKS.crefia} target="_blank" rel="noreferrer">여신금융협회</a>
        <a className="starter" href={REALTY_CARD_LINKS.revolving} target="_blank" rel="noreferrer">리볼빙 공시</a>
      </div>

      <h4 style={{ margin: "16px 0 6px" }}>경매 신청 · 급매·유찰 칸</h4>
      <p className="muted" style={{ margin: "0 0 8px" }}>{a.source}. {a.note}</p>
      <div className="official-kpis">
        <div className="index-cell">
          <div className="muted">경매 신청 2025</div>
          <div className="big" style={{ fontSize: 20 }}>{(a.filed / 10_000).toFixed(1)}만</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>2024 {(a.filed2024 / 10_000).toFixed(1)}만 · 전년비 {auctionYoyPct().toFixed(1)}%</p>
        </div>
        <div className="index-cell">
          <div className="muted">HUG 전세 회수</div>
          <div className="big" style={{ fontSize: 20 }}>{(a.hug / 10_000).toFixed(1)}만</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>신청의 약 {a.hugShare}% · 회수율 {a.hugRecover}% (전년 {a.hugRecoverPrev}%)</p>
        </div>
      </div>
      <div className="index-grid" style={{ marginTop: 12 }}>
        {REALTY_DISTRESS_SLOTS.map((s) => (
          <div key={s.id} className="index-cell">
            <div className="muted">{s.label}</div>
            <div className="big" style={{ fontSize: 18 }}>—</div>
            <p className="muted" style={{ margin: "6px 0 0" }}>{s.need}</p>
          </div>
        ))}
      </div>

      <h4 style={{ margin: "16px 0 6px" }}>꼬마·중형 빌딩 · 임대업 부채</h4>
      <p className="muted" style={{ margin: "0 0 8px" }}>{cre.note} {REALTY_RTI.note}</p>
      <div className="official-kpis">
        <div className="index-cell">
          <div className="muted">부동산업 연체</div>
          <div className="big" style={{ fontSize: 20 }}>{cre.realEstate.toFixed(2)}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>전체 업종 {cre.all.toFixed(2)}% · 잔액 비중 {cre.realEstateShare}%</p>
        </div>
        <div className="index-cell">
          <div className="muted">도소매 연체</div>
          <div className="big" style={{ fontSize: 20 }}>{cre.retail.toFixed(2)}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>잔액 비중 {cre.retailShare}% · 상권 소비와 겹침</p>
        </div>
        <div className="index-cell">
          <div className="muted">비주택 RTI</div>
          <div className="big" style={{ fontSize: 20 }}>{REALTY_RTI.nonHousing}배</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>주택 {REALTY_RTI.housing}배 · {REALTY_RTI.source}</p>
        </div>
        <div className="index-cell">
          <div className="muted">비은행 기업 연체</div>
          <div className="big" style={{ fontSize: 20 }}>{n.nonbankFirm.toFixed(2)}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>은행 기업 {n.bankFirm.toFixed(2)}%</p>
        </div>
      </div>

      <h4 style={{ margin: "16px 0 6px" }}>상권 · 소비 대체(임대수익률)</h4>
      <p className="muted" style={{ margin: "0 0 8px" }}>
        {c.source}. 점포 카드 매출은 소상공인365 원문. 임대료는 천원/㎡.
      </p>
      <div className="official-kpis">
        <div className="index-cell">
          <div className="muted">오피스 분기 수익</div>
          <div className="big" style={{ fontSize: 20 }}>{c.officeQ.toFixed(2)}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>소득 {c.officeInc.toFixed(2)}% · 연 {c.officeY.toFixed(2)}% · 임대료 {c.officeRent}</p>
        </div>
        <div className="index-cell">
          <div className="muted">중대형 상가</div>
          <div className="big" style={{ fontSize: 20 }}>{c.midShopQ.toFixed(2)}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>소득 {c.midShopInc.toFixed(2)}% · 연 {c.midShopY.toFixed(2)}% · 임대료 {c.midShopRent}</p>
        </div>
        <div className="index-cell">
          <div className="muted">소규모 상가</div>
          <div className="big" style={{ fontSize: 20 }}>{c.smallShopQ.toFixed(2)}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>소득 {c.smallShopInc.toFixed(2)}% · 연 {c.smallShopY.toFixed(2)}% · 임대료 {c.smallShopRent}</p>
        </div>
        <div className="index-cell">
          <div className="muted">집합 상가</div>
          <div className="big" style={{ fontSize: 20 }}>{c.retailQ.toFixed(2)}%</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>소득 {c.retailInc.toFixed(2)}% · 권리금 {(c.keyMoney / 10_000).toLocaleString("ko-KR")}만 · {c.keyMoneyShare}%</p>
        </div>
      </div>
      <div className="starter-list" style={{ marginTop: 10 }}>
        <a className="starter" href={REALTY_DISTRESS_LINKS.fsrJun} target="_blank" rel="noreferrer">금안보 2025.6</a>
        <a className="starter" href={REALTY_DISTRESS_LINKS.fsrDec} target="_blank" rel="noreferrer">금안보 2025.12</a>
        <a className="starter" href={REALTY_DISTRESS_LINKS.auction} target="_blank" rel="noreferrer">법원경매정보</a>
        <a className="starter" href={REALTY_DISTRESS_LINKS.fscRti} target="_blank" rel="noreferrer">RTI 가이드라인</a>
        <a className="starter" href={REALTY_DISTRESS_LINKS.reb} target="_blank" rel="noreferrer">부동산원 공실 정의</a>
        <a className="starter" href={REALTY_DISTRESS_LINKS.sbiz} target="_blank" rel="noreferrer">소상공인365</a>
        <a className="starter" href={REALTY_DISTRESS_LINKS.sg} target="_blank" rel="noreferrer">상권정보시스템</a>
      </div>
    </div>
  );
}
