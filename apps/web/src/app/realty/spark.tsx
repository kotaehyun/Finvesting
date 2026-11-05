export function RealtySpark({ values, up }: { values: number[]; up: boolean | null }) {
  if (values.length < 2) return <RealtySparkEmpty />;
  const w = 220;
  const h = 64;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = values.length === 1 ? w / 2 : (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.replace(",", " ")}`).join(" ");
  const last = pts[pts.length - 1];
  if (!last) return <RealtySparkEmpty />;
  const area = `${d} L${last.split(",")[0]} ${h} L0 ${h} Z`;
  return (
    <svg className={`index-spark${up == null ? "" : up ? " up" : " down"}`} viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" aria-hidden="true">
      <path d={area} fill="currentColor" opacity="0.14" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** 가짜 숫자가 아니라 빈 축만. */
export function RealtySparkEmpty() {
  return (
    <svg className="index-spark listing-empty" viewBox="0 0 220 64" width="100%" height={64} aria-hidden="true">
      <line x1="8" y1="56" x2="212" y2="56" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity="0.35" />
      <line x1="8" y1="12" x2="8" y2="56" stroke="currentColor" strokeWidth="1" opacity="0.2" />
    </svg>
  );
}
