/**
 * ROE·PER·PBR 삼각 차트용 스케일.
 * 숫자는 Yahoo 스냅샷만 쓴다. score는 도형용 0~1이며 투자 점수·목표가 아니다.
 * 피어가 3개 이상이면 표시 목록 대비 순위, 부족하면 절대 축(ROE 30%·PER 40·PBR 5).
 */

export type ValuationTriangleMetrics = {
  roe: number | null;
  per: number | null;
  pbr: number | null;
};

/**
 * Yahoo 국내(.KS)는 trailingPE·priceToBook이 자주 비어 있다.
 * 같은 스냅샷의 시총·순이익(TTM)·ROE로만 채운다.
 * PER ≈ 시총/순이익, PBR ≈ PER×ROE (= 시총/(순이익/ROE)).
 * 만든 값이 아니라 저장된 칸의 나눗셈이다.
 */
export function fillMissingPerPbr(input: {
  per: number | null;
  pbr: number | null;
  roe: number | null;
  marketCap: number | null;
  netIncomeTtm: number | null;
}): {
  per: number | null;
  pbr: number | null;
  filledPer: boolean;
  filledPbr: boolean;
} {
  let per = input.per != null && Number.isFinite(input.per) && input.per > 0 ? input.per : null;
  let pbr = input.pbr != null && Number.isFinite(input.pbr) && input.pbr > 0 ? input.pbr : null;
  let filledPer = false;
  let filledPbr = false;

  const mcap = input.marketCap;
  const ni = input.netIncomeTtm;
  if (per == null && mcap != null && mcap > 0 && ni != null && ni > 0) {
    per = mcap / ni;
    filledPer = true;
  }
  const roe = input.roe;
  if (pbr == null && per != null && per > 0 && roe != null && Number.isFinite(roe) && roe > 0) {
    pbr = per * roe;
    filledPbr = true;
  }
  return { per, pbr, filledPer, filledPbr };
}

/** 삼각을 그릴 수 있는지. PER·PBR은 양수, ROE는 숫자만 있으면 됨(음수 가능). */
export function hasValuationTriangleMetrics(m: ValuationTriangleMetrics): boolean {
  return m.roe != null && Number.isFinite(m.roe)
    && m.per != null && Number.isFinite(m.per) && m.per > 0
    && m.pbr != null && Number.isFinite(m.pbr) && m.pbr > 0;
}

/** 비어 있거나 양수가 아닌 축 이름. 안내 문구용. */
export function missingValuationTriangleFields(m: ValuationTriangleMetrics): string[] {
  const miss: string[] = [];
  if (m.roe == null || !Number.isFinite(m.roe)) miss.push("ROE");
  if (m.per == null || !Number.isFinite(m.per) || !(m.per > 0)) miss.push("PER");
  if (m.pbr == null || !Number.isFinite(m.pbr) || !(m.pbr > 0)) miss.push("PBR");
  return miss;
}

export type ValuationTriangleAxisId = "roe" | "per" | "pbr";

export type ValuationTriangleAxis = {
  id: ValuationTriangleAxisId;
  label: string;
  /** 원본. ROE는 Yahoo 비율(0.15=15%). */
  raw: number;
  /** 도형 반지름 비율 0~1. */
  score: number;
  scale: "peer" | "absolute";
};

export type ValuationTriangle = {
  status: "ok" | "empty";
  axes: ValuationTriangleAxis[];
  scaleNote: string;
};

/** 절대 축 상한. 차트 표시용이며 고시·권고가 아니다. */
export const VALUATION_TRIANGLE_ABS = {
  roeCap: 0.3,
  perCap: 40,
  pbrCap: 5,
} as const;

