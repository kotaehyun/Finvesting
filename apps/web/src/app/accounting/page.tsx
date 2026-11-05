"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

type SourceFilter = "all" | "transaction" | "dividend" | "interest" | "trade" | "payroll";

export default function AccountingPage() {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [sourceType, setSourceType] = useState<SourceFilter>("all");
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [showChartGuide, setShowChartGuide] = useState(false);

  // Journal preview query
  const { data: journal, isLoading, refetch } = trpc.accounting.preview.useQuery({
    year: selectedYear,
    month: selectedMonth,
    sourceType,
  });

  const exportMutation = trpc.accounting.exportFile.useMutation();

  const handleExport = async (format: "douzone" | "wehago" | "semusarang" | "xlsx") => {
    setIsExporting(format);
    try {
      const data = await exportMutation.mutateAsync({
        year: selectedYear,
        month: selectedMonth,
        format,
      });

      let blob: Blob;
      if (data.isBase64) {
        const byteCharacters = atob(data.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: data.mimeType });
      } else {
        blob = new Blob([data.content], { type: data.mimeType });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`전표 내보내기 실패: ${err.message}`);
    } finally {
      setIsExporting(null);
    }
  };

  const months = [
    { value: "all", label: `${selectedYear}년 전체` },
    { value: `${selectedYear}-12`, label: `${selectedYear}-12` },
    { value: `${selectedYear}-11`, label: `${selectedYear}-11` },
    { value: `${selectedYear}-10`, label: `${selectedYear}-10` },
    { value: `${selectedYear}-09`, label: `${selectedYear}-09` },
    { value: `${selectedYear}-08`, label: `${selectedYear}-08` },
    { value: `${selectedYear}-07`, label: `${selectedYear}-07` },
    { value: `${selectedYear}-06`, label: `${selectedYear}-06` },
    { value: `${selectedYear}-05`, label: `${selectedYear}-05` },
    { value: `${selectedYear}-04`, label: `${selectedYear}-04` },
    { value: `${selectedYear}-03`, label: `${selectedYear}-03` },
    { value: `${selectedYear}-02`, label: `${selectedYear}-02` },
    { value: `${selectedYear}-01`, label: `${selectedYear}-01` },
  ];

  return (
    <div className="accounting-terminal">
      {/* 1. Header */}
      <div className="page-head" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🏢</span> 회계 전표 & 세무 프로그램 연동
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            더존 Smart A · 위하고(WEHAGO) · 세무사랑 Pro(K-Lep) 표준 복식부기 분개 원장 생성기
          </p>
        </div>

        <div className="row" style={{ flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{
              padding: "6px 12px",
              background: "#161b22",
              color: "#e6edf3",
              border: "1px solid #30363d",
              borderRadius: 6,
            }}
          >
            <option value={2026}>2026년</option>
            <option value={2025}>2025년</option>
          </select>

          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: "6px 12px",
              background: "#161b22",
              color: "#e6edf3",
              border: "1px solid #30363d",
              borderRadius: 6,
            }}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Source Type Filter */}
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as SourceFilter)}
            style={{
              padding: "6px 12px",
              background: "#161b22",
              color: "#e6edf3",
              border: "1px solid #30363d",
              borderRadius: 6,
            }}
          >
            <option value="all">전체 원장 (통합)</option>
            <option value="transaction">지출·수입 거래만</option>
            <option value="dividend">배당소득만</option>
            <option value="interest">이자소득만</option>
            <option value="trade">주식 매매만</option>
            <option value="payroll">급여대장만</option>
          </select>

          {/* Guide toggle button */}
          <button
            type="button"
            className="secondary"
            onClick={() => setShowChartGuide(!showChartGuide)}
            style={{ padding: "6px 12px", fontSize: 13 }}
          >
            📖 {showChartGuide ? "코드표 닫기" : "표준 계정코드표"}
          </button>
        </div>
      </div>

      {/* 2. Top Export Action Bar */}
      <div
        className="card"
        style={{
          marginBottom: 20,
          background: "linear-gradient(135deg, rgba(31, 111, 235, 0.08), rgba(35, 134, 54, 0.08))",
          borderColor: "#30363d",
          padding: "16px 20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#58a6ff" }}>
              ⚡ 세무대리인 / 회계 프로그램 전표 업로드 원클릭 내보내기
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
              UTF-8 BOM 인코딩 적용으로 엑셀 한글 깨짐 없이 더존·위하고·세무사랑에 즉시 업로드 가능합니다.
            </div>
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="starter"
              onClick={() => handleExport("douzone")}
              disabled={isExporting !== null}
              style={{ padding: "8px 14px", fontSize: 13, background: "#1f6feb", border: "none" }}
            >
              {isExporting === "douzone" ? "생성 중..." : "🏢 더존 Smart A (CSV)"}
            </button>
            <button
              type="button"
              className="starter"
              onClick={() => handleExport("wehago")}
              disabled={isExporting !== null}
              style={{ padding: "8px 14px", fontSize: 13, background: "#8957e5", border: "none" }}
            >
              {isExporting === "wehago" ? "생성 중..." : "🌐 위하고 WEHAGO (CSV)"}
            </button>
            <button
              type="button"
              className="starter"
              onClick={() => handleExport("semusarang")}
              disabled={isExporting !== null}
              style={{ padding: "8px 14px", fontSize: 13, background: "#238636", border: "none" }}
            >
              {isExporting === "semusarang" ? "생성 중..." : "📊 세무사랑 Pro (CSV)"}
            </button>
            <button
              type="button"
              className="starter"
              onClick={() => handleExport("xlsx")}
              disabled={isExporting !== null}
              style={{
                padding: "8px 14px",
                fontSize: 13,
                background: "#d29922",
                color: "#0d1117",
                fontWeight: 600,
                border: "none",
              }}
            >
              {isExporting === "xlsx" ? "생성 중..." : "📑 4개 시트 통합 엑셀 (.xlsx)"}
            </button>
          </div>
        </div>
      </div>

      {/* 3. KPI Barometer Cards */}
      <div className="grid" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="muted" style={{ fontSize: 13 }}>총 전표 및 분개 라인</div>
          <div className="big" style={{ fontSize: 26, margin: "6px 0", color: "#58a6ff" }}>
            {journal ? `${journal.totalVouchers}건` : "0건"}
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            총 {journal?.totalLines ?? 0}개 분개행 생성 완료
          </div>
        </div>

        <div className="card">
          <div className="muted" style={{ fontSize: 13 }}>차변(Debit) 총액</div>
          <div className="big" style={{ fontSize: 26, margin: "6px 0", color: "#79c0ff" }}>
            {journal ? won(journal.debitSum) : "0원"}
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            자산 증가 · 비용 발생 · 부채 감소
          </div>
        </div>

        <div className="card">
          <div className="muted" style={{ fontSize: 13 }}>대변(Credit) 총액</div>
          <div className="big" style={{ fontSize: 26, margin: "6px 0", color: "#56d364" }}>
            {journal ? won(journal.creditSum) : "0원"}
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            자산 감소 · 수익 발생 · 부채 증가
          </div>
        </div>

        <div className="card">
          <div className="muted" style={{ fontSize: 13 }}>대차평형 (Trial Balance)</div>
          <div
            className="big"
            style={{
              fontSize: 24,
              margin: "6px 0",
              color: journal?.isAllBalanced ? "#3fb950" : "#f85149",
            }}
          >
            {journal?.isAllBalanced ? "✅ 차액 0원 (균형)" : `⚠️ 차액 ${won(journal?.difference ?? 0)}`}
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            {journal?.isAllBalanced ? "모든 전표 복식부기 원리 100% 충족" : "일부 전표 대차 불일치 확인 필요"}
          </div>
        </div>
      </div>

      {/* 4. Chart of Accounts Guide (Collapsible) */}
      {showChartGuide && (
        <div
          className="card"
          style={{
            marginBottom: 20,
            background: "#161b22",
            borderColor: "#30363d",
            padding: 16,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: "#f0883e" }}>
            📚 한국 표준 복식부기 주요 계정과목 코드 안내
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, fontSize: 13 }}>
            <div style={{ background: "#0d1117", padding: 12, borderRadius: 6, border: "1px solid #21262d" }}>
              <div style={{ color: "#58a6ff", fontWeight: 600, marginBottom: 6 }}>100번대: 자산</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#8b949e", lineHeight: 1.6 }}>
                <li><code>101</code> 현금</li>
                <li><code>103</code> 보통예금</li>
                <li><code>104</code> 정기예적금</li>
                <li><code>107</code> 유가증권(주식)</li>
                <li><code>136</code> 선납세금(원천징수)</li>
              </ul>
            </div>
            <div style={{ background: "#0d1117", padding: 12, borderRadius: 6, border: "1px solid #21262d" }}>
              <div style={{ color: "#d2a8ff", fontWeight: 600, marginBottom: 6 }}>200번대: 부채</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#8b949e", lineHeight: 1.6 }}>
                <li><code>251</code> 외상매입금</li>
                <li><code>253</code> 미지급금(신용카드)</li>
                <li><code>254</code> 예수금(4대보험/세금)</li>
                <li><code>260</code> 단기차입금(대출)</li>
              </ul>
            </div>
            <div style={{ background: "#0d1117", padding: 12, borderRadius: 6, border: "1px solid #21262d" }}>
              <div style={{ color: "#56d364", fontWeight: 600, marginBottom: 6 }}>400·500·900번대: 수익</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#8b949e", lineHeight: 1.6 }}>
                <li><code>401</code> 매출</li>
                <li><code>501</code> 급여수익(근로소득)</li>
                <li><code>903</code> 이자수익</li>
                <li><code>904</code> 배당금수익</li>
                <li><code>906</code> 유가증권처분이익</li>
              </ul>
            </div>
            <div style={{ background: "#0d1117", padding: 12, borderRadius: 6, border: "1px solid #21262d" }}>
              <div style={{ color: "#ff7b72", fontWeight: 600, marginBottom: 6 }}>800·900번대: 비용</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#8b949e", lineHeight: 1.6 }}>
                <li><code>811</code> 복리후생비 (식대/외식)</li>
                <li><code>812</code> 여비교통비 (대중교통/주유)</li>
                <li><code>813</code> 통신비</li>
                <li><code>814</code> 수도광열비 (공과금/관리비)</li>
                <li><code>816</code> 지급임차료 (월세)</li>
                <li><code>819</code> 보험료 / <code>931</code> 이자비용</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 5. Journal Entries Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #30363d",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 16 }}>
            📋 복식부기 분개장 상세 내역 ({journal?.entries.length ?? 0}개 전표)
          </div>
          <button
            type="button"
            className="secondary"
            onClick={() => refetch()}
            style={{ padding: "4px 10px", fontSize: 12 }}
          >
            🔄 새로고침
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center" }} className="muted">
            원장 데이터를 집계하고 복식부기 분개를 구성하는 중입니다...
          </div>
        ) : !journal || journal.entries.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }} className="muted">
            해당 기간에 등록된 거래, 배당, 매매 또는 급여 내역이 없습니다.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#161b22", borderBottom: "1px solid #30363d", color: "#8b949e" }}>
                  <th style={{ padding: "10px 16px", width: 90 }}>일자</th>
                  <th style={{ padding: "10px 12px", width: 70 }}>전표#</th>
                  <th style={{ padding: "10px 12px", width: 60 }}>구분</th>
                  <th style={{ padding: "10px 12px", width: 80 }}>계정코드</th>
                  <th style={{ padding: "10px 16px" }}>계정과목명</th>
                  <th style={{ padding: "10px 16px" }}>거래처</th>
                  <th style={{ padding: "10px 16px", textAlign: "right", width: 130 }}>차변금액 (Debit)</th>
                  <th style={{ padding: "10px 16px", textAlign: "right", width: 130 }}>대변금액 (Credit)</th>
                  <th style={{ padding: "10px 16px" }}>적요 (Memo)</th>
                </tr>
              </thead>
              <tbody>
                {journal.entries.map((group) => (
                  <tr
                    key={`group-${group.voucherNo}`}
                    style={{
                      borderBottom: "1px solid #21262d",
                    }}
                  >
                    <td colSpan={9} style={{ padding: 0 }}>
                      <div
                        style={{
                          background: "rgba(22, 27, 34, 0.4)",
                          borderBottom: "1px solid rgba(48, 54, 61, 0.5)",
                          padding: "6px 16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: 12,
                          color: "#8b949e",
                        }}
                      >
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <span style={{ fontWeight: 600, color: "#e6edf3" }}>전표 #{group.voucherNo}</span>
                          <span>일자: {group.date}</span>
                          <span
                            style={{
                              padding: "1px 6px",
                              borderRadius: 4,
                              background:
                                group.sourceType === "transaction"
                                  ? "#1f6feb22"
                                  : group.sourceType === "payroll"
                                  ? "#d2992222"
                                  : group.sourceType === "trade"
                                  ? "#8957e522"
                                  : "#23863622",
                              color:
                                group.sourceType === "transaction"
                                  ? "#58a6ff"
                                  : group.sourceType === "payroll"
                                  ? "#d29922"
                                  : group.sourceType === "trade"
                                  ? "#bc8cff"
                                  : "#3fb950",
                            }}
                          >
                            {group.sourceType === "transaction"
                              ? "일반거래"
                              : group.sourceType === "payroll"
                              ? "급여대장"
                              : group.sourceType === "trade"
                              ? "주식체결"
                              : "배당/이자"}
                          </span>
                        </div>
                        <div>
                          대차합: <span style={{ color: "#79c0ff" }}>{won(group.debitTotal)}</span> /{" "}
                          <span style={{ color: "#56d364" }}>{won(group.creditTotal)}</span>{" "}
                          {group.isBalanced ? "✅" : "⚠️ 불일치"}
                        </div>
                      </div>

                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <tbody>
                          {group.lines.map((line) => {
                            const isDebit = line.side === "debit";
                            return (
                              <tr
                                key={`line-${group.voucherNo}-${line.lineNo}`}
                                style={{
                                  borderBottom: "1px solid #161b22",
                                }}
                              >
                                <td style={{ padding: "8px 16px", width: 90, color: "#8b949e" }}>{line.date}</td>
                                <td style={{ padding: "8px 12px", width: 70, color: "#8b949e" }}>#{line.voucherNo}</td>
                                <td style={{ padding: "8px 12px", width: 60 }}>
                                  <span
                                    style={{
                                      display: "inline-block",
                                      padding: "1px 6px",
                                      borderRadius: 4,
                                      fontSize: 11,
                                      fontWeight: 600,
                                      background: isDebit ? "#1f6feb22" : "#23863622",
                                      color: isDebit ? "#58a6ff" : "#3fb950",
                                      border: isDebit ? "1px solid #1f6feb44" : "1px solid #23863644",
                                    }}
                                  >
                                    {isDebit ? "차변 3" : "대변 4"}
                                  </span>
                                </td>
                                <td style={{ padding: "8px 12px", width: 80, fontFamily: "monospace", color: "#d2a8ff" }}>
                                  {line.accountCode}
                                </td>
                                <td style={{ padding: "8px 16px", fontWeight: 500 }}>{line.accountName}</td>
                                <td style={{ padding: "8px 16px", color: "#8b949e" }}>{line.counterparty || "-"}</td>
                                <td
                                  style={{
                                    padding: "8px 16px",
                                    textAlign: "right",
                                    width: 130,
                                    fontWeight: isDebit ? 600 : 400,
                                    color: isDebit ? "#79c0ff" : "#8b949e",
                                  }}
                                >
                                  {isDebit ? won(line.amount) : "-"}
                                </td>
                                <td
                                  style={{
                                    padding: "8px 16px",
                                    textAlign: "right",
                                    width: 130,
                                    fontWeight: !isDebit ? 600 : 400,
                                    color: !isDebit ? "#56d364" : "#8b949e",
                                  }}
                                >
                                  {!isDebit ? won(line.amount) : "-"}
                                </td>
                                <td style={{ padding: "8px 16px", color: "#8b949e" }}>{line.memo}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
