"use client";
import { useMemo, useState } from "react";
import {
  OPINION_CATEGORIES,
  opinionCategoriesForLang,
  opinionCategoryLabel,
  type OpinionCategoryId,
} from "@finvesting/core";
import { trpc } from "@/lib/trpc";

type LangFilter = "all" | "ko" | "en";
type CatFilter = "all" | OpinionCategoryId;

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

export default function OpinionsDashboard() {
  const [lang, setLang] = useState<LangFilter>("all");
  const [category, setCategory] = useState<CatFilter>("all");
  const [publisher, setPublisher] = useState("");
  const [q, setQ] = useState("");
  const focused = category !== "all" || Boolean(publisher);
  const feed = trpc.market.opinionFeed.useQuery({
    limit: focused || lang !== "all" ? 80 : 40,
    lang: lang === "all" ? undefined : lang,
    category: category === "all" ? undefined : category,
    publisher: publisher || undefined,
  });

  const items = useMemo(() => {
    let rows = feed.data?.items ?? [];
    if (category !== "all") rows = rows.filter((n) => n.category === category);
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((n) =>
      n.title.toLowerCase().includes(needle)
      || (n.summary ?? "").toLowerCase().includes(needle)
      || (n.publisher ?? "").toLowerCase().includes(needle),
    );
  }, [feed.data?.items, q, category]);

  const stats = feed.data?.stats;
  const publishers = feed.data?.publishers ?? [];
  const catStats = stats?.categories ?? OPINION_CATEGORIES.map((c) => ({ id: c.id, label: c.label, n: 0 }));
  const boardCats = category === "all"
    ? opinionCategoriesForLang(lang === "all" ? undefined : lang)
    : OPINION_CATEGORIES.filter((c) => c.id === category);
  const splitBoard = category === "all" && !publisher && !q.trim();

  function pickLang(next: LangFilter) {
    setLang(next);
    setPublisher("");
    if (next === "ko" && category === "global_opinion") setCategory("all");
    if (next === "en" && category === "kr_column") setCategory("all");
  }

  function pickCategory(next: CatFilter) {
    setCategory(next);
    setPublisher("");
    if (next === "kr_column") setLang("ko");
    if (next === "global_opinion") setLang("en");
  }

  return (
    <>
      <h1>오피니언 · 칼럼</h1>
      <p className="muted">
        속보와 분리합니다. 한경·연합 오피니언, FT·Project Syndicate, Seeking Alpha 제목·링크·요약만 둡니다.
        증권사 리포트 공개 RSS는 없어서, 국내 뉴스 제목의 애널리스트·목표가·투자의견만 같이 모읍니다. 본문은 저장하지 않습니다.
      </p>
      <div className="grid" style={{ margin: "12px 0 16px" }}>
        <button type="button" className={`card news-stat${lang === "all" && category === "all" ? " on" : ""}`} onClick={() => { setLang("all"); setCategory("all"); setPublisher(""); }}>
          <h3>전체</h3>
          <div className="big">{stats?.total ?? "—"}</div>
          <div className="muted">국내 {stats?.ko ?? "—"} · 해외 {stats?.en ?? "—"}</div>
        </button>
        {catStats.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`card news-stat${category === c.id ? " on" : ""}`}
            onClick={() => pickCategory(category === c.id ? "all" : c.id)}
          >
            <h3>{c.label}</h3>
            <div className="big">{c.n}</div>
          </button>
        ))}
      </div>
      <div className="row" style={{ marginBottom: 10 }}>
        {([
          { id: "all" as const, label: "전체" },
          { id: "ko" as const, label: "국내" },
          { id: "en" as const, label: "해외" },
        ]).map((f) => (
          <button key={f.id} type="button" className={`starter${lang === f.id ? " on" : ""}`} onClick={() => pickLang(f.id)}>
            {f.label}
          </button>
        ))}
        <span className="muted" aria-hidden>|</span>
        {OPINION_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`starter${category === c.id ? " on" : ""}`}
            onClick={() => pickCategory(category === c.id ? "all" : c.id)}
          >
            {c.label}
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
          <button type="button" className={`starter${!publisher ? " on" : ""}`} onClick={() => setPublisher("")}>출처 전체</button>
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
      {!feed.isLoading && !items.length && (
        <p className="muted">조건에 맞는 칼럼이 없습니다. worker RSS 수집 후 다시 조회하세요.</p>
      )}
      {splitBoard ? (
        <div className="opinion-board">
          {boardCats.map((c) => (
            <OpinionCol
              key={c.id}
              title={c.label}
              rows={items.filter((n) => n.category === c.id)}
            />
          ))}
        </div>
      ) : (
        <OpinionCol
          title={publisher || (category !== "all" ? opinionCategoryLabel(category) : lang === "ko" ? "국내" : lang === "en" ? "해외" : "검색")}
          rows={items}
        />
      )}
    </>
  );
}

function OpinionCol({ title, rows }: {
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
