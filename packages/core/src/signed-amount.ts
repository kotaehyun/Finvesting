/** 평가손익 표시. 한국 시세와 같이 양수는 상승(적), 음수는 하락(청). */

export type PnlTone = "up" | "down" | "flat";

export function pnlTone(n: number): PnlTone {
  const r = Math.round(n);
  if (r > 0) return "up";
  if (r < 0) return "down";
  return "flat";
}

export function signedWon(n: number): string {
  const r = Math.round(n);
  const body = `${Math.abs(r).toLocaleString("ko-KR")}원`;
  if (r > 0) return `+${body}`;
  if (r < 0) return `-${body}`;
  return "0원";
}

/** rate는 0.1 = 10%. */
export function signedPct(rate: number, digits = 1): string {
  const v = rate * 100;
  if (Object.is(v, -0) || v === 0) return `${(0).toFixed(digits)}%`;
  const body = `${Math.abs(v).toFixed(digits)}%`;
  return v > 0 ? `+${body}` : `-${body}`;
}
