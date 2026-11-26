"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { trpc } from "@/lib/trpc";
import { categoriesFor, categoryLabel, type TxnCategoryId } from "@/lib/categories";
import { useUiMode } from "@/lib/ui-mode";

const won = (n: number, currency = "KRW") => {
  const body = `${Math.round(n).toLocaleString("ko-KR")}`;
  return currency === "KRW" ? `${body}원` : `${body} ${currency}`;
};

/** 입금은 +, 출금은 -. 0은 부호 없음. */
function signedMoney(n: number, currency = "KRW") {
  const r = Math.round(n);
  if (r === 0) return won(0, currency);
  const body = won(Math.abs(r), currency);
  return r > 0 ? `+${body}` : `-${body}`;
}

const WEEK = ["일", "월", "화", "수", "목", "금", "토"] as const;
const PERIODS = [
  { id: "1m", label: "1개월", months: 1 },
  { id: "3m", label: "3개월", months: 3 },
  { id: "6m", label: "6개월", months: 6 },
  { id: "all", label: "전체 기간", months: 0 },
] as const;
type PeriodId = (typeof PERIODS)[number]["id"];
type DirFilter = "all" | "in" | "out" | "transfer";

function kstToday(): string {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 10);
}

function monthsBefore(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1 - months, d ?? 1);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