const AXIS_META: Record<ValuationTriangleAxisId, { label: string; higherBetter: boolean }> = {
  roe: { label: "ROE", higherBetter: true },
  per: { label: "PER", higherBetter: false },
  pbr: { label: "PBR", higherBetter: false },
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** 값이 클수록 높은 순위(0~1). 자기 포함 peers. */
export function peerRankScore(value: number, peers: number[], higherBetter: boolean): number {
  const list = peers.filter((n) => Number.isFinite(n));
  if (list.length <= 1) return 0.5;
  let better = 0;
  for (const p of list) {
    if (higherBetter ? p < value : p > value) better += 1;
  }
  return clamp01(better / (list.length - 1));
}

export function absoluteTriangleScore(
  id: ValuationTriangleAxisId,
  raw: number,
): number {
  if (id === "roe") {
    if (raw <= 0) return 0;
    return clamp01(raw / VALUATION_TRIANGLE_ABS.roeCap);
  }
  if (raw <= 0) return 0;
  if (id === "per") return clamp01(1 - raw / VALUATION_TRIANGLE_ABS.perCap);
  return clamp01(1 - raw / VALUATION_TRIANGLE_ABS.pbrCap);
}

/**
 * 세 값이 모두 있을 때만 ok.
 * peers는 같은 화면의 주식 행(자기 포함). 메트릭별 유효값이 3개 미만이면 절대 축.
 */
export function buildValuationTriangle(
  target: ValuationTriangleMetrics,
  peers: ValuationTriangleMetrics[] = [],
): ValuationTriangle {
  const missing = missingValuationTriangleFields(target);
  if (missing.length) {
    return {
      status: "empty",
      axes: [],
      scaleNote: `${missing.join("·")}이(가) 비어 있거나 양수가 아니라 삼각을 그리지 않습니다. 시총·순이익(TTM)·ROE가 있으면 표에서 PER·PBR을 시총추정으로 채웁니다.`,
    };
  }

  const ids: ValuationTriangleAxisId[] = ["roe", "per", "pbr"];
  const axes: ValuationTriangleAxis[] = [];
  let usedPeer = false;

  for (const id of ids) {
    const raw = target[id] as number;
    const peerVals = peers
      .map((p) => p[id])
      .filter((n): n is number => n != null && Number.isFinite(n) && (id === "roe" || n > 0));
    const usePeer = peerVals.length >= 3;
    if (usePeer) usedPeer = true;
    const score = usePeer
      ? peerRankScore(raw, peerVals, AXIS_META[id].higherBetter)
      : absoluteTriangleScore(id, raw);
    axes.push({
      id,
      label: AXIS_META[id].label,
      raw,
      score,
      scale: usePeer ? "peer" : "absolute",
    });
  }

  return {
    status: "ok",
    axes,
    scaleNote: usedPeer
      ? "바깥쪽일수록 표시 중인 주식 대비 ROE는 높고 PER·PBR은 낮습니다. 순위 스케일이며 투자 점수가 아닙니다."
      : `바깥쪽일수록 ROE는 높고 PER·PBR은 낮습니다. 절대 축(ROE ${VALUATION_TRIANGLE_ABS.roeCap * 100}%·PER ${VALUATION_TRIANGLE_ABS.perCap}·PBR ${VALUATION_TRIANGLE_ABS.pbrCap})이며 투자 점수가 아닙니다.`,
  };
}

/** 정삼각형 꼭짓점. 위=ROE, 왼아래=PER, 오른아래=PBR. cx,cy 중심, r 바깥 반지름. */
export function valuationTriangleVertex(
  id: ValuationTriangleAxisId,
  cx: number,
  cy: number,
  r: number,
): { x: number; y: number } {
  const angle = id === "roe" ? -Math.PI / 2 : id === "per" ? (5 * Math.PI) / 6 : Math.PI / 6;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

/** score 0~1로 중심→꼭짓점 보간한 폴리곤 점. */
export function valuationTrianglePolygon(
  scores: { roe: number; per: number; pbr: number },
  cx: number,
  cy: number,
  r: number,
): Array<{ id: ValuationTriangleAxisId; x: number; y: number }> {
  return (["roe", "per", "pbr"] as const).map((id) => {
    const tip = valuationTriangleVertex(id, cx, cy, r * clamp01(scores[id]));
    return { id, x: tip.x, y: tip.y };
  });
}
