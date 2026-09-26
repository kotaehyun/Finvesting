"use client";
import { useState } from "react";
import {
  BIZ_BOOK_ACCOUNTS,
  BIZ_CASH_ACCOUNTS,
  CIT_FILING_CALENDAR,
  CIT_FORM_50_BYEONG_NOTE,
  CIT_FORM_50_EUL,
  CIT_FORM_50_GAP,
  CIT_FORM_54,
  CORP_SOLE_DIFF,
  CIVIL_PAY,
  CIVIL_PAY_GRADES,
  CIVIL_PAY_SOURCE,
  CIVIL_PAY_TABLE,
  civilPayAmount,
  civilPayCsv,
  CORP_LOCAL_RATE_SOURCE,
  EI_STABILITY_BANDS,
  EI_STABILITY_SOURCE,
  ENGAGEMENT_KINDS,
  FREELANCER_ALBA_CLAUSE,
  FREELANCER_ALBA_CLAUSE_BASIS,
  FREELANCER_CONDITIONS,
  FREELANCER_PROFESSIONS,
  FREELANCER_REJECTED,
  FREELANCER_SCOPES,
  GIT_FILING_CALENDAR,
  GIT_INCOME_KINDS,
  INDUSTRIAL_ACCIDENT_NOTE,
  MIN_WAGE_2026,
  NHI_ACQUISITION,
  NHI_ACQUISITION_COLUMNS,
  NHI_HANDOFF_STEPS,
  NHI_LATER,
  NHI_OFFICIAL_LINKS,
  nhiAcquisitionCsv,
  nhiAcquisitionDate,
  UNLISTED_CGT_FIELDS,
  UNLISTED_FILING_CALENDAR,
  VAT_ENTITIES,
  vatFilingRows,
  ZERO_RATE_EXPORT,
  bizJournalTotals,
  citEulCsv,
  citGapClosing,
  citGapCsv,
  citWorksheet,
  emptyBizJournal,
  emptyBizJournalLine,
  emptyCitAmountLine,
  emptyCitEulLines,
  emptyCitGapAmounts,
  emptyCitInput,
  emptyGitInput,
  emptyShareChangeLines,
  emptyStaffLines,
  emptyWorkplaceNhiHead,
  emptyExportZeroRateLines,
  emptyImportVatLines,
  emptyUnlistedCgt,
  emptyVatInput,
  emptyWorkplaceStatusLines,
  exampleStaffDesk,
  employerEmploymentInsurance,
  exemptTradeCalendarFor,
  EXEMPT_INCOME_CERT,
  EXEMPT_KINDS,
  EXEMPT_STATUS_FILING,
  exportZeroRateCsv,
  freelancerConditionHint,
  freelancerMayWithhold,
  freelancerWithholding,
  gitWorksheet,
  IMPORT_VAT,
  importVatCsv,
  accountNotePlaceholder,
  journalCsv,
  missingAccountName,
  missingBankNote,
  parseSlotWon,
  shareChangeCsv,
  shareClosing,
  slotWonText,
  STAFF_REGISTER,
  STAFF_REGISTER_COLUMNS,
  staffRegisterCsv,
  TAX_EXPERT_FIRST,
  TAX_INTERPRET_RULES,
  TAX_SCREEN_CAUTION,
  unlistedCgtCsv,
  unlistedCgtSheet,
  vatTaxpayerOptions,
  vatWorksheet,
  workplaceStatusCsv,
  workPath,
  type BizJournalLine,
  type ExportZeroRateLine,
  type ImportVatLine,
  type WorkplaceStatusLine,
  type CitAmountLine,
  type CitEulLine,
  type EiStabilityBandId,
  type CivilPayGradeId,
  type ShareChangeLine,
  type StaffLine,
  type SlotWon,
  type OperatorRole,
  type VatEntity,
  type VatTaxpayer,
} from "@finvesting/core";

function won(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function wonSlot(n: SlotWon) {
  return n == null ? "칸" : won(n);
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function SlotWonInput({
  value,
  onChange,
  label,
}: {
  value: SlotWon;
  onChange: (n: SlotWon) => void;
  label: string;
}) {
  return (
    <input
      inputMode="numeric"
      value={slotWonText(value)}
      onChange={(e) => onChange(parseSlotWon(e.target.value))}
      placeholder="칸"
      aria-label={label}
    />
  );
}

export function TaxCaution() {
  return (
    <aside className="erp-caution" role="note">
      <p>{TAX_EXPERT_FIRST}</p>
      <p>{TAX_SCREEN_CAUTION}</p>
      <ul>
        {TAX_INTERPRET_RULES.map((r) => (
          <li key={r.id}><strong>{r.label}</strong> {r.note}</li>
        ))}
      </ul>
    </aside>
  );
}

function pctBp(bp: number) {
  return `${(bp / 100).toFixed(2).replace(/\.?0+$/, "")}%`;
}

function WonField({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <label>
      {label}
      {" "}
      <input
        type="text"
        inputMode="numeric"
        value={value ? String(value) : ""}
        onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value.replace(/[^\d]/g, "")) || 0)))}
        placeholder="칸"
      />
    </label>
  );
}

