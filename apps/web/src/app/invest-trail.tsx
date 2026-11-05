export type InvestTrailId =
  | "invest"
  | "style"
  | "holdings"
  | "fundamentals"
  | "dashboard"
  | "statements";

const LINKS: { id: InvestTrailId; href: string; label: string }[] = [
  { id: "invest", href: "/profile?menu=invest", label: "투자내역" },
  { id: "style", href: "/profile?menu=style", label: "투자성향" },
  { id: "holdings", href: "/holdings", label: "보유·체결" },
  { id: "fundamentals", href: "/fundamentals", label: "Fundamentals" },
  { id: "dashboard", href: "/invest", label: "투자 대시보드" },
  { id: "statements", href: "/statements", label: "재무제표" },
];

/** 투자내역·성향·보유·펀더멘털 등 관련 화면을 같은 줄로 잇는다. */
export function InvestTrail({
  current,
  variant = "starter",
}: {
  current?: InvestTrailId;
  variant?: "starter" | "erp";
}) {
  const items = LINKS.filter((l) => l.id !== current);
  const cls = variant === "erp" ? "erp-pills" : "starter-list";
  return (
    <nav
      className={cls}
      aria-label="투자 관련 화면"
      style={variant === "starter" ? { margin: "12px 0 16px" } : { margin: "0 0 12px" }}
    >
      {items.map((l) => (
        <a key={l.id} className={variant === "starter" ? "starter" : undefined} href={l.href}>
          {l.label}
        </a>
      ))}
    </nav>
  );
}
