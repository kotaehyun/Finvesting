"use client";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { categoriesFor, categoryLabel, type TxnCategoryId } from "@/lib/categories";
import { ComboChart } from "./combo-chart";
import { PayYearSection } from "./pay-year";
import { SavingsPanel, type SavingsHandle } from "./savings-panel";
import { InvestPanel } from "./invest-panel";
import {
  draftPayEarnings,
  payEarningGroupOf,
  PAY_DEDUCTION_PRESETS,
  PAY_EARNING_GROUP_LABEL,
  type PayEarningGroup,
} from "@finvesting/core";

const RISKS = [
  { id: "conservative", label: "보수" },
  { id: "moderate", label: "중립" },
  { id: "aggressive", label: "공격" },
] as const;
type RiskId = (typeof RISKS)[number]["id"];

const RECUR_CATS = [
  { id: "phone", label: "휴대폰" },
  { id: "utilities", label: "공과금" },
  { id: "housing", label: "주거" },
  { id: "subscription", label: "구독" },
  { id: "insurance", label: "보험" },
  { id: "loan_repayment", label: "대출상환" },
  { id: "misc", label: "기타" },
] as const;

const ACCOUNT_TYPES = [
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

function accountTypeLabel(id: string) {
  return ACCOUNT_TYPES.find((t) => t.id === id)?.label ?? id;
}

const MENUS = [
  { id: "master", no: "01", label: "기본정보" },
  { id: "payroll", no: "02", label: "급여공제" },
  { id: "fixed", no: "03", label: "고정비" },
  { id: "tax", no: "04", label: "세액" },
  { id: "trends", no: "05", label: "추이" },
  { id: "ledger", no: "06", label: "통장내역" },
  { id: "books", no: "07", label: "급여상세 내역" },
  { id: "savings", no: "08", label: "적금내역" },
  { id: "invest", no: "09", label: "투자내역" },
] as const;
type MenuId = (typeof MENUS)[number]["id"];

type RecDraft = { key: string; id?: string; name: string; category: string; amount: string; dayOfMonth: string; memo: string };
type TaxDraft = { key: string; id?: string; month: string; amount: string };
type EarnDraft = { key: string; name: string; amount: string; group: PayEarningGroup };

const EARN_GROUP_ORDER: PayEarningGroup[] = ["monthly", "irregular", "custom"];

function currentMonth() {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 7);
}
function won(n: number) {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}
function newKey() {
  return crypto.randomUUID();
}
function emptyRec(): RecDraft {
  return { key: newKey(), name: "", category: "phone", amount: "", dayOfMonth: "", memo: "" };
}
function emptyTax(month = currentMonth()): TaxDraft {
  return { key: newKey(), month, amount: "" };
}
function emptyEarn(): EarnDraft {
  return { key: newKey(), name: "", amount: "", group: "custom" };
}
function earnDraftsFrom(saved: Array<{ name: string; amount: number }>, gross = 0): EarnDraft[] {
  return draftPayEarnings(saved, gross).map((e) => ({
    key: newKey(),
    name: e.name,
    amount: e.amount > 0 ? String(e.amount) : "",
    group: e.group,
  }));
}
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
function downloadBlob(filename: string, blob: Blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
function downloadCsv(filename: string, csv: string) {
  downloadBlob(filename, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}
function downloadBase64(filename: string, b64: string, mime: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  downloadBlob(filename, new Blob([bytes], { type: mime }));
}
function useDebounced(value: string, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="muted" style={{ padding: 20 }}>불러오는 중…</p>}>
      <ProfileWorkspace />
    </Suspense>
  );
}

