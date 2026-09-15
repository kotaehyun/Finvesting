// BIS 중앙은행 정책금리(WS_CBPOL). 키 없음. 코드는 macro_indicators.code = BIS_POL_<ISO2>.
// 유로 회원국(독일·프랑스·이탈리아) 국내 시계열이 끊기면 유로 지역(XM)을 쓴다.

import { INFLATION_COUNTRIES } from "./inflation-countries";

export type PolicyRateCountry = { iso2: string; label: string };

export const ECB_AREA: PolicyRateCountry = { iso2: "XM", label: "유로" };
export const ECB_MEMBER_ISO2 = ["DE", "FR", "IT"] as const;

export const POLICY_RATE_COUNTRIES: readonly PolicyRateCountry[] = INFLATION_COUNTRIES;

export function bisPolCode(iso2: string): string {
  return `BIS_POL_${iso2.trim().toUpperCase()}`;
}

export function policyRateTone(pct: number): "hot" | "warm" | "ok" | "cool" {
  if (pct >= 10) return "hot";
  if (pct >= 5) return "warm";
  if (pct >= 2) return "ok";
  return "cool";
}

/** BIS 기간 `YYYY-MM`. 18개월보다 오래되면 끊긴 시계열로 본다. */
export function isPolicyPeriodStale(period: string, now = new Date()): boolean {
  const m = /^(\d{4})-(\d{2})$/.exec(period.trim());
  if (!m) return true;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (!Number.isFinite(y) || mo < 1 || mo > 12) return true;
  const months = (now.getUTCFullYear() - y) * 12 + (now.getUTCMonth() + 1 - mo);
  return months > 18;
}

export type BisPolicyObs = { iso2: string; period: string; value: number };

type SdmxDim = { id?: string; values?: Array<{ id?: string }> };
type SdmxJson = {
  data?: {
    structure?: { dimensions?: { series?: SdmxDim[]; observation?: SdmxDim[] } };
    dataSets?: Array<{ series?: Record<string, { observations?: Record<string, unknown> }> }>;
  };
};

function obsValue(raw: unknown): number | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

/** stats.bis.org SDMX-JSON. 확인: 2026-09-14 WS_CBPOL lastNObservations=1 */
export function parseBisCbpolJson(json: unknown): BisPolicyObs[] {
  const root = json as SdmxJson;
  const seriesDims = root.data?.structure?.dimensions?.series ?? [];
  const obsDims = root.data?.structure?.dimensions?.observation ?? [];
  const areas = seriesDims.find((d) => d.id === "REF_AREA")?.values ?? [];
  const times = obsDims.find((d) => d.id === "TIME_PERIOD")?.values ?? [];
  const series = root.data?.dataSets?.[0]?.series ?? {};
  const out: BisPolicyObs[] = [];
  for (const [key, ser] of Object.entries(series)) {
    const parts = key.split(":");
    const areaIdx = Number(parts[1] ?? parts[0]);
    const iso2 = (areas[areaIdx]?.id ?? "").toUpperCase();
    if (!iso2) continue;
    let best: { period: string; value: number } | null = null;
    for (const [obsIdx, raw] of Object.entries(ser.observations ?? {})) {
      const period = times[Number(obsIdx)]?.id ?? "";
      const value = obsValue(raw);
      if (!period || value == null) continue;
      if (!best || period > best.period) best = { period, value };
    }
    if (best) out.push({ iso2, period: best.period, value: best.value });
  }
  return out;
}

export function bisPeriodToDate(period: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(period.trim());
  if (m) return `${m[1]}-${m[2]}-01`;
  return `${period}-01-01`;
}
