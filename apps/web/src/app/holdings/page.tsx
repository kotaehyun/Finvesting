"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { trpc } from "@/lib/trpc";
import { assetClassLabel } from "@finvesting/core";
import { InvestTrail } from "../invest-trail";
import { Pnl } from "../pnl";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const qty = (n: number) => {
  const s = n.toFixed(8).replace(/\.?0+$/, "");
  return s === "-0" ? "0" : s;
};
const money = (n: number, currency: string) =>
  currency === "KRW" ? won(n) : `${n.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${currency}`;

const CLASSES = [
  { id: "stock", label: "주식" },
  { id: "etf", label: "ETF" },
  { id: "crypto", label: "코인" },
  { id: "bond", label: "채권" },
  { id: "fund", label: "펀드" },
  { id: "other", label: "기타" },
] as const;

type ClassId = (typeof CLASSES)[number]["id"];

function localNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HoldingsPage() {
  const accounts = trpc.accounts.list.useQuery();
  const instruments = trpc.market.instruments.useQuery();
  const holdings = trpc.trades.holdings.useQuery();
  const trades = trpc.trades.list.useQuery({ limit: 50 });
  const ensure = trpc.trades.ensureInstrument.useMutation();
  const create = trpc.trades.create.useMutation();
  const remove = trpc.trades.remove.useMutation();
  const utils = trpc.useUtils();

  const investAccounts = useMemo(
    () => (accounts.data ?? []).filter((a) => a.type === "brokerage" || a.type === "crypto" || a.type === "pension"),
    [accounts.data],
  );
  const accountChoices = investAccounts.length ? investAccounts : (accounts.data ?? []);

  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    if (accountId || !accountChoices.length) return;
    setAccountId(accountChoices[0]!.id);
  }, [accountId, accountChoices]);
  const [instrumentId, setInstrumentId] = useState("");
  const [newSymbol, setNewSymbol] = useState("");
  const [newMarket, setNewMarket] = useState("UPBIT");
  const [newName, setNewName] = useState("");
  const [newClass, setNewClass] = useState<ClassId>("crypto");
  const [newCurrency, setNewCurrency] = useState("KRW");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [fee, setFee] = useState("0");
  const [tax, setTax] = useState("0");
  const [fxRate, setFxRate] = useState("");
  const [tradedAt, setTradedAt] = useState(localNow);
  const [memo, setMemo] = useState("");
  const [msg, setMsg] = useState("");

  const selected = instruments.data?.find((i) => i.id === instrumentId);
  const needFx = selected != null && selected.currency !== "KRW";

  async function refresh() {
    await Promise.all([
      holdings.refetch(),
      trades.refetch(),
      instruments.refetch(),
      utils.dashboard.overview.invalidate(),
    ]);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      let instId = instrumentId;
      if (!instId) {
        if (!newSymbol.trim() || !newName.trim()) {
          setMsg("기존 종목을 고르거나 새 종목 심볼·이름을 입력하세요");
          return;
        }
        const inst = await ensure.mutateAsync({
          symbol: newSymbol, market: newMarket, name: newName, assetClass: newClass, currency: newCurrency,
        });
        instId = inst.id;
        setInstrumentId(inst.id);
      }
      if (!accountId) {
        setMsg("계좌를 선택하세요");
        return;
      }
      await create.mutateAsync({
        accountId,
        instrumentId: instId,
        side,
        quantity: Number(quantity),
        price: Number(price),
        fee: Number(fee) || 0,
        tax: Number(tax) || 0,
        fxRate: fxRate ? Number(fxRate) : undefined,
        tradedAt: new Date(tradedAt).toISOString(),
        memo: memo.trim() || undefined,
      });
      setQuantity(""); setPrice(""); setMemo("");
      setMsg("체결을 저장했습니다");
      await refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  async function onRemove(id: string) {
    setMsg("");
    try {
      await remove.mutateAsync({ id });
      await refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  const h = holdings.data;
  const busy = create.isPending || ensure.isPending;

  return (
    <>
      <h1>보유 · 체결</h1>
      <p className="muted">매수·매도를 넣으면 평단·실현손익을 계산합니다. 워커가 모은 최근 종가가 있으면 평가손익도 표시합니다. 순자산의 투자 금액은 보유 평가액과 증권·코인·연금 예수금의 합입니다.</p>
      <InvestTrail current="holdings" />

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>체결 추가</h3>
        {!accounts.data?.length && <p className="muted">먼저 <a href="/accounts">계좌</a>를 등록하세요.</p>}
        <form onSubmit={onCreate}>
          <div className="row" style={{ marginBottom: 8 }}>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
              <option value="">계좌 선택</option>
              {accountChoices.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <select value={instrumentId} onChange={(e) => setInstrumentId(e.target.value)}>
              <option value="">종목 선택 또는 아래 신규</option>
              {instruments.data?.map((i) => (
                <option key={i.id} value={i.id}>{i.symbol} · {i.market} · {i.name}</option>
              ))}
            </select>
            <select value={side} onChange={(e) => setSide(e.target.value as "buy" | "sell")}>
              <option value="buy">매수</option>
              <option value="sell">매도</option>
            </select>
          </div>
          {!instrumentId && (
            <div className="row" style={{ marginBottom: 8 }}>
              <input value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} placeholder="심볼 (BTC, 005930)" />
              <input value={newMarket} onChange={(e) => setNewMarket(e.target.value)} placeholder="마켓 (UPBIT, KRX, US)" />
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="이름" />
              <select value={newClass} onChange={(e) => setNewClass(e.target.value as ClassId)}>
                {CLASSES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <input value={newCurrency} onChange={(e) => setNewCurrency(e.target.value)} placeholder="통화" />
            </div>
          )}
          <div className="row">
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" step="any" min="0" placeholder="수량" required />
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="any" min="0" placeholder="단가" required />
            <input value={fee} onChange={(e) => setFee(e.target.value)} type="number" step="any" min="0" placeholder="수수료" />
            <input value={tax} onChange={(e) => setTax(e.target.value)} type="number" step="any" min="0" placeholder="세금" />
            {needFx && <input value={fxRate} onChange={(e) => setFxRate(e.target.value)} type="number" step="any" min="0" placeholder="환율 (비우면 USDKRW)" />}
            <input value={tradedAt} onChange={(e) => setTradedAt(e.target.value)} type="datetime-local" required />
            <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모 (선택)" />
            <button type="submit" disabled={busy || !accountChoices.length}>저장</button>
          </div>
        </form>
        {msg && <p className="muted" style={{ marginTop: 8 }}>{msg}</p>}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>보유</h3>
        {!h?.positions.length && <p className="muted">아직 열린 포지션이 없습니다.</p>}
        {h && h.totals.openCount > 0 && (
          <p className="muted">평가 {won(h.totals.marketValueKrw)} · 원가 {won(h.totals.costKrw)} · 평가손익 <Pnl n={h.totals.pnlKrw} />{h.totals.missingQuote ? ` · 시세 없는 종목 ${h.totals.missingQuote}` : ""}</p>
        )}
        {!!h?.positions.length && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>계좌</th><th>자산군</th><th>종목</th><th>수량</th><th>평단</th><th>현재가</th><th>평가</th><th>손익</th></tr></thead>
              <tbody>
                {h.positions.map((p) => (
                  <tr key={`${p.accountId}:${p.instrumentId}`}>
                    <td>{p.institution ? `${p.institution} · ` : ""}{p.accountName}</td>
                    <td>{assetClassLabel(p.assetClass)}</td>
                    <td>{p.symbol} <span className="muted">{p.market} {p.name}</span></td>
                    <td>{qty(p.quantity)}</td>
                    <td>{money(p.avgCost, p.currency)}</td>
                    <td>{p.lastPrice != null ? `${money(p.lastPrice, p.currency)}` : "없음"}{p.lastDate ? <span className="muted"> {p.lastDate}</span> : null}</td>
                    <td>{p.marketValueKrw != null ? won(p.marketValueKrw) : "—"}</td>
                    <td>{p.pnlKrw != null ? <Pnl n={p.pnlKrw} rate={p.pnlRate ?? 0} /> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3>최근 체결</h3>
        {!trades.data?.length && <p className="muted">체결이 없습니다.</p>}
        {!!trades.data?.length && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>시각</th><th>계좌</th><th>종목</th><th>구분</th><th>수량</th><th>단가</th><th></th></tr></thead>
              <tbody>
                {trades.data.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.tradedAt).toLocaleString("ko-KR")}</td>
                    <td>{t.institution ? `${t.institution} · ` : ""}{t.accountName}</td>
                    <td>{t.symbol} <span className="muted">{t.market}</span></td>
                    <td>{t.side === "buy" ? "매수" : "매도"}</td>
                    <td>{qty(Number(t.quantity))}</td>
                    <td>{money(Number(t.price), t.currency)}</td>
                    <td><button type="button" className="link" onClick={() => onRemove(t.id)} disabled={remove.isPending}>삭제</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
