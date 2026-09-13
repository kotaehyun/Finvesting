"use client";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { trpc } from "@/lib/trpc";
import { RadarChart } from "./radar-chart";

const KINDS = [
  { id: "life", label: "생명" },
  { id: "health", label: "실손·건강" },
  { id: "cancer", label: "암" },
  { id: "critical", label: "중대질병" },
  { id: "accident", label: "상해" },
  { id: "disability", label: "후유장해" },
  { id: "property", label: "재물" },
  { id: "other", label: "기타" },
] as const;
type KindId = (typeof KINDS)[number]["id"];
type Shape = "hex" | "hept";

export type InsuranceHandle = {
  save: () => Promise<void>;
  create: () => void;
  remove: () => void;
  canDelete: boolean;
  refetch: () => Promise<void>;
};

function won(n: number) {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}
function kindLabel(id: string) {
  return KINDS.find((k) => k.id === id)?.label ?? id;
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

type Draft = {
  id?: string;
  name: string;
  insurer: string;
  kind: KindId;
  monthlyPremium: string;
  deathAmount: string;
  medicalCovered: boolean;
  cancerAmount: string;
  brainAmount: string;
  heartAmount: string;
  accidentAmount: string;
  disabilityAmount: string;
  startMonth: string;
  endMonth: string;
  memo: string;
};

function emptyDraft(): Draft {
  return {
    name: "", insurer: "", kind: "other", monthlyPremium: "",
    deathAmount: "", medicalCovered: false, cancerAmount: "", brainAmount: "",
    heartAmount: "", accidentAmount: "", disabilityAmount: "",
    startMonth: "", endMonth: "", memo: "",
  };
}

export const InsurancePanel = forwardRef<InsuranceHandle, {
  onDirty: () => void;
  onMsg: (s: string) => void;
  dirty: boolean;
}>(function InsurancePanel({ onDirty, onMsg, dirty }, ref) {
  const list = trpc.insurance.list.useQuery();
  const upsert = trpc.insurance.upsert.useMutation();
  const removeMut = trpc.insurance.remove.useMutation();

  const [sel, setSel] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [localOnly, setLocalOnly] = useState(false);
  const [shape, setShape] = useState<Shape>("hept");

  function patch(p: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...p }));
    onDirty();
  }

  function load(p: NonNullable<typeof list.data>["policies"][number] | null) {
    setLocalOnly(false);
    if (!p) {
      setDraft(emptyDraft());
      return;
    }
    setDraft({
      id: p.id,
      name: p.name,
      insurer: p.insurer ?? "",
      kind: KINDS.some((k) => k.id === p.kind) ? p.kind as KindId : "other",
      monthlyPremium: p.monthlyPremium ? String(p.monthlyPremium) : "",
      deathAmount: p.deathAmount ? String(p.deathAmount) : "",
      medicalCovered: p.medicalCovered,
      cancerAmount: p.cancerAmount ? String(p.cancerAmount) : "",
      brainAmount: p.brainAmount ? String(p.brainAmount) : "",
      heartAmount: p.heartAmount ? String(p.heartAmount) : "",
      accidentAmount: p.accidentAmount ? String(p.accidentAmount) : "",
      disabilityAmount: p.disabilityAmount ? String(p.disabilityAmount) : "",
      startMonth: p.startMonth ?? "",
      endMonth: p.endMonth ?? "",
      memo: p.memo ?? "",
    });
  }

  useEffect(() => {
    if (dirty || localOnly) return;
    const rows = list.data?.policies ?? [];
    if (!rows.length) {
      if (!draft.id) load(null);
      return;
    }
    const cur = rows.find((p) => p.id === sel) ?? rows[0];
    if (!cur) return;
    setSel(cur.id);
    load(cur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.dataUpdatedAt, dirty]);

  useImperativeHandle(ref, () => ({
    async save() {
      const row = await upsert.mutateAsync({
        id: draft.id,
        name: draft.name.trim() || "보험",
        insurer: draft.insurer.trim() || undefined,
        kind: draft.kind,
        monthlyPremium: Number(draft.monthlyPremium) || 0,
        deathAmount: Number(draft.deathAmount) || 0,
        medicalCovered: draft.medicalCovered,
        cancerAmount: Number(draft.cancerAmount) || 0,
        brainAmount: Number(draft.brainAmount) || 0,
        heartAmount: Number(draft.heartAmount) || 0,
        accidentAmount: Number(draft.accidentAmount) || 0,
        disabilityAmount: Number(draft.disabilityAmount) || 0,
        startMonth: draft.startMonth || undefined,
        endMonth: draft.endMonth || undefined,
        memo: draft.memo.trim() || undefined,
      });
      setLocalOnly(false);
      setSel(row.id);
      load(row);
      await list.refetch();
      onMsg("보험을 저장했습니다.");
    },
    create() {
      setSel("new");
      load(null);
      setLocalOnly(true);
      onDirty();
    },
    async remove() {
      if (draft.id) {
        await removeMut.mutateAsync({ id: draft.id });
        setSel(null);
        load((list.data?.policies ?? []).find((p) => p.id !== draft.id) ?? null);
        await list.refetch();
        onMsg("보험 증권을 삭제했습니다.");
        return;
      }
      load(null);
      setLocalOnly(false);
    },
    get canDelete() {
      return Boolean(draft.id || draft.name.trim() || localOnly);
    },
    async refetch() {
      setLocalOnly(false);
      await list.refetch();
    },
  }), [draft, localOnly, list.data]);

  const policies = list.data?.policies ?? [];
  const analysis = shape === "hex" ? list.data?.hex : list.data?.hept;
  const annual = list.data?.annualIncome ?? 0;
  const premiumSum = policies.reduce((s, p) => s + p.monthlyPremium, 0);

  return (
    <>
      <h3>보험내역</h3>
      <p className="erp-hint">
        가입한 민영 보험을 적습니다. 4대보험(급여 공제)과 별개입니다.
        권장액은 연소득 기준 경험 규칙이며 공식 고시가 아닙니다.
        {annual > 0 ? ` 연소득(세전×12) ${won(annual)}.` : " 기본정보에 세전 소득을 넣으면 권장 보장을 계산합니다."}
      </p>
      <table className="erp-grid">
        <thead>
          <tr>
            <th style={{ width: 40 }}>No</th>
            <th>상품명</th>
            <th style={{ width: 120 }}>보험사</th>
            <th style={{ width: 90 }}>종류</th>
            <th className="num" style={{ width: 120 }}>월 보험료</th>
            <th className="num" style={{ width: 140 }}>사망</th>
            <th style={{ width: 60 }}>실손</th>
          </tr>
        </thead>
        <tbody>
          {policies.map((p, i) => (
            <tr key={p.id} className={sel === p.id ? "sel" : ""} onClick={() => { setSel(p.id); load(p); }}>
              <td className="ro num">{i + 1}</td>
              <td className="ro">{p.name}</td>
              <td className="ro">{p.insurer ?? "—"}</td>
              <td className="ro">{kindLabel(p.kind)}</td>
              <td className="ro num">{p.monthlyPremium ? won(p.monthlyPremium) : "—"}</td>
              <td className="ro num">{p.deathAmount ? won(p.deathAmount) : "—"}</td>
              <td className="ro">{p.medicalCovered ? "가입" : "—"}</td>
            </tr>
          ))}
          {localOnly && (
            <tr className="sel">
              <td className="ro num">{policies.length + 1}</td>
              <td className="ro">{draft.name || "새 보험"}</td>
              <td className="ro">{draft.insurer || "—"}</td>
              <td className="ro">{kindLabel(draft.kind)}</td>
              <td className="ro num">{draft.monthlyPremium ? won(Number(draft.monthlyPremium)) : "—"}</td>
              <td className="ro num">{draft.deathAmount ? won(Number(draft.deathAmount)) : "—"}</td>
              <td className="ro">{draft.medicalCovered ? "가입" : "—"}</td>
            </tr>
          )}
          {!policies.length && !localOnly && (
            <tr><td className="ro" colSpan={7}>증권이 없습니다. 신규를 눌러 가입 보험을 넣으세요.</td></tr>
          )}
        </tbody>
      </table>

      <h3 style={{ marginTop: 16 }}>증권</h3>
      <table className="erp-props">
        <tbody>
          <tr><th>상품명</th><td><input value={draft.name} onChange={(e) => patch({ name: e.target.value })} placeholder="예: 실손의료비, 종신보험" /></td></tr>
          <tr><th>보험사</th><td><input value={draft.insurer} onChange={(e) => patch({ insurer: e.target.value })} placeholder="삼성화재" /></td></tr>
          <tr>
            <th>종류</th>
            <td>
              <select value={draft.kind} onChange={(e) => patch({ kind: e.target.value as KindId })}>
                {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </td>
          </tr>
          <tr><th>월 보험료</th><td><Num value={draft.monthlyPremium} onChange={(v) => patch({ monthlyPremium: v })} /></td></tr>
          <tr>
            <th>실손</th>
            <td>
              <label>
                <input
                  type="checkbox"
                  checked={draft.medicalCovered}
                  onChange={(e) => patch({ medicalCovered: e.target.checked })}
                />
                {" "}가입
              </label>
            </td>
          </tr>
          <tr><th>사망 보장</th><td><Num value={draft.deathAmount} onChange={(v) => patch({ deathAmount: v })} /></td></tr>
          <tr><th>암</th><td><Num value={draft.cancerAmount} onChange={(v) => patch({ cancerAmount: v })} /></td></tr>
          <tr><th>뇌혈관</th><td><Num value={draft.brainAmount} onChange={(v) => patch({ brainAmount: v })} /></td></tr>
          <tr><th>심장</th><td><Num value={draft.heartAmount} onChange={(v) => patch({ heartAmount: v })} /></td></tr>
          <tr><th>상해</th><td><Num value={draft.accidentAmount} onChange={(v) => patch({ accidentAmount: v })} /></td></tr>
          <tr><th>후유장해</th><td><Num value={draft.disabilityAmount} onChange={(v) => patch({ disabilityAmount: v })} /></td></tr>
          <tr><th>시작월</th><td><input type="month" value={draft.startMonth} onChange={(e) => patch({ startMonth: e.target.value })} /></td></tr>
          <tr><th>종료월</th><td><input type="month" value={draft.endMonth} onChange={(e) => patch({ endMonth: e.target.value })} /></td></tr>
          <tr>
            <th>메모</th>
            <td>
              <textarea
                value={draft.memo}
                onChange={(e) => patch({ memo: e.target.value })}
                rows={2}
                placeholder="특약, 갱신 여부 등"
                style={{ width: "100%", boxSizing: "border-box", border: 0, padding: "6px 8px", font: "inherit", resize: "vertical" }}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <h3 style={{ marginTop: 16 }}>보장 공백</h3>
      <p className="erp-hint">
        바깥선이 권장(100%), 안쪽 칠이 가입 비율입니다.
      </p>
      <div className="erp-pills">
        <button type="button" className={shape === "hept" ? "on" : ""} onClick={() => setShape("hept")}>칠각형 (7축)</button>
        <button type="button" className={shape === "hex" ? "on" : ""} onClick={() => setShape("hex")}>육각형 (6축)</button>
      </div>
      <div className="erp-chart-grid">
        <RadarChart
          title={shape === "hex" ? "보장 육각형" : "보장 칠각형"}
          axes={(analysis?.axes ?? []).map((a) => ({ label: a.label, ratio: a.ratio }))}
        />
        <div className="erp-chart">
          <p className="erp-chart-title" style={{ margin: "4px 8px 8px" }}>어디가 부족한지</p>
          {!annual && <p className="erp-hint">세전 소득이 없으면 권장액을 계산하지 않습니다.</p>}
          {analysis?.weakest && (
            <p className="erp-hint">가장 약한 축: <strong>{analysis.weakest.label}</strong> (가입 {Math.round(analysis.weakest.ratio * 100)}%)</p>
          )}
          <table className="erp-grid">
            <thead>
              <tr>
                <th>축</th>
                <th className="num">가입</th>
                <th className="num">권장</th>
                <th className="num">부족</th>
                <th className="num">충족</th>
              </tr>
            </thead>
            <tbody>
              {(analysis?.axes ?? []).map((a) => (
                <tr key={a.id}>
                  <td className="ro">{a.label}</td>
                  <td className="ro num">{a.id === "medical" ? (a.covered >= 1 ? "가입" : "없음") : won(a.covered)}</td>
                  <td className="ro num">{a.id === "medical" ? "가입" : won(a.recommended)}</td>
                  <td className="ro num">{a.missing ? (a.id === "medical" ? "미가입" : won(a.gap)) : "—"}</td>
                  <td className="ro num">{Math.round(a.ratio * 100)}%</td>
                </tr>
              ))}
              {!analysis?.axes.length && (
                <tr><td className="ro" colSpan={5}>저장한 증권과 연소득으로 계산합니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="erp-hint" style={{ marginTop: 8 }}>월 보험료 합 {won(premiumSum)}</p>
    </>
  );
});
