// 개인 보장 분석. 권장액은 연소득 기준 경험 규칙(공식 고시 아님).
// 칠각: 사망·실손·암·뇌혈관·심장·상해·후유장해. 육각: 뇌+심장을 중대질병으로 합침.

export const HEPT_AXES = ["death", "medical", "cancer", "brain", "heart", "accident", "disability"] as const;
export const HEX_AXES = ["death", "medical", "cancer", "critical", "accident", "disability"] as const;

export type HeptAxis = (typeof HEPT_AXES)[number];
export type HexAxis = (typeof HEX_AXES)[number];
export type CoverageShape = "hex" | "hept";

export const COVERAGE_LABEL: Record<HeptAxis | "critical", string> = {
  death: "사망",
  medical: "실손",
  cancer: "암",
  brain: "뇌혈관",
  heart: "심장",
  critical: "중대질병",
  accident: "상해",
  disability: "후유장해",
};

export type PolicyCoverage = {
  death: number;
  medical: boolean;
  cancer: number;
  brain: number;
  heart: number;
  accident: number;
  disability: number;
};

export function recommendedCoverages(annualIncome: number): Record<HeptAxis, number> {
  const y = Math.max(0, annualIncome);
  return {
    death: y * 5,
    medical: 1,
    cancer: Math.max(50_000_000, y),
    brain: Math.max(50_000_000, Math.round(y * 0.8)),
    heart: Math.max(50_000_000, Math.round(y * 0.8)),
    accident: Math.max(30_000_000, Math.round(y * 0.5)),
    disability: y * 3,
  };
}

export function sumCoverages(policies: PolicyCoverage[]): Record<HeptAxis, number> {
  const out: Record<HeptAxis, number> = {
    death: 0, medical: 0, cancer: 0, brain: 0, heart: 0, accident: 0, disability: 0,
  };
  for (const p of policies) {
    out.death += Math.max(0, p.death);
    out.cancer += Math.max(0, p.cancer);
    out.brain += Math.max(0, p.brain);
    out.heart += Math.max(0, p.heart);
    out.accident += Math.max(0, p.accident);
    out.disability += Math.max(0, p.disability);
    if (p.medical) out.medical = 1;
  }
  return out;
}

export type CoverageAxis = {
  id: string;
  label: string;
  covered: number;
  recommended: number;
  ratio: number;
  gap: number;
  missing: boolean;
};

function axis(id: string, covered: number, recommended: number): CoverageAxis {
  const rec = Math.max(0, recommended);
  const cov = Math.max(0, covered);
  const ratio = rec > 0 ? Math.min(1, cov / rec) : cov > 0 ? 1 : 0;
  const gap = Math.max(0, rec - cov);
  return {
    id, label: COVERAGE_LABEL[id as HeptAxis | "critical"] ?? id,
    covered: cov, recommended: rec, ratio, gap, missing: rec > 0 && cov < rec,
  };
}

export function analyzeCoverage(policies: PolicyCoverage[], annualIncome: number, shape: CoverageShape): {
  axes: CoverageAxis[];
  missing: CoverageAxis[];
  weakest: CoverageAxis | null;
} {
  const rec = recommendedCoverages(annualIncome);
  const cov = sumCoverages(policies);
  const axes: CoverageAxis[] = shape === "hex"
    ? [
        axis("death", cov.death, rec.death),
        axis("medical", cov.medical, rec.medical),
        axis("cancer", cov.cancer, rec.cancer),
        axis("critical", cov.brain + cov.heart, rec.brain + rec.heart),
        axis("accident", cov.accident, rec.accident),
        axis("disability", cov.disability, rec.disability),
      ]
    : HEPT_AXES.map((id) => axis(id, cov[id], rec[id]));
  const missing = axes.filter((a) => a.missing).sort((a, b) => a.ratio - b.ratio);
  return { axes, missing, weakest: missing[0] ?? null };
}

export type PolicyBrief = PolicyCoverage & {
  name: string;
  kind: string;
  monthlyPremium: number;
};

function won(n: number) {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

function axisLine(a: CoverageAxis) {
  if (a.id === "medical") {
    return `- ${a.label}: ${a.covered >= 1 ? "가입" : "미가입"} / 권장 가입`;
  }
  const pct = Math.round(a.ratio * 100);
  return `- ${a.label}: 가입 ${won(a.covered)} / 권장 ${won(a.recommended)} / 부족 ${a.missing ? won(a.gap) : "없음"} (${pct}%)`;
}

/** LLM·화면에 넣는 보장 공백 요약. 숫자만, 상품명 추천 없음. */
export function formatCoverageContext(
  analysis: ReturnType<typeof analyzeCoverage>,
  annualIncome: number,
  policies: PolicyBrief[],
): string {
  const lines: string[] = [
    `연소득(세전×12) ${annualIncome > 0 ? won(annualIncome) : "없음(권장액 0)"}`,
    "권장액은 연소득 경험 규칙이며 공식 고시가 아니다. 4대보험(급여 공제)은 이 표에 없다.",
  ];
  if (policies.length) {
    lines.push("가입 증권:");
    for (const p of policies) {
      const bits = [
        p.name || "보험",
        p.kind,
        p.monthlyPremium > 0 ? `월 ${won(p.monthlyPremium)}` : "",
        p.medical ? "실손" : "",
        p.death > 0 ? `사망 ${won(p.death)}` : "",
        p.cancer > 0 ? `암 ${won(p.cancer)}` : "",
        p.brain > 0 ? `뇌 ${won(p.brain)}` : "",
        p.heart > 0 ? `심장 ${won(p.heart)}` : "",
        p.accident > 0 ? `상해 ${won(p.accident)}` : "",
        p.disability > 0 ? `장해 ${won(p.disability)}` : "",
      ].filter(Boolean);
      lines.push(`- ${bits.join(" · ")}`);
    }
  } else {
    lines.push("가입 증권 없음");
  }
  lines.push("축:");
  lines.push(...analysis.axes.map(axisLine));
  if (analysis.weakest) {
    lines.push(`가장 약한 축: ${analysis.weakest.label} (${Math.round(analysis.weakest.ratio * 100)}%)`);
    lines.push(`부족한 축(약한 순): ${analysis.missing.map((a) => a.label).join(", ") || "없음"}`);
  } else {
    lines.push("부족한 축 없음");
  }
  return lines.join("\n");
}
