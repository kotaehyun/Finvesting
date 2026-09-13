type Axis = { label: string; ratio: number };

function point(i: number, n: number, scale: number, cx: number, cy: number, r: number) {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return { x: cx + Math.cos(a) * r * scale, y: cy + Math.sin(a) * r * scale };
}

function poly(axes: Axis[], n: number, scaleOf: (a: Axis) => number, cx: number, cy: number, r: number) {
  return axes.map((a, i) => {
    const p = point(i, n, scaleOf(a), cx, cy, r);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");
}

export function RadarChart({ title, axes }: { title: string; axes: Axis[] }) {
  const n = axes.length;
  if (n < 3) return null;
  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const r = 112;
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="erp-chart">
      <svg className="erp-svg" viewBox={`0 0 ${size} ${size + 8}`} role="img" aria-label={title}>
        <text className="erp-chart-title" x={12} y={18}>{title}</text>
        {rings.map((s) => (
          <polygon
            key={s}
            className="erp-radar-ring"
            points={poly(axes, n, () => s, cx, cy + 8, r)}
          />
        ))}
        {axes.map((_, i) => {
          const p = point(i, n, 1, cx, cy + 8, r);
          return <line key={i} className="erp-radar-spoke" x1={cx} y1={cy + 8} x2={p.x} y2={p.y} />;
        })}
        <polygon
          className="erp-radar-rec"
          points={poly(axes, n, () => 1, cx, cy + 8, r)}
        />
        <polygon
          className="erp-radar-cov"
          points={poly(axes, n, (a) => Math.max(0, Math.min(1, a.ratio)), cx, cy + 8, r)}
        />
        {axes.map((a, i) => {
          const p = point(i, n, 1.22, cx, cy + 8, r);
          return (
            <text key={a.label} className="erp-radar-label" x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle">
              {a.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