export function EngagementTable() {
  return (
    <section className="wehago-widget wehago-widget-span">
      <h3>근로 · 프리랜서 · 개인 · 법인 구분</h3>
      <div className="body">
        <p className="erp-hint">많이 섞입니다. 세목과 원천이 다릅니다. 원장이 없으면 금액은 칸입니다.</p>
        <table className="erp-grid">
          <thead>
            <tr><th>구분</th><th>언제</th><th>세금</th><th>아닌 것</th></tr>
          </thead>
          <tbody>
            {ENGAGEMENT_KINDS.map((k) => (
              <tr key={k.id}>
                <td className="ro">{k.label}</td>
                <td className="ro">{k.when}</td>
                <td className="ro">{k.tax}</td>
                <td className="ro">{k.not}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function VatForm({
  focus = "full",
  entity = "individual",
  lockEntity = false,
}: {
  focus?: "full" | "sales" | "purchase";
  entity?: VatEntity;
  lockEntity?: boolean;
}) {
  const [input, setInput] = useState(() => ({ ...emptyVatInput(), entity }));
  const sheet = vatWorksheet(input);
  const types = vatTaxpayerOptions(input.entity);
  const title = focus === "sales" ? "매출 → 부가세 매출세액" : focus === "purchase" ? "매입 → 부가세 매입세액" : "부가가치세 신고 양식";

  return (
    <>
      <TaxCaution />
      <h3>{title}</h3>
      <p className="erp-hint">
        부가가치세법 제30조 세율 10%. 법인은 간이과세가 없습니다. 홈택스 신고서 XML·더존 양식이 아닙니다. 원장 금액은 저장하지 않고 시산만 합니다.
        {focus === "sales" && " 가계 입금을 공급가액에 넣지 않습니다."}
      </p>
      {lockEntity ? (
        <p className="erp-hint">{input.entity === "corporation" ? "법인 부가세입니다. 간이과세 버튼이 없습니다." : "개인사업자 부가세입니다. 법인 화면으로 바꾸지 않습니다."}</p>
      ) : (
      <div className="erp-pills" role="group" aria-label="사업 인격">
        {VAT_ENTITIES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={input.entity === t.id ? "on" : ""}
            onClick={() => setInput({
              ...input,
              entity: t.id,
              taxpayer: t.id === "corporation" && input.taxpayer === "simplified" ? "general" : input.taxpayer,
            })}
          >
            {t.label}
          </button>
        ))}
      </div>
      )}
      <div className="erp-pills" role="group" aria-label="과세유형">
        {types.map((t) => (
          <button
            key={t.id}
            type="button"
            className={input.taxpayer === t.id ? "on" : ""}
            onClick={() => setInput({ ...input, taxpayer: t.id as VatTaxpayer })}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="erp-hint">{types.find((t) => t.id === input.taxpayer)?.note}</p>
      <p className="erp-hint erp-form-fields">
        {(focus === "full" || focus === "sales") && (
          <>
            <WonField label="과세 공급가액" value={input.taxableSupply} onChange={(n) => setInput({ ...input, taxableSupply: n })} />
            <WonField label="영세율 공급가액" value={input.zeroRateSupply} onChange={(n) => setInput({ ...input, zeroRateSupply: n })} />
            <WonField label="면세 공급가액" value={input.exemptSupply} onChange={(n) => setInput({ ...input, exemptSupply: n })} />
          </>
        )}
        {(focus === "full" || focus === "purchase") && (
          <WonField label="매입세액" value={input.inputVat} onChange={(n) => setInput({ ...input, inputVat: n })} />
        )}
        {focus === "full" && (
          <WonField label="예정고지 기납부" value={input.prepaid} onChange={(n) => setInput({ ...input, prepaid: n })} />
        )}
      </p>
      <div className="wehago-kpis">
        <div className="wehago-kpi"><span className="k">매출세액</span><span className="v">{won(sheet.outputVat)}</span><span className="s">일반과세 10%</span></div>
        <div className="wehago-kpi"><span className="k">매입세액</span><span className="v">{won(sheet.inputVat)}</span><span className="s">원장 없으면 0</span></div>
        <div className="wehago-kpi"><span className="k">납부세액</span><span className="v">{won(sheet.payable)}</span><span className="s">매출 − 매입</span></div>
        <div className="wehago-kpi"><span className="k">차감납부</span><span className="v">{won(sheet.remaining)}</span><span className="s">기납부 차감</span></div>
      </div>
      <p className="erp-hint">{sheet.note}</p>
      <p className="erp-hint">
        면세·확인서·수출입은{" "}
        <a href={workPath(input.entity === "corporation" ? "corporation" : "business", "exempt")}>면세·수출입</a>
        입니다. 확인서는 부가가치세면세사업자수입금액증명입니다. 이 화면에서 발급하지 않습니다.
      </p>
      <section className="wehago-widget wehago-widget-span">
        <h3>신고 달력</h3>
        <div className="body">
          <table className="erp-grid">
            <thead>
              <tr><th>신고</th><th>과세기간</th><th>신고기한</th><th>대상</th></tr>
            </thead>
            <tbody>
              {vatFilingRows(input.entity).map((r) => (
                <tr key={r.id}>
                  <td className="ro">{r.period}</td>
                  <td className="ro">{r.target}</td>
                  <td className="ro">{r.due}</td>
                  <td className="ro">{r.who}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export function ExemptTradeForm({ role }: { role: OperatorRole }) {
  const personal = role === "business";
  const [status, setStatus] = useState(() => emptyWorkplaceStatusLines(3));
  const [exportLines, setExportLines] = useState(() => emptyExportZeroRateLines(3));
  const [importLines, setImportLines] = useState(() => emptyImportVatLines(3));
  const calendar = exemptTradeCalendarFor(role);

  function patchStatus(i: number, next: Partial<WorkplaceStatusLine>) {
    setStatus(status.map((l, idx) => (idx === i ? { ...l, ...next } : l)));
  }
  function patchExport(i: number, next: Partial<ExportZeroRateLine>) {
    setExportLines(exportLines.map((l, idx) => (idx === i ? { ...l, ...next } : l)));
  }
  function patchImport(i: number, next: Partial<ImportVatLine>) {
    setImportLines(importLines.map((l, idx) => (idx === i ? { ...l, ...next } : l)));
  }

  return (
    <>
      <TaxCaution />
      <h3>면세·수출입</h3>
      <p className="erp-hint">
        {personal
          ? "개인 면세는 소득세법 제78조 사업장현황신고입니다. 다음해 2월 10일까지입니다."
          : "법인 면세 공급은 부가가치세법 제26조 문언만입니다. 소득세법 제78조 사업장현황신고 대상이 아닙니다."}
        {" "}사단법인·농업법인은 이름만으로 면세가 아닙니다. 수출은 제21조 영세율(0%이지 면세가 아님)입니다. 수입은 제50조 세관입니다.
        {" "}<a href={workPath(role, "vat")}>부가세</a>
      </p>
      <section className="wehago-widget wehago-widget-span">
        <h3>누가 면세인가</h3>
        <div className="body">
          <table className="erp-grid">
            <thead>
              <tr><th>구분</th><th>근거</th><th>직역</th><th>아닌 것</th></tr>
            </thead>
            <tbody>
              {EXEMPT_KINDS.map((k) => (
                <tr key={k.id}>
                  <td className="ro">{k.label}</td>
                  <td className="ro">{k.basis}</td>
                  <td className="ro">{k.plain}</td>
                  <td className="ro">{k.not}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="wehago-widget wehago-widget-span">
        <h3>{EXEMPT_INCOME_CERT.form}</h3>
        <div className="body">
          <p className="erp-hint">{EXEMPT_INCOME_CERT.basis}. {EXEMPT_INCOME_CERT.plain}. 정부24·홈택스 민원입니다.</p>
        </div>
      </section>
      {personal && (
        <>
          <h3>{EXEMPT_STATUS_FILING.form}</h3>
          <p className="erp-hint">{EXEMPT_STATUS_FILING.basis}. {EXEMPT_STATUS_FILING.plain}. {EXEMPT_STATUS_FILING.who}. {EXEMPT_STATUS_FILING.not}.</p>
          <table className="erp-journal">
            <thead>
              <tr>
                <th>인적사항<em>이름·사업장</em></th>
                <th>업종<em>무슨 일</em></th>
                <th>수입금액<em>작년 매출</em></th>
              </tr>
            </thead>
            <tbody>
              {status.map((l, i) => (
                <tr key={l.id}>
                  <td><input value={l.identity} onChange={(e) => patchStatus(i, { identity: e.target.value })} placeholder="칸" /></td>
                  <td><input value={l.industry} onChange={(e) => patchStatus(i, { industry: e.target.value })} placeholder="칸" /></td>
                  <td><SlotWonInput label="수입금액" value={l.receipts} onChange={(n) => patchStatus(i, { receipts: n })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="erp-hint">
            <button type="button" onClick={() => setStatus([...status, ...emptyWorkplaceStatusLines(1).map((l) => ({ ...l, id: `ws${status.length + 1}` }))])}>행 추가</button>
            {" · "}
            <button type="button" onClick={() => downloadCsv("사업장현황신고-시산.csv", workplaceStatusCsv(status))}>시산 CSV</button>
            {" · "}빈 행은 뺍니다. 홈택스 제출 파일이 아닙니다.
          </p>
        </>
      )}
      <h3>{ZERO_RATE_EXPORT.form}</h3>
      <p className="erp-hint">{ZERO_RATE_EXPORT.basis}. {ZERO_RATE_EXPORT.plain}.</p>
      <table className="erp-journal">
        <thead>
          <tr>
            <th>수출신고번호<em>세관 번호</em></th>
            <th>외화금액<em>환율을 곱하지 않음</em></th>
            <th>원화공급가액<em>넣은 원만</em></th>
          </tr>
        </thead>
        <tbody>
          {exportLines.map((l, i) => (
            <tr key={l.id}>
              <td><input value={l.declarationNo} onChange={(e) => patchExport(i, { declarationNo: e.target.value })} placeholder="칸" /></td>
              <td><input value={l.foreignAmount} onChange={(e) => patchExport(i, { foreignAmount: e.target.value })} placeholder="칸" /></td>
              <td><SlotWonInput label="원화공급가액" value={l.krw} onChange={(n) => patchExport(i, { krw: n })} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="erp-hint">
        <button type="button" onClick={() => setExportLines([...exportLines, ...emptyExportZeroRateLines(1).map((l) => ({ ...l, id: `ex${exportLines.length + 1}` }))])}>행 추가</button>
        {" · "}
        <button type="button" onClick={() => downloadCsv("수출실적-영세율-시산.csv", exportZeroRateCsv(exportLines))}>시산 CSV</button>
        {" · "}빈 행은 뺍니다. 환율을 곱하지 않습니다.
      </p>
      <h3>{IMPORT_VAT.form}</h3>
      <p className="erp-hint">{IMPORT_VAT.basis}. {IMPORT_VAT.plain}. {IMPORT_VAT.deferral}.</p>
      <table className="erp-journal">
        <thead>
          <tr>
            <th>수입신고번호<em>세관 번호</em></th>
            <th>관세의 과세가격<em>제29조 제2항 칸</em></th>
            <th>관세<em>곱하지 않음</em></th>
            <th>그 밖 내국세<em>칸</em></th>
            <th>수입부가세<em>세관 고지</em></th>
            <th>납부유예<em>제50조의2 칸</em></th>
          </tr>
        </thead>
        <tbody>
          {importLines.map((l, i) => (
            <tr key={l.id}>
              <td><input value={l.declarationNo} onChange={(e) => patchImport(i, { declarationNo: e.target.value })} placeholder="칸" /></td>
              <td><SlotWonInput label="관세의 과세가격" value={l.customsValue} onChange={(n) => patchImport(i, { customsValue: n })} /></td>
              <td><SlotWonInput label="관세" value={l.customsDuty} onChange={(n) => patchImport(i, { customsDuty: n })} /></td>
              <td><SlotWonInput label="그 밖 내국세" value={l.otherInternal} onChange={(n) => patchImport(i, { otherInternal: n })} /></td>
              <td><SlotWonInput label="수입부가세" value={l.importVat} onChange={(n) => patchImport(i, { importVat: n })} /></td>
              <td><input value={l.deferral} onChange={(e) => patchImport(i, { deferral: e.target.value })} placeholder="칸" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="erp-hint">
        <button type="button" onClick={() => setImportLines([...importLines, ...emptyImportVatLines(1).map((l) => ({ ...l, id: `im${importLines.length + 1}` }))])}>행 추가</button>
        {" · "}
        <button type="button" onClick={() => downloadCsv("수입부가세-시산.csv", importVatCsv(importLines))}>시산 CSV</button>
        {" · "}빈 행은 뺍니다. 관세에 10%를 곱하지 않습니다.
      </p>
      <section className="wehago-widget wehago-widget-span">
        <h3>신고 달력</h3>
        <div className="body">
          <table className="erp-grid">
            <thead>
              <tr><th>신고</th><th>대상</th><th>기한</th><th>누구</th><th>근거</th></tr>
            </thead>
            <tbody>
              {calendar.map((r) => (
                <tr key={r.id}>
                  <td className="ro">{r.period}</td>
                  <td className="ro">{r.target}</td>
                  <td className="ro">{r.due}</td>
                  <td className="ro">{r.who}</td>
                  <td className="ro">{r.article}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export function LaborForm({ role }: { role?: OperatorRole }) {
  const [wage, setWage] = useState(0);
  const [band, setBand] = useState<EiStabilityBandId>("under150");
  const [grade, setGrade] = useState<CivilPayGradeId>(9);
  const [step, setStep] = useState(1);
  const ei = employerEmploymentInsurance(wage, band);
  const amount = civilPayAmount(grade, step);
  const staffHref = workPath(role ?? "business", "staff");

  return (
    <>
      <h3>인건비 · 고용보험 · 호봉</h3>
      <p className="erp-hint">
        사업주가 직원에게 주는 인건비입니다. 법인 대표 급여도 여기 근로소득·4대보험입니다. 3.3%가 아닙니다.
        본인 근로 월급은 <a href="/profile?menu=books">07 급여상세</a>입니다.
        고용보험은 고용산재보험료징수법 시행령 제12조.
        호봉 양식은 {CIVIL_PAY.basis}입니다. {CIVIL_PAY.plain}. {CIVIL_PAY.step}. {CIVIL_PAY.not}.
        직원을 적으면 <a href={staffHref}>직원등록</a>에서 건강보험 자격취득 신고가 이어집니다.
      </p>
      <p className="erp-hint erp-form-fields">
        <WonField label="월 보수(직원)" value={wage} onChange={setWage} />
        <label>
          상시근로자
          {" "}
          <select value={band} onChange={(e) => setBand(e.target.value as EiStabilityBandId)}>
            {EI_STABILITY_BANDS.map((b) => (
              <option key={b.id} value={b.id}>{b.label} ({pctBp(b.rateBp)})</option>
            ))}
          </select>
        </label>
      </p>
      <div className="wehago-kpis">
        <div className="wehago-kpi"><span className="k">근로자 실업급여</span><span className="v">{won(ei.employeeTotal)}</span><span className="s">0.9%</span></div>
        <div className="wehago-kpi"><span className="k">사업주 실업급여</span><span className="v">{won(ei.unemploymentEmployer)}</span><span className="s">0.9%</span></div>
        <div className="wehago-kpi"><span className="k">고용안정·직능</span><span className="v">{won(ei.stabilityEmployer)}</span><span className="s">사업주만</span></div>
        <div className="wehago-kpi"><span className="k">사업주 고용보험</span><span className="v">{won(ei.employerTotal)}</span><span className="s">실업+안정</span></div>
      </div>
      <section className="wehago-widget wehago-widget-span">
        <h3>고용보험료율 (시행령 제12조)</h3>
        <div className="body">
          <table className="erp-grid">
            <thead>
              <tr><th>구분</th><th>요율</th><th>부담</th><th>근거</th></tr>
            </thead>
            <tbody>
              <tr><td className="ro">실업급여</td><td className="ro">1.8% (각 0.9%)</td><td className="ro">근로자·사업주</td><td className="ro">제12조 실업급여</td></tr>
              {EI_STABILITY_BANDS.map((b) => (
                <tr key={b.id}>
                  <td className="ro">고용안정·직능개발 · {b.label}</td>
                  <td className="ro">{pctBp(b.rateBp)}</td>
                  <td className="ro">사업주</td>
                  <td className="ro">{b.decree}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="erp-hint">{INDUSTRIAL_ACCIDENT_NOTE}</p>
          <p className="erp-hint">{EI_STABILITY_SOURCE}</p>
        </div>
      </section>
      <section className="wehago-widget wehago-widget-span">
        <h3>호봉 양식 ({CIVIL_PAY.basis})</h3>
        <div className="body">
          <p className="erp-hint">
            {CIVIL_PAY.form}. {CIVIL_PAY.revised} 개정. {CIVIL_PAY.source}.{" "}
            <a href={CIVIL_PAY.href} target="_blank" rel="noreferrer">인사혁신처 봉급표</a>.
            봉급월액만입니다. 수당을 더하지 않아 최저임금 월 {won(MIN_WAGE_2026.monthly209)}보다 작아 보일 수 있습니다.
          </p>
          <p className="erp-hint erp-form-fields">
            <label>
              계급
              {" "}
              <select value={grade} onChange={(e) => setGrade(Number(e.target.value) as CivilPayGradeId)}>
                {CIVIL_PAY_GRADES.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </label>
            <label>
              호봉
              {" "}
              <input
                type="number"
                min={1}
                max={CIVIL_PAY_TABLE.length}
                value={step}
                onChange={(e) => setStep(Math.min(CIVIL_PAY_TABLE.length, Math.max(1, Math.floor(Number(e.target.value) || 1))))}
              />
            </label>
            <span>
              {CIVIL_PAY_GRADES.find((g) => g.id === grade)?.label} {step}호봉 봉급월액 {amount == null ? "칸(그 계급에 없음)" : won(amount)}.
            </span>
          </p>
          <table className="erp-grid">
            <thead>
              <tr>
                <th>호봉</th>
                {CIVIL_PAY_GRADES.map((g) => (
                  <th key={g.id}>{g.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CIVIL_PAY_TABLE.map((row, i) => {
                const n = i + 1;
                return (
                  <tr key={n} className={n === step ? "on" : undefined}>
                    <td className="ro">{n}</td>
                    {row.map((cell, gi) => {
                      const g = (gi + 1) as CivilPayGradeId;
                      const on = g === grade && n === step;
                      return (
                        <td key={g} className={on ? "ro num on" : "ro num"}>
                          <button
                            type="button"
                            className={on ? "on" : ""}
                            onClick={() => {
                              setGrade(g);
                              setStep(n);
                            }}
                          >
                            {cell == null ? "칸" : won(cell)}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="erp-hint">
            <button type="button" onClick={() => downloadCsv("공무원-별표3-봉급표-시산.csv", civilPayCsv())}>별표 3 시산 CSV</button>
            {" · "}빈 칸은 0이 아닙니다. 인사혁신처 제출 파일이 아닙니다.
          </p>
          <p className="erp-hint">{CIVIL_PAY_SOURCE}</p>
        </div>
      </section>
    </>
  );
}

export function StaffForm({ role }: { role: OperatorRole }) {
  const [head, setHead] = useState(emptyWorkplaceNhiHead);
  const [lines, setLines] = useState(() => emptyStaffLines(3));

  function patch(i: number, next: Partial<StaffLine>) {
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...next } : l)));
  }

  return (
    <>
      <TaxCaution />
      <h3>{STAFF_REGISTER.form}</h3>
      <p className="erp-hint">
        {STAFF_REGISTER.basis}. {STAFF_REGISTER.plain}. {STAFF_REGISTER.except}.
        고용일을 적으면 아래 건강보험 신고 칸에 채용일이 따라갑니다.
        {" "}<a href={workPath(role, "labor")}>인건비</a>
      </p>
      <div className="table-wrap">
      <table className="erp-journal">
        <thead>
          <tr>
            {STAFF_REGISTER_COLUMNS.map((c) => (
              <th key={c.id}>{c.label}<em>{c.plain}</em></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={l.id}>
              <td><input value={l.name} onChange={(e) => patch(i, { name: e.target.value })} placeholder="칸" /></td>
              <td><input value={l.sex} onChange={(e) => patch(i, { sex: e.target.value })} placeholder="칸" /></td>
              <td><input value={l.birth} onChange={(e) => patch(i, { birth: e.target.value })} placeholder="칸" /></td>
              <td><input value={l.address} onChange={(e) => patch(i, { address: e.target.value })} placeholder="칸" /></td>
              <td><input value={l.phone} onChange={(e) => patch(i, { phone: e.target.value })} placeholder="칸" /></td>
              <td><input value={l.job} onChange={(e) => patch(i, { job: e.target.value })} placeholder="칸" /></td>
              <td><input value={l.hired} onChange={(e) => {
                const hired = e.target.value;
                patch(i, { hired, nhi: hired.trim() ? true : l.nhi });
              }} placeholder="YYYY-MM-DD" /></td>
              <td><input value={l.contractEnd} onChange={(e) => patch(i, { contractEnd: e.target.value })} placeholder="칸" /></td>
              <td><input value={l.history} onChange={(e) => patch(i, { history: e.target.value })} placeholder="칸" /></td>
              <td><input value={l.left} onChange={(e) => patch(i, { left: e.target.value })} placeholder="칸" /></td>
              <td><input value={l.leftReason} onChange={(e) => patch(i, { leftReason: e.target.value })} placeholder="칸" /></td>
              <td><input value={l.extra} onChange={(e) => patch(i, { extra: e.target.value })} placeholder="칸" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <p className="erp-hint">
        <button type="button" onClick={() => setLines([...lines, ...emptyStaffLines(1).map((l) => ({ ...l, id: `st${lines.length + 1}` }))])}>행 추가</button>
        {" · "}
        <button type="button" onClick={() => {
          const sample = exampleStaffDesk();
          setHead(sample.head);
          setLines(sample.lines);
        }}>예시 채우기</button>
        {" · "}
        <button type="button" onClick={() => downloadCsv("근로자명부-시산.csv", staffRegisterCsv(lines))}>명부 시산 CSV</button>
        {" · "}빈 행은 뺍니다. 홈택스·고용노동부 제출 파일이 아닙니다. 예시는 실제 접수가 아닙니다.
      </p>
      <h3>{NHI_ACQUISITION.form}</h3>
      <p className="erp-hint">
        {NHI_ACQUISITION.basis}. {NHI_ACQUISITION.plain}. 기한은 {NHI_ACQUISITION.due}입니다.
        {NHI_ACQUISITION.except}. {NHI_ACQUISITION.not}.
        주민등록번호는 비워도 됩니다. 넣어도 이 기기 CSV에만 가고 서버에 저장하지 않습니다.
      </p>
      <ol className="erp-hint">
        {NHI_HANDOFF_STEPS.map((s) => (
          <li key={s.id}><strong>{s.label}</strong> {s.plain}</li>
        ))}
      </ol>
      <p className="erp-hint">
        이 화면에서 공단으로 접수되지 않습니다. 공식 창구는{" "}
        {NHI_OFFICIAL_LINKS.map((l, i) => (
          <span key={l.id}>
            {i > 0 ? " · " : ""}
            <a href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
            {" "}({l.plain})
          </span>
        ))}
        입니다.
      </p>
      <p className="erp-hint">
        나중에: {NHI_LATER.ediTemplate}. {NHI_LATER.openApi}.
      </p>
      <div className="erp-form-fields">
        <label>
          사업장관리번호
          <input
            value={head.managementNo}
            onChange={(e) => setHead({ ...head, managementNo: e.target.value })}
            placeholder="칸"
            aria-label="사업장관리번호"
          />
        </label>
        <label>
          사업장 명칭
          <input
            value={head.workplaceName}
            onChange={(e) => setHead({ ...head, workplaceName: e.target.value })}
            placeholder="칸"
            aria-label="사업장 명칭"
          />
        </label>
        <label>
          소재지
          <input
            value={head.workplaceAddress}
            onChange={(e) => setHead({ ...head, workplaceAddress: e.target.value })}
            placeholder="칸"
            aria-label="소재지"
          />
        </label>
      </div>
      <div className="table-wrap">
      <table className="erp-journal">
        <thead>
          <tr>
            {NHI_ACQUISITION_COLUMNS.map((c) => (
              <th key={c.id}>{c.label}<em>{c.plain}</em></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={`nhi-${l.id}`}>
              <td className="ro">{l.name || "칸"}</td>
              <td><input value={l.idNo} onChange={(e) => patch(i, { idNo: e.target.value })} placeholder="칸" autoComplete="off" /></td>
              <td><SlotWonInput label="월 소득액" value={l.wage} onChange={(n) => patch(i, { wage: n })} /></td>
              <td>
                <input
                  value={l.nhiAcquired}
                  onChange={(e) => patch(i, { nhiAcquired: e.target.value })}
                  placeholder={l.hired || "고용일과 같음"}
                  aria-label="자격취득일"
                />
                <em>{nhiAcquisitionDate(l) ? `쓰는 날 ${nhiAcquisitionDate(l)}` : ""}</em>
              </td>
              <td>
                <label>
                  <input type="checkbox" checked={l.nhi} onChange={(e) => patch(i, { nhi: e.target.checked })} />
                  {" "}취득
                </label>
              </td>
              <td>
                <label>
                  <input type="checkbox" checked={l.dependents} onChange={(e) => patch(i, { dependents: e.target.checked })} />
                  {" "}신청
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <p className="erp-hint">
        <button type="button" onClick={() => downloadCsv("건강보험-직장가입자-자격취득-시산.csv", nhiAcquisitionCsv(head, lines))}>건보 시산 CSV</button>
        {" · "}빈 행은 뺍니다. 보험료를 곱하지 않습니다. 공단 전송 파일이 아닙니다.
      </p>
    </>
  );
}

export function FreelancerForm() {
  const [gross, setGross] = useState(0);
  const [scope, setScope] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({
    independent: false,
    not_disguised: false,
    repeat: false,
    no_facility: false,
    payer: false,
    statute_only: false,
  });
  const allowed = freelancerMayWithhold(flags, scope);
  const w = freelancerWithholding(gross);
  const hint = freelancerConditionHint(flags, scope);

  return (
    <>
      <TaxCaution />
      <h3>프리랜서 원천 3.3%</h3>
      <p className="erp-hint">
        소득세법 제129조 제1항 제3호 3% + 지방세법 제103조의13(그 10%) = 3.3%. 근로 4대보험·부가세 10%와 다릅니다.
        이 화면은 연예인·모델·프리랜서 개발자·인플루언서·전문직(의사·변호사·노무사·세무사·변리사 등)만 봅니다.
        아르바이트생을 3.3%로 억지로 돌리지 않습니다(소득세법 제20조·제129조 제1항 제1호).
        매장 알바·소위 사짜(위장 3.3%)는 근로입니다. 조건이 안 되면 3.3%를 곱하지 않습니다.
        원장을 저장하지 않고 시산만 합니다. 종소세 5월 확정세액이 아닙니다.
      </p>
      <div className="erp-pills" role="radiogroup" aria-label="이 화면에서 보는 직종">
        {FREELANCER_SCOPES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={scope === s.id ? "on" : ""}
            onClick={() => setScope(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="erp-hint">{FREELANCER_SCOPES.find((s) => s.id === scope)?.note ?? "직종을 고르지 않으면 시산하지 않습니다. 법령이 이 직종만 허용한다고 쓰지 않습니다."}</p>
      {scope === "professional" && (
        <section className="wehago-widget wehago-widget-span">
          <h3>전문직 예시</h3>
          <div className="body">
            <p className="erp-hint">자격 이름만으로 3.3%가 되지 않습니다. 개원·사무소·직원은 개인사업자입니다. 물적시설 없이 독립 자문 용역일 때만 아래 조건을 봅니다.</p>
            <table className="erp-grid">
              <thead>
                <tr><th>자격</th><th>메모</th></tr>
              </thead>
              <tbody>
                {FREELANCER_PROFESSIONS.map((p) => (
                  <tr key={p.id}>
                    <td className="ro">{p.label}</td>
                    <td className="ro">{p.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <section className="wehago-widget wehago-widget-span">
        <h3>해당 아님</h3>
        <div className="body">
          <table className="erp-grid">
            <thead>
              <tr><th>구분</th><th>이유</th></tr>
            </thead>
            <tbody>
              {FREELANCER_REJECTED.map((r) => (
                <tr key={r.id}>
                  <td className="ro">{r.label}</td>
                  <td className="ro">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="wehago-widget wehago-widget-span">
        <h3>법령 주의 · 아르바이트에 사업소득 3%를 쓰지 않음</h3>
        <div className="body">
          <p className="erp-hint">절세 특약이 아닙니다. 계약서 이름만 프리랜서로 바꿔도 근로소득 원천은 남습니다. 이 화면 안내이며 법률자문·절세 자문이 아닙니다.</p>
          <table className="erp-grid">
            <thead>
              <tr><th>근거</th><th>내용</th></tr>
            </thead>
            <tbody>
              {FREELANCER_ALBA_CLAUSE_BASIS.map((r) => (
                <tr key={r.id}>
                  <td className="ro">{r.article}</td>
                  <td className="ro">{r.point}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <textarea className="erp-memo" readOnly rows={10} value={FREELANCER_ALBA_CLAUSE} aria-label="아르바이트 임금에 사업소득 3%를 쓰지 않는다는 법령 주의" />
        </div>
      </section>
      <p className="erp-hint erp-form-fields">
        <WonField label="지급액(용역대가)" value={gross} onChange={setGross} />
      </p>
      <div className="wehago-kpis">
        <div className="wehago-kpi"><span className="k">소득세 3%</span><span className="v">{allowed ? won(w.incomeTax) : "—"}</span><span className="s">{allowed ? "원 단위 절사" : "조건 미충족"}</span></div>
        <div className="wehago-kpi"><span className="k">지방세</span><span className="v">{allowed ? won(w.localTax) : "—"}</span><span className="s">{allowed ? "소득세의 10%" : "3.3% 안 곱음"}</span></div>
        <div className="wehago-kpi"><span className="k">원천 합 3.3%</span><span className="v">{allowed ? won(w.total) : "—"}</span><span className="s">{allowed ? "지급자 원천" : "칸"}</span></div>
        <div className="wehago-kpi"><span className="k">실수령 시산</span><span className="v">{allowed ? won(w.net) : "—"}</span><span className="s">{allowed ? "확정 아님" : "확정 아님"}</span></div>
      </div>
      <section className="wehago-widget wehago-widget-span">
        <h3>3.3%가 되려면</h3>
        <div className="body">
          <ul className="wehago-todo">
            {FREELANCER_CONDITIONS.map((c) => (
              <li key={c.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!flags[c.id]}
                    onChange={(e) => setFlags({ ...flags, [c.id]: e.target.checked })}
                  />
                  {" "}
                  {c.pass}
                  <span className="muted"> — {c.fail}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="erp-hint">{hint}</p>
        </div>
      </section>
      <EngagementTable />
    </>
  );
}

export function CorpSoleTable() {
  return (
    <section className="wehago-widget wehago-widget-span">
      <h3>개인사업자 · 법인사업자</h3>
      <div className="body">
        <p className="erp-hint">인격이 다릅니다. 종소세와 법인세를 같은 세금으로 보지 않습니다.</p>
        <table className="erp-grid">
          <thead>
            <tr><th>구분</th><th>개인사업자</th><th>법인사업자</th></tr>
          </thead>
          <tbody>
            {CORP_SOLE_DIFF.map((r) => (
              <tr key={r.id}>
                <td className="ro">{r.label}</td>
                <td className="ro">{r.sole}</td>
                <td className="ro">{r.corp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function CitForm() {
  const [input, setInput] = useState(emptyCitInput);
  const sheet = citWorksheet(input);

  return (
    <>
      <TaxCaution />
      <h3>법인세 신고 양식</h3>
      <p className="erp-hint">
        법인세법 제60조 확정·제63조 중간예납. 종소세·연말정산이 아닙니다. 세율 구간을 곱하지 않고, 넣은 산출세액만 시산합니다.
        법인지방소득세는 그 10%(지방세법 제103조의20). 홈택스 XML·더존 양식이 아닙니다.
      </p>
      <p className="erp-hint erp-form-fields">
        <WonField label="과세표준" value={input.taxableIncome} onChange={(n) => setInput({ ...input, taxableIncome: n })} />
        <WonField label="법인세 산출세액" value={input.corporateTax} onChange={(n) => setInput({ ...input, corporateTax: n })} />
        <WonField label="중간예납 기납부" value={input.interimPaid} onChange={(n) => setInput({ ...input, interimPaid: n })} />
      </p>
      <div className="wehago-kpis">
        <div className="wehago-kpi"><span className="k">과세표준</span><span className="v">{won(sheet.taxableIncome)}</span><span className="s">세율 미적용</span></div>
        <div className="wehago-kpi"><span className="k">법인세</span><span className="v">{won(sheet.corporateTax)}</span><span className="s">칸 · 추정 없음</span></div>
        <div className="wehago-kpi"><span className="k">법인지방소득세</span><span className="v">{won(sheet.localTax)}</span><span className="s">산출세액의 10%</span></div>
        <div className="wehago-kpi"><span className="k">차감납부</span><span className="v">{won(sheet.remaining)}</span><span className="s">중간예납 차감</span></div>
      </div>
      <p className="erp-hint">{sheet.note}</p>
      <p className="erp-hint">{CORP_LOCAL_RATE_SOURCE}</p>
      <section className="wehago-widget wehago-widget-span">
        <h3>신고 달력</h3>
        <div className="body">
          <table className="erp-grid">
            <thead>
              <tr><th>신고</th><th>과세기간</th><th>신고기한</th><th>근거</th></tr>
            </thead>
            <tbody>
              {CIT_FILING_CALENDAR.map((r) => (
                <tr key={r.id}>
                  <td className="ro">{r.period}</td>
                  <td className="ro">{r.target}</td>
                  <td className="ro">{r.due}</td>
                  <td className="ro">{r.article}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <CorpSoleTable />
    </>
  );
}

function JournalAccountCell({
  listId,
  account,
  note,
  amount,
  side,
  onAccount,
  onNote,
}: {
  listId: string;
  account: string;
  note: string;
  amount: number;
  side: "차변" | "대변";
  onAccount: (v: string) => void;
  onNote: (v: string) => void;
}) {
  const noName = missingAccountName(account, amount);
  const noBank = missingBankNote(account, note, amount);
  return (
    <div className="erp-journal-acct">
      <input
        list={listId}
        value={account}
        onChange={(e) => onAccount(e.target.value)}
        placeholder={`${side} 계정과목`}
        aria-label={`${side} 계정과목`}
      />
      <input
        className="note"
        value={note}
        onChange={(e) => onNote(e.target.value)}
        placeholder={accountNotePlaceholder(account)}
        aria-label={`${side} 주석`}
      />
      {noName && <span className="warn">계정과목을 적으세요.</span>}
      {noBank && <span className="warn">은행명을 주석에 적으세요.</span>}
    </div>
  );
}

export function BizJournalForm({ kind, role }: { kind: "cash" | "books"; role?: OperatorRole }) {
  const accounts = kind === "cash" ? BIZ_CASH_ACCOUNTS : BIZ_BOOK_ACCOUNTS;
  const [lines, setLines] = useState(() => emptyBizJournal(4));
  const totals = bizJournalTotals(lines);
  const title = kind === "cash" ? "사업 자금 분개" : "사업 장부 분개";
  const listId = `biz-accts-${kind}`;

  function patch(i: number, next: Partial<BizJournalLine>) {
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...next } : l)));
  }

  return (
    <>
      <h3>{title}</h3>
      <p className="erp-hint">
        {kind === "cash"
          ? "회사 통장·현금이 오가는 분개입니다. 차변 계정과 대변 계정을 같이 적습니다. 한쪽이 보통예금이면 밑 주석에 은행명을 씁니다."
          : "모든 거래 분개장입니다. 차변 계정과 대변 계정을 같이 적습니다. 한 전표의 차변 합 = 대변 합이어야 합니다. 보통예금이면 밑 주석에 은행명."}
        {" "}은행 이름을 만들지 않습니다. 원장을 저장하지 않습니다. 가계 통장 CSV가 아닙니다.
        차변은 왼쪽에 적는 계정, 대변은 오른쪽에 적는 계정입니다.
      </p>
      <table className="erp-journal">
        <thead>
          <tr>
            <th>일자</th>
            <th>차변 계정</th>
            <th className="num">차변</th>
            <th>대변 계정</th>
            <th className="num">대변</th>
            <th>적요</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={l.id}>
              <td>
                <input type="date" value={l.date} onChange={(e) => patch(i, { date: e.target.value })} />
              </td>
              <td>
                <JournalAccountCell
                  listId={listId}
                  side="차변"
                  account={l.debitAccount}
                  note={l.debitNote}
                  amount={l.debit}
                  onAccount={(v) => patch(i, { debitAccount: v })}
                  onNote={(v) => patch(i, { debitNote: v })}
                />
              </td>
              <td>
                <input
                  inputMode="numeric"
                  value={l.debit ? String(l.debit) : ""}
                  onChange={(e) => patch(i, { debit: Math.max(0, Math.floor(Number(e.target.value.replace(/[^\d]/g, "")) || 0)) })}
                  placeholder="0"
                  aria-label="차변 금액"
                />
              </td>
              <td>
                <JournalAccountCell
                  listId={listId}
                  side="대변"
                  account={l.creditAccount}
                  note={l.creditNote}
                  amount={l.credit}
                  onAccount={(v) => patch(i, { creditAccount: v })}
                  onNote={(v) => patch(i, { creditNote: v })}
                />
              </td>
              <td>
                <input
                  inputMode="numeric"
                  value={l.credit ? String(l.credit) : ""}
                  onChange={(e) => patch(i, { credit: Math.max(0, Math.floor(Number(e.target.value.replace(/[^\d]/g, "")) || 0)) })}
                  placeholder="0"
                  aria-label="대변 금액"
                />
              </td>
              <td>
                <input value={l.memo} onChange={(e) => patch(i, { memo: e.target.value })} placeholder="적요" />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2}>합계 {totals.balanced ? "차대 일치" : "차대 불일치"}</td>
            <td className="num">{won(totals.debit)}</td>
            <td />
            <td className="num">{won(totals.credit)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
      <datalist id={listId}>
        {accounts.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
      <p className="erp-hint">
        <button type="button" onClick={() => setLines([...lines, emptyBizJournalLine(lines.length + 1)])}>행 추가</button>
        {" · "}
        <button type="button" onClick={() => downloadCsv(kind === "cash" ? "분개-사업자금-시산.csv" : "분개-사업장부-시산.csv", journalCsv(kind, lines))}>시산 CSV</button>
        {" · "}
        넣은 행만 뽑습니다. 빈 칸은 0이 아닙니다. 더존·홈택스 업로드가 아닙니다.
        {kind === "books" && role === "corporation" && <> {" · "}<a href="/erp?role=corporation&view=equity">자본금·적립금 조정</a></>}
      </p>
    </>
  );
}

export function EquityForm() {
  const [gap, setGap] = useState<Record<string, CitAmountLine>>(emptyCitGapAmounts);
  const [eul, setEul] = useState(() => emptyCitEulLines(4));

  function patchGap(id: string, next: Partial<CitAmountLine>) {
    const cur = gap[id] ?? emptyCitAmountLine();
    setGap({
      ...gap,
      [id]: {
        opening: next.opening === undefined ? cur.opening : next.opening,
        decrease: next.decrease === undefined ? cur.decrease : next.decrease,
        increase: next.increase === undefined ? cur.increase : next.increase,
        note: next.note === undefined ? cur.note : next.note,
      },
    });
  }

  function patchEul(i: number, next: Partial<CitEulLine>) {
    setEul(eul.map((l, idx) => (idx === i ? { ...l, ...next } : l)));
  }

  return (
    <>
      <TaxCaution />
      <h3>{CIT_FORM_50_GAP.form}</h3>
      <p className="erp-hint">
        {CIT_FORM_50_GAP.basis}. {CIT_FORM_50_GAP.plain}. 자본조정은 이 표의 과목 이름이지 화면 이름이 아닙니다.
        기말은 기초·감소·증가를 다 넣은 뒤에만 계산합니다. 빈 칸은 0이 아닙니다.
      </p>
      <table className="erp-journal">
        <thead>
          <tr>
            {CIT_FORM_50_GAP.columns.map((c) => (
              <th key={c.id}>{c.label}<em>{c.plain}</em></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CIT_FORM_50_GAP.rows.map((r) => {
            const line = gap[r.id] ?? { opening: null, decrease: null, increase: null, note: "" };
            return (
              <tr key={r.id}>
                <td className="ro">{r.title}<em>{r.plain}</em></td>
                <td className="ro">{r.code}</td>
                <td><SlotWonInput label={`${r.title} 기초잔액`} value={line.opening} onChange={(n) => patchGap(r.id, { opening: n })} /></td>
                <td><SlotWonInput label={`${r.title} 감소`} value={line.decrease} onChange={(n) => patchGap(r.id, { decrease: n })} /></td>
                <td><SlotWonInput label={`${r.title} 증가`} value={line.increase} onChange={(n) => patchGap(r.id, { increase: n })} /></td>
                <td className="ro num">{wonSlot(citGapClosing(line))}</td>
                <td><input value={line.note} onChange={(e) => patchGap(r.id, { note: e.target.value })} placeholder="비고" /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="erp-hint">
        <button type="button" onClick={() => downloadCsv("자본금과적립금조정명세서-갑-시산.csv", citGapCsv(gap))}>갑 시산 CSV</button>
        {" · "}넣은 칸만 숫자로 나갑니다. 홈택스 제출 파일이 아닙니다.
      </p>
      <h3>{CIT_FORM_50_EUL.form}</h3>
      <p className="erp-hint">{CIT_FORM_50_EUL.basis}. {CIT_FORM_50_EUL.plain}. {CIT_FORM_50_BYEONG_NOTE}</p>
      <table className="erp-journal">
        <thead>
          <tr>
            {CIT_FORM_50_EUL.columns.map((c) => (
              <th key={c.id}>{c.label}<em>{c.plain}</em></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {eul.map((l, i) => (
            <tr key={l.id}>
              <td><input value={l.title} onChange={(e) => patchEul(i, { title: e.target.value })} placeholder="과목 또는 사항" /></td>
              <td><SlotWonInput label="을 기초잔액" value={l.opening} onChange={(n) => patchEul(i, { opening: n })} /></td>
              <td><SlotWonInput label="을 감소" value={l.decrease} onChange={(n) => patchEul(i, { decrease: n })} /></td>
              <td><SlotWonInput label="을 증가" value={l.increase} onChange={(n) => patchEul(i, { increase: n })} /></td>
              <td className="ro num">{wonSlot(citGapClosing(l))}</td>
              <td><input value={l.note} onChange={(e) => patchEul(i, { note: e.target.value })} placeholder="비고" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="erp-hint">
        <button type="button" onClick={() => setEul([...eul, { id: `eul${eul.length + 1}`, title: "", opening: null, decrease: null, increase: null, note: "" }])}>을 행 추가</button>
        {" · "}
        <button type="button" onClick={() => downloadCsv("자본금과적립금조정명세서-을-시산.csv", citEulCsv(eul))}>을 시산 CSV</button>
        {" · "}빈 행은 뺍니다. <a href="/erp?role=corporation&view=unlisted">주식등변동상황명세서</a>
        {" · "}<a href="/erp?role=corporation&view=books">사업 장부 분개</a>
      </p>
    </>
  );
}

export function GitForm({ role }: { role?: OperatorRole }) {
  const [input, setInput] = useState(emptyGitInput);
  const sheet = gitWorksheet(input);

  return (
    <>
      <TaxCaution />
      <h3>종합소득세</h3>
      <p className="erp-hint">
        소득세법 제70조. 다음해 5.1~5.31 확정. 근로 연말정산·법인세가 아닙니다. 이 칸의 산출세액은 직접 넣습니다.
        제55조 누진 표·쉬운 설명은{" "}
        <a href={role ? `/erp?role=${role}&view=rates` : "/erp?view=rates"}>세율표</a>
        입니다. 특례는 세무사·회계사·국세청 126이 먼저입니다.
      </p>
      <p className="erp-hint erp-form-fields">
        <WonField label="과세표준" value={input.taxableIncome} onChange={(n) => setInput({ ...input, taxableIncome: n })} />
        <WonField label="산출세액" value={input.incomeTax} onChange={(n) => setInput({ ...input, incomeTax: n })} />
        <WonField label="기납부(원천·예정)" value={input.prepaid} onChange={(n) => setInput({ ...input, prepaid: n })} />
      </p>
      <div className="wehago-kpis">
        <div className="wehago-kpi"><span className="k">과세표준</span><span className="v">{won(sheet.taxableIncome)}</span><span className="s">세율 미적용</span></div>
        <div className="wehago-kpi"><span className="k">소득세</span><span className="v">{won(sheet.incomeTax)}</span><span className="s">칸</span></div>
        <div className="wehago-kpi"><span className="k">지방소득세</span><span className="v">{won(sheet.localTax)}</span><span className="s">산출세액의 10%</span></div>
        <div className="wehago-kpi"><span className="k">차감납부</span><span className="v">{won(sheet.remaining)}</span><span className="s">기납부 차감</span></div>
      </div>
      <p className="erp-hint">{sheet.note}</p>
      <section className="wehago-widget wehago-widget-span">
        <h3>소득 종류</h3>
        <div className="body">
          <table className="erp-grid">
            <thead>
              <tr><th>구분</th><th>메모</th></tr>
            </thead>
            <tbody>
              {GIT_INCOME_KINDS.map((k) => (
                <tr key={k.id}>
                  <td className="ro">{k.label}</td>
                  <td className="ro">{k.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="wehago-widget wehago-widget-span">
        <h3>신고 달력</h3>
        <div className="body">
          <table className="erp-grid">
            <thead>
              <tr><th>신고</th><th>과세기간</th><th>신고기한</th><th>근거</th></tr>
            </thead>
            <tbody>
              {GIT_FILING_CALENDAR.map((r) => (
                <tr key={r.id}>
                  <td className="ro">{r.period}</td>
                  <td className="ro">{r.target}</td>
                  <td className="ro">{r.due}</td>
                  <td className="ro">{r.article}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="erp-hint">
        근로자 연말정산은 <a href="/profile?menu=yearEnd">12 연말정산</a>입니다.
        {role === "business" && <> 원천 3.3%는 <a href="/erp?role=business&view=withholding">원천세</a>입니다.</>}
      </p>
    </>
  );
}

export function UnlistedForm({ role }: { role?: OperatorRole }) {
  const corp = role === "corporation";
  const [input, setInput] = useState(emptyUnlistedCgt);
  const [shares, setShares] = useState(() => emptyShareChangeLines(4));
  const sheet = unlistedCgtSheet(input);

  function patchShare(i: number, next: Partial<ShareChangeLine>) {
    setShares(shares.map((l, idx) => (idx === i ? { ...l, ...next } : l)));
  }

  return (
    <>
      <TaxCaution />
      {corp ? (
        <>
          <h3>{CIT_FORM_54.form}</h3>
          <p className="erp-hint">
            {CIT_FORM_54.basis}. {CIT_FORM_54.plain}. 개인 양도세 예정신고가 아닙니다.
            기말 주식수는 기초·증가·감소를 다 넣은 뒤에만 계산합니다. 지분율은 계산하지 않습니다.
            식별번호는 비워도 됩니다. 넣어도 이 기기 CSV에만 가고 서버에 저장하지 않습니다.
          </p>
          <table className="erp-journal">
            <thead>
              <tr>
                {CIT_FORM_54.columns.map((c) => (
                  <th key={c.id}>{c.label}<em>{c.plain}</em></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shares.map((l, i) => (
                <tr key={l.id}>
                  <td><input value={l.name} onChange={(e) => patchShare(i, { name: e.target.value })} placeholder="성명 또는 법인명" /></td>
                  <td><input value={l.idNo} onChange={(e) => patchShare(i, { idNo: e.target.value })} placeholder="칸" autoComplete="off" /></td>
                  <td><SlotWonInput label="기초 주식수" value={l.opening} onChange={(n) => patchShare(i, { opening: n })} /></td>
                  <td><SlotWonInput label="증가 주식수" value={l.increase} onChange={(n) => patchShare(i, { increase: n })} /></td>
                  <td><SlotWonInput label="감소 주식수" value={l.decrease} onChange={(n) => patchShare(i, { decrease: n })} /></td>
                  <td className="ro num">{shareClosing(l) == null ? "칸" : String(shareClosing(l))}</td>
                  <td><input value={l.openingPct} onChange={(e) => patchShare(i, { openingPct: e.target.value })} placeholder="칸" /></td>
                  <td><input value={l.closingPct} onChange={(e) => patchShare(i, { closingPct: e.target.value })} placeholder="칸" /></td>
                  <td><input value={l.reason} onChange={(e) => patchShare(i, { reason: e.target.value })} placeholder="칸" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="erp-hint">
            <button type="button" onClick={() => setShares([...shares, ...emptyShareChangeLines(1).map((l) => ({ ...l, id: `sh${shares.length + 1}` }))])}>행 추가</button>
            {" · "}
            <button type="button" onClick={() => downloadCsv("주식등변동상황명세서-시산.csv", shareChangeCsv(shares))}>시산 CSV</button>
            {" · "}빈 행은 뺍니다. 원인코드표를 만들지 않습니다.
            {" · "}<a href="/erp?role=corporation&view=equity">자본금과 적립금 조정명세서</a>
            {" · "}<a href="/erp?role=corporation&view=cit">법인세</a>
          </p>
        </>
      ) : (
        <>
          <h3>양도소득세 예정신고</h3>
          <p className="erp-hint">
            소득세법 제105조. 비상장 주식을 팔았을 때 적는 칸입니다. 하반기(7~12월) 양도는 다음해 2월 말일.
            세율·대주주·보충적 평가는 만들지 않습니다. 특례는 세무사·국세청 126이 먼저입니다.
          </p>
          <p className="erp-hint erp-form-fields">
            {UNLISTED_CGT_FIELDS.map((f) => (
              <WonField
                key={f.id}
                label={`${f.label} (${f.plain})`}
                value={input[f.id]}
                onChange={(n) => setInput({ ...input, [f.id]: n })}
              />
            ))}
          </p>
          <div className="wehago-kpis">
            <div className="wehago-kpi"><span className="k">양도가액</span><span className="v">{won(sheet.proceeds)}</span><span className="s">판 값</span></div>
            <div className="wehago-kpi"><span className="k">취득·경비</span><span className="v">{won(sheet.acquisition + sheet.expenses)}</span><span className="s">산 값+비용</span></div>
            <div className="wehago-kpi"><span className="k">양도차익</span><span className="v">{won(sheet.gain)}</span><span className="s">세율 없음</span></div>
          </div>
          <p className="erp-hint">{sheet.note}</p>
          <p className="erp-hint">
            <button type="button" onClick={() => downloadCsv("양도소득세예정신고-시산.csv", unlistedCgtCsv(sheet, input))}>시산 CSV</button>
            {" · "}빈 칸은 0이 아닙니다. 홈택스 제출 파일이 아닙니다.
            {" · "}<a href="/erp?role=business&view=git">종소세</a>
          </p>
        </>
      )}
      <section className="wehago-widget wehago-widget-span">
        <h3>신고 달력</h3>
        <div className="body">
          <table className="erp-grid">
            <thead>
              <tr><th>신고</th><th>대상</th><th>기한</th><th>누구</th><th>근거</th></tr>
            </thead>
            <tbody>
              {UNLISTED_FILING_CALENDAR.map((r) => (
                <tr key={r.id}>
                  <td className="ro">{r.period}</td>
                  <td className="ro">{r.target}</td>
                  <td className="ro">{r.due}</td>
                  <td className="ro">{r.who}</td>
                  <td className="ro">{r.article}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
