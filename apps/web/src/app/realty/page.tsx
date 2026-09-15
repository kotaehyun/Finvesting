"use client";
import {
  REALTY_LOAN_RISKS,
  REALTY_METRIC_SLOTS,
  REALTY_METROS,
  REALTY_MIND,
  REALTY_REF_LINKS,
  REALTY_REGULATED_GYEONGGI,
  REALTY_REGULATED_NOTE,
  REALTY_REGULATED_SEOUL,
  REALTY_ZONES,
  metroHeightScale,
  realtyMetroForPlace,
} from "@finvesting/core";
import { trpc } from "@/lib/trpc";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { RealtyClaimsPanel } from "./claims-panel";
import { RealtyWealthPanel } from "./wealth-panel";
import { RealtyCorpPanel } from "./corp-panel";
import { RealtyDistressPanel } from "./distress-panel";
import { RealtyListingsPanel } from "./listings-panel";
import { RealtyLoanPanel } from "./loan-panel";
import { RealtyRatesPanel } from "./rates-panel";
import { RealtyNtsPanel } from "./nts-panel";
import { RealtyOfficialsPanel } from "./officials-panel";
import { RealtyPeoplePanel } from "./people-panel";
import { RealtyStressPanel } from "./stress-panel";

const RealtyGeoMap = dynamic(() => import("./geo-map").then((m) => m.RealtyGeoMap), {
  ssr: false,
  loading: () => (
    <div className="realty-map-wrap">
      <div className="realty-geo realty-plan muted">도면 불러오는 중…</div>
    </div>
  ),
});

