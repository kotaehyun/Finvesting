import { PAY_EARNING_GROUP_LABEL, yearEndSettlement, yearEndWageSlip } from "@finvesting/core";
import { ComboChart } from "./combo-chart";

export type PayYearPoint = {
  month: string;
  base: number;
  allowance: number;
  bonus: number;
  other: number;
  gross: number;
  tax: number;
  insurance: number;
  net: number;
};

function won(n: number) {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

export function PayYearSection({
  points, year,
}: {
  points: PayYearPoint[];
  year?: PayYearPoint;
  monthlyPension?: number;
}) {
  if (!points.length) return null;
  const y = year;
  return (
    <>
      <h3 style={{ marginTop: 20 }}>연봉 추이 — 최근 12개월</h3>
      <p className="erp-hint">
        기본급·세금(소득세+지방세)·4대보험·세전 월급여. 해당 월 명세서를 저장하면 그 달이 남습니다.
        표 맨 아래 합계가 연 누적입니다.
      </p>
      <div className="erp-chart-grid">
        <ComboChart title="기본급" xLabel="월(X)" yLabel="기본급(Y)" showTable={false} points={points.map((p) => ({ x: p.month, y: p.base }))} />
        <ComboChart title="세금" xLabel="월(X)" yLabel="세금(Y)" showTable={false} points={points.map((p) => ({ x: p.month, y: p.tax }))} />
        <ComboChart title="보험" xLabel="월(X)" yLabel="보험(Y)" showTable={false} points={points.map((p) => ({ x: p.month, y: p.insurance }))} />
        <ComboChart title="세전 월급여" xLabel="월(X)" yLabel="세전(Y)" showTable={false} points={points.map((p) => ({ x: p.month, y: p.gross }))} />
      </div>
      <h3 style={{ marginTop: 16 }}>12개월 상세내역</h3>
      <table className="erp-grid">
        <thead>
          <tr>
            <th>월</th>
            <th className="num">기본급</th>
            <th className="num">수당</th>
            <th className="num">상여·성과</th>
            <th className="num">그 밖</th>
            <th className="num">세전</th>
            <th className="num">세금</th>
            <th className="num">보험</th>
            <th className="num">실수령</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.month}>
              <td className="ro">{p.month}</td>
              <td className="ro num">{p.base ? won(p.base) : "—"}</td>
              <td className="ro num">{p.allowance ? won(p.allowance) : "—"}</td>
              <td className="ro num">{p.bonus ? won(p.bonus) : "—"}</td>
              <td className="ro num">{p.other ? won(p.other) : "—"}</td>
              <td className="ro num">{p.gross ? won(p.gross) : "—"}</td>
              <td className="ro num">{p.tax ? won(p.tax) : "—"}</td>
              <td className="ro num">{p.insurance ? won(p.insurance) : "—"}</td>
              <td className="ro num">{p.net ? won(p.net) : "—"}</td>
            </tr>
          ))}
        </tbody>
        {y && (
          <tfoot>
            <tr>
              <td>연 합계</td>
              <td className="num">{won(y.base)}</td>
              <td className="num">{won(y.allowance)}</td>
              <td className="num">{won(y.bonus)}</td>
              <td className="num">{won(y.other)}</td>
              <td className="num">{won(y.gross)}</td>
              <td className="num">{won(y.tax)}</td>
              <td className="num">{won(y.insurance)}</td>
              <td className="num">{won(y.net)}</td>
            </tr>
          </tfoot>
        )}
      </table>
      {y && y.gross > 0 && <p className="erp-hint">연말정산 업무(연간 명세·과세표준)는 <a href="/profile?menu=yearEnd">12 연말정산</a>에 있습니다.</p>}
    </>
  );
}

