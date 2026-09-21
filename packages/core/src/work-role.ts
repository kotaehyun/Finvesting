// 근로자 대장과 개인(프리랜서·개인사업자)·법인 업무를 나눈다. 매출·부가세·법인세 숫자는 원장이 오기 전에 만들지 않는다.

import type { DataSlotStatus } from "./tax-year";

export const WORK_ROLES = ["employee", "freelancer", "business", "corporation"] as const;
export type WorkRole = (typeof WORK_ROLES)[number];
/** 업무 책상. 프리랜서는 개인사업자와 한 책상(ADR 0042). `?role=freelancer`는 business로 연다. */
export type OperatorRole = "business" | "corporation";
export const OPERATOR_ROLES = ["business", "corporation"] as const;

export const WORK_ROLE_LABEL: Record<WorkRole, string> = {
  employee: "근로자",
  freelancer: "프리랜서·개인사업자",
  business: "프리랜서·개인사업자",
  corporation: "법인사업자",
};

/** 초보 사장님용. 세율·금액을 만들지 않는다. */
export const OPERATOR_INTRO: Record<OperatorRole, { who: string; does: string; not: string }> = {
  business: {
    who: "본인 이름으로 용역·사업하는 사람 (프리랜서·개인사업자)",
    does: "3.3% 원천(연예인·모델·독립 개발·인플루언서·전문직), 매출·부가세·종소세. 간이과세는 개인만. 면세는 2월 현황신고. 수출은 영세율. 직원 명부 다음이 건보 14일.",
    not: "법인세·자본금과 적립금 조정이 없습니다. 회사 이름이 아닙니다. 아르바이트 3.3%가 아닙니다.",
  },
  corporation: {
    who: "회사 이름으로 사업하는 법인",
    does: "매출·부가세(일반)·법인세·자본금과 적립금 조정·주식등변동. 면세 공급·수출 영세율·수입 세관 부가세. 사단·농업은 제26조 문언만. 직원 명부 다음이 건보 14일.",
    not: "종소세·간이과세가 없습니다. 사장님 개인 세금과 섞지 않습니다.",
  },
};

export function parseOperatorRole(raw: string | null): OperatorRole | undefined {
  if (raw === "freelancer" || raw === "business") return "business";
  if (raw === "corporation") return "corporation";
  return undefined;
}

export function slotView(slot: BusinessWorkSlot): string {
  const i = slot.href.indexOf("view=");
  return i >= 0 ? slot.href.slice(i + 5) : slot.id;
}

export function workPath(role: OperatorRole, view?: string | null): string {
  const q = new URLSearchParams({ role });
  if (view && view !== "home") q.set("view", view);
  return `/erp?${q.toString()}`;
}

/** URL에 인격이 없으면 슬롯이 하나일 때만 연다. 부가세처럼 둘이 쓰면 고르는 화면. */
export function resolveOperatorRole(
  rawRole: string | null,
  view: string | null,
  entity?: string | null,
): OperatorRole | undefined {
  const parsed = parseOperatorRole(rawRole);
  if (parsed) return parsed;
  if (entity === "corporation") return "corporation";
  const slot = findBusinessSlot(view);
  if (slot?.roles.length === 1) return slot.roles[0];
  return undefined;
}

/** 현재 본인 프로필대장은 근로자. 업무 화면은 개인(프리랜서·개인사업자)·법인. */
export const DEFAULT_WORK_ROLE: WorkRole = "employee";

export type BusinessWorkSlot = {
  id: string;
  roles: OperatorRole[];
  label: string;
  amount: number | null;
  status: DataSlotStatus;
  note: string;
  href: string;
};

