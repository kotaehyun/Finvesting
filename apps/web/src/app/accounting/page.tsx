"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

type SourceFilter = "all" | "transaction" | "dividend" | "interest" | "trade" | "payroll";

const SOURCE_LABELS: Record<SourceFilter, string> = {
  all: "전부",
  transaction: "생활비·수입",
  dividend: "배당",
  interest: "이자",
  trade: "주식 사고팔기",
  payroll: "월급",
};

const SOURCE_MENU: SourceFilter[] = ["all", "transaction", "dividend", "interest", "trade", "payroll"];

function kstYear(): number {
  return Number(new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 4));
}

export default function AccountingPage() {
  const yearChoices = useMemo(() => {
    const y = kstYear();
    return [y, y - 1];
  }, []);
  const [selectedYear, setSelectedYear] = useState<number>(() => kstYear());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [sourceType, setSourceType] = useState<SourceFilter>("all");
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [showChartGuide, setShowChartGuide] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<number | null>(null);

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`전표 내보내기 실패: ${message}`);
    } finally {
      setIsExporting(null);
    }
  };

  const months = useMemo(
    () => [
      { value: "all", label: `${selectedYear}년 전체` },
      ...Array.from({ length: 12 }, (_, i) => {
        const m = 12 - i;
        const value = `${selectedYear}-${String(m).padStart(2, "0")}`;
        return { value, label: value };
      }),
    ],
    [selectedYear],
  );

  const selectedEntry = useMemo(() => {
    if (!journal?.entries.length) return null;
    if (selectedVoucher != null) {
      const hit = journal.entries.find((e) => e.voucherNo === selectedVoucher);
      if (hit) return hit;
    }
    return journal.entries[0] ?? null;
  }, [journal, selectedVoucher]);

  const pathLabel = [
    `${selectedYear}년`,
    selectedMonth === "all" ? "전체월" : selectedMonth,
    SOURCE_LABELS[sourceType],
  ].join(" · ");

  return (
    <div className="erp wehago">
      <div className="erp-titlebar">
        <h1>
          <span className="wehago-mark" aria-hidden>전표</span>
          내 돈 들·날 기록 (회계전표)
          <span className="path">{pathLabel}</span>
        </h1>
        <div className="wehago-title-meta">
          <a href="/tax">세금/연말정산</a>
          <a href="/statements">재무제표</a>
          <a href="/fundamentals">기업 숫자</a>
        </div>
      </div>

      <div className="erp-toolbar">
        {yearChoices.map((y) => (
          <button
            key={y}
            type="button"
            className={selectedYear === y ? "primary" : ""}
            onClick={() => {
              setSelectedYear(y);
              setSelectedMonth("all");
              setSelectedVoucher(null);
            }}
          >
            {y}년
          </button>
        ))}
        <span className="sep" />
        <label>
          월
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSelectedVoucher(null);
            }}
            aria-label="전표 월"
            style={{ width: 140, marginLeft: 6 }}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </label>
        <span className="sep" />
        <button type="button" className={showChartGuide ? "primary" : ""} onClick={() => setShowChartGuide((v) => !v)}>
          계정 이름표
        </button>
        <button type="button" onClick={() => refetch()}>새로고침</button>
        <span className="sep" />
        <span className="erp-hint" style={{ margin: 0 }}>세무사 프로그램으로 보내기</span>
        <button type="button" className="primary" disabled={isExporting !== null} onClick={() => handleExport("douzone")}>
          {isExporting === "douzone" ? "생성 중…" : "더존"}
        </button>
        <button type="button" disabled={isExporting !== null} onClick={() => handleExport("wehago")}>
          {isExporting === "wehago" ? "생성 중…" : "위하고"}
        </button>
        <button type="button" disabled={isExporting !== null} onClick={() => handleExport("semusarang")}>
          {isExporting === "semusarang" ? "생성 중…" : "세무사랑"}
        </button>
        <button type="button" disabled={isExporting !== null} onClick={() => handleExport("xlsx")}>
          {isExporting === "xlsx" ? "생성 중…" : "엑셀 묶음"}
        </button>
      </div>

      <div className="erp-body statements-erp-body">
        <nav className="erp-menu statements-menu" aria-label="돈 기록 종류">
          <h2>어떤 돈?</h2>
          <div className="statements-tree">
            {SOURCE_MENU.map((id) => (
              <button
                key={id}
                type="button"
                className={`lv3${sourceType === id ? " on" : ""}`}
                onClick={() => {
                  setSourceType(id);
                  setSelectedVoucher(null);
                }}
              >
                {SOURCE_LABELS[id]}
              </button>
            ))}
          </div>
        </nav>

        <div className="erp-work">
          <p className="erp-plain-lead">한눈에: 들어온 돈과 나간 돈을 같은 날짜·같은 금액으로 맞춰 둔 기록입니다.</p>
          <div className="wehago-kpis fund-compact-kpi">
            <div className="wehago-kpi">
              <span className="k">기록 건수</span>
              <span className="v">{journal ? `${journal.totalVouchers}건` : "—"}</span>
            </div>
            <div className="wehago-kpi">
              <span className="k">들어온 쪽(차변)</span>
              <span className="v">{journal ? won(journal.debitSum) : "—"}</span>
            </div>
            <div className="wehago-kpi">
              <span className="k">나간 쪽(대변)</span>
              <span className="v">{journal ? won(journal.creditSum) : "—"}</span>
            </div>
            <div className="wehago-kpi">
              <span className="k">맞춰짐 여부</span>
              <span className="v">
                {journal == null ? "—" : journal.isAllBalanced ? "맞음" : won(journal.difference)}
              </span>
            </div>
          </div>

          {showChartGuide && (
            <div className="erp-panel" style={{ paddingBottom: 0 }}>
              <div className="statements-erp-grids">
                <AccountGuide title="100 자산" items={[["101", "현금"], ["103", "보통예금"], ["104", "정기예적금"], ["107", "유가증권"], ["136", "선납세금"]]} />
                <AccountGuide title="200 부채" items={[["251", "외상매입금"], ["253", "미지급금"], ["254", "예수금"], ["260", "단기차입금"]]} />
                <AccountGuide title="수익" items={[["401", "매출"], ["501", "급여수익"], ["903", "이자수익"], ["904", "배당금수익"], ["906", "유가증권처분이익"]]} />
                <AccountGuide title="비용" items={[["811", "복리후생비"], ["812", "여비교통비"], ["813", "통신비"], ["814", "수도광열비"], ["816", "지급임차료"], ["819", "보험료"], ["931", "이자비용"]]} />
              </div>
            </div>
          )}

          <div className="statements-erp-main fund-triangle-layout">
            <div className="erp-panel" style={{ padding: "8px 12px" }}>
              <h3>돈 이동 기록 · {journal?.entries.length ?? 0}건</h3>
              <p className="erp-hint">행을 누르면 오른쪽에서 자세한 내용을 봅니다. 들어온 쪽=차변, 나간 쪽=대변.</p>

              {isLoading && <p className="erp-hint">기록 모으는 중…</p>}
              {!isLoading && (!journal || journal.entries.length === 0) && (
                <p className="erp-hint">이 기간에 생활비·배당·주식·월급 기록이 없습니다.</p>
              )}

              {journal && journal.entries.length > 0 && (
                <div className="table-wrap">
                  <table className="erp-grid">
                    <thead>
                      <tr>
                        <th>날짜</th>
                        <th>번호</th>
                        <th>구분</th>
                        <th>코드</th>
                        <th>항목</th>
                        <th>상대방</th>
                        <th className="num" title="차변">들어온 쪽</th>
                        <th className="num" title="대변">나간 쪽</th>
                        <th>메모</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journal.entries.flatMap((group) =>
                        group.lines.map((line, idx) => {
                          const on = selectedEntry?.voucherNo === group.voucherNo;
                          const isDebit = line.side === "debit";
                          return (
                            <tr
                              key={`${group.voucherNo}-${line.lineNo}`}
                              className={on ? "sel on" : ""}
                              style={{ cursor: "pointer" }}
                              onClick={() => setSelectedVoucher(group.voucherNo)}
                            >
                              <td className="ro">{idx === 0 ? line.date : ""}</td>
                              <td className="ro">{idx === 0 ? `#${group.voucherNo}` : ""}</td>
                              <td className="ro">{isDebit ? "들어온 쪽" : "나간 쪽"}</td>
                              <td className="ro">{line.accountCode}</td>
                              <td className="ro">{line.accountName}</td>
                              <td className="ro">{line.counterparty || "—"}</td>
                              <td className="ro num">{isDebit ? won(line.amount) : "—"}</td>
                              <td className="ro num">{!isDebit ? won(line.amount) : "—"}</td>
                              <td className="ro">{line.memo}</td>
                            </tr>
                          );
                        }),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <aside className="statements-erp-side" aria-label="기록 상세">
              <div className="statements-side-card">
                <h3>고른 기록</h3>
                <div className="body">
                  {selectedEntry ? (
                    <>
                      <table className="erp-props">
                        <tbody>
                          <tr><th>번호</th><td className="ro">#{selectedEntry.voucherNo}</td></tr>
                          <tr><th>날짜</th><td className="ro">{selectedEntry.date}</td></tr>
                          <tr><th>종류</th><td className="ro">{sourceLabel(selectedEntry.sourceType)}</td></tr>
                          <tr><th>들어온 합</th><td className="ro num">{won(selectedEntry.debitTotal)}</td></tr>
                          <tr><th>나간 합</th><td className="ro num">{won(selectedEntry.creditTotal)}</td></tr>
                          <tr><th>맞춤</th><td className="ro">{selectedEntry.isBalanced ? "맞음" : "안 맞음"}</td></tr>
                          <tr><th>줄 수</th><td className="ro">{selectedEntry.lines.length}줄</td></tr>
                        </tbody>
                      </table>
                      <div className="erp-slip">
                        <a href="/tax">세금/연말정산</a>
                        <a href="/profile">프로필대장</a>
                      </div>
                    </>
                  ) : (
                    <p className="erp-hint">왼쪽 표에서 기록을 고르세요.</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function sourceLabel(sourceType: string) {
  if (sourceType === "transaction") return "생활비·수입";
  if (sourceType === "payroll") return "월급";
  if (sourceType === "trade") return "주식 사고팔기";
  return "배당/이자";
}

function AccountGuide({ title, items }: { title: string; items: Array<[string, string]> }) {
  return (
    <section className="wehago-widget">
      <h3>{title}</h3>
      <table className="erp-props">
        <tbody>
          {items.map(([code, name]) => (
            <tr key={code}>
              <th>{code}</th>
              <td className="ro">{name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