function fmtAt(v: Date | string | null | undefined) {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function RealtyPage() {
  const news = trpc.market.newsFeed.useQuery({ category: "realty", limit: 12 });
  const loans = trpc.market.realtyLoans.useQuery();
  const [zones, regulated, loan] = REALTY_MIND.branches;
  const [focusId, setFocusId] = useState<string | null>(null);
  const [focusLabel, setFocusLabel] = useState<string | null>(null);
  const [focusCode, setFocusCode] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const onFocus = (id: string, label: string, code?: string) => {
    setFocusId(id);
    setFocusLabel(label);
    setFocusCode(code ?? null);
  };
  const heights = useMemo(() => {
    const m = loans.data?.metros;
    if (!m) return null;
    return metroHeightScale(
      Object.fromEntries(REALTY_METROS.map((row) => [row.id, m[row.id]?.latest ?? null])),
    );
  }, [loans.data]);
  const npl = useMemo(
    () => REALTY_METROS.map((row) => ({
      id: row.id,
      npl: loans.data?.metros[row.id]?.npl ?? null,
      nplDate: loans.data?.metros[row.id]?.nplDate ?? null,
    })),
    [loans.data],
  );
  async function refreshData() {
    setRefreshing(true);
    try {
      await Promise.all([news.refetch(), loans.refetch()]);
      setRefreshedAt(new Date());
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="realty-page">
      <div className="page-head">
        <div>
          <h1 style={{ marginBottom: 4 }}>부동산</h1>
          <p className="muted" style={{ margin: 0 }}>
            전국 시·구를 누르면 그 광역시도 가계대출 비중·총액이 나옵니다. 대출 금리는 한은 가중평균·COFIX 표입니다. 전월세 비중·카드 연체·리볼빙이 있습니다. 공실·빈집·PIR·지니, 법인·증여 채널, 고위공직자 공개분만 있습니다. 4급 등록·연예인·임원 실명·개인 세금 조회는 없습니다. 매수 권유가 아닙니다.
          </p>
        </div>
        <div className="row">
          <button type="button" className="starter" onClick={() => void refreshData()} disabled={refreshing}>
            {refreshing ? "업데이트 중…" : "데이터 업데이트"}
          </button>
          <a className="starter" href="/markets">시장</a>
          <a className="starter" href="/invest">투자</a>
        </div>
      </div>
      {refreshedAt && (
        <p className="muted" style={{ margin: "-8px 0 12px" }}>
          뉴스·가계대출·금리를 {fmtAt(refreshedAt)}에 다시 받았습니다. 공실·종부세·가중평균 스냅샷은 공표일 기준이며 사이트를 긁지 않습니다.
        </p>
      )}

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>전국 3D 도면</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>
          멀리서는 17개 시도, 확대하면 시·구 이름. 수도권만 규제·정비권역 색입니다. 오른쪽은 그 광역시도 예금은행 가계대출입니다. 화성 점선은 동탄구만 규제.
        </p>
        <div className="realty-3d-board">
          <RealtyGeoMap focusId={focusId} focusCode={focusCode} heights={heights} onFocus={onFocus} />
          <RealtyLoanPanel
            focusId={focusId}
            focusLabel={focusLabel}
            loans={loans.data}
            loading={loans.isLoading}
            onFocus={onFocus}
          />
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>대출 금리 현황</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>
          예금은행 가중평균과 COFIX입니다. 특정 은행 주담대 상품금리가 아닙니다. ECOS 키가 있으면 표의 일부 칸을 시계열로 덮습니다.
        </p>
        <RealtyRatesPanel rows={loans.data?.rates} />
      </section>

      <section className="card realty-mind-wrap" style={{ marginBottom: 16 }}>
        <h3>지역 마인드맵</h3>
        <p className="muted" style={{ margin: "0 0 12px" }}>
          주황은 규제지역, 빨강은 대출이 빡세지는 경우, 파랑은 수도권정비 권역입니다. 테두리 점선은 2026-07-01 추가(동탄·기흥·구리).
        </p>
        <div className="realty-mind">
          <div className="mind-arm mind-zones">
            <div className={`mind-node mind-branch ${zones.tone}`}>{zones.label}</div>
            <p className="muted mind-sum">{zones.summary}</p>
            {REALTY_ZONES.map((z) => (
              <div key={z.id} className="mind-leaf">
                <div className="mind-node info sm">{z.label}</div>
                <p className="muted mind-sum">{z.summary}</p>
                <div className="zone-list">
                  {z.places.map((p) => (
                    <span key={p} className="zone-chip">{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mind-hub" aria-label="수도권 지역 대출 위험">
            <strong>{REALTY_MIND.hub.label}</strong>
            <span>{REALTY_MIND.hub.sub}</span>
          </div>

          <div className="mind-arm mind-regs">
            <div className={`mind-node mind-branch ${regulated.tone}`}>{regulated.label}</div>
            <p className="muted mind-sum">{regulated.summary}</p>
            <div className="mind-leaf">
              <button
                type="button"
                className={`mind-node warn sm${focusId === "seoul" ? " on" : ""}`}
                onClick={() => onFocus("seoul", REALTY_REGULATED_SEOUL.label)}
              >
                {REALTY_REGULATED_SEOUL.label}
              </button>
              <p className="muted mind-sum">{REALTY_REGULATED_SEOUL.summary}</p>
            </div>
            <div className="mind-leaf">
              <div className="mind-node warn sm">경기 {REALTY_REGULATED_GYEONGGI.length}곳</div>
              <div className="zone-list">
                {REALTY_REGULATED_GYEONGGI.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    className={`zone-chip warn${p.since === "2026-07-01" ? " fresh" : ""}${focusId === p.id ? " on" : ""}`}
                    title={`${p.label} · 효력 ${p.since}`}
                    onClick={() => onFocus(p.id, p.label)}
                  >
                    {p.label}
                    {p.since === "2026-07-01" ? <em> 7/1</em> : null}
                  </button>
                ))}
              </div>
            </div>
            <p className="muted mind-sum">{REALTY_REGULATED_NOTE}</p>
          </div>

          <div className="mind-arm mind-loans">
            <div className={`mind-node mind-branch ${loan.tone}`}>{loan.label}</div>
            <p className="muted mind-sum">{loan.summary}</p>
            <div className="loan-grid">
              {REALTY_LOAN_RISKS.map((r) => (
                <div key={r.id} className={`loan-cell ${r.tone}`}>
                  <div className={`mind-node ${r.tone} sm`}>{r.label}</div>
                  <p className="muted mind-sum">{r.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>인구이동 · 출산율 · 인구감소</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>
          숫자는 국가데이터처·행안부 확정 공표입니다. 전월세는 점유·거래 비중입니다. 시군구 이동 인원·전세자금 대출 비중은 칸만 둡니다.
        </p>
        <RealtyPeoplePanel />
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>공실 · 빈집 · 소득 대비</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>
          전국 평균과 17개 시도. 수도권 3곳은 따로. 연체는 ECOS 키가 있으면 채워집니다.
          공실은 자가·무상임대를 빼므로 법인이 채우면 내려갑니다.
        </p>
        <RealtyStressPanel focusId={focusId ? realtyMetroForPlace(focusId) : null} npl={npl} />
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>상환 · 경매 · 빌딩 부채 · 상권</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>
          영끌은 고위험가구 청년 비중으로만 봅니다. 카드 연체·리볼빙은 금감원·협회 집계입니다. 꼬마빌딩은 기업 부동산업 연체·상가 수익률입니다. 포털 급매·상권 매출은 칸.
        </p>
        <RealtyDistressPanel />
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>고가주택 세금 방향</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>
          고위공직자를 뺀 자산가 명단은 없습니다. 국세청이 고지한 종부세 지역 집계로 고가주택 세금이 어디에 몰리는지만 봅니다.
        </p>
        <RealtyNtsPanel />
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>고액 자산 비중 · 이동 방식</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>
          연예인·임원·사적 자산가는 한 명씩 올리지 않습니다. 상위 분위 비중과 법인·증여·상속·신탁 채널만 봅니다.
        </p>
        <RealtyWealthPanel />
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>법인 명의 · 고액 창구</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>
          4급 재산등록과 연예인 실명은 데이터가 아닙니다. 법인 주택은 종부세 유형 집계로 넣습니다.
        </p>
        <RealtyCorpPanel />
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>고위공직자 자산 방향</h3>
        <RealtyOfficialsPanel />
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>유형별 매물·거래 추이</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>
          아파트·오피스텔·다가구/빌라·연립·상가·빌딩·토지. 전국 실거래 칸입니다. 네이버·직방·KB 매물 호수·급매는 긁지 않습니다.
          키를 넣으면 국토부 신고 건수로 그립니다. 지금은 빈 그래프입니다.
        </p>
        <RealtyListingsPanel focusLabel={focusLabel} />
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>임대료·공급</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>키를 넣기 전에는 칸만 둡니다. 국토부·부동산원 사이트를 긁지 않습니다.</p>
        <div className="index-grid">
          {REALTY_METRIC_SLOTS.map((s) => (
            <div key={s.id} className="index-cell">
              <div className="muted">{s.label}</div>
              <div className="big" style={{ fontSize: 18 }}>—</div>
              <p className="muted" style={{ margin: "6px 0 0" }}>{s.need}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>공식 조회</h3>
        <div className="starter-list">
          {REALTY_REF_LINKS.map((l) => (
            <a key={l.id} className="starter" href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>떠도는 말 vs 공식 · 평균의 함정</h3>
        <RealtyClaimsPanel
          items={(news.data?.items ?? []).map((n) => ({
            id: n.id,
            title: n.title,
            url: n.url,
            publisher: n.publisher,
          }))}
        />
      </section>

      <section className="card">
        <h3>부동산 뉴스</h3>
        <p className="muted">한국경제 부동산 RSS. 제목·링크·요약만. 위 칸에서 주장과 맞춰 봅니다.</p>
        {news.isLoading && <p className="muted">불러오는 중…</p>}
        {news.error && <p>오류: {news.error.message}</p>}
        <ul className="plain">
          {(news.data?.items ?? []).slice(0, 10).map((n) => (
            <li key={n.id} className="news-item">
              <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
              <p className="news-sum">{n.summary}</p>
              <div className="muted">{n.publisher} {fmtAt(n.publishedAt)}</div>
            </li>
          ))}
        </ul>
        {!news.isLoading && !(news.data?.items?.length) && <p className="muted">수집 전이면 worker RSS를 한 번 돌리세요.</p>}
      </section>
    </div>
  );
}
