"use client";
import { Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  OPERATOR_INTRO,
  OPERATOR_ROLES,
  WORK_ROLE_LABEL,
  findBusinessSlot,
  resolveOperatorRole,
  roleHasSlot,
  slotRoleLabel,
  slotView,
  slotsForRole,
  workPath,
  type BusinessWorkSlot,
  type OperatorRole,
} from "@finvesting/core";
import { EngagementTable, FreelancerForm, LaborForm, StaffForm, VatForm, ExemptTradeForm, CitForm, CorpSoleTable, BizJournalForm, EquityForm, GitForm, UnlistedForm } from "./biz-forms";
import { TaxRateGuide } from "./tax-rate-guide";

export default function ErpPage() {
  return (
    <Suspense fallback={<p className="muted" style={{ padding: 20 }}>불러오는 중…</p>}>
      <ErpWorkspace />
    </Suspense>
  );
}

function ErpWorkspace() {
  const search = useSearchParams();
  const view = search.get("view");
  const slot = findBusinessSlot(view);
  const role = resolveOperatorRole(search.get("role"), view, search.get("entity"));
  const legacyEmployeeTax = view === "tax";

  if (legacyEmployeeTax) {
    return (
      <ErpShell role={undefined} slot={undefined}>
        <EmployeeTaxRedirect />
      </ErpShell>
    );
  }

  if (!role) {
    return (
      <ErpShell role={undefined} slot={slot}>
        <RolePicker view={view} slot={slot} />
      </ErpShell>
    );
  }

  return (
    <ErpShell role={role} slot={slot}>
      {slot && !roleHasSlot(role, slot) ? (
        <WrongRole role={role} slot={slot} />
      ) : slot ? (
        <SlotView slot={slot} role={role} />
      ) : (
        <RoleHome role={role} />
      )}
    </ErpShell>
  );
}

function ErpShell({
  role,
  slot,
  children,
}: {
  role: OperatorRole | undefined;
  slot: BusinessWorkSlot | undefined;
  children: ReactNode;
}) {
  const intro = role ? OPERATOR_INTRO[role] : undefined;
  const navSlots = role ? slotsForRole(role) : [];
  const on = slot ? slotView(slot) : "home";

  return (
    <div className={`erp wehago${role ? "" : " erp-pick"}`}>
      <div className="erp-titlebar">
        <h1>
          <span className="wehago-mark" aria-hidden>업무</span>
          Finvesting 업무
          <span className="path">
            {role ? WORK_ROLE_LABEL[role] : "인격 고르기"}
            {slot ? ` · ${slot.label}` : ""}
          </span>
        </h1>
        <div className="wehago-title-meta">
          {role && <a href="/erp">다른 인격</a>}
          <a href="/profile?menu=yearEnd">근로자 연말정산</a>
          <a href="/">자산 홈</a>
        </div>
      </div>
      <div className="erp-toolbar">
        <span>
          {intro
            ? `${intro.who} ${intro.does} ${intro.not}`
            : "업무를 특화한 사람만 한 화면에 다 두지 않습니다. 인격을 고르면 그 메뉴만 나옵니다. 더존 제품이 아닙니다."}
        </span>
      </div>
      <div className="erp-body">
        {role ? (
          <nav className="erp-menu" aria-label={`${WORK_ROLE_LABEL[role]} 메뉴`}>
            <h2>{WORK_ROLE_LABEL[role]}</h2>
            <a href={workPath(role)} className={!slot ? "on" : ""}>이 업무홈</a>
            {navSlots.map((s) => {
              const v = slotView(s);
              return (
                <a key={s.id} href={workPath(role, v)} className={on === v ? "on" : ""}>
                  {s.label}
                </a>
              );
            })}
            <h2>나가기</h2>
            <a href="/erp">인격 다시 고르기</a>
            <a href="/profile">근로자 대장</a>
            <a href="/">자산 홈</a>
          </nav>
        ) : null}
        <div className="erp-work">
          <div className="erp-panel">{children}</div>
        </div>
      </div>
      <div className="erp-status">
        <span>{role ? WORK_ROLE_LABEL[role] : "인격을 고르세요"}</span>
        <span>원장 없음 · 칸만</span>
        <span>한 인격의 메뉴만</span>
      </div>
    </div>
  );
}

