"use client";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { projectSavings } from "@finvesting/core";

const KINDS = [
  { id: "installment", label: "적금" },
  { id: "savings", label: "예금" },
] as const;
const COMPOUNDS = [
  { id: "simple", label: "단리" },
  { id: "compound", label: "월복리" },
] as const;

type KindId = (typeof KINDS)[number]["id"];
type CompoundId = (typeof COMPOUNDS)[number]["id"];
type ContribDraft = { key: string; id?: string; month: string; amount: string; memo: string };

export type SavingsHandle = {
  save: () => Promise<void>;
  create: () => void;
  remove: () => void;
  canDelete: boolean;
  refetch: () => Promise<void>;
};

function won(n: number) {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}
function newKey() {
  return crypto.randomUUID();
}
function digitsOnly(s: string) {
  return s.replace(/[^\d]/g, "");
}
function grouped(s: string) {
  const d = digitsOnly(s);
  if (!d) return "";
  return Number(d).toLocaleString("ko-KR");
}
function Num({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input inputMode="numeric" value={grouped(value)} onChange={(e) => onChange(digitsOnly(e.target.value))} />
  );
}
function Rate({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      inputMode="decimal"
      value={value}
      onChange={(e) => {
        const v = e.target.value.replace(/[^\d.]/g, "");
        const parts = v.split(".");
        onChange(parts.length <= 2 ? v : `${parts[0]}.${parts.slice(1).join("")}`);
      }}
      placeholder="3.50"
    />
  );
}

