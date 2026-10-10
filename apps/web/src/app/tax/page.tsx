"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

type TaxTab = "capital_gains" | "financial_income" | "year_end";

export default function TaxPage() {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [activeTab, setActiveTab] = useState<TaxTab>("capital_gains");

  // Summary query
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } =
    trpc.tax.summary.useQuery({ year: selectedYear });

  // Capital Gains detailed query
  const { data: cgData, isLoading: cgLoading } =
    trpc.tax.capitalGains.useQuery({ year: selectedYear }, { enabled: activeTab === "capital_gains" });

  // Financial Income detailed query
  const { data: fiData, isLoading: fiLoading, refetch: refetchFi } =
    trpc.tax.financialIncome.useQuery({ year: selectedYear }, { enabled: activeTab === "financial_income" });

  // Account list for adding income
  const { data: accounts } = trpc.accounts.list.useQuery();

  // Year-End simulation state
  const [yeInputs, setYeInputs] = useState({
    grossSalary: 60_000_000,
    prepaidTax: 3_600_000,
    prepaidInsurance: 5_400_000,
    pensionSavingsContribution: 3_000_000,
    irpContribution: 1_500_000,
    housingSubscriptionDeposit: 2_400_000,
    insurancePremiumPaid: 1_296_000,
    creditCardSpent: 12_000_000,
    debitCardCashSpent: 9_000_000,
    dependentsCount: 0,
  });

  // Keep year-end state synced when summary loads
  const [isYeCustomized, setIsYeCustomized] = useState(false);
  const effectiveYeInput = useMemo(() => {
    if (isYeCustomized || !summary?.yearEndSettlement) return yeInputs;
    return {
      grossSalary: summary.yearEndSettlement.grossSalary,
      prepaidTax: summary.yearEndSettlement.prepaidTax,
      prepaidInsurance: summary.yearEndSettlement.pensionInsuranceDeduction + summary.yearEndSettlement.healthInsuranceDeduction,
      pensionSavingsContribution: 3_000_000,
      irpContribution: 1_500_000,
      housingSubscriptionDeposit: 2_400_000,
      insurancePremiumPaid: 1_296_000,
      creditCardSpent: Math.round(summary.yearEndSettlement.grossSalary * 0.2),
      debitCardCashSpent: Math.round(summary.yearEndSettlement.grossSalary * 0.15),
      dependentsCount: 0,
    };
  }, [summary, yeInputs, isYeCustomized]);

  // Year-end simulation query
  const { data: yeSimulation } = trpc.tax.simulateYearEnd.useQuery(effectiveYeInput);

  // Export XLSX & Hometax Parser state
  const trpcUtils = trpc.useUtils();
  const [isExporting, setIsExporting] = useState(false);
  const [showHometaxModal, setShowHometaxModal] = useState(false);
  const [hometaxNotice, setHometaxNotice] = useState<string | null>(null);
  const parseHometaxMutation = trpc.tax.parseHometaxUpload.useMutation();

  const handleExportXlsx = async () => {
    try {
      setIsExporting(true);
      const data = await trpcUtils.tax.exportXlsx.fetch({
        year: selectedYear,
        inputs: effectiveYeInput,
      });

      const byteCharacters = atob(data.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`엑셀 내보내기 실패: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleHometaxFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        const parsed = await parseHometaxMutation.mutateAsync({
          filename: file.name,
          content,
        });

        setIsYeCustomized(true);
        setYeInputs((prev) => ({
          ...prev,
          pensionSavingsContribution: parsed.pensionSavingsContribution || prev.pensionSavingsContribution,
          irpContribution: parsed.irpContribution || prev.irpContribution,
          housingSubscriptionDeposit: parsed.housingSubscriptionDeposit || prev.housingSubscriptionDeposit,
          insurancePremiumPaid: parsed.insurancePremiumPaid || prev.insurancePremiumPaid,
          creditCardSpent: parsed.creditCardSpent || prev.creditCardSpent,
          debitCardCashSpent: parsed.debitCardCashSpent || prev.debitCardCashSpent,
        }));

        setHometaxNotice(
          `🎉 국세청 홈택스 간소화 자료(${parsed.userName ? `${parsed.userName}님, ` : ""}${parsed.rawCount}건)가 자동 반영되었습니다! (연금저축: ${won(parsed.pensionSavingsContribution)}, IRP: ${won(parsed.irpContribution)}, 청약: ${won(parsed.housingSubscriptionDeposit)}, 보험: ${won(parsed.insurancePremiumPaid)}, 카드: ${won(parsed.creditCardSpent + parsed.debitCardCashSpent)})`
        );
        setShowHometaxModal(false);
      } catch (err: any) {
        alert(`홈택스 파일 파싱 실패: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // New Income Form State
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [newIncome, setNewIncome] = useState({
    accountId: "",
    kind: "dividend" as "dividend" | "interest",
    gross: 100_000,
    paidOn: "2026-10-10",
  });

  const addIncomeMutation = trpc.tax.addIncome.useMutation({
    onSuccess: () => {
      refetchFi();
      refetchSummary();
      setShowAddIncomeModal(false);
    },
  });

  const handleAddIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncome.accountId) {
      alert("입금 계좌를 선택해주세요.");
      return;
    }
    addIncomeMutation.mutate({
      accountId: newIncome.accountId,
      kind: newIncome.kind,
      gross: Number(newIncome.gross),
      paidOn: newIncome.paidOn,
    });
  };

  const handleYeInputChange = (key: keyof typeof yeInputs, value: number) => {
    setIsYeCustomized(true);
    setYeInputs((prev) => ({ ...prev, [key]: value }));
  };

  if (summaryLoading) {
    return (
      <div className="tax-loading">
        <div className="spinner"></div>
        <p>세금 및 연말정산 데이터를 분석하는 중…</p>
      </div>
    );
  }

  const cg = summary?.capitalGainsTax;
  const fi = summary?.financialIncome;
  const ye = yeSimulation || summary?.yearEndSettlement;
  const harvesting = summary?.taxLossHarvesting;

  return (
    <div className="tax-page">
      {/* 1. 최상단 헤더 */}
      <div className="tax-header">
        <div>
          <div className="tax-badge-row">
            <span className="tax-tag">Phase 3</span>
            <span className="tax-tag accent">Tax & Year-End Terminal</span>
          </div>
          <h1 className="tax-title">세금 & 연말정산 터미널</h1>
          <p className="tax-desc">
            해외주식 양도소득세(250만원 공제·절세 시뮬레이션) · 금융소득 종합과세(2,000만원) 모니터링 · 근로소득 연말정산(13월의 월급) 환급액 예측
          </p>
        </div>
        <div className="tax-header-controls">
          <div className="tax-header-actions">
            <button className="btn-action-primary" onClick={handleExportXlsx} disabled={isExporting}>
              {isExporting ? "⏳ 엑셀 생성 중…" : "📥 연말정산 XLSX 내보내기"}
            </button>
            <button className="btn-action-secondary" onClick={() => setShowHometaxModal(true)}>
              📂 홈택스 간소화 불러오기
            </button>
            <a className="btn-action-secondary" href="/accounting" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              🏢 회계 전표 내보내기
            </a>
          </div>
          <div className="tax-year-selector">
            <div className="year-pill-group">
              {[2026, 2025].map((y) => (
                <button
                  key={y}
                  className={`year-pill ${selectedYear === y ? "on" : ""}`}
                  onClick={() => setSelectedYear(y)}
                >
                  {y}년
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 홈택스 간소화 파일 적용 안내 배너 */}
      {hometaxNotice && (
        <div className="hometax-alert-banner">
          <span className="banner-icon">📋</span>
          <div className="banner-text">{hometaxNotice}</div>
          <button className="banner-close" onClick={() => setHometaxNotice(null)}>✕</button>
        </div>
      )}

      {/* 2. 3대 핵심 지표 바롬메터 KPI 카드 */}
      <div className="tax-kpi-grid">
        {/* KPI 1: 해외주식 양도세 */}
        <div className="tax-kpi-card">
          <div className="tax-kpi-header">
            <span className="kpi-icon">🇺🇸</span>
            <span className="kpi-label">해외주식 양도소득세</span>
            <span className={`status-chip ${cg?.isTaxable ? "warn" : "safe"}`}>
              {cg?.isTaxable ? "과세 대상" : "비과세 (공제 내)"}
            </span>
          </div>
          <div className="tax-kpi-body">
            <div className="kpi-main-val">
              {won(cg?.totalEstimatedTax ?? 0)}
              <span className="kpi-sub-text">납부 예상</span>
            </div>
            <div className="kpi-meta-row">
              <span>순실현차익: <strong>{won(cg?.netRealizedGain ?? 0)}</strong></span>
              <span>기본공제: <strong>{won(cg?.appliedDeduction ?? 0)}</strong> / 250만</span>
            </div>
            {harvesting && harvesting.estimatedTaxSaved > 0 && (
              <div className="kpi-harvest-hint">
                ⚡ 손실 매도 시 최대 <strong>{won(harvesting.estimatedTaxSaved)}</strong> 절세 가능
              </div>
            )}
          </div>
        </div>

        {/* KPI 2: 금융소득 종합과세 */}
        <div className="tax-kpi-card">
          <div className="tax-kpi-header">
            <span className="kpi-icon">💰</span>
            <span className="kpi-label">금융소득 (배당+이자)</span>
            <span className={`status-chip ${fi?.status === "safe" ? "safe" : fi?.status === "caution" ? "warn" : "danger"}`}>
              {fi?.status === "safe" ? "안전 (분리과세)" : fi?.status === "caution" ? "주의 구간" : "종합과세 대상"}
            </span>
          </div>
          <div className="tax-kpi-body">
            <div className="kpi-main-val">
              {won(fi?.totalGross ?? 0)}
              <span className="kpi-sub-text">세전 누적</span>
            </div>
            {/* 프로그레스 바 */}
            <div className="progress-bar-wrap">
              <div
                className={`progress-bar-fill ${fi?.status === "safe" ? "safe" : fi?.status === "caution" ? "warn" : "danger"}`}
                style={{ width: `${Math.min(100, (fi?.utilizationRate ?? 0) * 100)}%` }}
              ></div>
            </div>
            <div className="kpi-meta-row">
              <span>한도 소진율: <strong>{pct(fi?.utilizationRate ?? 0)}</strong></span>
              <span>잔여 비과세 한도: <strong>{won(fi?.remainingLimit ?? 0)}</strong></span>
            </div>
          </div>
        </div>

        {/* KPI 3: 연말정산 환급 예측 */}
        <div className="tax-kpi-card">
          <div className="tax-kpi-header">
            <span className="kpi-icon">📋</span>
            <span className="kpi-label">근로소득 연말정산</span>
            <span className={`status-chip ${ye?.isRefund ? "safe" : "danger"}`}>
              {ye?.isRefund ? "환급 예상 (13월의 월급)" : "추가 납부 예상"}
            </span>
          </div>
          <div className="tax-kpi-body">
            <div className={`kpi-main-val ${ye?.isRefund ? "up" : "down"}`}>
              {ye?.isRefund ? `+${won(ye.refundOrPayback)}` : `-${won(Math.abs(ye?.refundOrPayback ?? 0))}`}
              <span className="kpi-sub-text">{ye?.isRefund ? "환급액" : "추가납부"}</span>
            </div>
            <div className="kpi-meta-row">
              <span>기납부세액: <strong>{won(ye?.prepaidTax ?? 0)}</strong></span>
              <span>결정세액: <strong>{won(ye?.determinedTax ?? 0)}</strong></span>
            </div>
            <div className="kpi-meta-row">
              <span>총 세액공제: <strong>{won(ye?.totalTaxCredits ?? 0)}</strong></span>
              <span>과세표준: <strong>{won(ye?.taxableBase ?? 0)}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 탭 네비게이션 */}
      <div className="tax-tab-nav">
        <button
          className={`tax-tab-btn ${activeTab === "capital_gains" ? "on" : ""}`}
          onClick={() => setActiveTab("capital_gains")}
        >
          🇺🇸 해외주식 양도소득세 & 절세 시뮬레이터
        </button>
        <button
          className={`tax-tab-btn ${activeTab === "financial_income" ? "on" : ""}`}
          onClick={() => setActiveTab("financial_income")}
        >
          💰 배당·이자 금융소득 종합과세 모니터
        </button>
        <button
          className={`tax-tab-btn ${activeTab === "year_end" ? "on" : ""}`}
          onClick={() => setActiveTab("year_end")}
        >
          📋 근로소득 연말정산 시뮬레이터 & 공제 체크리스트
        </button>
      </div>

      {/* 4. 탭 콘텐츠 */}
      {/* ======================================================== */}
      {/* TAB 1: 해외주식 양도소득세 */}
      {/* ======================================================== */}
      {activeTab === "capital_gains" && (
        <div className="tax-tab-content">
          <div className="cg-container">
            {/* 세액 계산 명세서 */}
            <div className="card cg-calc-card">
              <div className="card-header-row">
                <h3>{selectedYear}년 해외주식 양도소득세 산출 명세서</h3>
                <span className="tax-rule-badge">소득세법 제118조의2 (세율 22%)</span>
              </div>
              <div className="cg-calc-table">
                <div className="calc-row">
                  <span className="calc-label">총 매도 가액 (원화 환산)</span>
                  <span className="calc-val">{won(cg?.totalProceeds ?? 0)}</span>
                </div>
                <div className="calc-row">
                  <span className="calc-label">(-) 총 취득 가액 (매수 원가)</span>
                  <span className="calc-val minus">-{won(cg?.totalCost ?? 0)}</span>
                </div>
                <div className="calc-row">
                  <span className="calc-label">(-) 매매 수수료 및 제세금</span>
                  <span className="calc-val minus">-{won(cg?.totalFees ?? 0)}</span>
                </div>
                <div className="calc-row highlight">
                  <span className="calc-label">= 순 양도차익 (통산 실현손익)</span>
                  <span className={`calc-val ${(cg?.netRealizedGain ?? 0) >= 0 ? "up" : "down"}`}>
                    {won(cg?.netRealizedGain ?? 0)}
                  </span>
                </div>
                <div className="calc-row">
                  <span className="calc-label">(-) 연간 기본공제 (250만원 한도)</span>
                  <span className="calc-val minus">-{won(cg?.appliedDeduction ?? 0)}</span>
                </div>
                <div className="calc-row highlight">
                  <span className="calc-label">= 과세표준</span>
                  <span className="calc-val">{won(cg?.taxableBase ?? 0)}</span>
                </div>
                <div className="calc-divider"></div>
                <div className="calc-row sub">
                  <span className="calc-label">양도소득세 (국세 20%)</span>
                  <span className="calc-val">{won(cg?.nationalTax ?? 0)}</span>
                </div>
                <div className="calc-row sub">
                  <span className="calc-label">지방소득세 (지방세 2%)</span>
                  <span className="calc-val">{won(cg?.localTax ?? 0)}</span>
                </div>
                <div className="calc-row total">
                  <span className="calc-label">총 납부 예상세액 (22%)</span>
                  <span className="calc-val total-tax">{won(cg?.totalEstimatedTax ?? 0)}</span>
                </div>
              </div>
              <div className="cg-note">
                * 매년 1월 1일 ~ 12월 31일 체결 기준 손익통산되며, 이듬해 5월 국세청 홈택스 확정신고 대상입니다.
              </div>
            </div>

            {/* Tax-Loss Harvesting (손실 통산) 절세 액션 플랜 */}
            <div className="card cg-harvest-card">
              <div className="card-header-row">
                <h3>⚡ Tax-Loss Harvesting (손실 통산 절세 가이드)</h3>
                <span className="tax-rule-badge highlight">연말 전 절세 기회</span>
              </div>
              {harvesting && harvesting.excessGainOverDeduction > 0 ? (
                <div className="harvest-content">
                  <div className="harvest-alert-box">
                    <p className="harvest-title">
                      현재 기본공제 250만원을 <strong>{won(harvesting.excessGainOverDeduction)}</strong> 초과하여 양도세가 발생합니다.
                    </p>
                    <p className="harvest-sub">
                      12월 말 폐장 전, 보유 중인 손실 종목을 매도(손실 확정)하면 통산 손익이 줄어들어 
                      <strong> 최대 {won(harvesting.estimatedTaxSaved)}</strong>의 세금을 합법적으로 절감할 수 있습니다.
                    </p>
                  </div>

                  <h4 className="harvest-sec-title">보유 중인 미실현 손실 해외 종목</h4>
                  {harvesting.lossHoldings.length > 0 ? (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>종목</th>
                            <th>보유 수량</th>
                            <th>평가손실 (원화)</th>
                            <th>권장 손실 매도액</th>
                          </tr>
                        </thead>
                        <tbody>
                          {harvesting.lossHoldings.map((lh) => (
                            <tr key={lh.symbol}>
                              <td>
                                <strong>{lh.name}</strong> <span className="muted">({lh.symbol})</span>
                              </td>
                              <td>{lh.quantity}주</td>
                              <td className="down">-{won(lh.unrealizedLoss)}</td>
                              <td>
                                <span className="harvest-chip">-{won(lh.harvestableLoss)} 확정 권장</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="muted">현재 보유 중인 마이너스 평가손실 종목이 없습니다.</p>
                  )}
                </div>
              ) : (
                <div className="harvest-safe-box">
                  <div className="safe-icon">✅</div>
                  <div>
                    <h4>현재 기본공제 범위 내(250만원 이하)입니다!</h4>
                    <p className="muted">
                      납부해야 할 양도소득세가 0원입니다. 연말까지 남은 기본공제 한도({won(Math.max(0, 2_500_000 - (cg?.netRealizedGain ?? 0)))}) 내에서 수익 중인 종목을 분할 매도 후 재매수하면 매수 평단을 높여 내년 세금을 줄일 수 있습니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 실현 매도 체결 내역 */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header-row">
              <h3>{selectedYear}년 해외주식 실현 매도 체결 목록</h3>
              <span className="muted">체결 건수: {cgData?.realizedTrades.length ?? 0}건</span>
            </div>
            {cgData && cgData.realizedTrades.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>체결일시</th>
                      <th>종목</th>
                      <th>매도수량</th>
                      <th>매도가 (원화환산)</th>
                      <th>매수가 (원화환산)</th>
                      <th>수수료/제세금</th>
                      <th>실현손익</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cgData.realizedTrades.map((t) => {
                      const gain = t.quantity * t.sellPrice - t.quantity * t.buyPrice - t.feeAndTax;
                      return (
                        <tr key={t.id}>
                          <td>{t.tradedAt.slice(0, 10)}</td>
                          <td>
                            <strong>{t.name}</strong> <span className="muted">({t.symbol})</span>
                          </td>
                          <td>{t.quantity}주</td>
                          <td>{won(t.sellPrice)}</td>
                          <td>{won(t.buyPrice)}</td>
                          <td>{won(t.feeAndTax)}</td>
                          <td className={gain >= 0 ? "up" : "down"}>
                            <strong>{gain >= 0 ? `+${won(gain)}` : won(gain)}</strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-box">
                <p className="muted">{selectedYear}년에 발생한 해외주식 매도 체결 내역이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: 배당·이자 금융소득 종합과세 */}
      {/* ======================================================== */}
      {activeTab === "financial_income" && (
        <div className="tax-tab-content">
          <div className="fi-top-row">
            {/* 2000만원 종합과세 게이지 카드 */}
            <div className="card fi-gauge-card">
              <div className="card-header-row">
                <h3>금융소득 종합과세 2,000만원 한도 현황</h3>
                <span className={`status-chip ${fi?.status === "safe" ? "safe" : fi?.status === "caution" ? "warn" : "danger"}`}>
                  {fi?.status === "safe" ? "안전 (분리과세)" : fi?.status === "caution" ? "주의 (75% 초과)" : "초과 (종합과세 대상)"}
                </span>
              </div>
              <div className="fi-gauge-body">
                <div className="gauge-metric-row">
                  <div>
                    <span className="muted">올해 누적 금융소득 (세전)</span>
                    <div className="gauge-val">{won(fi?.totalGross ?? 0)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="muted">기준 한도</span>
                    <div className="gauge-val muted">20,000,000원</div>
                  </div>
                </div>

                <div className="fi-progress-track">
                  <div
                    className={`fi-progress-fill ${fi?.status === "safe" ? "safe" : fi?.status === "caution" ? "warn" : "danger"}`}
                    style={{ width: `${Math.min(100, (fi?.utilizationRate ?? 0) * 100)}%` }}
                  ></div>
                  <div className="fi-threshold-marker" title="2,000만원 종합과세 기준선">
                    <span>2,000만</span>
                  </div>
                </div>

                <div className="fi-info-grid">
                  <div className="fi-info-item">
                    <span className="muted">배당소득 (세전)</span>
                    <strong>{won(fi?.dividendGross ?? 0)}</strong>
                  </div>
                  <div className="fi-info-item">
                    <span className="muted">이자소득 (세전)</span>
                    <strong>{won(fi?.interestGross ?? 0)}</strong>
                  </div>
                  <div className="fi-info-item">
                    <span className="muted">기납부 원천징수세 (15.4%)</span>
                    <strong>{won(fi?.totalWithheldTax ?? 0)}</strong>
                  </div>
                  <div className="fi-info-item">
                    <span className="muted">실제 세후 수령액</span>
                    <strong className="up">{won(fi?.netReceived ?? 0)}</strong>
                  </div>
                </div>

                <div className="fi-caution-box">
                  💡 <strong>금융소득 2,000만원 초과 시:</strong> 2천만원 초과분은 다른 종합소득(근로·사업)과 합산되어 기본세율(최대 45%)로 누진과세되며, 직장가입자 건강보험료 피부양자 자격이 박탈되거나 추가 보험료가 부과됩니다.
                </div>
              </div>
            </div>

            {/* 수취 내역 및 추가 버튼 */}
            <div className="card fi-list-card">
              <div className="card-header-row">
                <h3>{selectedYear}년 금융소득 수취 내역</h3>
                <button className="btn-sm" onClick={() => setShowAddIncomeModal(true)}>
                  + 배당/이자 수취 입력
                </button>
              </div>

              {fiData && fiData.items.length > 0 ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>수취일자</th>
                        <th>구분</th>
                        <th>종목/상품명</th>
                        <th>계좌</th>
                        <th>세전 금액</th>
                        <th>원천징수 (15.4%)</th>
                        <th>실수령액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fiData.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.paidOn}</td>
                          <td>
                            <span className={`kind-badge ${item.kind}`}>
                              {item.kind === "dividend" ? "배당" : "이자"}
                            </span>
                          </td>
                          <td>
                            <strong>{item.name}</strong> {item.symbol !== "-" && <span className="muted">({item.symbol})</span>}
                          </td>
                          <td className="muted">{item.accountName}</td>
                          <td>{won(item.gross)}</td>
                          <td className="down">-{won(item.withheldTax)}</td>
                          <td>
                            <strong className="up">{won(item.net)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-box">
                  <p className="muted">등록된 배당 또는 이자 수취 내역이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: 근로소득 연말정산 시뮬레이터 */}
      {/* ======================================================== */}
      {activeTab === "year_end" && (
        <div className="tax-tab-content">
          <div className="ye-container">
            {/* 왼쪽: 인터랙티브 공제 조절 폼 */}
            <div className="card ye-input-card">
              <div className="card-header-row">
                <h3>연말정산 공제 항목 시뮬레이터</h3>
                <button
                  className="btn-text"
                  onClick={() => {
                    setIsYeCustomized(false);
                  }}
                >
                  기본값 복원
                </button>
              </div>

              <div className="ye-form-grid">
                <div className="ye-field">
                  <label>연간 총급여 (세전)</label>
                  <input
                    type="number"
                    step={1000000}
                    value={effectiveYeInput.grossSalary}
                    onChange={(e) => handleYeInputChange("grossSalary", Number(e.target.value))}
                  />
                  <span className="field-hint">급여대장 연환산 기준</span>
                </div>

                <div className="ye-field">
                  <label>기납부세액 (원천징수 국세+지방세)</label>
                  <input
                    type="number"
                    step={100000}
                    value={effectiveYeInput.prepaidTax}
                    onChange={(e) => handleYeInputChange("prepaidTax", Number(e.target.value))}
                  />
                  <span className="field-hint">매월 급여에서 뗀 세금 합계</span>
                </div>

                <div className="ye-field">
                  <label>4대보험 납부액 (국민연금+건보+고용)</label>
                  <input
                    type="number"
                    step={100000}
                    value={effectiveYeInput.prepaidInsurance}
                    onChange={(e) => handleYeInputChange("prepaidInsurance", Number(e.target.value))}
                  />
                  <span className="field-hint">소득공제 100% 반영</span>
                </div>

                <div className="ye-field">
                  <label>연금저축 납입액 (최대 600만원)</label>
                  <input
                    type="number"
                    step={500000}
                    max={6000000}
                    value={effectiveYeInput.pensionSavingsContribution}
                    onChange={(e) => handleYeInputChange("pensionSavingsContribution", Number(e.target.value))}
                  />
                  <span className="field-hint">세액공제율: 16.5% 또는 13.2%</span>
                </div>

                <div className="ye-field">
                  <label>IRP (개인형퇴직연금) 납입액 (합산 900만원)</label>
                  <input
                    type="number"
                    step={500000}
                    max={9000000}
                    value={effectiveYeInput.irpContribution}
                    onChange={(e) => handleYeInputChange("irpContribution", Number(e.target.value))}
                  />
                  <span className="field-hint">연금저축과 합산 최대 900만 한도</span>
                </div>

                <div className="ye-field">
                  <label>주택청약종합저축 (연 300만원 한도)</label>
                  <input
                    type="number"
                    step={200000}
                    max={3000000}
                    value={effectiveYeInput.housingSubscriptionDeposit}
                    onChange={(e) => handleYeInputChange("housingSubscriptionDeposit", Number(e.target.value))}
                  />
                  <span className="field-hint">납입액의 40% 소득공제 (최대 120만원)</span>
                </div>

                <div className="ye-field">
                  <label>보장성 보험료 (연 100만원 한도)</label>
                  <input
                    type="number"
                    step={100000}
                    max={1000000}
                    value={effectiveYeInput.insurancePremiumPaid}
                    onChange={(e) => handleYeInputChange("insurancePremiumPaid", Number(e.target.value))}
                  />
                  <span className="field-hint">12% (지방세 포함 13.2%) 세액공제</span>
                </div>

                <div className="ye-field">
                  <label>신용카드 연간 사용액</label>
                  <input
                    type="number"
                    step={1000000}
                    value={effectiveYeInput.creditCardSpent}
                    onChange={(e) => handleYeInputChange("creditCardSpent", Number(e.target.value))}
                  />
                  <span className="field-hint">총급여 25% 초과분의 15% 공제</span>
                </div>

                <div className="ye-field">
                  <label>체크카드 / 현금영수증 사용액</label>
                  <input
                    type="number"
                    step={1000000}
                    value={effectiveYeInput.debitCardCashSpent}
                    onChange={(e) => handleYeInputChange("debitCardCashSpent", Number(e.target.value))}
                  />
                  <span className="field-hint">총급여 25% 초과분의 30% 공제</span>
                </div>

                <div className="ye-field">
                  <label>기본공제 부양가족 수 (본인 제외)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={effectiveYeInput.dependentsCount}
                    onChange={(e) => handleYeInputChange("dependentsCount", Number(e.target.value))}
                  />
                  <span className="field-hint">1인당 150만원 추가 소득공제</span>
                </div>
              </div>
            </div>

            {/* 오른쪽: 산출 및 환급액 결과 디스플레이 */}
            <div className="card ye-result-card">
              <div className="card-header-row">
                <h3>{selectedYear}년 예상 연말정산 결과서</h3>
                <span className="tax-rule-badge">13월의 월급 시뮬레이터</span>
              </div>

              {/* 환급액 빅 하이라이트 박스 */}
              <div className={`ye-highlight-box ${ye?.isRefund ? "refund" : "payback"}`}>
                <div className="highlight-tag">
                  {ye?.isRefund ? "🎉 환급 예상 (돌려받는 세금)" : "⚠️ 추가 납부 예상 (더 내야 하는 세금)"}
                </div>
                <div className="highlight-amount">
                  {ye?.isRefund ? `+${won(ye.refundOrPayback)}` : `-${won(Math.abs(ye?.refundOrPayback ?? 0))}`}
                </div>
                <p className="highlight-desc">
                  기납부세액({won(ye?.prepaidTax ?? 0)})에서 최종 결정세액({won(ye?.determinedTax ?? 0)})을 차감한 정산 금액입니다.
                </p>
              </div>

              {/* 세부 계산 내역 테이블 */}
              <div className="cg-calc-table" style={{ marginTop: 20 }}>
                <div className="calc-row">
                  <span className="calc-label">1. 총급여액</span>
                  <span className="calc-val">{won(ye?.grossSalary ?? 0)}</span>
                </div>
                <div className="calc-row">
                  <span className="calc-label">(-) 근로소득공제</span>
                  <span className="calc-val minus">-{won(ye?.earnedIncomeDeduction ?? 0)}</span>
                </div>
                <div className="calc-row highlight">
                  <span className="calc-label">= 근로소득금액</span>
                  <span className="calc-val">{won(ye?.earnedIncomeAmount ?? 0)}</span>
                </div>
                <div className="calc-row">
                  <span className="calc-label">(-) 소득공제 합계</span>
                  <span className="calc-val minus">-{won(ye?.totalIncomeDeductions ?? 0)}</span>
                </div>
                <div className="calc-row sub">
                  <span className="calc-label">· 인적공제 (기본공제)</span>
                  <span className="calc-val">{won(ye?.basicDeduction ?? 0)}</span>
                </div>
                <div className="calc-row sub">
                  <span className="calc-label">· 4대보험 공제 (국민연금+건보)</span>
                  <span className="calc-val">{won((ye?.pensionInsuranceDeduction ?? 0) + (ye?.healthInsuranceDeduction ?? 0))}</span>
                </div>
                <div className="calc-row sub">
                  <span className="calc-label">· 주택청약종합저축 공제</span>
                  <span className="calc-val">{won(ye?.housingSavingsDeduction ?? 0)}</span>
                </div>
                <div className="calc-row sub">
                  <span className="calc-label">· 신용/체크카드 사용액 공제</span>
                  <span className="calc-val">{won(ye?.cardDeduction ?? 0)}</span>
                </div>
                <div className="calc-row highlight">
                  <span className="calc-label">= 과세표준</span>
                  <span className="calc-val">{won(ye?.taxableBase ?? 0)}</span>
                </div>
                <div className="calc-row">
                  <span className="calc-label">산출세액 (기본 누진세율)</span>
                  <span className="calc-val">{won(ye?.calculatedTax ?? 0)}</span>
                </div>
                <div className="calc-row">
                  <span className="calc-label">(-) 세액공제 합계</span>
                  <span className="calc-val minus">-{won(ye?.totalTaxCredits ?? 0)}</span>
                </div>
                <div className="calc-row sub">
                  <span className="calc-label">· 근로소득 세액공제</span>
                  <span className="calc-val">{won(ye?.wageEarnerTaxCredit ?? 0)}</span>
                </div>
                <div className="calc-row sub">
                  <span className="calc-label">· 연금계좌(연금저축+IRP) 세액공제</span>
                  <span className="calc-val up">{won(ye?.pensionAccountsCredit ?? 0)}</span>
                </div>
                <div className="calc-row sub">
                  <span className="calc-label">· 보장성 보험료 세액공제</span>
                  <span className="calc-val">{won(ye?.insuranceTaxCredit ?? 0)}</span>
                </div>
                <div className="calc-divider"></div>
                <div className="calc-row total">
                  <span className="calc-label">= 최종 결정세액</span>
                  <span className="calc-val total-tax">{won(ye?.determinedTax ?? 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 신규 배당/이자 등록 모달 */}
      {showAddIncomeModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>신규 배당 / 이자 수취 등록</h3>
            <form onSubmit={handleAddIncomeSubmit} className="modal-form">
              <div className="form-group">
                <label>입금 계좌</label>
                <select
                  value={newIncome.accountId}
                  onChange={(e) => setNewIncome({ ...newIncome, accountId: e.target.value })}
                  required
                >
                  <option value="">계좌 선택</option>
                  {accounts?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.institution})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>구분</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="incomeKind"
                      checked={newIncome.kind === "dividend"}
                      onChange={() => setNewIncome({ ...newIncome, kind: "dividend" })}
                    />
                    배당소득
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="incomeKind"
                      checked={newIncome.kind === "interest"}
                      onChange={() => setNewIncome({ ...newIncome, kind: "interest" })}
                    />
                    이자소득
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>세전 금액 (원)</label>
                <input
                  type="number"
                  min={1}
                  value={newIncome.gross}
                  onChange={(e) => setNewIncome({ ...newIncome, gross: Number(e.target.value) })}
                  required
                />
                <span className="field-hint">원천징수 15.4%({won(Math.floor(newIncome.gross * 0.154))})가 자동 계산됩니다.</span>
              </div>

              <div className="form-group">
                <label>수취 일자</label>
                <input
                  type="date"
                  value={newIncome.paidOn}
                  onChange={(e) => setNewIncome({ ...newIncome, paidOn: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddIncomeModal(false)}>
                  취소
                </button>
                <button type="submit" disabled={addIncomeMutation.isPending}>
                  {addIncomeMutation.isPending ? "저장 중…" : "등록 완료"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 국세청 홈택스 간소화 파일 불러오기 모달 */}
      {showHometaxModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>국세청 홈택스 간소화 자료 불러오기</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              홈택스 연말정산 간소화 서비스에서 내려받은 <strong>전자문서(JSON)</strong> 또는 <strong>요약 CSV</strong> 파일을 업로드하세요. 연금저축, IRP, 청약, 보험료, 신용/체크카드 사용액이 연말정산 시뮬레이터에 자동으로 반영됩니다.
            </p>

            <div className="hometax-dropzone">
              <span className="dropzone-icon">📁</span>
              <p className="dropzone-label">홈택스 간소화 파일 선택 (.json, .csv)</p>
              <input
                type="file"
                accept=".json,.csv,.txt"
                onChange={handleHometaxFileChange}
                disabled={parseHometaxMutation.isPending}
              />
              {parseHometaxMutation.isPending && (
                <div className="dropzone-loading">
                  <div className="spinner" style={{ width: 20, height: 20 }}></div>
                  <span>국세청 서식을 분석하고 있습니다…</span>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowHometaxModal(false)}
                disabled={parseHometaxMutation.isPending}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
