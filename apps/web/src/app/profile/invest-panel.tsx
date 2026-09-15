"use client";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { assetClassLabel, summarizeByClass } from "@finvesting/core";
import { InvestTrail } from "../invest-trail";
import { Pnl } from "../pnl";

const ACCOUNT_TYPES: Record<string, string> = {
  brokerage: "증권",
  crypto: "코인",
  pension: "연금",
};

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const qty = (n: number) => {
  const s = n.toFixed(8).replace(/\.?0+$/, "");
  return s === "-0" ? "0" : s;
};
const money = (n: number, currency: string) =>
  currency === "KRW" ? won(n) : `${n.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${currency}`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function InvestPanel() {
  const holdings = trpc.trades.holdings.useQuery();
  const trades = trpc.trades.list.useQuery({ limit: 80 });
  const [accountId, setAccountId] = useState("");
  const [cls, setCls] = useState("all");

  const h = holdings.data;
  const scoped = useMemo(
    () => (h?.positions ?? []).filter((p) => !accountId || p.accountId === accountId),
    [h?.positions, accountId],
  );
  const classSummary = useMemo(() => summarizeByClass(scoped), [scoped]);
  const rows = useMemo(
    () => scoped.filter((p) => cls === "all" || p.assetClass === cls),
    [scoped, cls],
  );
  const tradeRows = useMemo(
    () => (trades.data ?? []).filter((t) => {
      if (accountId && t.accountId !== accountId) return false;
      if (cls !== "all" && t.assetClass !== cls) return false;
      return true;
    }),
    [trades.data, accountId, cls],
  );

  const totals = {
    count: rows.length,
    costKrw: rows.reduce((s, p) => s + p.costKrw, 0),
    marketValueKrw: rows.reduce((s, p) => s + (p.marketValueKrw ?? 0), 0),
    pnlKrw: rows.reduce((s, p) => s + (p.pnlKrw ?? 0), 0),
  };
  const accounts = h?.byAccount ?? [];

  return (
    <>
      <h3>투자내역</h3>
      <p className="erp-hint">
        증권·코인·연금 계좌를 모두 모아 주식·ETF·채권·펀드·코인을 봅니다. 카드를 누르면 그 계좌만.
        체결 입력은 보유 화면, 성향·조언은 바로 아래 링크로 이어집니다.
      </p>
      <InvestTrail current="invest" variant="erp" />

      <div className="erp-accts">
        <button
          type="button"
          className={!accountId ? "erp-acct on" : "erp-acct"}
          onClick={() => setAccountId("")}
        >
          <span className="erp-acct-bank">전체 계좌</span>
          <strong>{accounts.length}개</strong>
          <span className="muted">평가 {won(h?.totals.marketValueKrw ?? 0)} · 보유 {h?.totals.openCount ?? 0}건</span>
        </button>
        {accounts.map((a) => (
          <button
            key={a.accountId}
            type="button"
            className={accountId === a.accountId ? "erp-acct on" : "erp-acct"}
            onClick={() => setAccountId((id) => id === a.accountId ? "" : a.accountId)}
          >
            <span className="erp-acct-bank">{a.institution?.trim() || ACCOUNT_TYPES[a.type] || a.type}</span>
            <strong>{a.name}</strong>
            <span className="muted">
              {ACCOUNT_TYPES[a.type] ?? a.type} · 보유 {a.count}건 · 평가 {won(a.marketValueKrw)}
            </span>
          </button>
        ))}
      </div>
      {!accounts.length && (
        <p className="erp-hint">증권·코인·연금 계좌가 없습니다. <a href="/accounts">계좌 등록</a> 후 체결을 넣으세요.</p>
      )}

      <h3 style={{ marginTop: 16 }}>자산군 {accountId ? "· 선택 계좌" : "· 전체"}</h3>
      <div className="erp-pills" role="tablist" aria-label="자산군">
        <button type="button" className={cls === "all" ? "on" : ""} onClick={() => setCls("all")}>
          전체 {scoped.length}
        </button>
        {classSummary.map((c) => (
          <button key={c.assetClass} type="button" className={cls === c.assetClass ? "on" : ""} onClick={() => setCls(c.assetClass)}>
            {c.label} {c.count}
          </button>
        ))}
      </div>
      <table className="erp-grid">
        <thead>
          <tr>
            <th>자산군</th>
            <th className="num">건수</th>
            <th className="num">원가</th>
            <th className="num">평가</th>
            <th className="num">손익</th>
            <th className="num">비중</th>
            <th style={{ width: 120 }}>배분</th>
          </tr>
        </thead>
        <tbody>
          {classSummary.map((c) => (
            <tr key={c.assetClass} className={cls === c.assetClass ? "sel" : ""} onClick={() => setCls((v) => v === c.assetClass ? "all" : c.assetClass)}>
              <td className="ro">{c.label}</td>
              <td className="ro num">{c.count}</td>
              <td className="ro num">{won(c.costKrw)}</td>
              <td className="ro num">{won(c.marketValueKrw)}</td>
              <td className="ro num"><Pnl n={c.pnlKrw} /></td>
              <td className="ro num">{pct(c.weight)}</td>
              <td className="ro">
                <span className="erp-bar" aria-hidden><i style={{ width: `${Math.round(c.weight * 100)}%` }} /></span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>합계</td>
            <td className="num">{classSummary.reduce((s, c) => s + c.count, 0)}</td>
            <td className="num">{won(classSummary.reduce((s, c) => s + c.costKrw, 0))}</td>
            <td className="num">{won(classSummary.reduce((s, c) => s + c.marketValueKrw, 0))}</td>
            <td className="num"><Pnl n={classSummary.reduce((s, c) => s + c.pnlKrw, 0)} /></td>
            <td className="num">100%</td>
            <td />
          </tr>
        </tfoot>
      </table>

      <h3 style={{ marginTop: 16 }}>보유 종목</h3>
      {h && h.totals.missingQuote > 0 && (
        <p className="erp-hint">시세 없는 종목 {h.totals.missingQuote}건은 평가손익이 비어 있습니다.</p>
      )}
      <table className="erp-grid">
        <thead>
          <tr>
            <th>증권사·거래소</th>
            <th>계좌</th>
            <th>자산군</th>
            <th>종목</th>
            <th className="num">수량</th>
            <th className="num">평단</th>
            <th className="num">현재가</th>
            <th className="num">평가</th>
            <th className="num">손익</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={`${p.accountId}:${p.instrumentId}`}>
              <td className="ro">{p.institution?.trim() || "—"}</td>
              <td className="ro">{p.accountName || "—"}</td>
              <td className="ro">{assetClassLabel(p.assetClass)}</td>
              <td className="ro">{p.symbol} {p.name ? `· ${p.name}` : ""} <span className="muted">{p.market}</span></td>
              <td className="ro num">{qty(p.quantity)}</td>
              <td className="ro num">{money(p.avgCost, p.currency)}</td>
              <td className="ro num">{p.lastPrice != null ? money(p.lastPrice, p.currency) : "없음"}{p.lastDate ? ` ${p.lastDate}` : ""}</td>
              <td className="ro num">{p.marketValueKrw != null ? won(p.marketValueKrw) : "—"}</td>
              <td className="ro num">{p.pnlKrw != null ? <Pnl n={p.pnlKrw} rate={p.pnlRate ?? 0} /> : "—"}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr><td className="ro" colSpan={9}>보유가 없습니다. 보유 화면에서 계좌를 골라 체결을 넣으세요.</td></tr>
          )}
        </tbody>
        {!!rows.length && (
          <tfoot>
            <tr>
              <td colSpan={3}>합계 {totals.count}건</td>
              <td colSpan={4} />
              <td className="num">{won(totals.marketValueKrw)}</td>
              <td className="num"><Pnl n={totals.pnlKrw} /></td>
            </tr>
          </tfoot>
        )}
      </table>

      <h3 style={{ marginTop: 16 }}>최근 체결</h3>
      <table className="erp-grid">
        <thead>
          <tr>
            <th>시각</th>
            <th>계좌</th>
            <th>자산군</th>
            <th>종목</th>
            <th>구분</th>
            <th className="num">수량</th>
            <th className="num">단가</th>
          </tr>
        </thead>
        <tbody>
          {tradeRows.map((t) => (
            <tr key={t.id}>
              <td className="ro">{new Date(t.tradedAt).toLocaleString("ko-KR")}</td>
              <td className="ro">{t.institution ? `${t.institution} · ` : ""}{t.accountName}</td>
              <td className="ro">{assetClassLabel(t.assetClass)}</td>
              <td className="ro">{t.symbol} <span className="muted">{t.market}</span></td>
              <td className="ro">{t.side === "buy" ? "매수" : "매도"}</td>
              <td className="ro num">{qty(Number(t.quantity))}</td>
              <td className="ro num">{money(Number(t.price), t.currency)}</td>
            </tr>
          ))}
          {!tradeRows.length && <tr><td className="ro" colSpan={7}>체결이 없습니다.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
