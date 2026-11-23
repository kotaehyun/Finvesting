/** 시세·손익 색. CSS `--tone-*`와 맞춘다. 캔버스·인라인 스타일용. */

export type ToneKey = "up" | "down" | "flat" | "warn";

const FALLBACK: Record<ToneKey, string> = {
  up: "#dc2626",
  down: "#2563eb",
  flat: "#5c6470",
  warn: "#ea580c",
};

export function toneColor(key: ToneKey): string {
  if (typeof window === "undefined") return FALLBACK[key];
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(`--tone-${key}`)
    .trim();
  return raw || FALLBACK[key];
}

export function toneColors(): Record<ToneKey, string> {
  return {
    up: toneColor("up"),
    down: toneColor("down"),
    flat: toneColor("flat"),
    warn: toneColor("warn"),
  };
}
