"use client";
import { useState } from "react";
import { TAX_EXPERT_FIRST, TAX_SCREEN_CAUTION } from "@finvesting/core";
import { trpc } from "@/lib/trpc";
import { TaxRateGuide } from "@/app/erp/tax-rate-guide";

function won(n: number | null | undefined) {
  if (n == null) return "—";
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

function downloadCsv(filename: string, base64: string) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function TaxBooksPanel() {
  const nowY = Number(new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 4));
  const [year, setYear] = useState(nowY);
  const [note, setNote] = useState<string | null>(null);
  const board = trpc.tax.yearSummary.useQuery({ year });
  const exportLedger = trpc.tax.exportLedger.useMutation();
  const data = board.data;
  const cgt = data?.cgt;
  const inc = data?.incomes;

  async function onExport() {
    setNote(null);
    const r = await exportLedger.mutateAsync({ year });
    if ("status" in r) {
      setNote(r.note);
      return;
    }
    downloadCsv(r.filename, r.base64);
    setNote("가계 통장 범용 CSV를 받았습니다. 사업 전표·더존 양식이 아닙니다.");
  }

  return (
    <>
      <h3>양도·배당</h3>
      <aside className="erp-caution" role="note">
        <p>{TAX_EXPERT_FIRST}</p>
        <p>{TAX_SCREEN_CAUTION}</p>
      </aside>
      <p className="erp-hint">
        근로자 본인의 해외주식 양도·배당·이자입니다. 연말정산 업무는 <a href="/profile?menu=yearEnd">12 연말정산</a>에 있습니다.
        사업 매출·부가세 화면(`/erp`)은 보류(ADR 0050)입니다. 양도·증여·보유 세율표는 아래입니다. 결정세액·특례는 세무사·회계사·국세청 126이 먼저입니다.
      </p>
      <p className="erp-hint">
        연도{" "}
        <input
          type="number"
          min={2000}
          max={2100}
          value={year}
          onChange={(e) => setYear(Number(e.target.value) || nowY)}
          style={{ width: 88 }}
        />
        {" "}
        <button type="button" className="primary" onClick={() => void onExport()} disabled={exportLedger.isPending}>
          {exportLedger.isPending ? "만드는 중…" : "가계 통장 CSV"}
        </button>
        {" "}
        <a href="/profile?menu=yearEnd">12 연말정산</a>
        {" · "}
        <a href="/holdings">보유·체결</a>
      </p>
      {board.isLoading && <p className="erp-hint">불러오는 중…</p>}
      {data?.status === "unavailable" && <p className="erp-hint">{data.note}</p>}
      {data?.status === "empty" && (
        <p className="erp-hint">해당 연 급여·체결·배당·통장 거래가 없습니다. 숫자를 만들지 않습니다.</p>
      )}
      {note && <p className="erp-hint">{note}</p>}

      <div className="wehago-kpis">
        <div className="wehago-kpi">
          <span className="k">해외주식 과세대상</span>
          <span className="v">{won(cgt?.taxableKrw)}</span>
          <span className="s">매도 {cgt?.sellCount ?? 0}건 · 250만 공제</span>
        </div>
        <div className="wehago-kpi">
          <span className="k">배당 총액</span>
          <span className="v">{won(inc?.dividendGross)}</span>
          <span className="s">원천세 {won(inc?.dividendWithheld)}</span>
        </div>
        <div className="wehago-kpi">
          <span className="k">이자 총액</span>
          <span className="v">{won(inc?.interestGross)}</span>
          <span className="s">원천세 {won(inc?.interestWithheld)}</span>
        </div>
        <div className="wehago-kpi">
          <span className="k">장부 행</span>
          <span className="v">{data?.ledgerRowCount ?? 0}건</span>
          <span className="s">가계 CSV · 사업 전표 아님</span>
        </div>
      </div>

      <div className="wehago-widgets">
        <section className="wehago-widget">
          <h3>양도소득 미리보기</h3>
          <div className="body">
            <p className="erp-hint">한국 상장·코인은 넣지 않습니다. 평단법·체결 환율입니다. 세율 표는 아래 양도세 창입니다.</p>
            <table className="erp-props">
              <tbody>
                <tr><th>매도 건</th><td className="ro">{cgt?.sellCount ?? 0}건</td></tr>
                <tr><th>실현손익</th><td className="ro">{won(cgt?.realizedKrw)}</td></tr>
                <tr><th>기본공제</th><td className="ro">{won(cgt?.deductionKrw)} 중 {won(cgt?.deductionAppliedKrw)} 적용</td></tr>
                <tr><th>과세대상</th><td className="ro">{won(cgt?.taxableKrw)}</td></tr>
              </tbody>
            </table>
          </div>
        </section>
        <section className="wehago-widget">
          <h3>배당 · 이자</h3>
          <div className="body">
            <p className="erp-hint">`investment_incomes` 수집분만. 원천징수 세율을 추정하지 않습니다. 입력 화면은 아직 없습니다.</p>
            <table className="erp-props">
              <tbody>
                <tr><th>배당 총액 / 원천세</th><td className="ro">{won(inc?.dividendGross)} / {won(inc?.dividendWithheld)}</td></tr>
                <tr><th>이자 총액 / 원천세</th><td className="ro">{won(inc?.interestGross)} / {won(inc?.interestWithheld)}</td></tr>
                <tr><th>건수</th><td className="ro">{inc?.rowCount ?? 0}건</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
      {data?.note && data.status === "ok" && <p className="erp-hint">{data.note} 장부 행 {data.ledgerRowCount}건.</p>}
      <TaxRateGuide paneDefault="cgt" showCaution={false} />
    </>
  );
}
