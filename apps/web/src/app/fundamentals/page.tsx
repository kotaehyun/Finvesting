"use client";
import { useMemo, useState } from "react";
import {
  FUNDAMENTAL_FIELDS,
  formatExtraValue,
  formatFundamentalValue,
  yahooQuoteUrl,
  type FundamentalFieldId,
} from "@finvesting/core";
import { trpc } from "@/lib/trpc";
import { InvestTrail } from "../invest-trail";

type Filter = "all" | "stock" | "etf";

const CLASS_EN: Record<string, string> = { stock: "Stock", etf: "ETF" };

export default function FundamentalsPage() {
  const board = trpc.market.fundamentals.useQuery();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const items = board.data ?? [];
    const needle = q.trim().toLowerCase();
    return items.filter((r) => {
      if (filter !== "all" && r.assetClass !== filter) return false;
      if (!needle) return true;
      return `${r.symbol} ${r.name} ${r.market}`.toLowerCase().includes(needle);
    });
  }, [board.data, filter, q]);

  return (
    <div className="fund-page">
      <h1>Fundamentals</h1>
      <p className="muted">
        Daily Yahoo snapshot. DART/EDGAR statements and audit opinions are on Statements.
        Article bodies are not stored. Quotes: <a href="https://finance.yahoo.com/" target="_blank" rel="noreferrer">Yahoo Finance</a>.
      </p>
      <InvestTrail current="fundamentals" />
      <div className="row" style={{ marginBottom: 12 }}>
        {(["all", "stock", "etf"] as const).map((id) => (
          <button
            key={id}
            type="button"
            className={`starter${filter === id ? " on" : ""}`}
            onClick={() => setFilter(id)}
          >
            {id === "all" ? "All" : CLASS_EN[id]}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Symbol or name"
          style={{ minWidth: 160 }}
        />
      </div>
      {board.isLoading && <p className="muted">Loading…</p>}
      {board.error && <p>Error: {board.error.message}</p>}
      {board.data && !board.data.length && (
        <p className="muted">
          No snapshots yet. Add a stock/ETF holding or set <code>YAHOO_TARGETS</code> (e.g. AAPL,MSFT,SPY), then run
          {" "}<code>pnpm --filter @finvesting/worker run:once</code>. Coins and world indices are not in this table.
        </p>
      )}
      {board.data && board.data.length > 0 && !rows.length && (
        <p className="muted">No rows match the filter.</p>
      )}
      {!!rows.length && (
        <div className="table-wrap">
          <table className="fund-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Date</th>
                {FUNDAMENTAL_FIELDS.map((f) => <th key={f.id} className="num">{f.label}</th>)}
                <th className="num">52w</th>
                <th className="num">YTD</th>
                <th className="num">Exp.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.instrumentId}>
                  <td>
                    <a href={yahooQuoteUrl(r.symbol)} target="_blank" rel="noreferrer">{r.symbol}</a>
                    <div className="muted">{r.name} · {CLASS_EN[r.assetClass] ?? r.assetClass} · {r.market}</div>
                  </td>
                  <td className="muted">{r.date}</td>
                  {FUNDAMENTAL_FIELDS.map((f) => (
                    <td key={f.id} className="num">
                      {cell(f.id, r[f.id], r.currency)}
                    </td>
                  ))}
                  <td className="num muted">
                    {r.extra.fiftyTwoWeekLow != null && r.extra.fiftyTwoWeekHigh != null
                      ? `${r.extra.fiftyTwoWeekLow.toLocaleString("en-US")}–${r.extra.fiftyTwoWeekHigh.toLocaleString("en-US")}`
                      : "—"}
                  </td>
                  <td className="num">{r.extra.ytdReturn != null ? formatExtraValue("ytdReturn", r.extra.ytdReturn, r.currency) : "—"}</td>
                  <td className="num">{r.extra.netExpenseRatio != null ? formatExtraValue("netExpenseRatio", r.extra.netExpenseRatio, r.currency) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function cell(id: FundamentalFieldId, n: number | null, currency: string) {
  if (n == null) return "—";
  return formatFundamentalValue(id, n, currency);
}