export function businessWorkSlots(): BusinessWorkSlot[] {
  return [
    {
      id: "service_income",
      roles: ["business"],
      label: "용역수입",
      amount: null,
      status: "empty",
      note: "세금계산서·원천징수 영수증 원장이 없습니다. 가계 급여를 용역수입으로 넣지 않습니다.",
      href: "/erp?view=service",
    },
    {
      id: "withholding",
      roles: ["business"],
      label: "원천세",
      amount: null,
      status: "empty",
      note: "원천징수 원장이 없습니다. 3.3%는 시산 양식만. 가계 급여와 합치지 않습니다.",
      href: "/erp?view=withholding",
    },
    {
      id: "sales",
      roles: ["business", "corporation"],
      label: "매출",
      amount: null,
      status: "empty",
      note: "세금계산서·카드매출 원장이 없습니다. 가계 입금을 매출로 넣지 않습니다.",
      href: "/erp?view=sales",
    },
    {
      id: "purchase",
      roles: ["business", "corporation"],
      label: "매입",
      amount: null,
      status: "empty",
      note: "매입 세금계산서 원장이 없습니다.",
      href: "/erp?view=purchase",
    },
    {
      id: "vat",
      roles: ["business", "corporation"],
      label: "부가세",
      amount: null,
      status: "empty",
      note: "부가세 신고 원장이 없습니다. 부가세법 제30조 10% 양식은 시산만. 법인은 간이과세가 없습니다. 면세·수출입은 옆 메뉴.",
      href: "/erp?view=vat",
    },
    {
      id: "exempt",
      roles: ["business", "corporation"],
      label: "면세·수출입",
      amount: null,
      status: "empty",
      note: "개인 면세는 소득세법 제78조 2월 10일 사업장현황신고. 확인서는 부가가치세면세사업자수입금액증명. 사단·농업은 제26조 문언만. 수출 제21조·수입 제50조. 세율·감면을 만들지 않습니다.",
      href: "/erp?view=exempt",
    },
    {
      id: "labor",
      roles: ["business", "corporation"],
      label: "인건비",
      amount: null,
      status: "empty",
      note: "직원 급여대장이 없습니다. 법인 대표 급여는 근로소득·4대보험이지 3.3%가 아닙니다. 본인 근로 명세서는 프로필 07입니다.",
      href: "/erp?view=labor",
    },
    {
      id: "staff",
      roles: ["business", "corporation"],
      label: "직원등록",
      amount: null,
      status: "empty",
      note: "근로기준법 제41조 근로자 명부. 고용일을 적으면 국민건강보험법 제8조 제2항 14일 안 직장가입자 자격취득신고가 이어집니다. 공단 전송·보험료 곱셈이 아닙니다.",
      href: "/erp?view=staff",
    },
    {
      id: "cit",
      roles: ["corporation"],
      label: "법인세",
      amount: null,
      status: "empty",
      note: "법인세 원장이 없습니다. 세율을 추정하지 않습니다. 종소세·연말정산이 아닙니다.",
      href: "/erp?view=cit",
    },
    {
      id: "biz_cash",
      roles: ["business", "corporation"],
      label: "사업 자금",
      amount: null,
      status: "empty",
      note: "차변·대변에 계정과목을 적습니다. 보통예금 주석은 은행명. 가계 잔액을 사업 자금으로 보이지 않습니다.",
      href: "/erp?view=cash",
    },
    {
      id: "biz_books",
      roles: ["business", "corporation"],
      label: "사업 장부",
      amount: null,
      status: "empty",
      note: "차변·대변 계정과목 분개. 보통예금 주석은 은행명. 가계 통장 CSV는 개인세무에 있습니다.",
      href: "/erp?view=books",
    },
    {
      id: "equity",
      roles: ["corporation"],
      label: "자본금·적립금 조정",
      amount: null,
      status: "empty",
      note: "법인세법 시행규칙 별지 제50호서식(갑). 자본조정은 과목 이름입니다. 잔액을 만들지 않습니다.",
      href: "/erp?view=equity",
    },
    {
      id: "unlisted",
      roles: ["corporation", "business"],
      label: "비상장 신고",
      amount: null,
      status: "empty",
      note: "개인은 소득세법 제105조 예정신고. 법인은 별지 제54호 주식등변동상황명세서. 세율·평가액을 만들지 않습니다.",
      href: "/erp?view=unlisted",
    },
    {
      id: "git",
      roles: ["business"],
      label: "종소세",
      amount: null,
      status: "empty",
      note: "종합소득세 5월 확정. 세율 표는 세율표 메뉴. 연말정산·법인세가 아닙니다.",
      href: "/erp?view=git",
    },
    {
      id: "rates",
      roles: ["business", "corporation"],
      label: "세율표",
      amount: null,
      status: "empty",
      note: "양도·증여·보유 법령 세율과 과세표준. 시산만. 특례는 세무사·국세청.",
      href: "/erp?view=rates",
    },
  ];
}

export function slotsForRole(role: OperatorRole): BusinessWorkSlot[] {
  return businessWorkSlots().filter((s) => s.roles.includes(role));
}

export function findBusinessSlot(view: string | null): BusinessWorkSlot | undefined {
  if (!view || view === "home") return undefined;
  return businessWorkSlots().find((s) => s.href.endsWith(`view=${view}`));
}

export function slotRoleLabel(slot: BusinessWorkSlot): string {
  return slot.roles.map((r) => WORK_ROLE_LABEL[r]).join("·");
}

export function roleHasSlot(role: OperatorRole, slot: BusinessWorkSlot): boolean {
  return slot.roles.includes(role);
}
