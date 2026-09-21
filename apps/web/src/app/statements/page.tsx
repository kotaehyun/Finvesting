import { Suspense } from "react";
import { StatementsView } from "./statements-view";

export default async function StatementsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = sp.q;
  const q = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  return (
    <Suspense fallback={<p className="muted">주소의 종목 코드를 읽는 중…</p>}>
      <StatementsView q={q} />
    </Suspense>
  );
}
