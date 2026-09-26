import { describe, expect, it } from "vitest";
import {
  DEFAULT_WORK_ROLE,
  OPERATOR_INTRO,
  OPERATOR_ROLES,
  WORK_ROLE_LABEL,
  businessWorkSlots,
  findBusinessSlot,
  parseOperatorRole,
  resolveOperatorRole,
  slotsForRole,
  workPath,
} from "./work-role";

describe("work-role", () => {
  it("기본 역할은 근로자", () => {
    expect(DEFAULT_WORK_ROLE).toBe("employee");
    expect(WORK_ROLE_LABEL.employee).toBe("근로자");
  });

  it("사업·프리랜서 칸은 금액 없음", () => {
    const slots = businessWorkSlots();
    expect(slots.length).toBeGreaterThan(0);
    for (const s of slots) {
      expect(s.amount).toBeNull();
      expect(s.status).toBe("empty");
      expect(s.roles.every((r) => r === "business" || r === "corporation")).toBe(true);
    }
  });

  it("개인 책상에 용역·매출·종소세가 있고 법인세는 없다", () => {
    expect(WORK_ROLE_LABEL.corporation).toBe("법인사업자");
    expect(WORK_ROLE_LABEL.business).toBe("프리랜서·개인사업자");
    expect(WORK_ROLE_LABEL.freelancer).toBe("프리랜서·개인사업자");
    expect(slotsForRole("corporation").some((s) => s.id === "cit")).toBe(true);
    expect(slotsForRole("business").some((s) => s.id === "cit")).toBe(false);
    expect(slotsForRole("corporation").some((s) => s.id === "vat")).toBe(true);
    expect(slotsForRole("business").some((s) => s.id === "sales")).toBe(true);
    expect(slotsForRole("business").some((s) => s.id === "service_income")).toBe(true);
    expect(slotsForRole("business").some((s) => s.id === "withholding")).toBe(true);
    expect(slotsForRole("corporation").some((s) => s.id === "equity")).toBe(true);
    expect(slotsForRole("business").some((s) => s.id === "git")).toBe(true);
    expect(slotsForRole("corporation").some((s) => s.id === "git")).toBe(false);
    expect(slotsForRole("business").some((s) => s.id === "rates")).toBe(true);
    expect(slotsForRole("corporation").some((s) => s.id === "rates")).toBe(true);
    const service = slotsForRole("business").find((s) => s.id === "service_income");
    expect(service?.note).toMatch(/가계 급여/);
  });

  it("view로 칸을 고른다", () => {
    expect(findBusinessSlot("vat")?.id).toBe("vat");
    expect(findBusinessSlot("exempt")?.id).toBe("exempt");
    expect(findBusinessSlot("cit")?.id).toBe("cit");
    expect(findBusinessSlot("git")?.id).toBe("git");
    expect(findBusinessSlot("equity")?.id).toBe("equity");
    expect(findBusinessSlot("cash")?.id).toBe("biz_cash");
    expect(findBusinessSlot("books")?.id).toBe("biz_books");
    expect(findBusinessSlot("unlisted")?.id).toBe("unlisted");
    expect(findBusinessSlot("rates")?.id).toBe("rates");
    expect(findBusinessSlot("staff")?.id).toBe("staff");
    expect(findBusinessSlot("home")).toBeUndefined();
    expect(findBusinessSlot(null)).toBeUndefined();
  });

  it("인격은 URL로 나누고 부가세는 고르게 둔다", () => {
    expect(parseOperatorRole("business")).toBe("business");
    expect(parseOperatorRole("freelancer")).toBe("business");
    expect(parseOperatorRole("corporation")).toBe("corporation");
    expect([...OPERATOR_ROLES]).toEqual(["business", "corporation"]);
    expect(workPath("business")).toBe("/erp?role=business");
    expect(workPath("corporation", "vat")).toBe("/erp?role=corporation&view=vat");
    expect(resolveOperatorRole(null, "cit")).toBe("corporation");
    expect(resolveOperatorRole(null, "withholding")).toBe("business");
    expect(resolveOperatorRole(null, "git")).toBe("business");
    expect(resolveOperatorRole(null, "vat")).toBeUndefined();
    expect(resolveOperatorRole(null, "exempt")).toBeUndefined();
    expect(resolveOperatorRole(null, "rates")).toBeUndefined();
    expect(slotsForRole("business").some((s) => s.id === "exempt")).toBe(true);
    expect(slotsForRole("corporation").some((s) => s.id === "exempt")).toBe(true);
    expect(slotsForRole("business").some((s) => s.id === "staff")).toBe(true);
    expect(slotsForRole("corporation").some((s) => s.id === "staff")).toBe(true);
    expect(resolveOperatorRole(null, "staff")).toBeUndefined();
    expect(resolveOperatorRole("freelancer", "vat")).toBe("business");
    expect(resolveOperatorRole("business", "vat")).toBe("business");
    expect(resolveOperatorRole(null, "vat", "corporation")).toBe("corporation");
    expect(slotsForRole("business").some((s) => s.id === "cit")).toBe(false);
    expect(OPERATOR_INTRO.business.not).toMatch(/법인세/);
  });
});
