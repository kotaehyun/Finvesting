// 프로필 투자성향 설문 → 배분 위험 성향·조언. 증권사 적합성 설문이 아니라 내부 경험 규칙.
// 점수는 문항당 0~3, 합 0~12. 0–4 보수, 5–8 중립, 9–12 공격.

import {
  RISK_INVEST_SHARE,
  RISK_TOLERANCE_LABEL,
  type RiskTolerance,
} from "./allocation";

export const HORIZON_OPTIONS = [
  { id: "lt1", label: "1년 미만", score: 0 },
  { id: "y1to5", label: "1~5년", score: 1 },
  { id: "y5to10", label: "5~10년", score: 2 },
  { id: "over10", label: "10년 이상", score: 3 },
] as const;

export const EXPERIENCE_OPTIONS = [
  { id: "none", label: "거의 없음", score: 0 },
  { id: "deposit", label: "예적금·펀드", score: 1 },
  { id: "direct", label: "주식·ETF 직접", score: 2 },
  { id: "active", label: "단기매매·파생·코인", score: 3 },
] as const;

export const LOSS_OPTIONS = [
  { id: "lt10", label: "10% 미만", score: 0 },
  { id: "p10to20", label: "10~20%", score: 1 },
  { id: "p20to30", label: "20~30%", score: 2 },
  { id: "over30", label: "30% 초과", score: 3 },
] as const;

export const GOAL_OPTIONS = [
  { id: "preserve", label: "원금 보전", score: 0 },
  { id: "income", label: "배당·이자 현금흐름", score: 1 },
  { id: "grow", label: "장기 자산 증식", score: 2 },
  { id: "speculate", label: "고위험 기회", score: 3 },
] as const;

export type HorizonId = (typeof HORIZON_OPTIONS)[number]["id"];
export type ExperienceId = (typeof EXPERIENCE_OPTIONS)[number]["id"];
export type LossOkId = (typeof LOSS_OPTIONS)[number]["id"];
export type GoalId = (typeof GOAL_OPTIONS)[number]["id"];

export type InvestStyleAnswers = {
  horizon: HorizonId | "";
  experience: ExperienceId | "";
  lossOk: LossOkId | "";
  goal: GoalId | "";
};

export const EMPTY_INVEST_STYLE: InvestStyleAnswers = {
  horizon: "",
  experience: "",
  lossOk: "",
  goal: "",
};

const RISKY_CLASSES = new Set(["stock", "etf", "crypto", "other"]);

function pickId<T extends string>(raw: unknown, ids: readonly T[]): T | "" {
  return typeof raw === "string" && (ids as readonly string[]).includes(raw) ? (raw as T) : "";
}

export function parseInvestStyle(raw: unknown): InvestStyleAnswers {
  if (!raw || typeof raw !== "object") return { ...EMPTY_INVEST_STYLE };
  const o = raw as Record<string, unknown>;
  return {
    horizon: pickId(o.horizon, HORIZON_OPTIONS.map((x) => x.id)),
    experience: pickId(o.experience, EXPERIENCE_OPTIONS.map((x) => x.id)),
    lossOk: pickId(o.lossOk, LOSS_OPTIONS.map((x) => x.id)),
    goal: pickId(o.goal, GOAL_OPTIONS.map((x) => x.id)),
  };
}

export function investStyleComplete(a: InvestStyleAnswers): boolean {
  return Boolean(a.horizon && a.experience && a.lossOk && a.goal);
}

export function investStyleScore(a: InvestStyleAnswers): number | null {
  if (!investStyleComplete(a)) return null;
  const h = HORIZON_OPTIONS.find((x) => x.id === a.horizon)!.score;
  const e = EXPERIENCE_OPTIONS.find((x) => x.id === a.experience)!.score;
  const l = LOSS_OPTIONS.find((x) => x.id === a.lossOk)!.score;
  const g = GOAL_OPTIONS.find((x) => x.id === a.goal)!.score;
  return h + e + l + g;
}

export function suggestedRiskFromScore(score: number): RiskTolerance {
  if (score <= 4) return "conservative";
  if (score <= 8) return "moderate";
  return "aggressive";
}

export function investStyleAxes(a: InvestStyleAnswers): Array<{ id: string; label: string; score: number; ratio: number }> {
  const row = (
    id: string,
    label: string,
    opt: { score: number } | undefined,
  ) => ({ id, label, score: opt?.score ?? 0, ratio: (opt?.score ?? 0) / 3 });
  return [
    row("horizon", "투자기간", HORIZON_OPTIONS.find((x) => x.id === a.horizon)),
    row("experience", "경험", EXPERIENCE_OPTIONS.find((x) => x.id === a.experience)),
    row("lossOk", "손실감수", LOSS_OPTIONS.find((x) => x.id === a.lossOk)),
    row("goal", "목적", GOAL_OPTIONS.find((x) => x.id === a.goal)),
  ];
}

export type InvestAdvice = {
  answers: InvestStyleAnswers;
  complete: boolean;
  score: number | null;
  suggestedRisk: RiskTolerance;
  suggestedLabel: string;
  storedRisk: RiskTolerance;
  storedLabel: string;
  mismatch: boolean;
  targetInvestShare: number;
  actualInvestShare: number | null;
  cryptoWeight: number | null;
  topWeight: number | null;
  topSymbol: string | null;
  bullets: string[];
};

