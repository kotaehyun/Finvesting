import {
  REALTY_BOK_AVG,
  REALTY_COFIX,
  REALTY_RATE_LINKS,
  REALTY_RATE_NOTE,
  formatRate,
  formatRateDelta,
  realtyRateSnapshot,
  type RealtyRateRow,
} from "@finvesting/core";

function RateTable({ rows }: { rows: RealtyRateRow[] }) {
  const groups = [...new Set(rows.map((r) => r.group))];
  return (
    <div className="table-wrap">
      <table className="realty-table">
        <thead>
          <tr>
            <th>구분</th>
            <th>항목</th>
            <th>금리</th>
            <th>전월비</th>
            <th>시점</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) =>
            rows.filter((r) => r.group === g).map((row, i) => (
              <tr key={row.id}>
                {i === 0 ? <td rowSpan={rows.filter((r) => r.group === g).length}>{g}</td> : null}
                <td>{row.label}</td>
                <td>{formatRate(row.rate)}</td>
                <td>{formatRateDelta(row.delta)}</td>
                <td>{row.asOf || "—"}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}

export function RealtyRatesPanel({ rows }: { rows?: RealtyRateRow[] }) {
  const a = REALTY_BOK_AVG;
  const c = REALTY_COFIX;
  const table = rows?.length ? rows : realtyRateSnapshot();
  return (
    <div className="rates-panel">
      <p className="muted" style={{ margin: "0 0 10px" }}>{REALTY_RATE_NOTE}</p>
      <p className="muted" style={{ margin: "0 0 8px" }}>
        {a.source}. {a.asOf} (공표 {a.published}). {c.source} {c.asOf} (공시 {c.published}, 다음 {c.next}).
        주담대 고정형 비중 {a.mortFixShare}% (전월 {a.mortFixShareDelta}%p).
      </p>
      <RateTable rows={table} />
      <div className="starter-list" style={{ marginTop: 10 }}>
        <a className="starter" href={REALTY_RATE_LINKS.bokJuly} target="_blank" rel="noreferrer">한은 7월 가중평균</a>
        <a className="starter" href={REALTY_RATE_LINKS.bokMpc} target="_blank" rel="noreferrer">금통위 기준금리</a>
        <a className="starter" href={REALTY_RATE_LINKS.cofix} target="_blank" rel="noreferrer">COFIX</a>
        <a className="starter" href={REALTY_RATE_LINKS.finlife} target="_blank" rel="noreferrer">금융상품한눈에</a>
        <a className="starter" href={REALTY_RATE_LINKS.bokCal} target="_blank" rel="noreferrer">한은 공표일정</a>
      </div>
    </div>
  );
}
