// 계정 모드(ADR 0067). 화면 셸·메뉴만 다르고 데이터·계산은 같다.
// 저장은 쿠키(기기별 화면 설정). 메뉴 주소는 지금 있는 화면만 가리킨다.

export const UI_MODES = ["personal", "business"] as const;
export type UiMode = (typeof UI_MODES)[number];

export const UI_MODE_COOKIE = "finvesting_ui_mode";
export const DEFAULT_UI_MODE: UiMode = "personal";

export const UI_MODE_LABEL: Record<UiMode, string> = {
  personal: "일반",
  business: "비즈니스",
};

/** 쿠키 값 등 아무 문자열을 모드로. 모르는 값은 기본(일반). */
export function parseUiMode(raw: string | null | undefined): UiMode {
  const v = (raw ?? "").trim().toLowerCase();
  return (UI_MODES as readonly string[]).includes(v) ? (v as UiMode) : DEFAULT_UI_MODE;
}

export type NavLink = {
  href: string;
  label: string;
  /** ADR 0050 등으로 아직 없는 칸. 누를 수 없다. */
  pending?: string;
};

export type NavGroup = {
  id: string;
  label: string;
  /** 묶음 제목을 눌렀을 때 갈 곳. */
  href: string;
  items: NavLink[];
};

/** 일반: 위쪽 6개. 묶음 안 화면은 그 묶음에 있을 때 둘째 줄로 보인다. */
export const PERSONAL_NAV: NavGroup[] = [
  { id: "home", label: "홈", href: "/", items: [{ href: "/", label: "홈" }] },
  {
    id: "flow",
    label: "돈의 흐름",
    href: "/timeline",
    items: [
      { href: "/timeline", label: "타임라인" },
      { href: "/accounts", label: "계좌·거래" },
    ],
  },
  {
    id: "invest",
    label: "투자",
    href: "/invest",
    items: [
      { href: "/invest", label: "투자 대시보드" },
      { href: "/holdings", label: "내 보유" },
      { href: "/markets", label: "시장" },
      { href: "/statements", label: "재무제표" },
      { href: "/fundamentals", label: "기업 숫자" },
      { href: "/news", label: "뉴스" },
      { href: "/opinions", label: "오피니언" },
    ],
  },
  { id: "home-realty", label: "집", href: "/realty", items: [{ href: "/realty", label: "부동산" }] },
  {
    id: "tax",
    label: "세금",
    href: "/tax",
    items: [
      { href: "/tax", label: "세금·연말정산" },
      { href: "/profile", label: "급여·공제 입력" },
    ],
  },
  { id: "ai", label: "AI 비서", href: "/chat", items: [{ href: "/chat", label: "AI 비서" }] },
];

/** 비즈니스: 왼쪽 트리 7묶음. 새 업무 기능은 ADR 0050 재개 전까지 pending. */
export const BUSINESS_NAV: NavGroup[] = [
  { id: "dashboard", label: "대시보드", href: "/", items: [{ href: "/", label: "이번 달 현황" }] },
  {
    id: "ledger",
    label: "장부",
    href: "/accounting",
    items: [
      { href: "/accounts", label: "계좌·거래" },
      { href: "/accounting", label: "회계전표·내보내기" },
      { href: "/timeline", label: "거래 흐름" },
    ],
  },
  {
    id: "tax",
    label: "세무",
    href: "/tax",
    items: [
      { href: "/tax", label: "양도세·금융소득·연말정산" },
      { href: "/erp", label: "업무 책상(보기)" },
      { href: "#vat", label: "부가세 신고", pending: "준비 중 (ADR 0050)" },
      { href: "#withholding", label: "원천세 신고", pending: "준비 중 (ADR 0050)" },
    ],
  },
  {
    id: "hr",
    label: "급여·인사",
    href: "/profile",
    items: [
      { href: "/profile", label: "근로자 대장" },
      { href: "#payroll", label: "급여 대장·4대보험", pending: "준비 중 (ADR 0050)" },
    ],
  },
  {
    id: "corp",
    label: "투자·기업",
    href: "/holdings",
    items: [
      { href: "/holdings", label: "보유·체결" },
      { href: "/statements", label: "재무제표" },
      { href: "/fundamentals", label: "기업 숫자" },
    ],
  },
  {
    id: "market",
    label: "시장",
    href: "/invest",
    items: [
      { href: "/invest", label: "투자 대시보드" },
      { href: "/markets", label: "시장" },
      { href: "/realty", label: "부동산" },
      { href: "/news", label: "뉴스" },
      { href: "/opinions", label: "오피니언" },
    ],
  },
  { id: "ai", label: "AI", href: "/chat", items: [{ href: "/chat", label: "AI 비서" }] },
];

export function navFor(mode: UiMode): NavGroup[] {
  return mode === "business" ? BUSINESS_NAV : PERSONAL_NAV;
}

/** 모드를 바꾸면 갈 첫 화면. */
export function uiModeHome(_mode: UiMode): string {
  return "/";
}

function matches(pathname: string, href: string): boolean {
  if (href.startsWith("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 지금 주소에 맞는 묶음·화면. 같은 화면이 여러 묶음에 있으면 앞 묶음. 없으면 null. */
export function activeNav(
  mode: UiMode,
  pathname: string,
): { group: NavGroup; item: NavLink } | null {
  const path = pathname.split(/[?#]/)[0] || "/";
  for (const group of navFor(mode)) {
    const item = group.items.find((i) => matches(path, i.href));
    if (item) return { group, item };
  }
  return null;
}

/** 모드 메뉴에 없는 주소. 화면은 열리지만 메뉴 강조가 없다(예: 일반 모드의 /accounting). */
export function isHiddenInMode(mode: UiMode, pathname: string): boolean {
  return activeNav(mode, pathname) == null;
}