export const SavingsPanel = forwardRef<SavingsHandle, {
  month: string;
  accounts: Array<{ id: string; name: string; type: string; institution: string | null }>;
  onDirty: () => void;
  onMsg: (s: string) => void;
  dirty: boolean;
}>(function SavingsPanel({ month, accounts, onDirty, onMsg, dirty }, ref) {
  const list = trpc.savings.list.useQuery();
  const upsert = trpc.savings.upsert.useMutation();
  const removeMut = trpc.savings.remove.useMutation();

  const [selPlan, setSelPlan] = useState<string | null>(null);
  const [selContrib, setSelContrib] = useState<string | null>(null);
  const [id, setId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [kind, setKind] = useState<KindId>("installment");
  const [rate, setRate] = useState("");
  const [compounding, setCompounding] = useState<CompoundId>("simple");
  const [term, setTerm] = useState("");
  const [monthly, setMonthly] = useState("");
  const [start, setStart] = useState(month);
  const [maturity, setMaturity] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [contribs, setContribs] = useState<ContribDraft[]>([]);
  const [deletedContrib, setDeletedContrib] = useState<string[]>([]);
  const [localOnly, setLocalOnly] = useState(false);

  const depositAccounts = accounts.filter((a) => a.type === "installment" || a.type === "savings");

  function loadPlan(p: NonNullable<typeof list.data>[number] | null) {
    setLocalOnly(false);
    setDeletedContrib([]);
    setSelContrib(null);
    if (!p) {
      setId(undefined);
      setName(""); setInstitution(""); setKind("installment"); setRate("");
      setCompounding("simple"); setTerm(""); setMonthly(""); setStart(month);
      setMaturity(""); setDescription(""); setAccountId("");
      setContribs([{ key: newKey(), month, amount: "", memo: "" }]);
      return;
    }
    setId(p.id);
    setName(p.name);
    setInstitution(p.institution ?? "");
    setKind(p.kind === "savings" ? "savings" : "installment");
    setRate(p.interestRate ? String(p.interestRate) : "");
    setCompounding(p.compounding === "compound" ? "compound" : "simple");
    setTerm(p.termMonths != null ? String(p.termMonths) : "");
    setMonthly(p.monthlyAmount ? String(p.monthlyAmount) : "");
    setStart(p.startMonth ?? month);
    setMaturity(p.maturityMonth ?? "");
    setDescription(p.description ?? "");
    setAccountId(p.accountId ?? "");
    setContribs(p.contributions.length
      ? p.contributions.map((c) => ({ key: c.id, id: c.id, month: c.month, amount: String(c.amount), memo: c.memo ?? "" }))
      : [{ key: newKey(), month, amount: "", memo: "" }]);
  }

  useEffect(() => {
    if (dirty || localOnly) return;
    const rows = list.data ?? [];
    if (!rows.length) {
      if (!id) loadPlan(null);
      return;
    }
    const cur = rows.find((p) => p.id === selPlan) ?? rows[0];
    if (!cur) return;
    setSelPlan(cur.id);
    loadPlan(cur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.dataUpdatedAt, dirty]);

  const paid = contribs.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const proj = useMemo(() => {
    const t = Number(term);
    if (!(t > 0)) return null;
    return projectSavings({
      kind, compounding,
      monthlyAmount: Number(monthly) || 0,
      interestRate: Number(rate) || 0,
      termMonths: t,
    });
  }, [kind, compounding, monthly, rate, term]);

  useImperativeHandle(ref, () => ({
    async save() {
      const row = await upsert.mutateAsync({
        plan: {
          id,
          name: name.trim() || "적금",
          institution: institution.trim() || undefined,
          kind,
          interestRate: Number(rate) || 0,
          compounding,
          termMonths: term ? Number(term) : undefined,
          monthlyAmount: monthly ? Number(monthly) : undefined,
          startMonth: start || undefined,
          maturityMonth: maturity || undefined,
          description: description.trim() || undefined,
          accountId: accountId || null,
        },
        contributions: contribs.filter((c) => c.month && Number(c.amount) > 0).map((c) => ({
          id: c.id,
          month: c.month,
          amount: Number(c.amount) || 0,
          memo: c.memo.trim() || undefined,
        })),
        deleteContributionIds: deletedContrib,
      });
      setLocalOnly(false);
      setDeletedContrib([]);
      setSelPlan(row.id);
      loadPlan(row);
      await list.refetch();
      onMsg("적금을 저장했습니다.");
    },
    create() {
      setSelPlan("new");
      loadPlan(null);
      setLocalOnly(true);
      onDirty();
    },
    async remove() {
      if (selContrib) {
        const row = contribs.find((c) => c.key === selContrib);
        if (row?.id) setDeletedContrib((ids) => [...ids, row.id!]);
        setContribs((rows) => {
          const next = rows.filter((c) => c.key !== selContrib);
          return next.length ? next : [{ key: newKey(), month, amount: "", memo: "" }];
        });
        setSelContrib(null);
        onDirty();
        return;
      }
      if (id) {
        await removeMut.mutateAsync({ id });
        setSelPlan(null);
        loadPlan((list.data ?? []).find((p) => p.id !== id) ?? null);
        await list.refetch();
        onMsg("적금 상품을 삭제했습니다.");
        return;
      }
      loadPlan(null);
    },
    get canDelete() {
      return Boolean(selContrib || id || name.trim());
    },
    async refetch() {
      setLocalOnly(false);
      await list.refetch();
    },
  }), [
    id, name, institution, kind, rate, compounding, term, monthly, start, maturity,
    description, accountId, contribs, deletedContrib, selContrib, month, list.data,
  ]);

  const plans = list.data ?? [];

  return (
    <>
      <h3>적금내역</h3>
      <p className="erp-hint">
        상품명·금리·내용과 월 납입을 적습니다. 만기 이자는 세전 추정(중도해지·우대조건 없음). 저장해야 반영됩니다.
        {" "}<a href="/profile?menu=invest">09 투자내역</a>
        {" · "}
        <a href="/profile?menu=style">10 투자성향</a>
      </p>
      <table className="erp-grid">
        <thead>
          <tr>
            <th style={{ width: 40 }}>No</th>
            <th>상품명</th>
            <th style={{ width: 120 }}>은행</th>
            <th style={{ width: 70 }}>종류</th>
            <th className="num" style={{ width: 80 }}>연금리</th>
            <th className="num" style={{ width: 130 }}>월납·원금</th>
            <th className="num" style={{ width: 130 }}>납입합</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((p, i) => (
            <tr key={p.id} className={selPlan === p.id ? "sel" : ""} onClick={() => { setSelPlan(p.id); loadPlan(p); }}>
              <td className="ro num">{i + 1}</td>
              <td className="ro">{p.name}</td>
              <td className="ro">{p.institution ?? "—"}</td>
              <td className="ro">{p.kind === "savings" ? "예금" : "적금"}</td>
              <td className="ro num">{p.interestRate}%</td>
              <td className="ro num">{p.monthlyAmount ? won(p.monthlyAmount) : "—"}</td>
              <td className="ro num">{won(p.paidTotal)}</td>
            </tr>
          ))}
          {localOnly && (
            <tr className="sel">
              <td className="ro num">{plans.length + 1}</td>
              <td className="ro">{name || "새 상품"}</td>
              <td className="ro">{institution || "—"}</td>
              <td className="ro">{kind === "savings" ? "예금" : "적금"}</td>
              <td className="ro num">{rate ? `${rate}%` : "—"}</td>
              <td className="ro num">{monthly ? won(Number(monthly)) : "—"}</td>
              <td className="ro num">{won(paid)}</td>
            </tr>
          )}
          {!plans.length && !localOnly && (
            <tr><td className="ro" colSpan={7}>상품이 없습니다. 신규를 눌러 적금·예금을 넣으세요.</td></tr>
          )}
        </tbody>
      </table>

      <h3 style={{ marginTop: 16 }}>상품</h3>
      <table className="erp-props">
        <tbody>
          <tr><th>상품명</th><td><input value={name} onChange={(e) => { setName(e.target.value); onDirty(); }} placeholder="예: 카카오뱅크 26주적금" /></td></tr>
          <tr><th>은행</th><td><input value={institution} onChange={(e) => { setInstitution(e.target.value); onDirty(); }} placeholder="카카오뱅크" /></td></tr>
          <tr>
            <th>종류</th>
            <td>
              <select value={kind} onChange={(e) => { setKind(e.target.value as KindId); onDirty(); }}>
                {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </td>
          </tr>
          <tr><th>연 금리(%)</th><td><Rate value={rate} onChange={(v) => { setRate(v); onDirty(); }} /></td></tr>
          <tr>
            <th>이자</th>
            <td>
              <select value={compounding} onChange={(e) => { setCompounding(e.target.value as CompoundId); onDirty(); }}>
                {COMPOUNDS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </td>
          </tr>
          <tr><th>약정 개월</th><td><input type="number" min={1} max={120} value={term} onChange={(e) => { setTerm(e.target.value); onDirty(); }} placeholder="12" /></td></tr>
          <tr><th>{kind === "savings" ? "가입원금" : "월 납입"}</th><td><Num value={monthly} onChange={(v) => { setMonthly(v); onDirty(); }} /></td></tr>
          <tr><th>시작월</th><td><input type="month" value={start} onChange={(e) => { setStart(e.target.value); onDirty(); }} /></td></tr>
          <tr><th>만기월</th><td><input type="month" value={maturity} onChange={(e) => { setMaturity(e.target.value); onDirty(); }} /></td></tr>
          <tr>
            <th>연결 통장</th>
            <td>
              <select value={accountId} onChange={(e) => { setAccountId(e.target.value); onDirty(); }}>
                <option value="">없음</option>
                {depositAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.institution ? `${a.institution} · ` : ""}{a.name}</option>
                ))}
              </select>
            </td>
          </tr>
          <tr>
            <th>상품내용</th>
            <td>
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); onDirty(); }}
                rows={3}
                placeholder="우대조건, 납입한도, 만기 후 처리 등"
                style={{ width: "100%", boxSizing: "border-box", border: 0, padding: "6px 8px", font: "inherit", resize: "vertical" }}
              />
            </td>
          </tr>
          <tr><th>납입 합계</th><td><span className="ro">{won(paid)}</span></td></tr>
          <tr><th>만기 원금(추정)</th><td><span className="ro">{proj ? won(proj.principal) : "약정 개월을 넣으면 계산"}</span></td></tr>
          <tr><th>만기 이자(세전)</th><td><span className="ro">{proj ? won(proj.interest) : "—"}</span></td></tr>
          <tr><th>만기 수령(세전)</th><td><span className="ro">{proj ? won(proj.maturity) : "—"}</span></td></tr>
        </tbody>
      </table>

      <h3 style={{ marginTop: 16 }}>납입 내역</h3>
      <p className="erp-hint">
        {kind === "savings" ? "예금 입금·재예치 월을 적습니다." : "월별 적립액입니다. 같은 달은 저장 시 덮어씁니다."}
        {" "}
        <button type="button" onClick={() => {
          const row = { key: newKey(), month, amount: monthly, memo: "" };
          setContribs((rows) => [...rows, row]);
          setSelContrib(row.key);
          onDirty();
        }}>납입 행 추가</button>
      </p>
      <table className="erp-grid">
        <thead>
          <tr>
            <th style={{ width: 40 }}>No</th>
            <th style={{ width: 160 }}>월</th>
            <th style={{ width: 160 }}>금액</th>
            <th>메모</th>
          </tr>
        </thead>
        <tbody>
          {contribs.map((c, i) => (
            <tr key={c.key} className={selContrib === c.key ? "sel" : ""} onClick={() => setSelContrib(c.key)}>
              <td className="ro num">{i + 1}</td>
              <td><input type="month" value={c.month} onChange={(e) => { setContribs((rows) => rows.map((r) => r.key === c.key ? { ...r, month: e.target.value } : r)); onDirty(); }} /></td>
              <td><Num value={c.amount} onChange={(v) => { setContribs((rows) => rows.map((r) => r.key === c.key ? { ...r, amount: v } : r)); onDirty(); }} /></td>
              <td><input value={c.memo} onChange={(e) => { setContribs((rows) => rows.map((r) => r.key === c.key ? { ...r, memo: e.target.value } : r)); onDirty(); }} /></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="ro" colSpan={2}>합계</td>
            <td className="ro num">{won(paid)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </>
  );
});
