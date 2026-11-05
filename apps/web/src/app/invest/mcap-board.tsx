"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

type BoardTab = "kr" | "world";

type NewsHit = {
  id: string;
  title: string;
  url: string;
  publisher: string | null;
  publishedAt: string | null;
};

type McapRow = {
  instrumentId: string;
  symbol: string;
  name: string;
  market: string;
  currency: string;
  marketCap: number;
  rank: number;
  marketCapLabel: string;
  recentNews: NewsHit[];
};

function statementsHref(symbol: string, market: string) {
  const domestic = market === "KRX" || market === "KOSDAQ";
  const q = new URLSearchParams({
    area: domestic ? "kr" : "os",
    browse: "mcap",
    q: symbol,
  });
  return `/statements?${q.toString()}`;
}

function fmtPub(iso: string | null) {
  if (!iso) return "";
  const d = iso.slice(0, 10);
  return d || "";
}

export function McapBoard() {
  const q = trpc.market.mcapBoard.useQuery({ limit: 15 });
  const [tab, setTab] = useState<BoardTab>("kr");
  const [openId, setOpenId] = useState<string | null>(null);

  const data = q.data;
  const rows: McapRow[] = !data || data.status !== "ok"
    ? []
    : (tab === "kr" ? data.kr : data.world);

  return (
    <section className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0 }}>시가총액 순위</h3>
        <Link href="/statements?browse=mcap" className="link" style={{ fontSize: 13 }}>
          재무제표 · 시총 보기 →
        </Link>
      </div>
      <p className="muted" style={{ margin: "6px 0 12px", fontSize: 13 }}>
        Yahoo 수집분 기준입니다. 국내=KRX·KOSDAQ, 해외=주로 미국 상장. 전 세계 공식 순위가 아닙니다.
        {data?.asOf ? ` · 기준일 ${data.asOf}` : ""}
      </p>

      <div className="fold-tabs" role="tablist" aria-label="시가총액 지역" style={{ marginBottom: 12 }}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "kr"}
          className={`starter${tab === "kr" ? " on" : ""}`}
          onClick={() => { setTab("kr"); setOpenId(null); }}
        >
          국내 {data?.status === "ok" ? `(${data.kr.length})` : ""}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "world"}
          className={`starter${tab === "world" ? " on" : ""}`}
          onClick={() => { setTab("world"); setOpenId(null); }}
        >
          해외 · 수집분 {data?.status === "ok" ? `(${data.world.length})` : ""}
        </button>
      </div>

      {q.isLoading && <p className="muted">불러오는 중…</p>}
      {q.isError && <p className="muted">시총 순위를 불러오지 못했습니다.</p>}
      {data && data.status !== "ok" && (
        <p className="muted">
          {data.status === "empty"
            ? "시총 데이터가 없습니다. Yahoo 펀더멘털 수집을 먼저 실행하세요."
            : "시총 데이터를 사용할 수 없습니다."}
        </p>
      )}
      {data?.status === "ok" && rows.length === 0 && (
        <p className="muted">{tab === "kr" ? "국내" : "해외"} 시총 행이 없습니다.</p>
      )}

      {rows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table className="data" style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ width: 48 }}>순위</th>
                <th>종목</th>
                <th className="num">시가총액</th>
                <th style={{ width: 120 }}>연계</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const open = openId === r.instrumentId;
                const newsCount = r.recentNews.length;
                return (
                  <tr key={r.instrumentId}>
                    <td className="num">{r.rank}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "baseline" }}>
                        <span className="muted" style={{ fontSize: 11 }}>{r.market}</span>
                        <strong>{r.symbol}</strong>
                        <span>{r.name}</span>
                      </div>
                      {open && (
                        <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12 }}>
                          {newsCount === 0 && <li className="muted">관련 뉴스 없음</li>}
                          {r.recentNews.map((n) => (
                            <li key={n.id} style={{ marginBottom: 4 }}>
                              <a href={n.url} target="_blank" rel="noopener noreferrer">
                                {n.title}
                              </a>
                              <span className="muted">
                                {" "}
                                {[n.publisher, fmtPub(n.publishedAt)].filter(Boolean).join(" · ")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="num">{r.marketCapLabel}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                        <button
                          type="button"
                          className="link"
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: newsCount ? "var(--accent)" : "var(--muted)",
                          }}
                          onClick={() => setOpenId((cur) => (cur === r.instrumentId ? null : r.instrumentId))}
                        >
                          뉴스 {newsCount}건 {open ? "▲" : "▼"}
                        </button>
                        <Link
                          href={statementsHref(r.symbol, r.market)}
                          className="link"
                          style={{ fontSize: 12 }}
                        >
                          재무·개황
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