export function YearEndBlock({ year, annualPension }: { year: PayYearPoint; annualPension: number }) {
  const slip = yearEndWageSlip(year);
  const settle = yearEndSettlement(year, annualPension);
  const earnGroups = (["monthly", "irregular", "custom"] as const).map((g) => ({
    g,
    rows: slip.earnings.filter((r) => r.group === g),
  })).filter((x) => x.rows.length);
  const lines: Array<{ group: string; span: number; name: string; amount: number } | null> = [];
  for (const { g, rows } of earnGroups) {
    rows.forEach((r, i) => {
      lines.push({
        group: i === 0 ? PAY_EARNING_GROUP_LABEL[g] : "",
        span: i === 0 ? rows.length : 0,
        name: r.name,
        amount: r.amount,
      });
    });
  }
  const n = Math.max(lines.length, slip.deductions.length);
  return (
    <>
      <h3 style={{ marginTop: 20 }}>연말정산 — 연간 임금명세서</h3>
      <p className="erp-hint">
        근로기준법 시행령 제27조의2 · 고용노동부 임금명세서 작성 예시(지급|공제 양란)의 12개월 합입니다.
        수당·상여는 월 합계만 모읍니다. 홈택스 제출서가 아니며 부양가족·의료비·카드 공제는 없습니다.
      </p>
      <div className="erp-slip">
        <table className="erp-grid">
          <thead>
            <tr>
              <th style={{ width: 120 }}>구분</th>
              <th>임금 항목</th>
              <th className="num" style={{ width: 140 }}>지급 금액</th>
              <th>공제 항목</th>
              <th className="num" style={{ width: 140 }}>공제 금액</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: n }, (_, i) => {
              const line = lines[i];
              const d = slip.deductions[i];
              return (
                <tr key={line?.name ?? d?.name ?? i}>
                  {line?.span ? <td className="ro" rowSpan={line.span}>{line.group}</td> : !line ? <td className="ro" /> : null}
                  <td className="ro">{line?.name ?? ""}</td>
                  <td className="ro num">{line && line.amount ? won(line.amount) : line ? "" : ""}</td>
                  <td className="ro">{d?.name ?? ""}</td>
                  <td className="ro num">{d && d.amount ? won(d.amount) : d ? "" : ""}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="ro" colSpan={2}>지급액 계</td>
              <td className="ro num">{won(slip.payTotal)}</td>
              <td className="ro">공제액 계</td>
              <td className="ro num">{won(slip.deductTotal)}</td>
            </tr>
            <tr>
              <td className="ro" colSpan={3}>실수령액</td>
              <td className="ro" colSpan={2}>{won(slip.net)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <h3 style={{ marginTop: 16 }}>연말정산 — 과세표준 기초</h3>
      <p className="erp-hint">
        소득세법 제47조 근로소득공제 · 본인 기본공제 150만. 국민연금 공제는 세전이 있는 달 × 현재 월 국민연금입니다.
        기납부세액은 12개월 세금 합입니다. 결정세액·환급은 간이세액표가 없어 계산하지 않습니다.
      </p>
      <table className="erp-grid">
        <thead>
          <tr>
            <th>항목</th>
            <th>근거</th>
            <th className="num">금액</th>
          </tr>
        </thead>
        <tbody>
          <tr><td className="ro">총급여</td><td className="ro">12개월 세전 합</td><td className="ro num">{won(settle.annualGross)}</td></tr>
          <tr><td className="ro">근로소득공제</td><td className="ro">소득세법 제47조</td><td className="ro num">{won(settle.earnedIncomeDeduction)}</td></tr>
          <tr><td className="ro">근로소득금액</td><td className="ro">총급여 − 근로소득공제</td><td className="ro num">{won(settle.earnedIncome)}</td></tr>
          <tr><td className="ro">본인 기본공제</td><td className="ro">150만원</td><td className="ro num">{won(settle.personalExemption)}</td></tr>
          <tr><td className="ro">연금보험료공제</td><td className="ro">세전 있는 달의 국민연금 합(현재 월 × 달 수)</td><td className="ro num">{settle.pensionDeduction ? won(settle.pensionDeduction) : "—"}</td></tr>
          <tr><td className="ro">소득세 과세표준</td><td className="ro">근로소득금액 − 공제</td><td className="ro num">{won(settle.taxableBase)}</td></tr>
          <tr><td className="ro">기납부 소득세·지방세</td><td className="ro">12개월 세금 합</td><td className="ro num">{won(settle.prepaidTax)}</td></tr>
          <tr><td className="ro">기납부 4대보험</td><td className="ro">12개월 보험 합</td><td className="ro num">{won(settle.prepaidInsurance)}</td></tr>
        </tbody>
      </table>
    </>
  );
}
