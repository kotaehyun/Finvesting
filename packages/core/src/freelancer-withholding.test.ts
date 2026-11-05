import { describe, expect, it } from "vitest";
import {
  ENGAGEMENT_KINDS,
  FREELANCER_ALBA_CLAUSE,
  FREELANCER_ALBA_CLAUSE_BASIS,
  FREELANCER_CONDITIONS,
  FREELANCER_PROFESSIONS,
  FREELANCER_REJECTED,
  FREELANCER_SCOPES,
  freelancerConditionHint,
  freelancerMayWithhold,
  freelancerWithholding,
} from "./freelancer-withholding";

describe("freelancerWithholding", () => {
  it("100만 원은 소득세 3만 + 지방 3천 = 3.3만", () => {
    const w = freelancerWithholding(1_000_000);
    expect(w.incomeTax).toBe(30_000);
    expect(w.localTax).toBe(3_000);
    expect(w.total).toBe(33_000);
    expect(w.net).toBe(967_000);
  });

  it("0과 음수는 0", () => {
    expect(freelancerWithholding(0).total).toBe(0);
    expect(freelancerWithholding(-100).total).toBe(0);
  });

  it("원 단위 절사 뒤 지방세는 그 10%", () => {
    const w = freelancerWithholding(333);
    expect(w.incomeTax).toBe(9);
    expect(w.localTax).toBe(0);
  });
});

describe("engagement kinds", () => {
  it("근로·프리랜서·기타·부가세를 나눈다", () => {
    expect(ENGAGEMENT_KINDS.map((k) => k.id)).toEqual([
      "employee", "freelancer", "other_income", "vat_business", "corporation",
    ]);
    expect(FREELANCER_CONDITIONS).toHaveLength(6);
    expect(FREELANCER_CONDITIONS[5].id).toBe("statute_only");
    expect(FREELANCER_ALBA_CLAUSE).toMatch(/법령 주의/);
    expect(FREELANCER_ALBA_CLAUSE).not.toMatch(/【특약】/);
    expect(FREELANCER_SCOPES.map((s) => s.id)).toEqual(["entertainer", "model", "developer", "influencer", "professional"]);
    expect(FREELANCER_REJECTED.some((r) => r.id === "forced_alba")).toBe(true);
    expect(FREELANCER_ALBA_CLAUSE).toMatch(/제20조/);
    expect(FREELANCER_ALBA_CLAUSE).toMatch(/제1항 제1호/);
  });

  it("종속관계가 있으면 3.3%가 아니라고 한다", () => {
    expect(freelancerConditionHint({})).toMatch(/아르바이트/);
    expect(freelancerConditionHint({
      independent: true, not_disguised: true, repeat: true, no_facility: true, payer: true, statute_only: true,
    }, "developer")).toMatch(/시산만/);
  });

  it("직종·사짜가 아니면 시산을 열지 않는다", () => {
    const ok = {
      independent: true, not_disguised: true, repeat: true, no_facility: true, payer: true, statute_only: true,
    };
    expect(freelancerMayWithhold(ok, "influencer")).toBe(true);
    expect(freelancerMayWithhold(ok, "professional")).toBe(true);
    expect(freelancerMayWithhold(ok, null)).toBe(false);
    expect(freelancerMayWithhold({ ...ok, statute_only: false }, "developer")).toBe(false);
    expect(freelancerConditionHint(ok, "shop_alba")).toMatch(/아르바이트/);
    expect(freelancerConditionHint({ ...ok, no_facility: false }, "professional")).toMatch(/개인사업자/);
    expect(FREELANCER_PROFESSIONS.map((p) => p.id)).toEqual(["doctor", "lawyer", "labor", "tax", "patent", "cpa"]);
    expect(FREELANCER_ALBA_CLAUSE_BASIS.some((r) => r.article.includes("제20조"))).toBe(true);
  });
});
