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
      { value: "all", label: "전체" },
      ...Array.from({ length: 12 }, (_, i) => {
        const m = 12 - i;
        const value = `${selectedYear}-${String(m).padStart(2, "0")}`;
        return { value, label: `${m}월` };
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
    <div className="erp wehago journal-page">
      <div className="erp-titlebar">
        <h1>
          <span className="wehago-mark" aria-hidden>전표</span>
          회계전표
          <span className="path">{pathLabel}</span>
        </h1>
        <div className="wehago-title-meta">
          <a href="/tax">세금/연말정산</a>
          <a href="/accounts">계좌·거래</a>
        </div>
      </div>

      <div className="erp-toolbar journal-toolbar">
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
        <label className="journal-month">
          월
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSelectedVoucher(null);
            }}
            aria-label="전표 월"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => refetch()}>새로고침</button>
        <div className="journal-export" role="group" aria-label="내보내기">
          <span className="erp-hint">이 달 전체 파일</span>
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
      </div>

      <div className="erp-body">
        <div className="erp-work">
          <div className="journal-sources" role="group" aria-label="돈 종류">
            {SOURCE_MENU.map((id) => (
              <button
                key={id}
                type="button"
                className={sourceType === id ? "on" : ""}
                aria-pressed={sourceType === id}
                onClick={() => {
                  setSourceType(id);
                  setSelectedVoucher(null);
                }}
              >
                {SOURCE_LABELS[id]}
              </button>
            ))}
            <button type="button" className={showChartGuide ? "on" : ""} aria-pressed={showChartGuide} onClick={() => setShowChartGuide((v) => !v)}>
              계정 이름표
            </button>
          </div>
          <p className="erp-plain-lead">들어온 돈과 나간 돈을 한 장(전표)으로 맞춰 둔 기록입니다. 파일은 고른 월의 전부입니다. 위 종류 버튼은 화면만 거릅니다.</p>
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

          <div className="journal-split">
            <div className="erp-panel journal-list">
              <h3>전표 · {journal?.entries.length ?? 0}건</h3>
              <p className="erp-hint">한 줄을 누르면 오른쪽에 차변·대변이 나옵니다.</p>

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
                        <th>종류</th>
                        <th>적요</th>
                        <th className="num">들어온 쪽</th>
                        <th className="num">나간 쪽</th>
                        <th>맞춤</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journal.entries.map((group) => {
                        const on = selectedEntry?.voucherNo === group.voucherNo;
                        return (
                          <tr
                            key={group.voucherNo}
                            className={on ? "sel on" : ""}
                            onClick={() => setSelectedVoucher(group.voucherNo)}
                          >
                            <td className="ro">{group.date}</td>
                            <td className="ro">#{group.voucherNo}</td>
                            <td className="ro">{sourceLabel(group.sourceType)}</td>
                            <td className="ro">{slipTitle(group)}</td>
                            <td className="ro num">{won(group.debitTotal)}</td>
                            <td className="ro num">{won(group.creditTotal)}</td>
                            <td className={`ro ${group.isBalanced ? "flat" : "warn"}`}>{group.isBalanced ? "맞음" : "안 맞음"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <aside className="journal-detail" aria-label="고른 전표">
              <h3>{selectedEntry ? `#${selectedEntry.voucherNo} ${selectedEntry.date}` : "고른 전표"}</h3>
              {selectedEntry ? (
                <>
                  <p className="erp-hint">{sourceLabel(selectedEntry.sourceType)} · {selectedEntry.isBalanced ? "들어온 쪽과 나간 쪽이 같습니다." : "들어온 쪽과 나간 쪽이 다릅니다."}</p>
                  <table className="erp-grid">
                    <thead>
                      <tr>
                        <th>쪽</th>
                        <th>항목</th>
                        <th className="num">금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEntry.lines.map((line) => (
                        <tr key={line.lineNo}>
                          <td className="ro">{line.side === "debit" ? "들어옴" : "나감"}</td>
                          <td className="ro">
                            {line.accountCode} {line.accountName}
                            {(line.memo || line.counterparty) && (
                              <em>{[line.counterparty, line.memo].filter(Boolean).join(" · ")}</em>
                            )}
                          </td>
                          <td className="ro num">{won(line.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="erp-hint">전표가 없습니다.</p>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function sourceLabel(sourceType: string) {
  if (sourceType in SOURCE_LABELS && sourceType !== "all") return SOURCE_LABELS[sourceType as SourceFilter];
  return sourceType;
}

function slipTitle(group: { lines: Array<{ memo: string; counterparty: string }> }) {
  const line = group.lines.find((l) => l.memo.trim()) ?? group.lines[0];
  const text = (line?.memo || line?.counterparty || "").trim();
  return text || "내용 없음";
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
