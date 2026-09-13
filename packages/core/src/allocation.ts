// 소득·자산 구조에 따른 예적금/투자/소비 배분 가이드.
// 기본은 50/30/20 룰을 출발점으로, 비상금 확보 여부와 위험 성향으로 조정한다.

export type RiskTolerance = "conservative" | "moderate" | "aggressive";

export type AllocationInput = {
  monthlyNetIncome: number;
  monthlyFixedCost: number;
  liquidAssets: number;        // 현금 + 입출금 + 예적금
  investedAssets: number;      // 보유 평가액 + 증권·코인·연금 예수금
  emergencyFundMonths: number; // 목표 비상금 개월 수
  riskTolerance: RiskTolerance;
};

export type MonthlyBudgetGuide = {
  needs: number;          // 고정비 + 필수 소비 상한
  wants: number;          // 여가·쇼핑 등 변동 소비 상한
  saveAndInvest: number;  // 저축+투자 권장액
  ofWhichDeposit: number; // 그중 예적금(안전자산)
  ofWhichInvest: number;  // 그중 투자(위험자산)
  emergencyFundTarget: number;
  emergencyFundGap: number;   // 부족하면 양수
  notes: string[];
};

const INVEST_SHARE: Record<RiskTolerance, number> = { conservative: 0.3, moderate: 0.5, aggressive: 0.7 };

export function monthlyBudgetGuide(i: AllocationInput): MonthlyBudgetGuide {
  const notes: string[] = [];
  const income = i.monthlyNetIncome;
  const emergencyFundTarget = i.monthlyFixedCost * i.emergencyFundMonths;
  const emergencyFundGap = Math.max(0, emergencyFundTarget - i.liquidAssets);

  // 기본 50/30/20
  let needs = income * 0.5, wants = income * 0.3, saveAndInvest = income * 0.2;

  // 고정비가 50%를 넘으면 wants에서 깎는다
  if (i.monthlyFixedCost > needs) {
    const over = i.monthlyFixedCost - needs;
    needs = i.monthlyFixedCost;
    wants = Math.max(0, wants - over);
    notes.push("고정비가 소득의 50%를 초과합니다. 변동 소비 상한을 줄였습니다.");
  }

  // 비상금이 부족하면 저축 비중을 늘리고 예적금 우선
  let investShare = INVEST_SHARE[i.riskTolerance];
  if (emergencyFundGap > 0) {
    const boost = Math.min(income * 0.1, wants * 0.5);
    wants -= boost; saveAndInvest += boost;
    investShare = Math.min(investShare, 0.2);
    notes.push(`비상금 목표(${i.emergencyFundMonths}개월 고정비)까지 ${Math.round(emergencyFundGap).toLocaleString()}원 부족합니다. 예적금 우선을 권장합니다.`);
  }

  // 이미 투자 비중이 목표보다 높으면 예적금 쪽으로
  const total = i.liquidAssets + i.investedAssets;
  if (total > 0 && i.investedAssets / total > investShare + 0.15) {
    investShare = Math.max(0, investShare - 0.2);
    notes.push("현재 위험자산 비중이 목표보다 높습니다. 신규 납입은 안전자산 위주로 권장합니다.");
  }

  return {
    needs, wants, saveAndInvest,
    ofWhichInvest: saveAndInvest * investShare,
    ofWhichDeposit: saveAndInvest * (1 - investShare),
    emergencyFundTarget, emergencyFundGap, notes,
  };
}
