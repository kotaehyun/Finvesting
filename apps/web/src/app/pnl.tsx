import { pnlTone, signedPct, signedWon } from "@finvesting/core";

export function Pnl({
  n,
  rate,
  className,
}: {
  n: number;
  rate?: number | null;
  className?: string;
}) {
  const text = rate != null ? `${signedWon(n)} (${signedPct(rate)})` : signedWon(n);
  return <span className={["pnl", pnlTone(n), className].filter(Boolean).join(" ")}>{text}</span>;
}
