"use client";
import { useMemo, useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import {
  NEWS_CATEGORIES,
  newsCategoriesForLang,
  newsCategoryLabel,
  newsCategoryLang,
  type NewsCategoryId,
} from "@finvesting/core";
import { trpc } from "@/lib/trpc";

type LangFilter = "all" | "ko" | "en";
type CatFilter = "all" | NewsCategoryId;

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
  const [category, setCategory] = useState<CatFilter>("all");
  const [publisher, setPublisher] = useState("");
  const [q, setQ] = useState("");
  const focused = category !== "all" || Boolean(publisher);
  const feed = trpc.market.newsFeed.useQuery({
    limit: focused || lang !== "all" ? 80 : 40,
    lang: lang === "all" ? undefined : lang,
    category: category === "all" ? undefined : category,
    publisher: publisher || undefined,
  }, { placeholderData: keepPreviousData });

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

  const stats = feed.data?.stats;
  const publishers = feed.data?.publishers ?? [];
  const catStats = stats?.categories ?? NEWS_CATEGORIES.map((c) => ({ id: c.id, label: c.label, n: 0 }));
  const boardCats = category === "all"
    ? newsCategoriesForLang(lang === "all" ? undefined : lang)
    : NEWS_CATEGORIES.filter((c) => c.id === category);
  const splitBoard = category === "all" && !publisher && !q.trim();

  function pickLang(next: LangFilter) {
    setLang(next);
    setPublisher("");
    if (category !== "all" && next !== "all" && newsCategoryLang(category) !== next) setCategory("all");
  }

  function pickCategory(next: CatFilter) {
    setCategory(next);
    setPublisher("");
    if (next !== "all") setLang(newsCategoryLang(next));
  }

  return (
    <>
      <h1>뉴스 대시보드</h1>
      <p className="muted">수집한 제목·링크·요약만 보여 줍니다. 본문은 저장하지 않습니다. 분류는 피드(한경 금융·매경/연합 경제·한경 부동산·해외 시황·크립토·외환·중앙은행)입니다.</p>
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
        {NEWS_CATEGORIES.map((c) => (
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
      {splitBoard ? (
        <div className="news-board">
          {boardCats.map((c) => (
            <NewsCol
              key={c.id}
              title={c.label}
              rows={items.filter((n) => n.category === c.id)}
            />
          ))}
        </div>
      ) : (
        <NewsCol
          title={publisher || (category !== "all" ? newsCategoryLabel(category) : lang === "ko" ? "국내" : lang === "en" ? "해외" : "검색")}
          rows={items}
        />
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
