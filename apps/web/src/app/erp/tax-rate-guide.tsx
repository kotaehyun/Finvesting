"use client";
import { useMemo, useState } from "react";
import {
  CGT_FLAT_RATES,
  GIFT_DEDUCTIONS,
  PROGRESSIVE_PLAIN,
  TAX_EXPERT_FIRST,
  TAX_HELP_LINKS,
  TAX_TABLES,
  TAX_TERMS,
  assessBracketTax,
  findTaxTable,
  type TaxTable,
} from "@finvesting/core";
import { TaxCaution } from "./biz-forms";

function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function ratePct(bp: number) {
  const n = bp / 100;
  return `${n.toFixed(bp % 10 === 0 ? (bp % 100 === 0 ? 0 : 1) : 2)}%`;
}

function capLabel(cap: number | null) {
  if (cap == null) return "그 이상";
  return `${won(cap)} 이하`;
}

type Pane = "words" | "cgt" | "gift" | "holding";

function BracketTable({ table }: { table: TaxTable }) {
  return (
    <section className="wehago-widget wehago-widget-span">
      <h3>{table.title}</h3>
      <div className="body">
        <p className="erp-hint">{table.article}</p>
        <p className="erp-hint">{table.note}</p>
        <table className="erp-grid">
          <thead>
            <tr>
              <th>과세표준</th>
              <th>세율</th>
              <th>누진공제</th>
              <th>조문 계산</th>
            </tr>
          </thead>
          <tbody>
            {table.brackets.map((b) => (
              <tr key={b.id}>
                <td className="ro">{b.floor === 0 ? "" : `${won(b.floor)} 초과 `}{capLabel(b.cap)}</td>
                <td className="ro">{ratePct(b.rateBp)}</td>
                <td className="ro num">{b.quickDeductionWon === 0 ? "—" : won(b.quickDeductionWon)}</td>
                <td className="ro">{b.rateLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Worksheet({ tables }: { tables: TaxTable[] }) {
  const [tableId, setTableId] = useState(tables[0]?.id ?? "ita55");
  const [base, setBase] = useState(0);
  const table = findTaxTable(tableId) ?? tables[0];
  const sheet = useMemo(() => (table ? assessBracketTax(base, table) : null), [base, table]);

  if (!table || !sheet) return null;

  return (
    <section className="wehago-widget wehago-widget-span">
      <h3>과세표준을 넣으면 그 표의 산출세액 시산</h3>
      <div className="body">
        <p className="erp-hint">
          넣은 숫자가 이미 과세표준이어야 합니다. 공시가격·매매가·증여액을 그대로 넣지 마세요.
          특례·중과·비과세를 자동으로 빼거나 더하지 않습니다.
        </p>
        <p className="erp-hint erp-form-fields">
          <label>
            표
            {" "}
            <select value={table.id} onChange={(e) => setTableId(e.target.value)}>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </label>
          {" "}
          <label>
            과세표준
            {" "}
            <input
              type="text"
              inputMode="numeric"
              placeholder="칸"
              value={base ? String(base) : ""}
              onChange={(e) => setBase(Math.max(0, Math.floor(Number(e.target.value.replace(/[^\d]/g, "")) || 0)))}
            />
          </label>
        </p>
        <div className="wehago-kpis">
          <div className="wehago-kpi"><span className="k">과세표준</span><span className="v">{won(sheet.base)}</span><span className="s">넣은 값</span></div>
          <div className="wehago-kpi"><span className="k">이 칸 세율</span><span className="v">{sheet.bracket ? ratePct(sheet.bracket.rateBp) : "—"}</span><span className="s">{sheet.bracket ? capLabel(sheet.bracket.cap) : "칸"}</span></div>
          <div className="wehago-kpi"><span className="k">산출세액 시산</span><span className="v">{won(sheet.assessed)}</span><span className="s">신고액 아님</span></div>
          <div className="wehago-kpi"><span className="k">{table.localOnTax ? "지방세 10%" : "지방세"}</span><span className="v">{table.localOnTax ? won(sheet.localTax) : "이 표에 없음"}</span><span className="s">{table.localOnTax ? "산출세액의 10%" : "재산·증여"}</span></div>
        </div>
        <p className="erp-hint">{sheet.formula}. {sheet.note}</p>
      </div>
    </section>
  );
}

export function TaxRateGuide({ paneDefault = "words", showCaution = true }: { paneDefault?: Pane; showCaution?: boolean }) {
  const [pane, setPane] = useState<Pane>(paneDefault);
  const holding = TAX_TABLES.filter((t) => t.kind === "holding");
  const cgt = TAX_TABLES.filter((t) => t.kind === "cgt");
  const gift = TAX_TABLES.filter((t) => t.kind === "gift");

  return (
    <>
      {showCaution && <TaxCaution />}
      <h3>양도·증여·보유 세율</h3>
      <p className="erp-hint">{TAX_EXPERT_FIRST}</p>
      <p className="erp-hint">
        초보가 용어부터 막히지 않게, 법령 표와 누진 설명을 같이 둡니다.
        조문·시행령에 없는 세율은 만들지 않습니다. 1세대1주택 비과세·다주택 중과·합산배제는 상담 사항입니다.
      </p>
      <div className="erp-pills" role="tablist" aria-label="세율 창">
        {([
          ["words", "쉬운 말"],
          ["cgt", "양도세"],
          ["gift", "증여세"],
          ["holding", "보유세"],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" className={pane === id ? "on" : ""} onClick={() => setPane(id)}>
            {label}
          </button>
        ))}
      </div>

      {pane === "words" && (
        <>
          <section className="wehago-widget wehago-widget-span">
            <h3>용어</h3>
            <div className="body">
              <table className="erp-grid">
                <thead>
                  <tr><th>말</th><th>쉽게</th></tr>
                </thead>
                <tbody>
                  {TAX_TERMS.map((t) => (
                    <tr key={t.id}>
                      <td className="ro">{t.term}</td>
                      <td className="ro">{t.plain}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="wehago-widget wehago-widget-span">
            <h3>누진세율을 한 번에</h3>
            <div className="body">
              <ul className="wehago-todo">
                {PROGRESSIVE_PLAIN.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </section>
          <section className="wehago-widget wehago-widget-span">
            <h3>문의</h3>
            <div className="body">
              <table className="erp-grid">
                <thead>
                  <tr><th>창구</th><th>메모</th></tr>
                </thead>
                <tbody>
                  {TAX_HELP_LINKS.map((l) => (
                    <tr key={l.id}>
                      <td className="ro"><a href={l.href} target="_blank" rel="noreferrer">{l.label}</a></td>
                      <td className="ro">{l.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {pane === "cgt" && (
        <>
          {cgt.map((t) => <BracketTable key={t.id} table={t} />)}
          <section className="wehago-widget wehago-widget-span">
            <h3>양도 과세표준이 되기까지</h3>
            <div className="body">
              <p className="erp-hint">
                판 가격에서 산 가격·필요경비를 빼면 차익입니다. 장기보유특별공제·양도소득 기본공제(소득세법 제103조)를 뺀 뒤가 과세표준입니다.
                이 화면은 그 빼기를 대신하지 않습니다. 해외주식 250만 공제 미리보기만 프로필 13에 있습니다.
              </p>
            </div>
          </section>
          <section className="wehago-widget wehago-widget-span">
            <h3>기본세율이 아닌 양도(제104조)</h3>
            <div className="body">
              <p className="erp-hint">둘 이상에 해당하면 큰 세액을 씁니다(제104조 제1항 후단). 어느 호인지는 세무사·국세청.</p>
              <table className="erp-grid">
                <thead>
                  <tr><th>구분</th><th>세율</th><th>조문</th></tr>
                </thead>
                <tbody>
                  {CGT_FLAT_RATES.map((r) => (
                    <tr key={r.id}>
                      <td className="ro">{r.label}</td>
                      <td className="ro">{r.rate}</td>
                      <td className="ro">{r.article}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <Worksheet tables={cgt} />
        </>
      )}

      {pane === "gift" && (
        <>
          {gift.map((t) => <BracketTable key={t.id} table={t} />)}
          <section className="wehago-widget wehago-widget-span">
            <h3>증여 과세표준(제55조)</h3>
            <div className="body">
              <p className="erp-hint">
                일반 증여는 증여세 과세가액에서 제53조·제53조의2·제54조 금액을 뺀 뒤가 과세표준입니다.
                과세표준이 50만원 미만이면 부과하지 않습니다(제55조 제2항). 이 화면에서 공제를 빼 주지 않습니다.
              </p>
              <table className="erp-grid">
                <thead>
                  <tr><th>누구에게서</th><th>공제(10년 합산 한도)</th><th>조문</th></tr>
                </thead>
                <tbody>
                  {GIFT_DEDUCTIONS.map((r) => (
                    <tr key={r.id}>
                      <td className="ro">{r.label}</td>
                      <td className="ro">{r.amount}</td>
                      <td className="ro">{r.article}. {r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="erp-hint">혼인·출산 공제는 제53조의2입니다. 기간·한도는 국세청·세무사.</p>
            </div>
          </section>
          <Worksheet tables={gift} />
        </>
      )}

      {pane === "holding" && (
        <>
          <p className="erp-hint">
            보유세는 두 겹입니다. 재산세는 지자체가 부과하고, 종부세는 공시가격을 전국 합산해 일정 금액을 넘으면 국세청이 부과합니다.
            과세표준은 시세가 아닙니다. 재산세는 시가표준액×공정시장가액비율(제110조), 종부세 주택분은 공시가격 합산 − 공제 × 공정시장가액비율(제8조).
          </p>
          {holding.map((t) => <BracketTable key={t.id} table={t} />)}
          <Worksheet tables={holding} />
        </>
      )}
    </>
  );
}
