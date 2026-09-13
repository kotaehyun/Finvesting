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

export function PayYearSection({ points, year }: { points: PayYearPoint[]; year?: PayYearPoint }) {
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
    </>
  );
}
