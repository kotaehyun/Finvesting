"use client";

import { useState, useMemo } from "react";
import { pnlTone, signedWon } from "@finvesting/core";
import { trpc } from "@/lib/trpc";
import { useUiMode } from "@/lib/ui-mode";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
/** 차감 행: 0이면 부호 없음, 아니면 -금액. */
const deductWon = (n: number) => signedWon(-(n || 0));

type TaxTab = "capital_gains" | "financial_income" | "year_end";

function kstToday(): string {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 10);
}

function kstYear(): number {
  return Number(kstToday().slice(0, 4));
}

export default function TaxPage() {
  const mode = useUiMode();
  const personal = mode === "personal";
  const yearChoices = useMemo(() => {
    const y = kstYear();
    return [y, y - 1];
  }, []);
  const [selectedYear, setSelectedYear] = useState<number>(() => kstYear());
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
          `홈택스 간소화 자료(${parsed.userName ? `${parsed.userName}님, ` : ""}${parsed.rawCount}건) 반영. 연금저축 ${won(parsed.pensionSavingsContribution)} · IRP ${won(parsed.irpContribution)} · 청약 ${won(parsed.housingSubscriptionDeposit)} · 보험 ${won(parsed.insurancePremiumPaid)} · 카드 ${won(parsed.creditCardSpent + parsed.debitCardCashSpent)}`
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
  const [newIncome, setNewIncome] = useState<{
    accountId: string;
    kind: "dividend" | "interest";
    gross: number | "";
    paidOn: string;
  }>({
    accountId: "",
    kind: "dividend",
    gross: "",
    paidOn: kstToday(),
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
    const gross = typeof newIncome.gross === "number" ? newIncome.gross : Number(newIncome.gross);
    if (!Number.isFinite(gross) || gross <= 0) {
      alert("세전 금액을 입력해주세요.");
      return;
    }
    addIncomeMutation.mutate({
      accountId: newIncome.accountId,
      kind: newIncome.kind,
      gross,
      paidOn: newIncome.paidOn,
    });
  };

  const handleYeInputChange = (key: keyof typeof yeInputs, value: number) => {
    setIsYeCustomized(true);
    setYeInputs((prev) => ({ ...prev, [key]: value }));
  };

  const cg = summary?.capitalGainsTax;
  const fi = summary?.financialIncome;
  const ye = yeSimulation || summary?.yearEndSettlement;
  const harvesting = summary?.taxLossHarvesting;

  const tabLabel =
    activeTab === "capital_gains" ? "해외주식 팔아서 낸 세금"
    : activeTab === "financial_income" ? "배당·이자 소득"
    : "월급 연말정산";

  const pathLabel = [`${selectedYear}년`, tabLabel].join(" · ");

  const plainLead =
    activeTab === "capital_gains"
      ? "한눈에: 해외주식을 팔아서 번 돈에서 세금이 얼마나 나오는지 봅니다."
      : activeTab === "financial_income"
        ? "한눈에: 올해 받은 배당·이자가 2천만원 한도에 얼마나 찼는지 봅니다."
        : "한눈에: 월급에서 떼인 세금과 공제를 맞춰 돌려받을(더 낼) 돈을 봅니다.";

  const yeSigned = ye ? (ye.isRefund ? ye.refundOrPayback : -Math.abs(ye.refundOrPayback)) : 0;
  const yeTone = ye ? pnlTone(yeSigned) : "flat";
  const yeKicker = yeTone === "up" ? "돌려받을 돈" : yeTone === "down" ? "더 낼 돈" : "연말정산";
  const yeAmount = ye ? won(Math.abs(ye.refundOrPayback)) : "—";
  const yeLabel = ye ? signedWon(yeSigned) : "—";

  return (
    <div className={personal ? "card-page tax-personal" : "erp wehago"}>
      {personal ? (
        <div className="card-page-head">
          <div>
            <h1>세금 · 연말정산</h1>
            <p className="lead">{plainLead}</p>
            <p className="muted" style={{ margin: "4px 0 0" }}>{selectedYear}년 · 숫자만 보여 줍니다. 세무 상담이 아닙니다.</p>
          </div>
        </div>
      ) : (
        <div className="erp-titlebar">
          <h1>
            <span className="wehago-mark" aria-hidden>세금</span>
            세금 · 연말정산
            <span className="path">{pathLabel}</span>
          </h1>
          <div className="wehago-title-meta">
            <a href="/accounting">회계전표</a>
            <a href="/statements">재무제표</a>
            <a href="/fundamentals">기업 숫자</a>
          </div>
        </div>
      )}

      <div className={personal ? "card-toolbar" : "erp-toolbar"}>
        {personal ? (
          <div className="year-seg" role="group" aria-label="연도">
            {yearChoices.map((y) => (
              <button
                key={y}
                type="button"
                className={selectedYear === y ? "on" : ""}
                aria-pressed={selectedYear === y}
                onClick={() => setSelectedYear(y)}
              >
                {y}년
              </button>
            ))}
          </div>
        ) : (
          yearChoices.map((y) => (
            <button
              key={y}
              type="button"
              className={selectedYear === y ? "primary" : ""}
              onClick={() => setSelectedYear(y)}
            >
              {y}년
            </button>
          ))
        )}
        {!personal && <span className="sep" />}
        <button type="button" className={personal ? "ghost" : "primary"} onClick={handleExportXlsx} disabled={isExporting || summaryLoading}>
          {isExporting ? "엑셀 생성 중…" : "연말정산 엑셀 받기"}
        </button>
        <button type="button" className={personal ? "ghost" : ""} onClick={() => setShowHometaxModal(true)}>홈택스 자료 불러오기</button>
        {!personal && <a href="/accounting" className="erp-toolbar-link">돈 기록(전표)</a>}
        {!personal && (
          <span className="erp-hint" style={{ margin: "0 0 0 auto" }}>
            숫자만 보여 줍니다. 세무 상담이 아닙니다.
          </span>
        )}
      </div>

      {summaryLoading && <p className={personal ? "muted" : "erp-hint"} style={{ padding: personal ? 0 : "8px 12px" }}>불러오는 중…</p>}

      {hometaxNotice && (
        <p className={personal ? "card-panel" : "erp-caution"} style={{ margin: personal ? 0 : 8 }}>
          {hometaxNotice}
          <button type="button" style={{ marginLeft: 8 }} onClick={() => setHometaxNotice(null)}>닫기</button>
        </p>
      )}

      {!summaryLoading && (
        <div className={personal ? "tax-personal-body" : "erp-body statements-erp-body"}>
          {personal ? (
            <div className="card-page-tabs" role="tablist" aria-label="세금 구분">
              <button type="button" className={activeTab === "capital_gains" ? "on" : ""} aria-pressed={activeTab === "capital_gains"} title="해외주식을 팔아서 낸 세금" onClick={() => setActiveTab("capital_gains")}>
                해외주식
              </button>
              <button type="button" className={activeTab === "financial_income" ? "on" : ""} aria-pressed={activeTab === "financial_income"} title="배당·이자 소득" onClick={() => setActiveTab("financial_income")}>
                배당·이자
              </button>
              <button type="button" className={activeTab === "year_end" ? "on" : ""} aria-pressed={activeTab === "year_end"} title="월급 연말정산" onClick={() => setActiveTab("year_end")}>
                연말정산
              </button>
            </div>
          ) : (
            <nav className="tax-tabs" aria-label="세금 메뉴">
              <button type="button" className={activeTab === "capital_gains" ? "on" : ""} aria-pressed={activeTab === "capital_gains"} onClick={() => setActiveTab("capital_gains")}>
                해외주식
              </button>
              <button type="button" className={activeTab === "financial_income" ? "on" : ""} aria-pressed={activeTab === "financial_income"} onClick={() => setActiveTab("financial_income")}>
                배당·이자
              </button>
              <button type="button" className={activeTab === "year_end" ? "on" : ""} aria-pressed={activeTab === "year_end"} onClick={() => setActiveTab("year_end")}>
                연말정산
              </button>
            </nav>
          )}

          <div className={personal ? "tax-personal-work" : "erp-work"}>
            {!personal && <p className="erp-plain-lead">{plainLead}</p>}
            <div className={personal ? "card-kpi-grid" : "wehago-kpis fund-compact-kpi"}>
              <div className={personal ? "card-kpi" : "wehago-kpi"}>
                <span className="k">내야 할 양도세</span>
                <span className="v">{won(cg?.totalEstimatedTax ?? 0)}</span>
              </div>
              <div className={personal ? "card-kpi" : "wehago-kpi"}>
                <span className="k">올해 배당·이자 합</span>
                <span className="v">{won(fi?.totalGross ?? 0)}</span>
              </div>
              <div className={personal ? "card-kpi" : "wehago-kpi"}>
                <span className="k">{personal ? yeKicker : "연말정산 예상"}</span>
                <span className={`v ${personal ? yeTone : ""}`}>{personal ? yeAmount : yeLabel}</span>
              </div>
              <div className={personal ? "card-kpi" : "wehago-kpi"}>
                <span className="k">{personal ? "배당·이자 2천만원 한도" : "2천만원 한도 사용률"}</span>
                <span className="v">{pct(fi?.utilizationRate ?? 0)}</span>
              </div>
            </div>

            <div className="tax-layout">
              <div className={personal ? "tax-stack" : "erp-panel tax-erp-panel"} style={personal ? undefined : { padding: "8px 12px" }}>
                {activeTab === "capital_gains" && (
                  <div className="tax-erp-stack">
                    <div className="statements-erp-grids">
                      <section className="wehago-widget">
                        <h3>{selectedYear}년 양도세 계산</h3>
                        <p className="erp-hint" style={{ margin: "0 10px 6px" }}>팔아서 번 돈에서 공제를 뺀 뒤 세금을 계산합니다.</p>
                        <table className="erp-props">
                          <tbody>
                            <tr><th>판 금액</th><td className="ro num">{won(cg?.totalProceeds ?? 0)}</td></tr>
                            <tr><th>(-) 산 가격</th><td className="ro num">{deductWon(cg?.totalCost ?? 0)}</td></tr>
                            <tr><th>(-) 수수료</th><td className="ro num">{deductWon(cg?.totalFees ?? 0)}</td></tr>
                            <tr><th>실제로 번 돈</th><td className="ro num">{won(cg?.netRealizedGain ?? 0)}</td></tr>
                            <tr><th>(-) 기본공제(250만)</th><td className="ro num">{deductWon(cg?.appliedDeduction ?? 0)}</td></tr>
                            <tr><th>세금 매기는 금액</th><td className="ro num">{won(cg?.taxableBase ?? 0)}</td></tr>
                            <tr><th>국세 20%</th><td className="ro num">{won(cg?.nationalTax ?? 0)}</td></tr>
                            <tr><th>지방세 2%</th><td className="ro num">{won(cg?.localTax ?? 0)}</td></tr>
                            <tr><th>내야 할 세금(22%)</th><td className="ro num"><strong>{won(cg?.totalEstimatedTax ?? 0)}</strong></td></tr>
                          </tbody>
                        </table>
                        <p className="erp-hint" style={{ margin: "6px 10px 8px" }}>이듬해 5월 홈택스에서 확정신고합니다.</p>
                      </section>

                      <section className="wehago-widget">
                        <h3>기본공제 250만원</h3>
                        <div className="body" style={{ padding: "8px 10px 10px" }}>
                          {harvesting && harvesting.excessGainOverDeduction > 0 ? (
                            <>
                              <p className="erp-hint">
                                기본공제 250만원을 {won(harvesting.excessGainOverDeduction)} 넘겼습니다. 미실현 손실이 있으면 한도에 반영될 수 있는 금액은 최대 {won(harvesting.estimatedTaxSaved)}입니다.
                              </p>
                              {harvesting.lossHoldings.length > 0 ? (
                                <table className="erp-grid">
                                  <thead>
                                    <tr>
                                      <th>종목</th>
                                      <th className="num">수량</th>
                                      <th className="num">평가손실</th>
                                      <th className="num">권장 확정</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {harvesting.lossHoldings.map((lh) => (
                                      <tr key={lh.symbol}>
                                        <td className="ro"><strong>{lh.name}</strong> <span className="erp-hint" style={{ display: "inline", margin: 0 }}>({lh.symbol})</span></td>
                                        <td className="ro num">{lh.quantity}주</td>
                                        <td className="ro num down">-{won(lh.unrealizedLoss)}</td>
                                        <td className="ro num">-{won(lh.harvestableLoss)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="erp-hint">아직 팔지 않은 손실 종목이 없습니다.</p>
                              )}
                            </>
                          ) : (
                            <p className="erp-hint">
                              기본공제(250만원) 안입니다. 남은 한도 {won(Math.max(0, 2_500_000 - (cg?.netRealizedGain ?? 0)))}.
                            </p>
                          )}
                        </div>
                      </section>
                    </div>

                    <section className="wehago-widget" style={{ marginTop: 10 }}>
                      <h3>{selectedYear}년 해외주식 판 기록 · {cgData?.realizedTrades.length ?? 0}건</h3>
                      {cgLoading && <p className="erp-hint" style={{ padding: 10 }}>불러오는 중…</p>}
                      {!cgLoading && cgData && cgData.realizedTrades.length > 0 ? (
                        <div className="table-wrap" style={{ padding: 8 }}>
                          <table className="erp-grid">
                            <thead>
                              <tr>
                                <th>체결일</th>
                                <th>종목</th>
                                <th className="num">수량</th>
                                <th className="num">매도가</th>
                                <th className="num">매수가</th>
                                <th className="num">수수료</th>
                                <th className="num">실현손익</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cgData.realizedTrades.map((t) => {
                                const gain = t.quantity * t.sellPrice - t.quantity * t.buyPrice - t.feeAndTax;
                                return (
                                  <tr key={t.id}>
                                    <td className="ro">{t.tradedAt.slice(0, 10)}</td>
                                    <td className="ro"><strong>{t.name}</strong> ({t.symbol})</td>
                                    <td className="ro num">{t.quantity}주</td>
                                    <td className="ro num">{won(t.sellPrice)}</td>
                                    <td className="ro num">{won(t.buyPrice)}</td>
                                    <td className="ro num">{won(t.feeAndTax)}</td>
                                    <td className={`ro num ${pnlTone(gain)}`}>{signedWon(gain)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        !cgLoading && <p className="erp-hint" style={{ padding: 10 }}>{selectedYear}년에 해외주식을 판 기록이 없습니다.</p>
                      )}
                    </section>
                  </div>
                )}

                {activeTab === "financial_income" && (
                  <div className="tax-erp-stack">
                    <div className="statements-erp-grids">
                      <section className="wehago-widget">
                        <h3>배당·이자 2천만원 한도</h3>
                        <p className="erp-hint" style={{ margin: "0 10px 6px" }}>배당과 이자를 합쳐 연 2천만원까지는 따로 세금 내는 구간입니다.</p>
                        <table className="erp-props">
                          <tbody>
                            <tr><th>올해 합(세금 전)</th><td className="ro num">{won(fi?.totalGross ?? 0)}</td></tr>
                            <tr><th>한도</th><td className="ro num">20,000,000원</td></tr>
                            <tr><th>쓴 비율</th><td className="ro num">{pct(fi?.utilizationRate ?? 0)}</td></tr>
                            <tr><th>남은 한도</th><td className="ro num">{won(fi?.remainingLimit ?? 0)}</td></tr>
                            <tr><th>배당</th><td className="ro num">{won(fi?.dividendGross ?? 0)}</td></tr>
                            <tr><th>이자</th><td className="ro num">{won(fi?.interestGross ?? 0)}</td></tr>
                            <tr><th>미리 낸 세금</th><td className="ro num">{won(fi?.totalWithheldTax ?? 0)}</td></tr>
                            <tr><th>실제로 받은 돈</th><td className="ro num">{won(fi?.netReceived ?? 0)}</td></tr>
                            <tr>
                              <th>상태</th>
                              <td className="ro">
                                {fi?.status === "safe" ? "한도 안(분리과세)" : fi?.status === "caution" ? "한도 75% 넘김" : "한도 초과(종합과세)"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div className="fund-range-wrap" style={{ margin: "8px 10px 10px" }}>
                          <div className="fund-range-bar" aria-label={`한도 소진 ${pct(fi?.utilizationRate ?? 0)}`}>
                            <div className="fund-range-fill" style={{ width: `${Math.min(100, (fi?.utilizationRate ?? 0) * 100)}%` }} />
                          </div>
                        </div>
                        <p className="erp-hint" style={{ margin: "0 10px 8px" }}>
                          2천만원을 넘기면 다른 소득과 합쳐 세금이 붙을 수 있습니다. 건강보험 피부양자에도 영향이 있을 수 있습니다.
                        </p>
                      </section>

                      <section className="wehago-widget">
                        <h3>
                          {selectedYear}년 받은 내역
                          <button type="button" className="link" style={{ marginLeft: 8, fontSize: 12 }} onClick={() => setShowAddIncomeModal(true)}>
                            + 입력
                          </button>
                        </h3>
                        {fiLoading && <p className="erp-hint" style={{ padding: 10 }}>불러오는 중…</p>}
                        {!fiLoading && fiData && fiData.items.length > 0 ? (
                          <div className="table-wrap" style={{ padding: 8 }}>
                            <table className="erp-grid">
                              <thead>
                                <tr>
                                  <th>일자</th>
                                  <th>구분</th>
                                  <th>종목</th>
                                  <th>계좌</th>
                                  <th className="num">세전</th>
                                  <th className="num">원천징수</th>
                                  <th className="num">실수령</th>
                                </tr>
                              </thead>
                              <tbody>
                                {fiData.items.map((item) => (
                                  <tr key={item.id}>
                                    <td className="ro">{item.paidOn}</td>
                                    <td className="ro">{item.kind === "dividend" ? "배당" : "이자"}</td>
                                    <td className="ro">
                                      <strong>{item.name}</strong>
                                      {item.symbol !== "-" ? ` (${item.symbol})` : ""}
                                    </td>
                                    <td className="ro">{item.accountName}</td>
                                    <td className="ro num">{won(item.gross)}</td>
                                    <td className="ro num down">-{won(item.withheldTax)}</td>
                                    <td className="ro num up">{won(item.net)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          !fiLoading && <p className="erp-hint" style={{ padding: 10 }}>등록된 배당·이자가 없습니다.</p>
                        )}
                      </section>
                    </div>
                  </div>
                )}

                {activeTab === "year_end" && (
                  <div className="statements-erp-grids">
                    <section className="wehago-widget">
                      <h3>
                        공제 금액 바꿔 보기
                        <button
                          type="button"
                          className="link"
                          style={{ marginLeft: 8, fontSize: 12 }}
                          onClick={() => setIsYeCustomized(false)}
                        >
                          기본값 복원
                        </button>
                      </h3>
                      <p className="erp-hint" style={{ margin: "0 10px 6px" }}>숫자를 바꾸면 돌려받을 돈·더 낼 돈이 바로 다시 계산됩니다.</p>
                      <table className="erp-props ye-erp-form">
                        <tbody>
                          {([
                            ["grossSalary", "연간 총급여", 1_000_000],
                            ["prepaidTax", "기납부세액", 100_000],
                            ["prepaidInsurance", "4대보험 납부액", 100_000],
                            ["pensionSavingsContribution", "연금저축", 500_000],
                            ["irpContribution", "IRP", 500_000],
                            ["housingSubscriptionDeposit", "주택청약저축", 200_000],
                            ["insurancePremiumPaid", "보장성 보험료", 100_000],
                            ["creditCardSpent", "신용카드 사용액", 1_000_000],
                            ["debitCardCashSpent", "체크/현금영수증", 1_000_000],
                            ["dependentsCount", "부양가족 수(본인 제외)", 1],
                          ] as const).map(([key, label, step]) => (
                            <tr key={key}>
                              <th>{label}</th>
                              <td>
                                <input
                                  type="number"
                                  step={step}
                                  value={effectiveYeInput[key]}
                                  onChange={(e) => handleYeInputChange(key, Number(e.target.value))}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>

                    <section className="wehago-widget">
                      <h3>{selectedYear}년 연말정산 결과</h3>
                      <p className="erp-hint" style={{ margin: "0 10px 6px" }}>미리 낸 세금과 최종 세금을 맞춰 돌려받을(더 낼) 돈입니다.</p>
                      <table className="erp-props">
                        <tbody>
                          <tr>
                            <th>{ye ? yeKicker : "연말정산"}</th>
                            <td className={`ro num ${yeTone}`}>
                              <strong>{yeLabel}</strong>
                            </td>
                          </tr>
                          <tr><th>총급여</th><td className="ro num">{won(ye?.grossSalary ?? 0)}</td></tr>
                          <tr><th>(-) 근로소득공제</th><td className="ro num">-{won(ye?.earnedIncomeDeduction ?? 0)}</td></tr>
                          <tr><th>근로소득금액</th><td className="ro num">{won(ye?.earnedIncomeAmount ?? 0)}</td></tr>
                          <tr><th>(-) 소득공제 합계</th><td className="ro num">-{won(ye?.totalIncomeDeductions ?? 0)}</td></tr>
                          <tr><th>· 인적공제</th><td className="ro num">{won(ye?.basicDeduction ?? 0)}</td></tr>
                          <tr><th>· 4대보험</th><td className="ro num">{won((ye?.pensionInsuranceDeduction ?? 0) + (ye?.healthInsuranceDeduction ?? 0))}</td></tr>
                          <tr><th>· 주택청약</th><td className="ro num">{won(ye?.housingSavingsDeduction ?? 0)}</td></tr>
                          <tr><th>· 카드 공제</th><td className="ro num">{won(ye?.cardDeduction ?? 0)}</td></tr>
                          <tr><th>세금 매기는 금액</th><td className="ro num">{won(ye?.taxableBase ?? 0)}</td></tr>
                          <tr><th>계산된 세금</th><td className="ro num">{won(ye?.calculatedTax ?? 0)}</td></tr>
                          <tr><th>(-) 세액공제</th><td className="ro num">-{won(ye?.totalTaxCredits ?? 0)}</td></tr>
                          <tr><th>· 근로소득 세액공제</th><td className="ro num">{won(ye?.wageEarnerTaxCredit ?? 0)}</td></tr>
                          <tr><th>· 연금계좌</th><td className="ro num">{won(ye?.pensionAccountsCredit ?? 0)}</td></tr>
                          <tr><th>· 보험료</th><td className="ro num">{won(ye?.insuranceTaxCredit ?? 0)}</td></tr>
                          <tr><th>최종 세금</th><td className="ro num"><strong>{won(ye?.determinedTax ?? 0)}</strong></td></tr>
                          <tr><th>미리 낸 세금</th><td className="ro num">{won(ye?.prepaidTax ?? 0)}</td></tr>
                        </tbody>
                      </table>
                    </section>
                  </div>
                )}
              </div>

              {!personal && (
              <aside className="statements-erp-side" aria-label="세금 요약">
                <div className="statements-side-card tax-side">
                  <h3>올해 요약 · {selectedYear}</h3>
                  <div className="body">
                    <table className="erp-props">
                      <tbody>
                        <tr><th>팔아 번 돈</th><td className="ro num">{won(cg?.netRealizedGain ?? 0)}</td></tr>
                        <tr><th>양도세</th><td className="ro num">{won(cg?.totalEstimatedTax ?? 0)}</td></tr>
                        <tr><th>배당·이자</th><td className="ro num">{won(fi?.totalGross ?? 0)}</td></tr>
                        <tr><th>한도 남은 돈</th><td className="ro num">{won(fi?.remainingLimit ?? 0)}</td></tr>
                        <tr><th>연말정산</th><td className={`ro num ${yeTone}`}>{yeLabel}</td></tr>
                        <tr><th>최종 세금</th><td className="ro num">{won(ye?.determinedTax ?? 0)}</td></tr>
                      </tbody>
                    </table>
                    <div className="erp-slip">
                      <a href="/accounting">돈 기록(전표)</a>
                      <a href="/profile">프로필대장</a>
                    </div>
                  </div>
                </div>
              </aside>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddIncomeModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>배당 / 이자 수취 등록</h3>
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
                  value={newIncome.gross === "" ? "" : newIncome.gross}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNewIncome({ ...newIncome, gross: v === "" ? "" : Number(v) });
                  }}
                  required
                />
                <span className="field-hint">
                  {typeof newIncome.gross === "number" && newIncome.gross > 0
                    ? `원천징수 15.4%(${won(Math.floor(newIncome.gross * 0.154))}) 자동 계산`
                    : "금액을 입력하면 원천징수 15.4%를 계산합니다"}
                </span>
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
                <button type="button" className="btn-secondary" onClick={() => setShowAddIncomeModal(false)}>취소</button>
                <button type="submit" disabled={addIncomeMutation.isPending}>
                  {addIncomeMutation.isPending ? "저장 중…" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHometaxModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>홈택스 간소화 자료 불러오기</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              홈택스에서 내려받은 전자문서(JSON) 또는 요약 CSV를 올리면 연금저축·IRP·청약·보험·카드 사용액이 시뮬레이터에 반영됩니다.
            </p>
            <div className="hometax-dropzone">
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
                  <span>서식 분석 중…</span>
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