function isoDay(value: string | Date): string {
  if (typeof value === "string") return value.slice(0, 10);
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayHeading(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return `${y}년 ${m}월 ${d}일 ${WEEK[dt.getDay()]}요일`;
}

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
  const mode = useUiMode();
  const personal = mode === "personal";
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
  const [period, setPeriod] = useState<PeriodId>("3m");
  const [dir, setDir] = useState<DirFilter>("all");
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[] | null>(null);
  const [skipped, setSkipped] = useState<Array<{ line: number; reason: string }>>([]);
  const [detected, setDetected] = useState("");
  const [msg, setMsg] = useState("");

  const range = useMemo(() => {
    const spec = PERIODS.find((p) => p.id === period);
    if (!spec || spec.months === 0) return {};
    const to = kstToday();
    return { from: monthsBefore(to, spec.months), to };
  }, [period]);

  const txns = trpc.transactions.list.useQuery(
    { accountId, limit: 200, ...range },
    { enabled: !!accountId },
  );

  useEffect(() => {
    if (!accountId && list.data?.[0]) setAccountId(list.data[0].id);
  }, [accountId, list.data]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const row = await create.mutateAsync({
      name: name.trim(),
      institution: institution.trim() || undefined,
      type,
      balance: Number(balance) || 0,
    });
    setName(""); setInstitution(""); setBalance("0"); setAddOpen(false);
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

  const selected = list.data?.find((a) => a.id === accountId);
  const currency = selected?.currency ?? "KRW";
  const typeLabel = (id: string) => TYPES.find((t) => t.id === id)?.label ?? id;

  const visible = useMemo(() => {
    const rows = txns.data ?? [];
    const needle = q.trim().toLowerCase();
    return rows.filter((t) => {
      if (dir !== "all" && t.direction !== dir) return false;
      if (!needle) return true;
      const blob = `${t.memo ?? ""} ${t.merchant ?? ""} ${categoryLabel(t.category)}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [txns.data, dir, q]);

  const sums = useMemo(() => {
    let inn = 0;
    let out = 0;
    for (const t of visible) {
      const n = Number(t.amount);
      if (!Number.isFinite(n)) continue;
      if (t.direction === "in") inn += n;
      else if (t.direction === "out") out += n;
    }
    return { inn, out };
  }, [visible]);

  const capped = (txns.data?.length ?? 0) >= 200;

  return (
    <div className={personal ? "card-page ledger" : "ledger"}>
      <div className={personal ? "card-page-head" : "page-head"}>
        <div>
          <h1>계좌 · 거래</h1>
          <p className={personal ? "lead" : "muted"}>
            통장처럼 계좌를 고르고, 날짜별로 입금·출금을 봅니다. 파일로 가져온 거래만 나옵니다.
          </p>
        </div>
        {!personal && (
          <div className="row">
            <a className="starter" href="/accounting">회계 전표 내보내기 (더존/위하고)</a>
          </div>
        )}
      </div>

      <div className="ledger-accts" role="group" aria-label="내 계좌">
          {list.data?.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-pressed={a.id === accountId}
              className={a.id === accountId ? "ledger-acct on" : "ledger-acct"}
              onClick={() => { setAccountId(a.id); setPreviewRows(null); setMsg(""); setQ(""); }}
            >
              <span className="inst">{a.institution?.trim() || "기관 없음"}</span>
              <span className="name">{a.name}</span>
              <span className="meta">{typeLabel(a.type)}</span>
              <strong className="bal">{won(Number(a.balance), a.currency)}</strong>
            </button>
          ))}
          <button type="button" className={addOpen ? "ledger-acct add on" : "ledger-acct add"} onClick={() => setAddOpen((v) => !v)}>
            <span className="name">{addOpen ? "닫기" : "계좌 추가"}</span>
            <span className="meta">이름·종류·잔액을 직접 넣습니다</span>
          </button>
      </div>
      {!list.data?.length && !list.isLoading && <p className="muted">아직 계좌가 없습니다. 계좌 추가로 등록하세요.</p>}

      {(addOpen || (!list.isLoading && !list.data?.length)) && (
        <div className="card">
          <h3>계좌 추가</h3>
          <form onSubmit={onCreate} className="field-grid">
            <label>이름<input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 입출금" required /></label>
            <label>금융기관<input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="선택" /></label>
            <label>
              종류
              <select value={type} onChange={(e) => setType(e.target.value as TypeId)}>
                {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>
            <label>잔액<input value={balance} onChange={(e) => setBalance(e.target.value)} type="number" step="1" placeholder="0" /></label>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button type="submit" disabled={create.isPending}>추가</button>
            </div>
          </form>
        </div>
      )}

      {selected && (
        <section className="card ledger-book" aria-label={`${selected.name} 거래`}>
          <header className="ledger-hero">
            <div>
              <p className="who">{selected.institution?.trim() || "기관 없음"} · {typeLabel(selected.type)}</p>
              <h2>{selected.name}</h2>
              <p className="bal">{won(Number(selected.balance), currency)}</p>
              <p className="muted">저장된 잔액입니다. 아래 합계는 이 목록만 더한 값입니다.</p>
            </div>
            <div className="ledger-kpis">
              <div>
                <span className="k">입금</span>
                <strong className="v in">{won(sums.inn, currency)}</strong>
              </div>
              <div>
                <span className="k">출금</span>
                <strong className="v">{won(sums.out, currency)}</strong>
              </div>
              <div>
                <span className="k">건수</span>
                <strong className="v">{visible.length.toLocaleString("ko-KR")}건</strong>
              </div>
            </div>
          </header>

          <div className="ledger-filters">
            <div className="ledger-chips" role="group" aria-label="기간">
              {PERIODS.map((p) => (
                <button key={p.id} type="button" className={period === p.id ? "on" : ""} aria-pressed={period === p.id} onClick={() => setPeriod(p.id)}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="ledger-chips" role="group" aria-label="입출금">
              {([
                ["all", "전체"],
                ["in", "입금"],
                ["out", "출금"],
                ["transfer", "이체"],
              ] as const).map(([id, label]) => (
                <button key={id} type="button" className={dir === id ? "on" : ""} aria-pressed={dir === id} onClick={() => setDir(id)}>
                  {label}
                </button>
              ))}
            </div>
            <input
              className="ledger-search"
              type="search"
              value={q}
              placeholder="적요 검색"
              aria-label="적요 검색"
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {capped && <p className="muted">최근 200건까지 표시합니다.</p>}
          {txns.isLoading && <p className="muted">불러오는 중…</p>}
          {!txns.isLoading && visible.length === 0 && (
            <p className="muted">{txns.data?.length ? "이 조건에 맞는 거래가 없습니다." : "이 기간에 가져온 거래가 없습니다."}</p>
          )}

          <TxnList
            rows={visible}
            currency={currency}
            onChanged={() => { txns.refetch(); utils.dashboard.overview.invalidate(); }}
          />

          <div className="ledger-import">
            <h3>거래 파일 가져오기</h3>
            <p className="muted">은행에서 받은 CSV, 엑셀, 워드를 올립니다. 입금은 기타수입, 출금은 미분류로 들어가고 각 줄에서 바꿀 수 있습니다.</p>
            <input type="file" accept=".csv,.xlsx,.xls,.docx,.doc,text/csv" onChange={(e) => onFile(e.target.files?.[0])} disabled={preview.isPending} />
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
                          <td className={r.direction === "in" ? "num in" : "num"}>{r.direction === "in" ? signedMoney(r.amount, currency) : signedMoney(-r.amount, currency)}</td>
                          <td>{r.memo ?? r.merchant ?? ""}</td>
                          <td>{r.balanceAfter != null ? won(r.balanceAfter, currency) : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewRows.length > 30 && <p className="muted">미리보기 30/{previewRows.length}건</p>}
                <button type="button" onClick={onCommit} disabled={commit.isPending}>이 내용으로 저장</button>
              </>
            )}
            {msg && <p className="muted">{msg}</p>}
          </div>
        </section>
      )}
    </div>
  );
}

type TxnRow = {
  id: string;
  date: string | Date;
  amount: string | number;
  direction: "in" | "out" | "transfer";
  category: string;
  merchant: string | null;
  memo: string | null;
};

function dirWord(direction: TxnRow["direction"]) {
  if (direction === "in") return "입금";
  if (direction === "out") return "출금";
  return "이체";
}

function amountText(row: TxnRow, currency: string) {
  const n = Number(row.amount);
  if (!Number.isFinite(n) || Math.round(n) === 0) return { text: won(0, currency), tone: "flat" as const };
  if (row.direction === "in") return { text: signedMoney(n, currency), tone: "in" as const };
  if (row.direction === "out") return { text: signedMoney(-n, currency), tone: "out" as const };
  return { text: won(n, currency), tone: "move" as const };
}

function TxnList({ rows, currency, onChanged }: { rows: TxnRow[]; currency: string; onChanged: () => void }) {
  const update = trpc.transactions.updateCategory.useMutation();
  const [err, setErr] = useState("");
  const groups = useMemo(() => {
    const map = new Map<string, TxnRow[]>();
    for (const row of rows) {
      const day = isoDay(row.date);
      const bucket = map.get(day);
      if (bucket) bucket.push(row);
      else map.set(day, [row]);
    }
    return [...map.entries()];
  }, [rows]);

  async function onCategory(id: string, category: string) {
    setErr("");
    try {
      await update.mutateAsync({ id, category: category as TxnCategoryId });
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="ledger-days">
      {groups.map(([day, items]) => (
        <section key={day}>
          <h3 className="ledger-day">{dayHeading(day)}</h3>
          <ul className="ledger-list">
            {items.map((t) => {
              const title = (t.memo ?? t.merchant ?? "").trim() || "내용 없음";
              const extra = t.memo && t.merchant && t.memo !== t.merchant ? t.merchant : "";
              const amt = amountText(t, currency);
              return (
                <li key={t.id} className="ledger-row">
                  <div className="ledger-main">
                    <span className="title">{title}</span>
                    <span className="sub">
                      <span>{dirWord(t.direction)}</span>
                      {extra && <span>{extra}</span>}
                      <select
                        className="ledger-cat"
                        value={t.category}
                        aria-label={`${title} 분류`}
                        onChange={(e) => onCategory(t.id, e.target.value)}
                        disabled={update.isPending}
                      >
                        {categoriesFor(t.direction).map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </span>
                  </div>
                  <span className={`ledger-amt ${amt.tone}`}>{amt.text}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {err && <p className="muted">{err}</p>}
    </div>
  );
}
