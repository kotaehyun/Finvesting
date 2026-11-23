"use client";
// 계정 모드 셸(ADR 0067). 일반 = 위쪽 메뉴 + 둘째 줄, 비즈니스 = 왼쪽 트리 메뉴.
// 화면(page.tsx) 내용은 바꾸지 않는다. 모드는 쿠키에 둔다(기기별 화면 설정).
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UI_MODES,
  UI_MODE_COOKIE,
  UI_MODE_LABEL,
  activeNav,
  navFor,
  uiModeHome,
  type NavGroup,
  type UiMode,
} from "@finvesting/core";
import { UiModeProvider } from "@/lib/ui-mode";

function ModeSwitch({ mode }: { mode: UiMode }) {
  const change = (next: UiMode) => {
    if (next === mode) return;
    document.cookie = `${UI_MODE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    window.location.assign(uiModeHome(next));
  };
  return (
    <div className="mode-switch" role="group" aria-label="화면 모드">
      {UI_MODES.map((m) => (
        <button
          key={m}
          type="button"
          className={m === mode ? "on" : ""}
          aria-pressed={m === mode}
          onClick={() => change(m)}
        >
          {UI_MODE_LABEL[m]}
        </button>
      ))}
    </div>
  );
}

function Logout() {
  return (
    <form action="/api/auth/logout" method="post" className="shell-logout">
      <button type="submit" className="link">로그아웃</button>
    </form>
  );
}

function PersonalShell({ children, showLogout }: { children: React.ReactNode; showLogout: boolean }) {
  const pathname = usePathname() || "/";
  const active = activeNav("personal", pathname);
  const groups = navFor("personal");
  const sub = active && active.group.items.length > 1 ? active.group : null;
  return (
    <div className="pshell">
      <header className="pshell-top">
        <Link href="/" className="shell-brand">Finvesting</Link>
        <nav className="pshell-nav" aria-label="메뉴">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={g.href}
              className={active?.group.id === g.id ? "on" : ""}
              aria-current={active?.group.id === g.id ? "page" : undefined}
            >
              {g.label}
            </Link>
          ))}
        </nav>
        <div className="shell-right">
          <ModeSwitch mode="personal" />
          {showLogout ? <Logout /> : null}
        </div>
      </header>
      {sub ? <SubNav group={sub} current={active?.item.href ?? ""} /> : null}
      <main className="main">{children}</main>
    </div>
  );
}

function SubNav({ group, current }: { group: NavGroup; current: string }) {
  return (
    <nav className="pshell-sub" aria-label={`${group.label} 하위 메뉴`}>
      {group.items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={i.href === current ? "on" : ""}
          aria-current={i.href === current ? "page" : undefined}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

function BusinessShell({ children, showLogout }: { children: React.ReactNode; showLogout: boolean }) {
  const pathname = usePathname() || "/";
  const active = activeNav("business", pathname);
  return (
    <div className="bshell">
      <header className="bshell-top">
        <Link href="/" className="shell-brand">Finvesting <span className="bshell-badge">비즈니스</span></Link>
        <span className="bshell-where">
          {active ? `${active.group.label} › ${active.item.label}` : "메뉴에 없는 화면"}
        </span>
        <div className="shell-right">
          <ModeSwitch mode="business" />
          {showLogout ? <Logout /> : null}
        </div>
      </header>
      <div className="bshell-body">
        <nav className="bshell-tree" aria-label="업무 메뉴">
          {navFor("business").map((g) => (
            <div key={g.id} className={`bshell-group${active?.group.id === g.id ? " open" : ""}`}>
              <div className="bshell-group-title">{g.label}</div>
              {g.items.map((i) =>
                i.pending ? (
                  <span key={i.href} className="bshell-item pending" title={i.pending} aria-disabled="true">
                    {i.label}<small>{i.pending}</small>
                  </span>
                ) : (
                  <Link
                    key={i.href}
                    href={i.href}
                    className={`bshell-item${active?.item.href === i.href && active.group.id === g.id ? " on" : ""}`}
                    aria-current={active?.item.href === i.href && active.group.id === g.id ? "page" : undefined}
                  >
                    {i.label}
                  </Link>
                ),
              )}
            </div>
          ))}
        </nav>
        <main className="main main-biz">{children}</main>
      </div>
    </div>
  );
}

export function AppShell({
  mode,
  showLogout,
  children,
}: {
  mode: UiMode;
  showLogout: boolean;
  children: React.ReactNode;
}) {
  const shell = mode === "business"
    ? <BusinessShell showLogout={showLogout}>{children}</BusinessShell>
    : <PersonalShell showLogout={showLogout}>{children}</PersonalShell>;
  return <UiModeProvider mode={mode}>{shell}</UiModeProvider>;
}
