"use client";
import { REALTY_LISTING_TYPES } from "@finvesting/core";
import { RealtySparkEmpty } from "./spark";

export function RealtyListingsPanel({ focusLabel }: { focusLabel: string | null }) {
  return (
    <div className="listing-grid">
      {focusLabel && (
        <p className="muted listing-focus">{focusLabel} 기준이어도 유형별 숫자는 전국 실거래 키 후입니다. 지금은 칸만.</p>
      )}
      {!focusLabel && (
        <p className="muted listing-focus">전국 기준 칸입니다. 시·구를 고르면 그 이름이 붙습니다.</p>
      )}
      {REALTY_LISTING_TYPES.map((t) => (
        <article key={t.id} className="listing-cell">
          <div className="muted">{t.label}</div>
          <div className="big" style={{ fontSize: 18 }}>—</div>
          <div className="muted">{t.molit} · 건수</div>
          <RealtySparkEmpty />
          <p className="muted" style={{ margin: "6px 0 0" }}>{t.need}</p>
        </article>
      ))}
    </div>
  );
}