function ProfileWorkspace() {
  const search = useSearchParams();
  const initialMenu = MENUS.some((m) => m.id === search.get("menu")) ? search.get("menu") as MenuId : "master";

  const [menu, setMenu] = useState<MenuId>(initialMenu);
  const [month, setMonth] = useState(currentMonth);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [selRec, setSelRec] = useState<string | null>(null);
  const [selTax, setSelTax] = useState<string | null>(null);
  const [selEarn, setSelEarn] = useState<string | null>(null);
  const [earnRows, setEarnRows] = useState<EarnDraft[]>([emptyEarn()]);

  const [gross, setGross] = useState("");
  const [income, setIncome] = useState("");
  const [tax, setTax] = useState("");
  const [health, setHealth] = useState("");
  const [fixed, setFixed] = useState("");
  const [months, setMonths] = useState("6");
  const [risk, setRisk] = useState<RiskId>("moderate");
  const [recRows, setRecRows] = useState<RecDraft[]>([emptyRec()]);
  const [taxRows, setTaxRows] = useState<TaxDraft[]>([]);
  const [deletedRec, setDeletedRec] = useState<string[]>([]);
  const [deletedTax, setDeletedTax] = useState<string[]>([]);
  const [accountId, setAccountId] = useState("");
  const [lastUpload, setLastUpload] = useState<{ filename: string; contentBase64: string } | null>(null);
  const [filePreview, setFilePreview] = useState<{
    kind: string;
    detected: string;
    rows: string[][];
    rowCount: number;
    bank: { rows: Array<{ date: string; amount: number; direction: "in" | "out"; merchant?: string | null; memo?: string | null; balanceAfter?: number | null; raw: Record<string, unknown> }>; skipped: Array<{ line: number; reason: string }>; detected: string };
    recurring: { rows: Array<{ name: string; category: string; amount: number }>; skipped: Array<{ line: number; reason: string }> };
  } | null>(null);

  const current = trpc.profile.get.useQuery();
  const statement = trpc.profile.statement.useQuery({ month });
  const trends = trpc.profile.trends.useQuery({ month, count: 12 });
  const save = trpc.profile.workspaceSave.useMutation();
  const recImport = trpc.profile.recurringImport.useMutation();
  const recExport = trpc.profile.recurringExport.useQuery(undefined, { enabled: false });
  const templates = trpc.profile.templates.useQuery();
  const previewFile = trpc.profile.previewFile.useMutation();
  const accounts = trpc.accounts.list.useQuery();
  const holdingsQ = trpc.trades.holdings.useQuery(undefined, { enabled: menu === "invest" });
  const txns = trpc.transactions.listAll.useQuery(
    { accountId: accountId || undefined, month, limit: 200 },
    { enabled: menu === "ledger" || menu === "trends" },
  );
  const commitBank = trpc.transactions.commitImport.useMutation();
  const updateCat = trpc.transactions.updateCategory.useMutation();
  const updateAccount = trpc.accounts.update.useMutation();
  const utils = trpc.useUtils();
  const savRef = useRef<SavingsHandle>(null);

  const previewKey = useDebounced(`${gross}|${income}|${tax}|${health}`, 250);
  const [pg, pn, pt, ph] = previewKey.split("|");
  const preview = trpc.profile.previewPay.useQuery({
    monthlyGrossIncome: Number(pg) || undefined,
    monthlyNetIncome: Number(pn) || undefined,
    monthlyIncomeTax: Number(pt) || undefined,
    monthlyHealthInsurance: Number(ph) || undefined,
  }, { enabled: Number(pg) > 0 || Number(pn) > 0 });

  function markDirty() { setDirty(true); setMsg(""); }

  function applyServer() {
    const p = current.data;
    setGross(p?.monthlyGrossIncome != null ? String(p.monthlyGrossIncome) : "");
    setIncome(p?.monthlyNetIncome != null ? String(p.monthlyNetIncome) : "");
    setTax(p?.monthlyIncomeTax != null ? String(p.monthlyIncomeTax) : "");
    setHealth(p?.monthlyHealthInsurance != null ? String(p.monthlyHealthInsurance) : "");
    setFixed(p?.monthlyFixedCost != null ? String(p.monthlyFixedCost) : "");
    setMonths(String(p?.emergencyFundMonths ?? 6));
    if (p && RISKS.some((r) => r.id === p.riskTolerance)) setRisk(p.riskTolerance as RiskId);
    const rec = statement.data?.recurring ?? [];
    setRecRows(rec.length
      ? rec.map((r) => ({
        key: r.id, id: r.id, name: r.name, category: r.category,
        amount: String(r.amount), dayOfMonth: r.dayOfMonth != null ? String(r.dayOfMonth) : "", memo: r.memo ?? "",
      }))
      : [emptyRec()]);
    setTaxRows((statement.data?.taxMonths ?? []).map((t) => ({
      key: t.id, id: t.id, month: t.month, amount: String(t.amount),
    })));
    setDeletedRec([]);
    setDeletedTax([]);
    setSelRec(null);
    setSelTax(null);
    setSelEarn(null);
    setEarnRows(earnDraftsFrom(p?.payEarnings ?? [], Number(p?.monthlyGrossIncome) || 0));
    setDirty(false);
  }

  useEffect(() => {
    if (dirty) return;
    if (!current.isFetched || !statement.isFetched) return;
    applyServer();
    // 서버 값으로만 채운다. dirty면 조회를 누를 때까지 유지.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.dataUpdatedAt, statement.dataUpdatedAt, dirty]);

  async function refresh() {
    await Promise.all([
      current.refetch(), statement.refetch(), trends.refetch(), txns.refetch(),
      accounts.refetch(), utils.dashboard.overview.invalidate(), utils.savings.list.invalidate(),
      utils.trades.holdings.invalidate(), utils.trades.list.invalidate(),
      savRef.current?.refetch() ?? Promise.resolve(),
    ]);
  }

  async function onQuery() {
    setMsg("");
    setDirty(false);
    await refresh();
  }

  async function onSave() {
    setMsg("");
    if (menu === "invest") {
      setMsg("체결은 보유 화면에서 입력합니다.");
      return;
    }
    if (menu === "savings") {
      try {
        await savRef.current?.save();
        setDirty(false);
      } catch (err) {
        setMsg(err instanceof Error ? err.message : String(err));
      }
      return;
    }
    try {
      const earnings = earnRows.filter((r) => r.name.trim() && Number(r.amount) > 0).map((r) => ({
        name: r.name.trim(),
        amount: Number(r.amount) || 0,
      }));
      const earnSum = earnings.reduce((s, e) => s + e.amount, 0);
      const hasIncome = earnSum > 0 || Number(gross) > 0 || Number(income) > 0 || Boolean(current.data);
      await save.mutateAsync({
        month,
        profile: hasIncome ? {
          monthlyGrossIncome: earnSum > 0 ? earnSum : (gross ? Number(gross) : undefined),
          monthlyNetIncome: income ? Number(income) : undefined,
          monthlyIncomeTax: tax ? Number(tax) : undefined,
          monthlyHealthInsurance: health ? Number(health) : undefined,
          monthlyFixedCost: Number(fixed) || 0,
          emergencyFundMonths: Number(months) || 6,
          riskTolerance: risk,
          payEarnings: earnings,
        } : undefined,
        recurring: recRows.filter((r) => r.name.trim()).map((r) => ({
          id: r.id,
          name: r.name.trim(),
          category: r.category,
          amount: Number(r.amount) || 0,
          dayOfMonth: r.dayOfMonth ? Number(r.dayOfMonth) : undefined,
          memo: r.memo.trim() || undefined,
        })),
        deleteRecurringIds: deletedRec,
        taxMonths: taxRows.filter((t) => t.month && t.amount !== "").map((t) => ({
          month: t.month,
          amount: Number(t.amount) || 0,
        })),
        deleteTaxIds: deletedTax,
      });
      setDirty(false);
      await refresh();
      setMsg("저장했습니다.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  function addEarnRow() {
    const row = emptyEarn();
    setEarnRows((rows) => [...rows, row]);
    setSelEarn(row.key);
    markDirty();
  }

  function onNew() {
    if (menu === "tax") {
      const row = emptyTax(month);
      setTaxRows((rows) => [...rows, row]);
      setSelTax(row.key);
      setMenu("tax");
    } else if (menu === "books" || menu === "master") {
      addEarnRow();
      return;
    } else if (menu === "savings") {
      savRef.current?.create();
      return;
    } else if (menu === "invest") {
      window.location.href = "/holdings";
      return;
    } else {
      const row = emptyRec();
      setRecRows((rows) => [...rows.filter((r) => r.name.trim() || r.amount), row]);
      setSelRec(row.key);
      setMenu("fixed");
    }
    markDirty();
  }

  function onDelete() {
    if (menu === "invest") return;
    if (menu === "savings") {
      void Promise.resolve(savRef.current?.remove()).catch((err: unknown) => {
        setMsg(err instanceof Error ? err.message : String(err));
      });
      return;
    }
    if (menu === "tax" && selTax) {
      const row = taxRows.find((r) => r.key === selTax);
      if (row?.id) setDeletedTax((ids) => [...ids, row.id!]);
      setTaxRows((rows) => rows.filter((r) => r.key !== selTax));
      setSelTax(null);
      markDirty();
      return;
    }
    if ((menu === "books" || menu === "master") && selEarn) {
      setEarnRows((rows) => {
        const row = rows.find((r) => r.key === selEarn);
        const next = row && row.group !== "custom"
          ? rows.map((r) => (r.key === selEarn ? { ...r, amount: "" } : r))
          : rows.filter((r) => r.key !== selEarn);
        const kept = next.length ? next : earnDraftsFrom([], Number(gross) || 0);
        const sum = kept.reduce((s, r) => s + (Number(r.amount) || 0), 0);
        if (sum > 0) setGross(String(sum));
        return kept;
      });
      setSelEarn(null);
      markDirty();
      return;
    }
    if (selRec) {
      const row = recRows.find((r) => r.key === selRec);
      if (row?.id) setDeletedRec((ids) => [...ids, row.id!]);
      setRecRows((rows) => {
        const next = rows.filter((r) => r.key !== selRec);
        return next.length ? next : [emptyRec()];
      });
      setSelRec(null);
      markDirty();
    }
  }

  async function onCsv(f: File | undefined) {
    if (!f) return;
    setMsg("");
    try {
      const contentBase64 = await fileToBase64(f);
      const r = await previewFile.mutateAsync({ filename: f.name, contentBase64 });
      setLastUpload({ filename: f.name, contentBase64 });
      setFilePreview(r);
      if (r.detected === "bank") setMenu("ledger");
      else if (r.detected === "recurring") setMenu("fixed");
      setMsg(`변환 ${r.kind} · ${r.rowCount}행 · 인식 ${r.detected === "bank" ? "통장" : r.detected === "recurring" ? "고정비" : "표"}`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  async function importRecurringFromPreview() {
    if (!lastUpload || !filePreview?.recurring.rows.length) return;
    try {
      const r = await recImport.mutateAsync(lastUpload);
      setDirty(false);
      setFilePreview(null);
      await refresh();
      setMenu("fixed");
      setMsg(`고정비 가져오기: 추가 ${r.inserted} · 갱신 ${r.updated}`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  async function importBankFromPreview() {
    if (!filePreview?.bank.rows.length) return;
    if (!accountId) { setMsg("통장내역에서 계좌를 고른 뒤 가져오세요"); setMenu("ledger"); return; }
    try {
      const r = await commitBank.mutateAsync({
        accountId,
        detected: filePreview.bank.detected || "generic-bank",
        rows: filePreview.bank.rows,
      });
      setFilePreview(null);
      await refresh();
      setMenu("ledger");
      setMsg(`통장 가져오기: 저장 ${r.inserted} · 중복 ${r.duplicate}`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  async function onExport(kind: "csv" | "xlsx" | "docx") {
    const r = await recExport.refetch();
    if (!r.data) return;
    if (kind === "csv") downloadCsv(r.data.filename, r.data.csv);
    else if (kind === "xlsx") downloadBase64(r.data.filenameXlsx, r.data.xlsxBase64, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    else downloadBase64(r.data.filenameDocx, r.data.docxBase64, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  }

  function downloadTemplate(which: "recurring" | "bank", kind: "csv" | "xlsx" | "docx") {
    const t = templates.data?.[which];
    if (!t) return;
    if (kind === "csv") downloadCsv(t.filenameCsv, t.csv);
    else if (kind === "xlsx") downloadBase64(t.filenameXlsx, t.xlsxBase64, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    else downloadBase64(t.filenameDocx, t.docxBase64, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  }

  function patchRec(key: string, patch: Partial<RecDraft>) {
    setRecRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    markDirty();
  }
  function patchEarn(key: string, patch: Partial<EarnDraft>) {
    setEarnRows((rows) => {
      const next = rows.map((r) => {
        if (r.key !== key) return r;
        const merged = { ...r, ...patch };
        if (patch.name != null) merged.group = payEarningGroupOf(patch.name.trim());
        return merged;
      });
      const sum = next.reduce((s, r) => s + (Number(r.amount) || 0), 0);
      if (sum > 0) setGross(String(sum));
      return next;
    });
    markDirty();
  }
  function patchTax(key: string, patch: Partial<TaxDraft>) {
    setTaxRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    markDirty();
  }

  const pay = preview.data ?? statement.data?.pay ?? current.data?.resolved;
  const recSum = recRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const otherFixed = Number(fixed) || 0;
  const st = statement.data;
  const trend = st?.taxTrend ?? [];
  const menuLabel = MENUS.find((m) => m.id === menu)?.label ?? "";

  return (
    <div className="erp">
      <div className="erp-titlebar">
        <h1>프로필대장 <span className="path">재무관리 › {menuLabel}</span></h1>
        <label>
          기준월
          <input type="month" value={month} onChange={(e) => { setMonth(e.target.value); setDirty(false); }} />
        </label>
      </div>
      <div className="erp-toolbar">
        <button type="button" onClick={onQuery} disabled={current.isFetching}>조회</button>
        <button type="button" className="primary" onClick={onSave} disabled={save.isPending}>저장</button>
        <button type="button" onClick={onNew}>신규</button>
        <button type="button" onClick={onDelete} disabled={menu === "invest" || (menu === "savings" ? false : menu === "tax" ? !selTax : menu === "books" || menu === "master" ? !selEarn : !selRec)}>삭제</button>
        <span className="sep" />
        <button type="button" onClick={() => downloadTemplate("recurring", "csv")}>CSV 양식</button>
        <button type="button" onClick={() => downloadTemplate("recurring", "xlsx")}>엑셀 양식</button>
        <button type="button" onClick={() => downloadTemplate("recurring", "docx")}>문서 양식</button>
        <button type="button" onClick={() => downloadTemplate("bank", "csv")}>통장 CSV</button>
        <button type="button" onClick={() => downloadTemplate("bank", "xlsx")}>통장 엑셀</button>
        <button type="button" onClick={() => downloadTemplate("bank", "docx")}>통장 문서</button>
        <span className="sep" />
        <button type="button" onClick={() => onExport("csv")} disabled={recExport.isFetching}>CSV 내보내기</button>
        <button type="button" onClick={() => onExport("xlsx")} disabled={recExport.isFetching}>엑셀 내보내기</button>
        <button type="button" onClick={() => onExport("docx")} disabled={recExport.isFetching}>문서 내보내기</button>
        <label className="erp-file">
          가져오기
          <input type="file" accept=".csv,.xlsx,.xls,.docx,.doc,text/csv" onChange={(e) => { onCsv(e.target.files?.[0]); e.target.value = ""; }} disabled={previewFile.isPending} />
        </label>
        {dirty && <span className="erp-dirty">* 미저장</span>}
        {msg && <span>{msg}</span>}
      </div>
      <div className="erp-body">
        <nav className="erp-menu" aria-label="프로필대장 메뉴">
          <h2>메뉴</h2>
          {MENUS.map((m) => (
            <button key={m.id} type="button" className={menu === m.id ? "on" : ""} onClick={() => setMenu(m.id)}>
              {m.no} {m.label}
            </button>
          ))}
        </nav>
        <div className="erp-work">
          <div className="erp-panel">
            {filePreview && (
              <div className="erp-preview">
                <h3>변환 내용 ({filePreview.kind} · {filePreview.rowCount}행)</h3>
                <p className="erp-hint">
                  CSV·엑셀·워드 표를 같은 형식으로 읽었습니다.
                  {filePreview.detected === "bank" ? " 통장 거래로 인식." : filePreview.detected === "recurring" ? " 고정비로 인식." : " 표만 표시."}
                </p>
                <div className="row" style={{ marginBottom: 8 }}>
                  {filePreview.recurring.rows.length > 0 && (
                    <button type="button" className="primary" onClick={importRecurringFromPreview} disabled={recImport.isPending}>고정비로 가져오기 ({filePreview.recurring.rows.length})</button>
                  )}
                  {filePreview.bank.rows.length > 0 && (
                    <button type="button" className="primary" onClick={importBankFromPreview} disabled={commitBank.isPending}>통장으로 가져오기 ({filePreview.bank.rows.length})</button>
                  )}
                  <button type="button" onClick={() => setFilePreview(null)}>닫기</button>
                </div>
                <div className="table-wrap">
                  <table className="erp-grid">
                    <tbody>
                      {filePreview.rows.map((r, i) => (
                        <tr key={i}>{r.map((c, j) => i === 0 ? <th key={j}>{c}</th> : <td key={j} className="ro">{c}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filePreview.rowCount > filePreview.rows.length && <p className="erp-hint">미리보기 {filePreview.rows.length}/{filePreview.rowCount}행</p>}
              </div>
            )}
            {menu === "master" && (
              <>
                <h3>기본정보</h3>
                <p className="erp-hint">세전·국세를 넣고 저장하면 4대보험·지방세·실수령을 계산합니다. 세후를 비우면 세전−공제입니다.</p>
                <table className="erp-props">
                  <tbody>
                    <Prop label="세전 월 소득"><Num value={gross} onChange={(v) => { setGross(v); markDirty(); }} placeholder="기본급+수당+상여 합" /></Prop>
                    <Prop label="근로소득세(국세)"><Num value={tax} onChange={(v) => { setTax(v); markDirty(); }} placeholder="명세서 금액" /></Prop>
                    <Prop label="건보료(수동)"><Num value={health} onChange={(v) => { setHealth(v); markDirty(); }} placeholder="세전 있으면 자동" /></Prop>
                    <Prop label="세후 월 소득"><Num value={income} onChange={(v) => { setIncome(v); markDirty(); }} placeholder="비우면 자동" /></Prop>
                    <Prop label="기타 고정비"><Num value={fixed} onChange={(v) => { setFixed(v); markDirty(); }} placeholder="세부에 안 넣는 금액" /></Prop>
                    <Prop label="비상금 목표(개월)">
                      <input value={months} onChange={(e) => { setMonths(e.target.value); markDirty(); }} type="number" min={1} max={36} />
                    </Prop>
                    <Prop label="위험 성향">
                      <select value={risk} onChange={(e) => { setRisk(e.target.value as RiskId); markDirty(); }}>
                        {RISKS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                    </Prop>
                    <Prop label="계산 실수령"><span className="ro">{pay && pay.net > 0 ? won(pay.net) : "—"}</span></Prop>
                  </tbody>
                </table>
                <h3 style={{ marginTop: 16 }}>임금 구성항목</h3>
                <p className="erp-hint">고용노동부 임금명세서 예시의 지급란입니다. 금액 있는 항목만 저장되고 세전이 됩니다.</p>
                <WageSlip
                  earnRows={earnRows}
                  selEarn={selEarn}
                  onSel={setSelEarn}
                  onPatch={patchEarn}
                  onAdd={addEarnRow}
                  deductions={deductionRows(pay)}
                />
              </>
            )}
            {menu === "payroll" && (
              <>
                <h3>급여공제 (2026 직장가입자 근로자분)</h3>
                <p className="erp-hint">국세 세액만 명세서 금액을 넣습니다. 과세표준은 총급여−근로소득공제−본인 기본공제(150만)−국민연금. 부양가족 공제는 아직 없습니다.</p>
                <table className="erp-grid">
                  <thead>
                    <tr><th>항목</th><th>요율·기준</th><th className="num">금액</th></tr>
                  </thead>
                  <tbody>
                    <tr><td className="ro">세전 근로소득</td><td className="ro">월 입력</td><td className="ro num">{pay ? won(pay.gross) : "—"}</td></tr>
                    <tr><td className="ro">국민연금</td><td className="ro">4.75% (하한 41만 · 상한 659만)</td><td className="ro num">{pay ? won(pay.nationalPension) : "—"}</td></tr>
                    <tr><td className="ro">건강보험</td><td className="ro">7.19% × 50%</td><td className="ro num">{pay ? won(pay.healthInsurance) : "—"}</td></tr>
                    <tr><td className="ro">장기요양보험</td><td className="ro">건보료 × (0.9448 / 7.19)</td><td className="ro num">{pay ? won(pay.longTermCare) : "—"}</td></tr>
                    <tr><td className="ro">고용보험</td><td className="ro">0.9%</td><td className="ro num">{pay ? won(pay.employmentInsurance) : "—"}</td></tr>
                    <tr><td className="ro" colSpan={3}><strong>소득세 과세표준 · 세액</strong></td></tr>
                    <tr><td className="ro">연 총급여</td><td className="ro">세전 × 12</td><td className="ro num">{pay ? won(pay.taxBase.annualGross) : "—"}</td></tr>
                    <tr><td className="ro">근로소득공제</td><td className="ro">소득세법 제47조</td><td className="ro num">{pay ? won(pay.taxBase.earnedIncomeDeduction) : "—"}</td></tr>
                    <tr><td className="ro">본인 기본공제</td><td className="ro">150만원</td><td className="ro num">{pay ? won(pay.taxBase.personalExemption) : "—"}</td></tr>
                    <tr><td className="ro">연금보험료공제</td><td className="ro">국민연금 × 12</td><td className="ro num">{pay ? won(pay.taxBase.pensionDeduction) : "—"}</td></tr>
                    <tr><td className="ro">소득세 과세표준(연)</td><td className="ro">근로소득금액 − 공제</td><td className="ro num">{pay ? won(pay.taxBase.taxableBase) : "—"}</td></tr>
                    <tr><td className="ro">소득세 과세표준(월)</td><td className="ro">연 ÷ 12</td><td className="ro num">{pay ? won(pay.taxBase.monthlyTaxableBase) : "—"}</td></tr>
                    <tr>
                      <td className="ro">근로소득세(국세) 세액</td>
                      <td className="ro">명세서 입력</td>
                      <td><Num value={tax} onChange={(v) => { setTax(v); markDirty(); }} /></td>
                    </tr>
                    <tr><td className="ro">지방소득세 세액</td><td className="ro">국세 × 10%</td><td className="ro num">{pay ? won(pay.localTax) : "—"}</td></tr>
                    <tr><td className="ro">공제 합계</td><td className="ro"></td><td className="ro num">{pay ? won(pay.withholdTotal) : "—"}</td></tr>
                    <tr><td className="ro">실수령액</td><td className="ro">세전 − 공제 (세후 입력이 있으면 그 값)</td><td className="ro num">{pay ? won(pay.net) : "—"}</td></tr>
                  </tbody>
                </table>
              </>
            )}
            {menu === "fixed" && (
              <>
                <h3>고정비 세부내역</h3>
                <p className="erp-hint">셀을 눌러 수정합니다. 신규·삭제는 위 툴바, CSV는 같은 이름이면 갱신합니다. 저장 전까지 반영되지 않습니다.</p>
                <table className="erp-grid">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>No</th>
                      <th>이름</th>
                      <th style={{ width: 120 }}>분류</th>
                      <th style={{ width: 130 }}>금액</th>
                      <th style={{ width: 80 }}>출금일</th>
                      <th>메모</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recRows.map((r, i) => (
                      <tr key={r.key} className={selRec === r.key ? "sel" : ""} onClick={() => setSelRec(r.key)}>
                        <td className="ro num">{i + 1}</td>
                        <td><input value={r.name} onChange={(e) => patchRec(r.key, { name: e.target.value })} placeholder="항목명" /></td>
                        <td>
                          <select value={r.category} onChange={(e) => patchRec(r.key, { category: e.target.value })}>
                            {RECUR_CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                          </select>
                        </td>
                        <td><Num value={r.amount} onChange={(v) => patchRec(r.key, { amount: v })} /></td>
                        <td><input value={r.dayOfMonth} onChange={(e) => patchRec(r.key, { dayOfMonth: e.target.value })} type="number" min={1} max={31} /></td>
                        <td><input value={r.memo} onChange={(e) => patchRec(r.key, { memo: e.target.value })} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {menu === "tax" && (
              <>
                <h3>근로소득세 추이</h3>
                <p className="erp-hint">프로필 저장 시 이번 달 국세가 들어갑니다. 과거 달은 그리드에서 추가합니다. 막대+선 그래프는 추이 메뉴에도 있습니다.</p>
                {trend.length > 0 && (
                  <ComboChart title="세액추이" xLabel="월(X)" yLabel="세액(Y)" points={trend.map((t) => ({ x: t.month, y: t.amount }))} />
                )}
                <table className="erp-grid">
                  <thead>
                    <tr><th style={{ width: 40 }}>No</th><th style={{ width: 160 }}>월</th><th style={{ width: 160 }}>세액</th><th>구분</th></tr>
                  </thead>
                  <tbody>
                    {taxRows.map((t, i) => (
                      <tr key={t.key} className={selTax === t.key ? "sel" : ""} onClick={() => setSelTax(t.key)}>
                        <td className="ro num">{i + 1}</td>
                        <td><input type="month" value={t.month} onChange={(e) => patchTax(t.key, { month: e.target.value })} /></td>
                        <td><Num value={t.amount} onChange={(v) => patchTax(t.key, { amount: v })} /></td>
                        <td className="ro">{t.id ? "입력" : "신규"}</td>
                      </tr>
                    ))}
                    {!taxRows.length && <tr><td className="ro" colSpan={4}>행이 없습니다. 신규를 누르세요.</td></tr>}
                  </tbody>
                </table>
              </>
            )}
            {menu === "trends" && (
              <>
                <h3>세액 · 소비 · 저축 · 투자 추이</h3>
                <p className="erp-hint">X축은 월, Y축은 금액. 막대 위를 선으로 이었습니다. 세액은 입력·거래(근로소득세), 소비는 이체·저축·투자·세액을 뺀 출금입니다.</p>
                <div className="erp-chart-grid">
                  <ComboChart title="세액추이" xLabel="월(X)" yLabel="세액(Y)" points={(trends.data ?? []).map((p) => ({ x: p.month, y: p.tax }))} />
                  <ComboChart title="소비추이" xLabel="월(X)" yLabel="소비(Y)" points={(trends.data ?? []).map((p) => ({ x: p.month, y: p.spend }))} />
                  <ComboChart title="저축추이" xLabel="월(X)" yLabel="저축(Y)" points={(trends.data ?? []).map((p) => ({ x: p.month, y: p.save }))} />
                  <ComboChart title="투자추이" xLabel="월(X)" yLabel="투자(Y)" points={(trends.data ?? []).map((p) => ({ x: p.month, y: p.invest }))} />
                </div>
              </>
            )}
            {menu === "ledger" && (
              <>
                <h3>내 통장</h3>
                <p className="erp-hint">개인 프로필이라 은행·통장 이름을 구분해 둡니다. 카드를 누르면 그 통장만 보고, 은행이 비어 있으면 여기서 적습니다.</p>
                {!accounts.data?.length && <p className="erp-hint"><a href="/accounts">계좌 등록</a></p>}
                <div className="erp-accts">
                  {accounts.data?.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className={accountId === a.id ? "erp-acct on" : "erp-acct"}
                      onClick={() => setAccountId((id) => id === a.id ? "" : a.id)}
                    >
                      <span className="erp-acct-bank">{a.institution?.trim() || "은행 미입력"}</span>
                      <strong>{a.name}</strong>
                      <span className="muted">{accountTypeLabel(a.type)} · {a.currency} · 잔액 {won(Number(a.balance))}</span>
                    </button>
                  ))}
                </div>
                {accountId && (() => {
                  const a = accounts.data?.find((x) => x.id === accountId);
                  if (!a) return null;
                  return (
                    <table className="erp-props" style={{ marginTop: 10 }}>
                      <tbody>
                        <Prop label="은행">
                          <input
                            defaultValue={a.institution ?? ""}
                            key={`${a.id}-bank`}
                            placeholder="예: 카카오뱅크"
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (v === (a.institution ?? "")) return;
                              updateAccount.mutateAsync({ id: a.id, institution: v }).then(() => refresh());
                            }}
                          />
                        </Prop>
                        <Prop label="통장 이름">
                          <input
                            defaultValue={a.name}
                            key={`${a.id}-name`}
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (!v || v === a.name) return;
                              updateAccount.mutateAsync({ id: a.id, name: v }).then(() => refresh());
                            }}
                          />
                        </Prop>
                        <Prop label="종류">
                          <select
                            value={a.type}
                            onChange={(e) => updateAccount.mutateAsync({ id: a.id, type: e.target.value as typeof a.type }).then(() => refresh())}
                          >
                            {ACCOUNT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                          </select>
                        </Prop>
                        <Prop label="잔액"><span className="ro">{won(Number(a.balance))}</span></Prop>
                      </tbody>
                    </table>
                  );
                })()}
                <h3 style={{ marginTop: 16 }}>거래내역 {accountId ? "" : "· 전체 통장"}</h3>
                <table className="erp-grid">
                  <thead>
                    <tr>
                      <th>날짜</th><th>은행</th><th>통장</th><th>종류</th><th>방향</th><th className="num">금액</th><th>분류</th><th>내용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(txns.data ?? []).map((t) => (
                      <tr key={t.id}>
                        <td className="ro">{String(t.date)}</td>
                        <td className="ro">{t.institution?.trim() || "—"}</td>
                        <td className="ro">{t.accountName}</td>
                        <td className="ro">{accountTypeLabel(t.accountType)}</td>
                        <td className="ro">{t.direction === "in" ? "입금" : t.direction === "out" ? "출금" : "이체"}</td>
                        <td className="ro num">{won(Number(t.amount))}</td>
                        <td>
                          <select
                            value={t.category}
                            aria-label={`${categoryLabel(t.category)} 분류`}
                            onChange={(e) => updateCat.mutateAsync({ id: t.id, category: e.target.value as TxnCategoryId }).then(() => refresh())}
                            disabled={updateCat.isPending}
                          >
                            {categoriesFor(t.direction).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                          </select>
                        </td>
                        <td className="ro">{t.memo ?? t.merchant ?? ""}</td>
                      </tr>
                    ))}
                    {!txns.data?.length && <tr><td className="ro" colSpan={8}>거래가 없습니다. 가져오기로 통장 파일을 넣으세요.</td></tr>}
                  </tbody>
                </table>
              </>
            )}
            {menu === "books" && (
              <>
                <h3>임금명세서 — {month} (기본급·수당·상여·성과)</h3>
                <p className="erp-hint">
                  근로기준법 시행령 제27조의2 · 고용노동부 임금명세서 작성 예시(지급|공제 양란).
                  차변은 지급, 대변은 공제·보통예금(실수령). 금액 0은 저장하지 않습니다. 저장해야 전표에 반영됩니다.
                </p>
                <WageSlip
                  earnRows={earnRows}
                  selEarn={selEarn}
                  onSel={setSelEarn}
                  onPatch={patchEarn}
                  onAdd={addEarnRow}
                  deductions={deductionRows(pay)}
                  net={pay && pay.gross > 0 ? Math.max(0, (earnRows.reduce((s, r) => s + (Number(r.amount) || 0), 0) || pay.gross) - pay.withholdTotal) : undefined}
                />
                {st && <PayYearSection points={st.payTrend} year={st.payYear} />}
                {st && (
                  <>
                    <h3 style={{ marginTop: 20 }}>급여전표 — {month}</h3>
                    <Journal ledger={st.payroll} debitHead="차변 · 지급" creditHead="대변 · 공제·보통예금" />
                    <h3 style={{ marginTop: 20 }}>월 보통예금 — {month}</h3>
                    <p className="erp-hint">차변은 입금(실수령·이자·배당), 대변은 출금(고정비·실거래)입니다.</p>
                    <Journal ledger={st.monthly} showNet debitHead="차변 · 입금" creditHead="대변 · 출금" netLabel="보통예금 증가 (차변 − 대변)" />
                  </>
                )}
                {!st && <p className="erp-hint">전표 조회 중…</p>}
              </>
            )}
            {menu === "savings" && (
              <SavingsPanel
                ref={savRef}
                month={month}
                accounts={(accounts.data ?? []).map((a) => ({
                  id: a.id, name: a.name, type: a.type, institution: a.institution,
                }))}
                dirty={dirty}
                onDirty={markDirty}
                onMsg={setMsg}
              />
            )}
            {menu === "invest" && <InvestPanel />}
          </div>
        </div>
      </div>
      <div className="erp-status">
        <span>고정비 {recRows.filter((r) => r.name.trim()).length}건 · {won(recSum)}</span>
        <span>기타 고정비 {won(otherFixed)}</span>
        <span>합계 {won(recSum + otherFixed)}</span>
        {pay && pay.net > 0 && <span>실수령 {won(pay.net)}</span>}
        {menu === "invest" && holdingsQ.data && (
          <span>투자 {holdingsQ.data.byAccount.length}계좌 · 보유 {holdingsQ.data.totals.openCount}건 · 평가 {won(holdingsQ.data.totals.marketValueKrw)}</span>
        )}
        {dirty ? <span className="erp-dirty">미저장 변경 있음</span> : <span>저장됨</span>}
      </div>
    </div>
  );
}

function Prop({ label, children }: { label: string; children: ReactNode }) {
  return (
    <tr>
      <th>{label}</th>
      <td>{children}</td>
    </tr>
  );
}

function digitsOnly(s: string) {
  return s.replace(/[^\d]/g, "");
}
function grouped(s: string) {
  const d = digitsOnly(s);
  if (!d) return "";
  return Number(d).toLocaleString("ko-KR");
}

function Num({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ph = placeholder && /^\d+$/.test(placeholder.replace(/,/g, "")) ? grouped(placeholder) : placeholder;
  return (
    <input
      inputMode="numeric"
      value={grouped(value)}
      onChange={(e) => onChange(digitsOnly(e.target.value))}
      placeholder={ph}
    />
  );
}

type PayPreview = {
  nationalTax: number;
  localTax: number;
  nationalPension: number;
  employmentInsurance: number;
  healthInsurance: number;
  longTermCare: number;
};

function deductionRows(pay?: PayPreview | null) {
  const amt: Record<(typeof PAY_DEDUCTION_PRESETS)[number]["id"], number> = {
    nationalTax: pay?.nationalTax ?? 0,
    localTax: pay?.localTax ?? 0,
    nationalPension: pay?.nationalPension ?? 0,
    employmentInsurance: pay?.employmentInsurance ?? 0,
    healthInsurance: pay?.healthInsurance ?? 0,
    longTermCare: pay?.longTermCare ?? 0,
  };
  return PAY_DEDUCTION_PRESETS.map((p) => ({ name: p.name, amount: amt[p.id] }));
}

function WageSlip({
  earnRows, selEarn, onSel, onPatch, onAdd, deductions, net,
}: {
  earnRows: EarnDraft[];
  selEarn: string | null;
  onSel: (key: string) => void;
  onPatch: (key: string, patch: Partial<EarnDraft>) => void;
  onAdd: () => void;
  deductions?: Array<{ name: string; amount: number }>;
  net?: number;
}) {
  const lines = EARN_GROUP_ORDER.flatMap((g) => {
    const list = earnRows.filter((r) => r.group === g);
    return list.map((row, i) => ({
      row,
      group: i === 0 ? PAY_EARNING_GROUP_LABEL[g] : "",
      span: i === 0 ? list.length : 0,
    }));
  });
  const deduct = deductions ?? [];
  const n = Math.max(lines.length, deduct.length);
  const payTotal = earnRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const deductTotal = deduct.reduce((s, d) => s + d.amount, 0);
  return (
    <div className="erp-slip">
      <table className="erp-grid">
        <thead>
          <tr>
            <th style={{ width: 120 }}>구분</th>
            <th>임금 항목</th>
            <th className="num" style={{ width: 140 }}>지급 금액</th>
            <th>공제 항목</th>
            <th className="num" style={{ width: 140 }}>공제 금액</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: n }, (_, i) => {
            const line = lines[i];
            const d = deduct[i];
            return (
              <tr key={line?.row.key ?? `d-${i}`} className={line && selEarn === line.row.key ? "sel" : ""} onClick={() => line && onSel(line.row.key)}>
                {line?.span ? <td className="ro" rowSpan={line.span}>{line.group}</td> : !line ? <td className="ro" /> : null}
                <td>
                  {line
                    ? line.row.group === "custom"
                      ? <input value={line.row.name} onChange={(e) => onPatch(line.row.key, { name: e.target.value })} placeholder="항목명" />
                      : <span className="ro" style={{ display: "block" }}>{line.row.name}</span>
                    : ""}
                </td>
                <td>{line ? <Num value={line.row.amount} onChange={(v) => onPatch(line.row.key, { amount: v })} /> : ""}</td>
                <td className="ro">{d?.name ?? ""}</td>
                <td className="ro num">{d && d.amount > 0 ? won(d.amount) : d ? "" : ""}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className="ro" colSpan={2}>지급액 계</td>
            <td className="ro num">{won(payTotal)}</td>
            <td className="ro">공제액 계</td>
            <td className="ro num">{won(deductTotal)}</td>
          </tr>
          {net != null && (
            <tr>
              <td className="ro" colSpan={3}>실수령액</td>
              <td className="ro" colSpan={2}>{won(net)}</td>
            </tr>
          )}
        </tfoot>
      </table>
      <p className="erp-hint" style={{ marginTop: 8 }}>
        <button type="button" onClick={onAdd}>그 밖의 임금 항목 추가</button>
        {" "}없는 수당·상여는 여기에 이름을 적습니다.
      </p>
    </div>
  );
}

function Journal({ ledger, showNet, debitHead, creditHead, netLabel }: {
  ledger: { credits: Array<{ label: string; amount: number; source: string }>; debits: Array<{ label: string; amount: number; source: string }>; creditTotal: number; debitTotal: number; net: number };
  showNet?: boolean;
  debitHead?: string;
  creditHead?: string;
  netLabel?: string;
}) {
  const rows = useMemo(() => {
    const n = Math.max(ledger.credits.length, ledger.debits.length);
    return Array.from({ length: n }, (_, i) => ({ debit: ledger.debits[i], credit: ledger.credits[i] }));
  }, [ledger]);
  return (
    <>
      <table className="erp-journal">
        <thead>
          <tr>
            <th>{debitHead ?? "차변 계정"}</th><th className="num">차변</th>
            <th>{creditHead ?? "대변 계정"}</th><th className="num">대변</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.debit ? <>{r.debit.label} <span className="muted">{r.debit.source === "planned" ? "예정" : "실적"}</span></> : ""}</td>
              <td className="num">{r.debit ? won(r.debit.amount) : ""}</td>
              <td>{r.credit ? <>{r.credit.label} <span className="muted">{r.credit.source === "planned" ? "예정" : "실적"}</span></> : ""}</td>
              <td className="num">{r.credit ? won(r.credit.amount) : ""}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>합계</td><td className="num">{won(ledger.debitTotal)}</td>
            <td>합계</td><td className="num">{won(ledger.creditTotal)}</td>
          </tr>
        </tfoot>
      </table>
      {showNet && <p className="erp-hint" style={{ marginTop: 8 }}>{netLabel ?? "보통예금 증가 (차변 − 대변)"} {won(ledger.net)}</p>}
    </>
  );
}
