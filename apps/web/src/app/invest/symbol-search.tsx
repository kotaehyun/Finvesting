"use client";
import { useEffect, useState } from "react";
import { instrumentFromYahooHit } from "@finvesting/core";
import { trpc } from "@/lib/trpc";

export function SymbolSearch() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 400);
    return () => window.clearTimeout(t);
  }, [q]);
  const enabled = debounced.length >= 2;
  const res = trpc.market.searchSymbols.useQuery({ q: debounced }, { enabled });
  const watch = trpc.market.watchlist.useQuery();
  const add = trpc.market.watchAdd.useMutation();
  const utils = trpc.useUtils();
  const watched = new Set((watch.data ?? []).map((w) => `${w.symbol}|${w.market}`));

  return (
    <section className="card" style={{ marginBottom: 16 }}>
      <h3>기업 검색</h3>
      <p className="muted" style={{ margin: "0 0 8px" }}>
        Yahoo 종목 검색입니다. 뉴스는 받지 않습니다. 한글 회사명보다 종목코드·영문이 잘 됩니다.
        관심에 넣으면 다음 시세 수집 대상이 됩니다. 실시간 호가가 아닙니다.
      </p>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="005930, samsung, AAPL…"
        aria-label="기업 검색"
        autoComplete="off"
        style={{ width: "min(420px, 100%)" }}
      />
      {enabled && res.isLoading && <p className="muted">찾는 중…</p>}
      {res.error && <p>오류: {res.error.message}</p>}
      {res.data?.error && <p className="muted">{res.data.error}</p>}
      {enabled && res.data && res.data.items.length === 0 && !res.isLoading && (
        <p className="muted">결과가 없습니다.</p>
      )}
      {msg && <p className="muted">{msg}</p>}
      <ul className="plain search-hits">
        {(res.data?.items ?? []).map((h) => {
          const draft = instrumentFromYahooHit(h);
          const key = draft ? `${draft.symbol}|${draft.market}` : "";
          const on = Boolean(draft && watched.has(key));
          return (
            <li key={h.symbol} className="search-hit">
              <strong>{h.symbol}</strong>
              <span> {h.name}</span>
              <span className="muted">
                {" "}{h.exchange ?? ""}{h.quoteType ? ` · ${h.quoteType}` : ""}
              </span>
              <span className="search-links">
                <a href={h.yahooUrl} target="_blank" rel="noreferrer">Yahoo</a>
                {h.naverUrl && <a href={h.naverUrl} target="_blank" rel="noreferrer">네이버</a>}
                {h.dartUrl && <a href={h.dartUrl} target="_blank" rel="noreferrer">DART</a>}
                {h.edgarUrl && <a href={h.edgarUrl} target="_blank" rel="noreferrer">EDGAR</a>}
                {draft
                  ? (
                    <button
                      type="button"
                      className="link"
                      disabled={on || add.isPending}
                      onClick={() => {
                        add.mutateAsync({
                          symbol: h.symbol, name: h.name, exchange: h.exchange, quoteType: h.quoteType,
                        }).then((r) => {
                          setMsg(r.already ? `${r.symbol}은 이미 관심 종목입니다.` : `${r.symbol}을 관심에 넣었습니다. 시세는 다음 수집 때 붙습니다.`);
                          return utils.market.watchlist.invalidate();
                        }).catch((e: Error) => setMsg(e.message));
                      }}
                    >
                      {on ? "관심됨" : "관심 추가"}
                    </button>
                  )
                  : <span className="muted">관심 불가</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