export function buildInvestAdvice(input: {
  answers: InvestStyleAnswers;
  storedRisk: RiskTolerance;
  liquid: number;
  invested: number;
  emergencyFundGap: number | null;
  guideNotes: string[];
  byClass: Array<{ assetClass: string; weight: number }>;
  hasUsd: boolean;
  topWeight: number | null;
  topSymbol: string | null;
  openCount: number;
}): InvestAdvice {
  const score = investStyleScore(input.answers);
  const suggestedRisk = score != null ? suggestedRiskFromScore(score) : input.storedRisk;
  const targetInvestShare = RISK_INVEST_SHARE[suggestedRisk];
  const total = input.liquid + input.invested;
  const actualInvestShare = total > 0 ? input.invested / total : null;
  const crypto = input.byClass.find((c) => c.assetClass === "crypto");
  const cryptoWeight = crypto && input.openCount > 0 ? crypto.weight : null;
  const riskyHolding = input.byClass
    .filter((c) => RISKY_CLASSES.has(c.assetClass))
    .reduce((s, c) => s + c.weight, 0);

  const bullets: string[] = [];
  if (score != null) {
    bullets.push(`설문 ${score}/12점 → ${RISK_TOLERANCE_LABEL[suggestedRisk]}형. 월 저축·투자 중 투자 목표 비중은 ${(targetInvestShare * 100).toFixed(0)}%입니다.`);
  } else {
    bullets.push(`설문이 비어 있습니다. 지금은 기본정보의 위험 성향(${RISK_TOLERANCE_LABEL[input.storedRisk]})으로 배분합니다.`);
  }
  if (score != null && suggestedRisk !== input.storedRisk) {
    bullets.push(`기본정보 성향은 ${RISK_TOLERANCE_LABEL[input.storedRisk]}입니다. 저장하면 설문 결과(${RISK_TOLERANCE_LABEL[suggestedRisk]})에 맞춥니다.`);
  }
  if (actualInvestShare != null) {
    bullets.push(`지금 자산에서 투자(평가+예수금) 비중은 ${(actualInvestShare * 100).toFixed(0)}%입니다. ${RISK_TOLERANCE_LABEL[suggestedRisk]}형 목표는 약 ${(targetInvestShare * 100).toFixed(0)}%입니다.`);
  }
  if (input.openCount === 0) {
    bullets.push("열린 보유가 없습니다. 성향만 저장되고, 종목 조언은 체결을 넣은 뒤에 나옵니다.");
  } else if (riskyHolding >= 0 && input.openCount > 0) {
    bullets.push(`보유 안에서 주식·ETF·코인 등 위험자산 비중은 ${(riskyHolding * 100).toFixed(0)}%입니다.`);
  }
  if (cryptoWeight != null && cryptoWeight >= 0.2 && suggestedRisk !== "aggressive") {
    bullets.push(`코인 비중이 ${(cryptoWeight * 100).toFixed(0)}%로 ${RISK_TOLERANCE_LABEL[suggestedRisk]}형보다 높습니다. 비중을 줄이거나 성향을 다시 보세요.`);
  }
  if (input.topWeight != null && input.topWeight >= 0.4 && input.topSymbol) {
    bullets.push(`한 종목(${input.topSymbol})이 보유의 ${(input.topWeight * 100).toFixed(0)}%입니다. 집중 리스크가 큽니다.`);
  }
  if (input.emergencyFundGap != null && input.emergencyFundGap > 0) {
    bullets.push(`비상금이 ${Math.round(input.emergencyFundGap).toLocaleString("ko-KR")}원 부족합니다. 신규 납입은 예적금 우선입니다.`);
  }
  if (input.hasUsd) {
    bullets.push("해외 통화 보유가 있습니다. 한국 거주자 해외주식 양도세는 연 250만원 기본공제 후 과세입니다. 매수는 단정하지 않습니다.");
  }
  for (const n of input.guideNotes) {
    if (input.emergencyFundGap != null && input.emergencyFundGap > 0 && n.includes("비상금")) continue;
    if (!bullets.includes(n)) bullets.push(n);
  }
  bullets.push("특정 종목·상품 매수 단정은 하지 않습니다. 경험 규칙이며 투자자 성향 공식 평가가 아닙니다.");

  return {
    answers: input.answers,
    complete: score != null,
    score,
    suggestedRisk,
    suggestedLabel: RISK_TOLERANCE_LABEL[suggestedRisk],
    storedRisk: input.storedRisk,
    storedLabel: RISK_TOLERANCE_LABEL[input.storedRisk],
    mismatch: score != null && suggestedRisk !== input.storedRisk,
    targetInvestShare,
    actualInvestShare,
    cryptoWeight,
    topWeight: input.topWeight,
    topSymbol: input.topSymbol,
    bullets,
  };
}

export function formatInvestStyleContext(a: InvestAdvice): string {
  const lines = [
    `- 배분 성향 ${a.storedLabel} (설문 제안 ${a.suggestedLabel}${a.score != null ? `, ${a.score}/12점` : ", 미완료"})`,
  ];
  if (a.actualInvestShare != null) {
    lines.push(`- 현재 투자 비중 ${(a.actualInvestShare * 100).toFixed(0)}% · 목표 ${(a.targetInvestShare * 100).toFixed(0)}%`);
  }
  for (const b of a.bullets) lines.push(`- ${b}`);
  return lines.join("\n");
}
