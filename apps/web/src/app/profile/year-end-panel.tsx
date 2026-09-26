"use client";
import { useState } from "react";
import { TAX_EXPERT_FIRST, TAX_SCREEN_CAUTION, YEAR_END_PANES, yearEndDeductionFields, yearEndSettlement, type YearEndPaneId } from "@finvesting/core";
import { YearEndBlock, type PayYearPoint } from "./pay-year";

function won(n: number | null | undefined) {
  if (n == null) return "—";
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

function slotLabel(status: string) {
  if (status === "collected") return "수집";
  if (status === "unavailable") return "불가";
  return "칸";
}

export function YearEndPanel({
  points,
  year,
  monthlyPension = 0,
}: {
  points: PayYearPoint[];
  year?: PayYearPoint;
  monthlyPension?: number;
}) {
  const payMonths = points.filter((p) => p.gross > 0).length;
  const annualPension = monthlyPension * payMonths;
  const settle = year && year.gross > 0 ? yearEndSettlement(year, annualPension) : null;
  const fields = yearEndDeductionFields({
    annualGross: settle?.annualGross ?? 0,
    annualPension: settle?.pensionDeduction ?? 0,
  });
  const [pane, setPane] = useState<YearEndPaneId>("earned");
  const [draft, setDraft] = useState<Record<string, number>>({});
  const shown = fields.filter((f) => f.pane === pane);

  return (
    <>
      <h3>연말정산 업무</h3>
      <aside className="erp-caution" role="note">
        <p>{TAX_EXPERT_FIRST}</p>
        <p>{TAX_SCREEN_CAUTION}</p>
      </aside>
      <p className="erp-hint">
        근로자 본인 연말정산입니다. 고용노동부 연 합 명세와 과세표준 기초만 수집분입니다.
        기부금·자녀 등은 창을 나눠 넣을 수 있습니다. 세액공제율을 곱하지 않습니다. 홈택스 제출이 아닙니다.
        종소세(사업·프리랜서) 화면(`/erp`)은 보류(ADR 0050)입니다.
      </p>
      <p className="erp-hint">
        <a href="/profile?menu=books">07 월 임금명세서</a>
        {" · "}
        <a href="/profile?menu=taxBooks">13 양도·배당</a>
        {" · "}
        <a href="/profile?menu=taxBooks">세율표(13)</a>
      </p>

      {!year || year.gross <= 0 ? (
        <p className="erp-hint">해당 연 급여 스냅샷이 없습니다. 07에서 월 명세를 저장하면 여기 연 합이 생깁니다. 숫자를 만들지 않습니다.</p>
      ) : (
        <YearEndBlock year={year} annualPension={annualPension} />
      )}

      <h3 style={{ marginTop: 20 }}>공제 내역</h3>
      <p className="erp-hint">창마다 따로 넣습니다. 입력은 이 화면 시산만이고 저장하지 않습니다.</p>
      <div className="erp-pills" role="tablist" aria-label="연말정산 공제 창">
        {YEAR_END_PANES.map((p) => (
          <button key={p.id} type="button" className={pane === p.id ? "on" : ""} onClick={() => setPane(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      <table className="erp-grid">
        <thead>
          <tr><th>항목</th><th>금액·수</th><th>상태</th><th>메모</th></tr>
        </thead>
        <tbody>
          {shown.map((s) => (
              <tr key={s.id}>
                <td className="ro">{s.label}</td>
                <td>
                  {s.status === "collected" ? (
                    <span className="num">{won(s.amount)}</span>
                  ) : (
                    <input
                      inputMode="numeric"
                      placeholder={s.kind === "yesno" ? "유 1 / 무 0" : s.kind === "count" ? "명" : "칸"}
                      value={draft[s.id] ? String(draft[s.id]) : ""}
                      onChange={(e) => {
                        const n = Math.max(0, Math.floor(Number(e.target.value.replace(/[^\d]/g, "")) || 0));
                        setDraft({ ...draft, [s.id]: n });
                      }}
                      style={{ width: 120 }}
                    />
                  )}
                </td>
                <td className="ro"><span className={`wehago-badge ${s.status === "empty" ? "empty" : s.status === "unavailable" ? "unavail" : ""}`}>{slotLabel(s.status)}</span></td>
                <td className="ro">{s.note}</td>
              </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