function RolePicker({ view, slot }: { view: string | null; slot: BusinessWorkSlot | undefined }) {
  const roles = slot ? slot.roles : [...OPERATOR_ROLES];
  return (
    <>
      <h3>누구의 업무인가요?</h3>
      <p className="erp-hint">
        {slot
          ? `${slot.label} 화면은 ${slotRoleLabel(slot)}입니다. 인격을 고르면 그 메뉴만 보입니다.`
          : "프리랜서와 개인사업자는 한 책상입니다. 법인만 따로입니다. 아이콘이 많으면 초보·사장님이 헷갈립니다."}
      </p>
      <div className="erp-role-pick">
        {roles.map((r) => {
          const intro = OPERATOR_INTRO[r];
          return (
            <a key={r} className="erp-role-card" href={workPath(r, view)}>
              <strong>{WORK_ROLE_LABEL[r]}</strong>
              <span>{intro.who}</span>
              <span>{intro.does}</span>
              <em>{intro.not}</em>
            </a>
          );
        })}
      </div>
      <p className="erp-hint">
        근로자 급여·연말정산은 <a href="/profile?menu=yearEnd">프로필대장</a>입니다. 가계 통장을 매출로 넣지 않습니다.
      </p>
    </>
  );
}

function RoleHome({ role }: { role: OperatorRole }) {
  const slots = slotsForRole(role);
  const intro = OPERATOR_INTRO[role];
  return (
    <>
      <h3>{WORK_ROLE_LABEL[role]} 업무홈</h3>
      <p className="erp-hint">{intro.who} {intro.does} {intro.not}</p>
      <table className="erp-grid">
        <thead>
          <tr><th>메뉴</th><th>하는 일</th></tr>
        </thead>
        <tbody>
          {slots.map((s) => (
            <tr key={s.id}>
              <td><a href={workPath(role, slotView(s))}>{s.label}</a></td>
              <td className="ro">{s.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {role === "business" && <EngagementTable />}
      {role === "business" && (
        <p className="erp-hint">법인세·자본금과 적립금 조정은 법인 업무입니다. <a href="/erp">법인사업자 고르기</a></p>
      )}
      {role === "corporation" && <CorpSoleTable />}
    </>
  );
}

function WrongRole({ role, slot }: { role: OperatorRole; slot: BusinessWorkSlot }) {
  return (
    <>
      <h3>이 메뉴는 {WORK_ROLE_LABEL[role]} 업무가 아닙니다</h3>
      <p className="erp-hint">
        {slot.label} 화면은 {slotRoleLabel(slot)}입니다. {OPERATOR_INTRO[role].not}
      </p>
      <p className="erp-hint">
        <a href={workPath(role)}>이 인격 업무홈</a>
        {slot.roles.map((r) => (
          <span key={r}>
            {" · "}
            <a href={workPath(r, slotView(slot))}>{WORK_ROLE_LABEL[r]}에서 열기</a>
          </span>
        ))}
      </p>
    </>
  );
}

function EmployeeTaxRedirect() {
  return (
    <>
      <h3>근로자 세무는 여기 없습니다</h3>
      <p className="erp-hint">
        연말정산 공제·해외주식 250만 공제는 근로자 대장입니다. 종소세는 프리랜서·개인사업자를 고른 뒤 엽니다.
      </p>
      <p className="erp-hint">
        <a href="/profile?menu=yearEnd">12 연말정산</a>
        {" · "}
        <a href="/profile?menu=taxBooks">13 양도·배당</a>
        {" · "}
        <a href="/erp">인격 고르기</a>
      </p>
    </>
  );
}

function SlotView({ slot, role }: { slot: BusinessWorkSlot; role: OperatorRole }) {
  const entity = role === "corporation" ? "corporation" as const : "individual" as const;
  if (slot.id === "cit") return <CitForm />;
  if (slot.id === "vat") return <VatForm key={role} entity={entity} lockEntity />;
  if (slot.id === "exempt") return <ExemptTradeForm role={role} />;
  if (slot.id === "sales") return <VatForm key={`sales-${role}`} focus="sales" entity={entity} lockEntity />;
  if (slot.id === "purchase") return <VatForm key={`purchase-${role}`} focus="purchase" entity={entity} lockEntity />;
  if (slot.id === "labor") return <LaborForm role={role} />;
  if (slot.id === "staff") return <StaffForm role={role} />;
  if (slot.id === "withholding" || slot.id === "service_income") return <FreelancerForm />;
  if (slot.id === "biz_cash") return <BizJournalForm kind="cash" role={role} />;
  if (slot.id === "biz_books") return <BizJournalForm kind="books" role={role} />;
  if (slot.id === "equity") return <EquityForm />;
  if (slot.id === "git") return <GitForm role={role} />;
  if (slot.id === "unlisted") return <UnlistedForm role={role} />;
  if (slot.id === "rates") return <TaxRateGuide />;

  return (
    <>
      <h3>{slot.label}</h3>
      <p className="erp-hint">{WORK_ROLE_LABEL[role]} 칸입니다. {slot.note}</p>
    </>
  );
}
