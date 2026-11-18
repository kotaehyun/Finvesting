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

type LoanChartPoint = { date: string; value: number };

function chartLabel(n: number) {
  const abs = Math.abs(n);
  const digits = abs >= 100 ? 0 : 1;
  return n.toLocaleString("ko-KR", { maximumFractionDigits: digits });
}

function monthLabel(date: string) {
  return `${date.slice(2, 4)}.${date.slice(5, 7)}`;
}

/** 고른 광역시도 말잔을 3D 막대로. 점이 없으면 바닥만 둔다. 눈금은 0이 아니라 이 구간의 최저·최고. */
export function RealtyLoanBars({ points, caption }: { points: LoanChartPoint[]; caption: string }) {
  const w = 640;
  const h = 228;
  const padL = 48;
  const padR = 22;
  const padT = 26;
  const padB = 30;
  const dx = 8;
  const dy = 6;
  if (points.length < 1) {
    return (
      <figure className="loan-chart loan-bars">
        <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={caption}>
          <line x1={padL} x2={w - padR} y1={h - padB} y2={h - padB} stroke="currentColor" opacity="0.28" />
          <text x={(padL + w - padR) / 2} y={h / 2} textAnchor="middle" fontSize="13" fill="currentColor" opacity="0.7">
            시계열이 없습니다
          </text>
        </svg>
        <figcaption>{caption}</figcaption>
      </figure>
    );
  }
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || Math.abs(max) * 0.08 || 1;
  const y0 = min - span * 0.16;
  const y1 = max + span * 0.2;
  const innerW = w - padL - padR - dx;
  const innerH = h - padT - padB;
  const slot = innerW / points.length;
  const bw = Math.max(3, Math.min(18, slot * 0.62));
  const yOf = (v: number) => padT + innerH - ((v - y0) / (y1 - y0)) * innerH;
  const base = padT + innerH;
  const last = points.length - 1;
  const yTicks = [min, (min + max) / 2, max];
  const step = Math.max(1, Math.round(points.length / 4));
  const xIdx = [...new Set([0, ...Array.from({ length: points.length }, (_, i) => i).filter((i) => i % step === 0), last])];
  return (
    <figure className="loan-chart loan-bars">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={caption}>
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={padL} x2={w - padR} y1={yOf(v)} y2={yOf(v)} stroke="currentColor" opacity="0.12" />
            <text x={padL - 6} y={yOf(v) + 3} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.72">
              {chartLabel(v)}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const x = padL + i * slot + (slot - bw) / 2;
          const y = yOf(p.value);
          const on = i === last;
          const front = on ? 0.95 : 0.62;
          return (
            <g key={p.date}>
              <polygon
                points={`${x + bw},${y} ${x + bw + dx},${y - dy} ${x + bw + dx},${base - dy} ${x + bw},${base}`}
                fill="currentColor"
                opacity={on ? 0.55 : 0.32}
              />
              <polygon
                points={`${x},${y} ${x + dx},${y - dy} ${x + bw + dx},${y - dy} ${x + bw},${y}`}
                fill="currentColor"
                opacity={on ? 0.85 : 0.48}
              />
              <rect x={x} y={y} width={bw} height={Math.max(1, base - y)} fill="currentColor" opacity={front} />
            </g>
          );
        })}
        <text x={padL + last * slot + slot / 2 + dx} y={yOf(points[last]!.value) - dy - 6} textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor">
          {chartLabel(points[last]!.value)}
        </text>
        {xIdx.map((i) => (
          <text
            key={points[i]!.date}
            x={padL + i * slot + slot / 2}
            y={h - 8}
            textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
            fontSize="11"
            fill="currentColor"
            opacity="0.72"
          >
            {monthLabel(points[i]!.date)}
          </text>
        ))}
      </svg>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/** 고른 광역시도의 저장된 점만 잇는다. 점이 없으면 축만 둔다. */
export function RealtyLoanChart({
  points,
  caption,
  tone = "balance",
  compact = false,
}: {
  points: LoanChartPoint[];
  caption: string;
  tone?: "balance" | "up" | "down";
  compact?: boolean;
}) {
  const w = 320;
  const h = compact ? 108 : 148;
  const padL = 40;
  const padR = 8;
  const padT = 10;
  const padB = 22;
  if (points.length < 2) {
    return (
      <figure className={`loan-chart ${tone}`}>
        <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={caption}>
          <line x1={padL} x2={w - padR} y1={h - padB} y2={h - padB} stroke="currentColor" opacity="0.28" />
          <text x={(padL + w - padR) / 2} y={h / 2} textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.7">
            시계열이 없습니다
          </text>
        </svg>
        <figcaption>{caption}</figcaption>
      </figure>
    );
  }
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || Math.abs(max) * 0.08 || 1;
  const y0 = min - span * 0.12;
  const y1 = max + span * 0.12;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const xOf = (i: number) => padL + (i / (points.length - 1)) * innerW;
  const yOf = (v: number) => padT + innerH - ((v - y0) / (y1 - y0)) * innerH;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)} ${yOf(p.value).toFixed(1)}`).join(" ");
  const last = points.length - 1;
  const area = `${d} L${xOf(last).toFixed(1)} ${padT + innerH} L${xOf(0).toFixed(1)} ${padT + innerH} Z`;
  const yTicks = [min, (min + max) / 2, max];
  const xIdx = [0, Math.floor(last / 2), last].filter((v, i, a) => a.indexOf(v) === i);
  return (
    <figure className={`loan-chart ${tone}`}>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={caption}>
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={padL} x2={w - padR} y1={yOf(v)} y2={yOf(v)} stroke="currentColor" opacity="0.14" />
            <text x={padL - 4} y={yOf(v) + 3} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">
              {chartLabel(v)}
            </text>
          </g>
        ))}
        <path d={area} fill="currentColor" opacity="0.14" />
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={xOf(last)} cy={yOf(points[last]!.value)} r="3.2" fill="currentColor" />
        {xIdx.map((i) => (
          <text
            key={points[i]!.date}
            x={xOf(i)}
            y={h - 6}
            textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
            fontSize="10"
            fill="currentColor"
            opacity="0.7"
          >
            {monthLabel(points[i]!.date)}
          </text>
        ))}
      </svg>
      <figcaption>{caption}</figcaption>
    </figure>
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
