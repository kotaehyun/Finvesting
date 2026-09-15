"use client";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import ReactMarkdown from "react-markdown";
import { trpc } from "@/lib/trpc";
import {
  EMPTY_INVEST_STYLE,
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  HORIZON_OPTIONS,
  LOSS_OPTIONS,
  investStyleAxes,
  type InvestStyleAnswers,
} from "@finvesting/core";
import { RadarChart } from "./radar-chart";
import { InvestTrail } from "../invest-trail";

export type InvestStyleHandle = {
  save: () => Promise<void>;
  create: () => void;
  remove: () => void;
  canDelete: boolean;
  refetch: () => Promise<void>;
};

export const InvestStylePanel = forwardRef<InvestStyleHandle, {
  onDirty: () => void;
  onMsg: (s: string) => void;
}>(function InvestStylePanel({ onDirty, onMsg }, ref) {
  const adviceQ = trpc.profile.investAdvice.useQuery();
  const profileQ = trpc.profile.get.useQuery();
  const save = trpc.profile.upsertInvestStyle.useMutation();
  const recommend = trpc.profile.investRecommend.useMutation();
  const [draft, setDraft] = useState<InvestStyleAnswers>({ ...EMPTY_INVEST_STYLE });
  const [ai, setAi] = useState("");

  useEffect(() => {
    if (!profileQ.data?.investStyle) return;
    setDraft(profileQ.data.investStyle);
  }, [profileQ.dataUpdatedAt]);

  function patch(p: Partial<InvestStyleAnswers>) {
    setDraft((d) => ({ ...d, ...p }));
    onDirty();
  }

  useImperativeHandle(ref, () => ({
    save: async () => {
      await save.mutateAsync(draft);
      await Promise.all([adviceQ.refetch(), profileQ.refetch()]);
      onMsg("투자성향을 저장했습니다.");
    },
    create: () => {
      setDraft({ ...EMPTY_INVEST_STYLE });
      onDirty();
    },
    remove: () => {
      setDraft({ ...EMPTY_INVEST_STYLE });
      void save.mutateAsync(EMPTY_INVEST_STYLE)
        .then(() => Promise.all([adviceQ.refetch(), profileQ.refetch()]))
        .then(() => onMsg("설문을 비웠습니다. 배분 성향은 기본정보에 남아 있습니다."))
        .catch((err: unknown) => onMsg(err instanceof Error ? err.message : String(err)));
    },
    canDelete: Boolean(draft.horizon || draft.experience || draft.lossOk || draft.goal),
    refetch: async () => {
      await Promise.all([adviceQ.refetch(), profileQ.refetch()]);
    },
  }), [draft, save, adviceQ, profileQ, onDirty, onMsg]);

  const a = adviceQ.data;
  const axes = investStyleAxes(draft);

  return (
    <>
      <h3>투자성향</h3>
      <p className="erp-hint">
        기간·경험·손실감수·목적으로 점수를 매깁니다. 증권사 적합성 평가가 아닙니다.
        설문을 저장하면 기본정보의 위험 성향을 맞추고, 월 배분 가이드에 반영합니다.
      </p>
      <InvestTrail current="style" variant="erp" />
      <table className="erp-props">
        <tbody>
          <tr>
            <th>투자기간</th>
            <td>
              <select value={draft.horizon} onChange={(e) => patch({ horizon: e.target.value as InvestStyleAnswers["horizon"] })}>
                <option value="">선택</option>
                {HORIZON_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </td>
          </tr>
          <tr>
            <th>투자 경험</th>
            <td>
              <select value={draft.experience} onChange={(e) => patch({ experience: e.target.value as InvestStyleAnswers["experience"] })}>
                <option value="">선택</option>
                {EXPERIENCE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </td>
          </tr>
          <tr>
            <th>원금 손실 감수</th>
            <td>
              <select value={draft.lossOk} onChange={(e) => patch({ lossOk: e.target.value as InvestStyleAnswers["lossOk"] })}>
                <option value="">선택</option>
                {LOSS_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </td>
          </tr>
          <tr>
            <th>투자 목적</th>
            <td>
              <select value={draft.goal} onChange={(e) => patch({ goal: e.target.value as InvestStyleAnswers["goal"] })}>
                <option value="">선택</option>
                {GOAL_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </td>
          </tr>
        </tbody>
      </table>

      <h3 style={{ marginTop: 16 }}>투자조언</h3>
      <p className="erp-hint">
        숫자는 저장된 설문·보유·비상금으로만 계산합니다. AI는 그 문장을 다시 설명할 뿐, 종목을 고르지 않습니다.
      </p>
      <div className="erp-pills">
        <button
          type="button"
          className={recommend.isPending ? "on" : ""}
          disabled={recommend.isPending}
          onClick={() => {
            setAi("");
            recommend.mutateAsync()
              .then((r) => setAi(r.advice))
              .catch((err: unknown) => {
                setAi("");
                onMsg(err instanceof Error ? err.message : String(err));
              });
          }}
        >
          {recommend.isPending ? "추천 작성 중…" : "AI 추천"}
        </button>
      </div>
      <div className="erp-chart-grid">
        <RadarChart
          title="설문 네 축 (만점 대비)"
          axes={axes.map((x) => ({ label: x.label, ratio: x.ratio }))}
        />
        <div className="erp-chart">
          <p className="erp-chart-title" style={{ margin: "4px 8px 8px" }}>성향 요약</p>
          {adviceQ.isLoading && <p className="erp-hint">불러오는 중…</p>}
          {a && (
            <ul className="plain" style={{ margin: "0 8px 8px" }}>
              <li>배분에 쓰는 성향 <strong>{a.storedLabel}</strong></li>
              <li>설문이 가리키는 성향 <strong>{a.suggestedLabel}</strong>{a.score != null ? ` · ${a.score}/12점` : " · 미완료"}</li>
              <li>월 투자 목표 비중 {(a.targetInvestShare * 100).toFixed(0)}%</li>
              <li>지금 자산의 투자 비중 {a.actualInvestShare != null ? `${(a.actualInvestShare * 100).toFixed(0)}%` : "—"}</li>
              {a.mismatch && <li className="erp-hint">저장하면 기본정보 성향을 {a.suggestedLabel}로 맞춥니다.</li>}
            </ul>
          )}
        </div>
      </div>
      <table className="erp-grid" style={{ marginTop: 12 }}>
        <thead>
          <tr><th>조언</th></tr>
        </thead>
        <tbody>
          {(a?.bullets ?? []).map((b) => (
            <tr key={b}><td className="ro">{b}</td></tr>
          ))}
          {!a?.bullets.length && (
            <tr><td className="ro">설문을 고르고 저장하면 조언이 나옵니다.</td></tr>
          )}
        </tbody>
      </table>
      {(recommend.isPending || ai) && (
        <div className="erp-chart" style={{ marginTop: 12 }}>
          <p className="erp-chart-title" style={{ margin: "4px 8px 8px" }}>AI 추천 (로컬 LLM)</p>
          <p className="erp-hint">컨텍스트 문장만 다시 설명합니다. Ollama가 켜져 있어야 합니다.</p>
          {recommend.isPending && !ai && <p className="erp-hint">생각 중…</p>}
          {ai && <div className="md" style={{ padding: "0 8px 8px" }}><ReactMarkdown>{ai}</ReactMarkdown></div>}
        </div>
      )}
      <p className="erp-hint" style={{ marginTop: 8 }}>
        저장은 위 툴바에서 합니다. 설문 점수는 내부 규칙이며 공식 투자자 성향 평가가 아닙니다.
      </p>
    </>
  );
});
