"use client";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { FS_ITEM_LABELS, FS_STATEMENT_LABELS, lookupServices } from "@finvesting/core";
import { trpc } from "@/lib/trpc";
import { InvestTrail } from "../invest-trail";

const won = (n: number, currency: string) =>
  currency === "KRW"
    ? `${Math.round(n).toLocaleString("ko-KR")}원`
    : `${n.toLocaleString("en-US")} ${currency}`;

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function StatementsPage() {
  const list = trpc.statements.list.useQuery();
  const [instrumentId, setInstrumentId] = useState("");
  const [year, setYear] = useState<number | undefined>(undefined);
  const explain = trpc.statements.explain.useMutation();

  useEffect(() => {
    if (instrumentId || !list.data?.length) return;
    setInstrumentId(list.data[0]!.id);
  }, [instrumentId, list.data]);

  const picked = list.data?.find((i) => i.id === instrumentId);
  const bundle = trpc.statements.get.useQuery(
    { instrumentId, year },
    { enabled: Boolean(instrumentId) },
  );
  const data = bundle.data;
  const currency = data?.currency ?? "KRW";

  function pickInstrument(id: string) {
    setInstrumentId(id);
    setYear(undefined);
    explain.reset();
  }

  return (
    <>
      <h1>재무제표 · 기업정보</h1>
      <p className="muted">
        숫자는 DART/EDGAR 표준 항목만 둡니다. 기업개황·재무조회·감사보고서는 공식 사이트로 엽니다.
        해설은 「재무제표를 읽는 사람들」을 참조하고, 본문은 저장하지 않습니다.
        Yahoo 시총·PER 표는 Fundamentals입니다.
      </p>
      <InvestTrail current="statements" />
      <LookupCard query={picked?.symbol || picked?.name} />
      {list.isLoading && <p className="muted">불러오는 중…</p>}
      {list.data && !list.data.length && (
        <p className="muted">
          수집된 재무제표가 없습니다. `.env`에 `DART_API_KEY`와 `DART_TARGETS`(종목코드:corp_code:이름)를 넣고
          `pnpm --filter @finvesting/worker run:once`를 실행하세요.
        </p>
      )}
      {!!list.data?.length && (
        <div className="starter-list" style={{ margin: "12px 0 16px" }}>
          {list.data.map((i) => (
            <button
              key={i.id}
              type="button"
              className={`starter${instrumentId === i.id ? " on" : ""}`}
              onClick={() => pickInstrument(i.id)}
            >
              {i.name} {i.symbol}
              {i.opinions[0] ? ` · ${i.opinions[0]}` : ""}
            </button>
          ))}
        </div>
      )}
      {picked && data?.years?.length ? (
        <div className="row" style={{ marginBottom: 12 }}>
          {data.years.map((y) => (
            <button
              key={y}
              type="button"
              className={`starter${data.fiscalYear === y ? " on" : ""}`}
              onClick={() => { setYear(y); explain.reset(); }}
            >
              {y}
            </button>
          ))}
          <button
            type="button"
            disabled={!instrumentId || explain.isPending}
            onClick={() => explain.mutate({ instrumentId, year: data.fiscalYear ?? undefined })}
          >
            {explain.isPending ? "읽는 중…" : "읽어주기"}
          </button>
        </div>
      ) : null}
      {bundle.isLoading && instrumentId && <p className="muted">숫자 불러오는 중…</p>}
      {bundle.error && <p>오류: {bundle.error.message}</p>}
      {data?.fiscalYear && (
        <>
          <div className="grid" style={{ marginBottom: 16 }}>
            <StmtCard kind="income" items={data.income} currency={currency} />
            <StmtCard kind="balance" items={data.balance} currency={currency} />
            <StmtCard kind="cashflow" items={data.cashflow} currency={currency} />
          </div>
          {!!Object.keys(data.ratios).length && (
            <section className="card" style={{ marginBottom: 16 }}>
              <h3>비율 (수집 숫자로만)</h3>
              <ul className="plain">
                {data.ratios.opMargin != null && <li>영업이익률 {pct(data.ratios.opMargin)}</li>}
                {data.ratios.netMargin != null && <li>순이익률 {pct(data.ratios.netMargin)}</li>}
                {data.ratios.debtToAssets != null && <li>부채비율(자산 대비) {pct(data.ratios.debtToAssets)}</li>}
                {data.ratios.roe != null && <li>ROE {pct(data.ratios.roe)}</li>}
                {data.ratios.cfoMinusNetIncome != null && (
                  <li>영업CF − 순이익 {won(data.ratios.cfoMinusNetIncome, currency)}</li>
                )}
              </ul>
            </section>
          )}
          <section className="card" style={{ marginBottom: 16 }}>
            <h3>감사의견 {data.fiscalYear}</h3>
            {data.audit ? (
              <>
                <p>의견 <strong>{data.audit.opinion ?? "—"}</strong></p>
                {data.audit.goingConcern && <p className="muted">계속기업 관련 문구가 공시에 있습니다. 적정이어도 건전성 보장이 아닙니다.</p>}
                <div className="starter-list">
                  {data.audit.auditorSite && (
                    <a className="starter" href={data.audit.auditorSite.url} target="_blank" rel="noreferrer">
                      {data.audit.auditor ?? data.audit.auditorSite.label} 홈페이지
                    </a>
                  )}
                  {data.audit.dartUrl && (
                    <a className="starter" href={data.audit.dartUrl} target="_blank" rel="noreferrer">DART 감사 공시</a>
                  )}
                  <a className="starter" href="https://dart.fss.or.kr/dsab007/main.do" target="_blank" rel="noreferrer">DART 감사보고서 검색</a>
                </div>
              </>
            ) : (
              <p className="muted">
                이 연도 감사의견이 없습니다. 위 조회에서 감사보고서를 열거나, DART 수집 후 다시 보세요.
                미국 종목(EDGAR)은 감사의견 API가 없습니다.
              </p>
            )}
          </section>
        </>
      )}
      {explain.error && <p>오류: {explain.error.message}</p>}
      {explain.data && (
        <section className="card">
          <h3>읽어주기 <span className="muted">{explain.data.provider} · {explain.data.fiscalYear}</span></h3>
          <div className="md"><ReactMarkdown>{explain.data.reading}</ReactMarkdown></div>
        </section>
      )}
    </>
  );
}

function LookupCard({ query }: { query?: string }) {
  const links = lookupServices(query);
  return (
    <section className="card" style={{ margin: "12px 0 16px" }}>
      <h3>기업정보 조회 · 해설 참조</h3>
      <p className="muted">공식 조회와 해설 사이트입니다. 내용은 저장하지 않고 새 탭으로 엽니다.</p>
      <div className="starter-list">
        {links.map((s) => (
          <a key={s.id} className="starter" href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
        ))}
      </div>
    </section>
  );
}

function StmtCard({ kind, items, currency }: {
  kind: keyof typeof FS_STATEMENT_LABELS;
  items: Record<string, number>;
  currency: string;
}) {
  const rows = Object.entries(items);
  return (
    <section className="card">
      <h3>{FS_STATEMENT_LABELS[kind]}</h3>
      {rows.length ? (
        <ul className="plain">
          {rows.map(([k, n]) => (
            <li key={k}>{FS_ITEM_LABELS[k] ?? k} <span className="muted">{won(n, currency)}</span></li>
          ))}
        </ul>
      ) : <p className="muted">없음</p>}
    </section>
  );
}
