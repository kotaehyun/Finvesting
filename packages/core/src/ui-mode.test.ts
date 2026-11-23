import { describe, expect, it } from "vitest";
import {
  BUSINESS_NAV,
  PERSONAL_NAV,
  activeNav,
  isHiddenInMode,
  parseUiMode,
} from "./ui-mode";

describe("parseUiMode", () => {
  it("알려진 값만 받고 나머지는 일반", () => {
    expect(parseUiMode("business")).toBe("business");
    expect(parseUiMode(" Business ")).toBe("business");
    expect(parseUiMode("personal")).toBe("personal");
    expect(parseUiMode("admin")).toBe("personal");
    expect(parseUiMode(undefined)).toBe("personal");
  });
});

describe("activeNav", () => {
  it("홈은 정확히 /일 때만", () => {
    expect(activeNav("personal", "/")?.group.id).toBe("home");
    expect(activeNav("personal", "/holdings")?.group.id).toBe("invest");
  });
  it("하위 주소와 쿼리도 같은 화면", () => {
    expect(activeNav("personal", "/statements?q=005930")?.item.href).toBe("/statements");
    expect(activeNav("business", "/tax/anything")?.group.id).toBe("tax");
  });
  it("모드마다 묶음이 다르다", () => {
    expect(activeNav("personal", "/accounts")?.group.id).toBe("flow");
    expect(activeNav("business", "/accounts")?.group.id).toBe("ledger");
    expect(activeNav("personal", "/profile")?.group.id).toBe("tax");
    expect(activeNav("business", "/profile")?.group.id).toBe("hr");
  });
  it("일반 모드에 회계전표·업무 책상은 메뉴가 없다", () => {
    expect(isHiddenInMode("personal", "/accounting")).toBe(true);
    expect(isHiddenInMode("personal", "/erp")).toBe(true);
    expect(isHiddenInMode("business", "/accounting")).toBe(false);
  });
  it("준비 중 칸은 주소로 잡히지 않는다", () => {
    const pending = BUSINESS_NAV.flatMap((g) => g.items).filter((i) => i.pending);
    expect(pending.length).toBeGreaterThan(0);
    for (const p of pending) expect(p.href.startsWith("#")).toBe(true);
  });
});

describe("메뉴 정의", () => {
  it("일반은 6묶음, 비즈니스는 7묶음", () => {
    expect(PERSONAL_NAV).toHaveLength(6);
    expect(BUSINESS_NAV).toHaveLength(7);
  });
  it("지금 있는 화면은 두 모드 중 적어도 한 곳 메뉴에 있다", () => {
    const pages = ["/", "/timeline", "/accounts", "/holdings", "/invest", "/markets", "/realty", "/statements", "/fundamentals", "/profile", "/tax", "/accounting", "/news", "/opinions", "/chat", "/erp"];
    for (const p of pages) {
      const inAny = !isHiddenInMode("personal", p) || !isHiddenInMode("business", p);
      expect(inAny, p).toBe(true);
    }
  });
});
