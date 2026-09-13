const W = 640;
const H = 220;
const L = 58;
const R = 16;
const T = 28;
const B = 36;

function ticks(max: number) {
  if (!(max > 0)) return [0, 1];
  const raw = max / 2;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = Math.ceil(raw / mag) * mag;
  return [0, step, step * 2].filter((n, i, a) => n <= max * 1.05 || i === a.length - 1);
}

function fmt(n: number) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}만`;
  return n.toLocaleString("ko-KR");
}

export function ComboChart({ title, xLabel, yLabel, points, showTable = true }: {
  title: string;
  xLabel: string;
  yLabel: string;
  points: Array<{ x: string; y: number }>;
  showTable?: boolean;
}) {
  const max = Math.max(1, ...points.map((p) => p.y));
  const ys = ticks(max);
  const yMax = ys[ys.length - 1] ?? max;
  const innerW = W - L - R;
  const innerH = H - T - B;
  const n = Math.max(1, points.length);
  const gap = innerW / n;
  const barW = Math.min(36, gap * 0.5);
  const xs = points.map((_, i) => L + gap * i + gap / 2);
  const yOf = (v: number) => T + innerH - (v / yMax) * innerH;
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${yOf(p.y)}`).join(" ");

  return (
    <div className="erp-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="erp-svg">
        <text x={W / 2} y={16} textAnchor="middle" className="erp-chart-title">{title}</text>
        <text x={14} y={H / 2} textAnchor="middle" transform={`rotate(-90 14 ${H / 2})`} className="erp-chart-axis">{yLabel}</text>
        <text x={W / 2} y={H - 4} textAnchor="middle" className="erp-chart-axis">{xLabel}</text>
        {ys.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={yOf(v)} y2={yOf(v)} className="erp-chart-gridline" />
            <text x={L - 6} y={yOf(v) + 3} textAnchor="end" className="erp-chart-tick">{fmt(v)}</text>
          </g>
        ))}
        <line x1={L} x2={L} y1={T} y2={T + innerH} className="erp-chart-axisline" />
        <line x1={L} x2={W - R} y1={T + innerH} y2={T + innerH} className="erp-chart-axisline" />
        {points.map((p, i) => (
          <rect
            key={`b-${p.x}`}
            x={xs[i]! - barW / 2}
            y={yOf(p.y)}
            width={barW}
            height={Math.max(0, T + innerH - yOf(p.y))}
            className="erp-chart-bar"
          />
        ))}
        {points.length > 1 && <path d={line} className="erp-chart-line" />}
        {points.map((p, i) => (
          <circle key={`d-${p.x}`} cx={xs[i]} cy={yOf(p.y)} r={3.5} className="erp-chart-dot" />
        ))}
        {points.map((p, i) => (
          <text key={`x-${p.x}`} x={xs[i]} y={T + innerH + 14} textAnchor="middle" className="erp-chart-tick">{p.x.slice(5)}</text>
        ))}
      </svg>
      {showTable && (
        <table className="erp-grid" style={{ marginTop: 8 }}>
          <thead><tr><th>{xLabel}</th><th className="num">{yLabel}</th></tr></thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.x}>
                <td className="ro">{p.x}</td>
                <td className="ro num">{Math.round(p.y).toLocaleString("ko-KR")}원</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
