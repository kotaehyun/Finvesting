"use client";
import { useState, type FormEvent } from "react";
import { trpc } from "@/lib/trpc";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

const TYPES = [
  { id: "checking", label: "입출금" },
  { id: "savings", label: "예금" },
  { id: "installment", label: "적금" },
  { id: "brokerage", label: "증권" },
  { id: "crypto", label: "코인" },
  { id: "card", label: "카드" },
  { id: "cash", label: "현금" },
  { id: "pension", label: "연금" },
  { id: "loan", label: "대출" },
] as const;

type TypeId = (typeof TYPES)[number]["id"];

type PreviewRow = {
  date: string;
  amount: number;
  direction: "in" | "out";
  merchant?: string;
  memo?: string;
  balanceAfter?: number;
  raw: Record<string, unknown>;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result ?? "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export default function AccountsPage() {
  const list = trpc.accounts.list.useQuery();
  const create = trpc.accounts.create.useMutation({ onSuccess: () => list.refetch() });
  const preview = trpc.transactions.previewImport.useMutation();
  const commit = trpc.transactions.commitImport.useMutation();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [type, setType] = useState<TypeId>("checking");
  const [balance, setBalance] = useState("0");
  const [accountId, setAccountId] = useState<string>("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[] | null>(null);
  const [skipped, setSkipped] = useState<Array<{ line: number; reason: string }>>([]);
  const [detected, setDetected] = useState("");
  const [msg, setMsg] = useState("");

  const txns = trpc.transactions.list.useQuery({ accountId, limit: 50 }, { enabled: !!accountId });

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const row = await create.mutateAsync({
      name: name.trim(),
      institution: institution.trim() || undefined,
      type,
      balance: Number(balance) || 0,
    });
    setName(""); setInstitution(""); setBalance("0");
    if (row?.id) setAccountId(row.id);
  }

  async function onFile(f: File | undefined) {
    if (!f || !accountId) return;
    setMsg("");
    try {
      const contentBase64 = await fileToBase64(f);
      const r = await preview.mutateAsync({ filename: f.name, contentBase64 });
      setDetected(r.detected);
      setPreviewRows(r.rows);
      setSkipped(r.skipped);
      if (!r.rows.length) setMsg(r.skipped[0]?.reason ?? "거래 행이 없습니다");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  async function onCommit() {
    if (!accountId || !previewRows?.length || !detected) return;
    try {
      const r = await commit.mutateAsync({ accountId, detected, rows: previewRows });
      setMsg(`저장 ${r.inserted}건` + (r.duplicate ? ` · 중복 건너뜀 ${r.duplicate}건` : "") + (r.balanceUpdated != null ? ` · 잔액 ${won(r.balanceUpdated)}` : ""));
      setPreviewRows(null); setSkipped([]);
      await Promise.all([list.refetch(), txns.refetch(), utils.dashboard.overview.invalidate()]);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <h1>계좌 · 거래</h1>
      <p className="muted">통장·카드 계좌를 등록하고, 은행 내보내기 CSV/XLSX를 가져옵니다. 입금은 기타수입, 출금은 미분류로 들어갑니다.</p>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>계좌 추가</h3>
        <form onSubmit={onCreate} className="row">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 (예: 카카오뱅크 입출금)" required />
          <input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="금융기관 (선택)" />
          <select value={type} onChange={(e) => setType(e.target.value as TypeId)}>
            {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <input value={balance} onChange={(e) => setBalance(e.target.value)} type="number" step="1" placeholder="잔액" />
          <button type="submit" disabled={create.isPending}>추가</button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>내 계좌</h3>
        {!list.data?.length && <p className="muted">아직 계좌가 없습니다.</p>}
        <ul className="plain">
          {list.data?.map((a) => (
            <li key={a.id}>
              <button type="button" className={a.id === accountId ? "link on" : "link"} onClick={() => { setAccountId(a.id); setPreviewRows(null); setMsg(""); }}>
                {a.name} <span className="muted">{TYPES.find((t) => t.id === a.type)?.label} · {won(Number(a.balance))}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {accountId && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>CSV/XLSX 가져오기</h3>
          <input type="file" accept=".csv,.xlsx,.xls,text/csv" onChange={(e) => onFile(e.target.files?.[0])} disabled={preview.isPending} />
          {detected && <p className="muted">인식: {detected} · {previewRows?.length ?? 0}건</p>}
          {!!skipped.length && <p className="muted">건너뜀 {skipped.length}행 (예: {skipped[0]?.reason})</p>}
          {previewRows && previewRows.length > 0 && (
            <>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>날짜</th><th>방향</th><th>금액</th><th>내용</th><th>잔액</th></tr></thead>
                  <tbody>
                    {previewRows.slice(0, 30).map((r, i) => (
                      <tr key={i}>
                        <td>{r.date}</td>
                        <td>{r.direction === "in" ? "입금" : "출금"}</td>
                        <td>{won(r.amount)}</td>
                        <td>{r.memo ?? r.merchant ?? ""}</td>
                        <td>{r.balanceAfter != null ? won(r.balanceAfter) : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewRows.length > 30 && <p className="muted">미리보기 30/{previewRows.length}건</p>}
              <button type="button" onClick={onCommit} disabled={commit.isPending} style={{ marginTop: 12 }}>이 내용으로 저장</button>
            </>
          )}
          {msg && <p className="muted" style={{ marginTop: 8 }}>{msg}</p>}
        </div>
      )}

      {accountId && !!txns.data?.length && (
        <div className="card">
          <h3>최근 거래</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>날짜</th><th>방향</th><th>금액</th><th>내용</th></tr></thead>
              <tbody>
                {txns.data.map((t) => (
                  <tr key={t.id}>
                    <td>{String(t.date)}</td>
                    <td>{t.direction === "in" ? "입금" : t.direction === "out" ? "출금" : "이체"}</td>
                    <td>{won(Number(t.amount))}</td>
                    <td>{t.memo ?? t.merchant ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
