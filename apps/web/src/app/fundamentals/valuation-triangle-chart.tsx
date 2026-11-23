"use client";

import {
  formatFundamentalValue,
  valuationTrianglePolygon,
  valuationTriangleVertex,
  type ValuationTriangle,
} from "@finvesting/core";

const CX = 120;
const CY = 118;
const R = 78;

type Props = {
  title: string;
  triangle: ValuationTriangle;
  currency: string;
  derived?: boolean;
};

export function ValuationTriangleChart({ title, triangle, currency, derived }: Props) {
  if (triangle.status !== "ok") {
    return (
      <div className="fund-triangle-panel">
        <h3>{title}</h3>
        <p className="erp-hint">{triangle.scaleNote}</p>
      </div>
    );
  }

  const byId = Object.fromEntries(triangle.axes.map((a) => [a.id, a]));
  const scores = {
    roe: byId.roe!.score,
    per: byId.per!.score,
    pbr: byId.pbr!.score,
  };
  const outer = (["roe", "per", "pbr"] as const).map((id) => valuationTriangleVertex(id, CX, CY, R));
  const mid = (["roe", "per", "pbr"] as const).map((id) => valuationTriangleVertex(id, CX, CY, R * 0.5));
  const poly = valuationTrianglePolygon(scores, CX, CY, R);
  const outerPts = outer.map((p) => `${p.x},${p.y}`).join(" ");
  const midPts = mid.map((p) => `${p.x},${p.y}`).join(" ");
  const polyPts = poly.map((p) => `${p.x},${p.y}`).join(" ");

  const labels: Record<string, { x: number; y: number }> = {
    roe: { x: CX, y: CY - R - 14 },
    per: { x: CX - R - 8, y: CY + R * 0.72 },
    pbr: { x: CX + R + 8, y: CY + R * 0.72 },
  };

  return (
    <div className="fund-triangle-panel">
      <h3>
        {title}
        {derived ? <span className="tax-tag accent" style={{ marginLeft: 8, textTransform: "none" }}>시총추정</span> : null}
      </h3>
      <div className="fund-triangle-body">
        <svg
          className="fund-triangle-svg"
          viewBox="0 0 240 230"
          role="img"
          aria-label={`${title} ROE PER PBR 그림`}
        >
          <polygon points={outerPts} className="fund-triangle-frame" />
          <polygon points={midPts} className="fund-triangle-grid" />
          {outer.map((p) => (
            <line key={`${p.x}-${p.y}`} x1={CX} y1={CY} x2={p.x} y2={p.y} className="fund-triangle-spoke" />
          ))}
          <polygon points={polyPts} className="fund-triangle-fill" />
          {poly.map((p) => (
            <circle key={p.id} cx={p.x} cy={p.y} r={3.5} className="fund-triangle-dot" />
          ))}
          {triangle.axes.map((a) => {
            const pos = labels[a.id]!;
            const text =
              a.id === "roe"
                ? formatFundamentalValue("roe", a.raw, currency)
                : a.id === "per"
                  ? formatFundamentalValue("per", a.raw, currency)
                  : formatFundamentalValue("pbr", a.raw, currency);
            return (
              <text
                key={a.id}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                className="fund-triangle-label"
              >
                {a.label} {text}
              </text>
            );
          })}
        </svg>
        <p className="erp-hint fund-triangle-note">
          바깥으로 갈수록 수익성↑·비쌈↓ (점수 아님)
          {triangle.scaleNote ? <><br />{triangle.scaleNote}</> : null}
        </p>
      </div>
    </div>
  );
}
