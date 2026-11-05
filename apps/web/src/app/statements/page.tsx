import { Suspense } from "react";
import { StatementsView } from "./statements-view";

function first(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default async function StatementsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    area?: string | string[];
    browse?: string | string[];
  }>;
}) {
  const sp = await searchParams;
  return (
    <Suspense fallback={<p className="muted">주소의 종목 코드를 읽는 중…</p>}>
      <StatementsView
        q={first(sp.q)}
        initialArea={first(sp.area)}
        initialBrowse={first(sp.browse)}
      />
    </Suspense>
  );
}
