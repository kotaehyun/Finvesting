"use client";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";

type LangFilter = "all" | "ko" | "en";

function fmtAt(v: Date | string | null | undefined) {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NewsDashboard() {
  const [lang, setLang] = useState<LangFilter>("all");
  const [publisher, setPublisher] = useState("");
  const [q, setQ] = useState("");
  const feed = trpc.market.newsFeed.useQuery({
    limit: 80,
    lang: lang === "all" ? undefined : lang,
    publisher: publisher || undefined,
  });

  const items = useMemo(() => {
    const rows = feed.data?.items ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((n) =>
      n.title.toLowerCase().includes(needle)
      || (n.summary ?? "").toLowerCase().includes(needle)
      || (n.publisher ?? "").toLowerCase().includes(needle),
    );
  }, [feed.data?.items, q]);

  const ko = items.filter((n) => n.lang === "ko");
  const en = items.filter((n) => n.lang === "en");
  const other = items.filter((n) => n.lang !== "ko" && n.lang !== "en");
  const stats = feed.data?.stats;
  const publishers = feed.data?.publishers ?? [];

  return (
    <>
      <h1>뉴스 대시보드</h1>
      <p className="muted">수집한 제목·링크·요약만 보여 줍니다. 본문은 저장하지 않습니다. 원문은 제목을 누르면 열립니다.</p>
      <div className="grid" style={{ margin: "12px 0 16px" }}>
        <div className="card"><h3>전체</h3><div className="big">{stats?.total ?? "—"}</div></div>
        <div className="card"><h3>국내</h3><div className="big">{stats?.ko ?? "—"}</div><div className="muted">한경·매경·연합</div></div>
        <div className="card"><h3>해외</h3><div className="big">{stats?.en ?? "—"}</div><div className="muted">CNBC · MarketWatch · Fed · ECB</div></div>
      </div>
      <div className="row" style={{ marginBottom: 10 }}>
        {([
          { id: "all" as const, label: "전체" },
          { id: "ko" as const, label: "국내" },
          { id: "en" as const, label: "해외" },
        ]).map((f) => (
          <button key={f.id} type="button" className={`starter${lang === f.id ? " on" : ""}`} onClick={() => { setLang(f.id); setPublisher(""); }}>
            {f.label}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제목·요약 검색"
          style={{ flex: 1, minWidth: 160 }}
        />
      </div>
      {publishers.length > 0 && (
        <div className="starter-list" style={{ marginBottom: 16 }}>
          <button type="button" className={`starter${!publisher ? " on" : ""}`} onClick={() => setPublisher("")}>언론 전체</button>
          {publishers.map((p) => (
            <button
              key={p.publisher}
              type="button"
              className={`starter${publisher === p.publisher ? " on" : ""}`}
              onClick={() => setPublisher(publisher === p.publisher ? "" : p.publisher)}
            >
              {p.publisher} ({p.n})
            </button>
          ))}
        </div>
      )}
      {feed.isLoading && <p className="muted">불러오는 중…</p>}
      {feed.error && <p>오류: {feed.error.message}</p>}
      {!feed.isLoading && !items.length && <p className="muted">조건에 맞는 뉴스가 없습니다. worker RSS 수집 후 다시 조회하세요.</p>}
      {lang === "all" && !publisher && !q.trim() ? (
        <div className="news-board">
          <NewsCol title="국내" rows={ko} />
          <NewsCol title="해외" rows={en} />
          {other.length > 0 && <NewsCol title="기타" rows={other} />}
        </div>
      ) : (
        <NewsCol title={publisher || (lang === "ko" ? "국내" : lang === "en" ? "해외" : "검색")} rows={items} />
      )}
    </>
  );
}

function NewsCol({ title, rows }: {
  title: string;
  rows: Array<{ id: string; title: string; url: string; publisher: string | null; publishedAt: Date | string | null; summary: string | null }>;
}) {
  return (
    <section className="card">
      <h3>{title} <span className="muted">{rows.length}건</span></h3>
      <ul className="plain news-list">
        {rows.map((n) => (
          <li key={n.id} className="news-item">
            <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
            <div className="muted">
              {n.publisher ?? "—"}
              {n.publishedAt ? ` · ${fmtAt(n.publishedAt)}` : ""}
            </div>
            {n.summary && <p className="news-sum">{n.summary}</p>}
          </li>
        ))}
        {!rows.length && <li className="muted">없음</li>}
      </ul>
    </section>
  );
}
