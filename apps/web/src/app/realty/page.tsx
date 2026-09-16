"use client";
import {
  REALTY_LOAN_RISKS,
  REALTY_METROS,
  REALTY_MIND,
  REALTY_REF_LINKS,
  REALTY_REGULATED_GYEONGGI,
  REALTY_REGULATED_NOTE,
  REALTY_REGULATED_SEOUL,
  REALTY_ZONES,
  REALTY_CURATED_NEWS,
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
      <div className="realty-geo realty-plan muted">3D 도면 불러오는 중…</div>
    </div>
  ),
});

function fmtAt(v: Date | string | null | undefined) {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const TABS = [
  { id: "all", label: "📊 전체 보기", badge: "12개 블록" },
  { id: "map", label: "🗺️ 도면 & 대출 지도", badge: "3D 벡터 맵" },
  { id: "debt", label: "📉 금리 & 부채·연체", badge: "위험 모니터링" },
  { id: "wealth", label: "🏛️ 자산 편중 & 세금", badge: "종부세·법인" },
  { id: "demographics", label: "👥 인구 & 주거·공실", badge: "출산·임차" },
  { id: "claims", label: "💡 팩트체크 & 뉴스", badge: "통설 검증" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function RealtyPage() {
  const news = trpc.market.newsFeed.useQuery({ category: "realty", limit: 12 });
  const displayNews = (news.data?.items && news.data.items.length > 0) ? news.data.items : REALTY_CURATED_NEWS;
  const loans = trpc.market.realtyLoans.useQuery();
  const [activeTab, setActiveTab] = useState<TabId>("debt");
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

  const showTab = (t: TabId) => activeTab === "all" || activeTab === t;

  return (
    <div className="realty-page">
      {/* 헤더 */}
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>🏢 부동산 시장 & 가계부채 인텔리전스</h1>
          <p className="muted" style={{ margin: 0 }}>
            한국은행, 금융감독원, 통계청, 대법원 공식 통계를 기반으로 대한민국 부동산 시장과 부채 건전성을 분석합니다.
          </p>
        </div>
        <div className="row">
          <button type="button" className="starter" onClick={() => void refreshData()} disabled={refreshing}>
            {refreshing ? "동기화 중…" : "실시간 데이터 새로고침"}
          </button>
          <a className="starter" href="/markets">시장 지표</a>
          <a className="starter" href="/invest">투자 대시보드</a>
        </div>
      </div>

      {refreshedAt && (
        <p className="muted" style={{ margin: "-6px 0 16px", fontSize: 13 }}>
          ✅ {fmtAt(refreshedAt)} 최신 공표 통계 동기화 완료
        </p>
      )}

      {/* 📌 최상단 핵심 4대 바롬터 KPI 바 */}
      <div className="realty-kpi-bar">
        <div className="realty-kpi-card blue">
          <div className="realty-kpi-title">
            <span>🏦</span> 한국은행 기준금리
          </div>
          <div className="realty-kpi-value blue">3.00%</div>
          <div className="realty-kpi-sub">COFIX 신규 3.18% · 잔액 3.05%</div>
        </div>

        <div className="realty-kpi-card amber">
          <div className="realty-kpi-title">
            <span>💳</span> 가계 / 카드 연체율
          </div>
          <div className="realty-kpi-value amber">
            1.05% <span style={{ fontSize: 18, color: "var(--muted)" }}>/</span> 1.54%
          </div>
          <div className="realty-kpi-sub">카드대출 연체 3.35% · 리볼빙 12.1%</div>
        </div>

        <div className="realty-kpi-card emerald">
          <div className="realty-kpi-title">
            <span>🏠</span> 임차 점유 / 월세 비중
          </div>
          <div className="realty-kpi-value emerald">
            38.0% <span style={{ fontSize: 18, color: "var(--muted)" }}>/</span> 68.3%
          </div>
          <div className="realty-kpi-sub">서울 아파트 거래 월세 비중 52.4%</div>
        </div>

        <div className="realty-kpi-card red">
          <div className="realty-kpi-title">
            <span>⚠️</span> 고위험 청년가구 비중
          </div>
          <div className="realty-kpi-value red">34.9%</div>
          <div className="realty-kpi-sub">DSR 40% & 부채 100% 초과 가구</div>
        </div>
      </div>

      {/* 📌 카테고리 탭 네비게이션 */}
      <nav className="realty-tab-nav" aria-label="부동산 지표 카테고리">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`realty-tab-btn${activeTab === t.id ? " active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            <span className="realty-tab-badge">{t.badge}</span>
          </button>
        ))}
      </nav>

      {/* ============================================================== */}
      {/* 탭 1: 🗺️ 도면 & 대출 지도                                        */}
      {/* ============================================================== */}
      {showTab("map") && (
        <>
          <section className="realty-block-card">
            <div className="realty-block-header">
              <div className="realty-block-title-wrap">
                <span className="realty-block-icon">🗺️</span>
                <div>
                  <h3 className="realty-block-title">전국 3D 벡터 도면 & 지역별 가계대출</h3>
                  <p className="realty-block-desc">
                    17개 시도 및 서울·경기 주요 시군구 경계선. 지도 클릭 시 해당 권역의 예금은행 가계대출 규모가 연동됩니다.
                  </p>
                </div>
              </div>
              <span className="realty-block-badge">3D 인터랙티브 맵</span>
            </div>
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

          <section className="realty-block-card">
            <div className="realty-block-header">
              <div className="realty-block-title-wrap">
                <span className="realty-block-icon">🧭</span>
                <div>
                  <h3 className="realty-block-title">수도권 규제지역 및 정비권역 마인드맵</h3>
                  <p className="realty-block-desc">
                    투기과열지구·조정대상지역(주황) 및 대출 규제 강화 구역(빨강), 수도권정비권역(파랑) 관계도입니다.
                  </p>
                </div>
              </div>
              <span className="realty-block-badge">국토부 규제 현황</span>
            </div>
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
        </>
      )}

      {/* ============================================================== */}
      {/* 탭 2: 📉 금리 & 부채·연체                                        */}
      {/* ============================================================== */}
      {showTab("debt") && (
        <>
          <section className="realty-block-card">
            <div className="realty-block-header">
              <div className="realty-block-title-wrap">
                <span className="realty-block-icon">📊</span>
                <div>
                  <h3 className="realty-block-title">주요 대출 금리 및 기준금리 현황</h3>
                  <p className="realty-block-desc">
                    한국은행 기준금리, 예금은행 가중평균 대출금리(주담대/전세/가계), 신규·잔액 COFIX 금리 비교표입니다.
                  </p>
                </div>
              </div>
              <span className="realty-block-badge">공식 금융 공표</span>
            </div>
            <RealtyRatesPanel rows={loans.data?.rates} />
          </section>

          <section className="realty-block-card">
            <div className="realty-block-header">
              <div className="realty-block-title-wrap">
                <span className="realty-block-icon">⚠️</span>
                <div>
                  <h3 className="realty-block-title">가계·카드 연체, 리볼빙 및 부채 건전성</h3>
                  <p className="realty-block-desc">
                    한국은행 금융안정보고서 및 금융감독원 여전사 공시 기준 취약 계층, 자영업, 카드 부실 위험 지표입니다.
                  </p>
                </div>
              </div>
              <span className="realty-block-badge" style={{ color: "#ea580c" }}>건전성 모니터링</span>
            </div>
            <RealtyDistressPanel />
          </section>

          <section className="realty-block-card">
            <div className="realty-block-header">
              <div className="realty-block-title-wrap">
                <span className="realty-block-icon">📑</span>
                <div>
                  <h3 className="realty-block-title">유형별 부동산 매물 및 실거래 추이</h3>
                  <p className="realty-block-desc">아파트, 오피스텔, 다가구/빌라, 연립, 상가, 토지 등 국토부 실거래 신고 기준입니다.</p>
                </div>
              </div>
              <span className="realty-block-badge">실거래 트렌드</span>
            </div>
            <RealtyListingsPanel focusLabel={focusLabel} />
          </section>
        </>
      )}

      {/* ============================================================== */}
      {/* 탭 3: 🏛️ 자산 편중 & 세금                                        */}
      {/* ============================================================== */}
      {showTab("wealth") && (
        <>
          <section className="realty-block-card">
            <div className="realty-block-header">
              <div className="realty-block-title-wrap">
                <span className="realty-block-icon">🏛️</span>
                <div>
                  <h3 className="realty-block-title">고가주택 소재지 및 종부세 집중도</h3>
                  <p className="realty-block-desc">국세청 종합부동산세 지역별 고지 통계 기반 고가주택 자산 집중 현황입니다.</p>
                </div>
              </div>
              <span className="realty-block-badge">국세 통계</span>
            </div>
            <RealtyNtsPanel />
          </section>

          <section className="realty-block-card">
            <div className="realty-block-header">
              <div className="realty-block-title-wrap">
                <span className="realty-block-icon">💎</span>
                <div>
                  <h3 className="realty-block-title">상위 10% 부의 편중 및 자산 이동 채널</h3>
                  <p className="realty-block-desc">통계청 가계금융복지조사 기준 순자산 분위 점유율과 법인·증여·상속·신탁 채널입니다.</p>
                </div>
              </div>
              <span className="realty-block-badge">가계금융복지조사</span>
            </div>
            <RealtyWealthPanel />
          </section>

          <section className="realty-block-card">
            <div className="realty-block-header">
              <div className="realty-block-title-wrap">
                <span className="realty-block-icon">🏢</span>
                <div>
                  <h3 className="realty-block-title">법인 명의 주택 보유 통계</h3>
                  <p className="realty-block-desc">국세청 종부세 통계 기준 법인 소유 주택수 및 세액 비중입니다.</p>
                </div>
              </div>
              <span className="realty-block-badge">법인 보유분</span>
            </div>
            <RealtyCorpPanel />
          </section>

          <section className="realty-block-card">
            <div className="realty-block-header">
              <div className="realty-block-title-wrap">
                <span className="realty-block-icon">🎖️</span>
                <div>
                  <h3 className="realty-block-title">고위공직자 부동산 자산 분포 통계</h3>
                  <p className="realty-block-desc">공직윤리시스템 공개 기준 주요 공직자 관할 외 수도권 주택 보유 집계입니다.</p>
                </div>
              </div>
              <span className="realty-block-badge">인사혁신처 공시</span>
            </div>
            <RealtyOfficialsPanel />
          </section>
        </>
      )}

      {/* ============================================================== */}
      {/* 탭 4: 👥 인구 & 주거·공실                                        */}
      {/* ============================================================== */}
      {showTab("demographics") && (
        <>
          <section className="realty-block-card">
            <div className="realty-block-header">
              <div className="realty-block-title-wrap">
                <span className="realty-block-icon">👥</span>
                <div>
                  <h3 className="realty-block-title">인구 이동, 합계출산율 및 인구소멸 지역</h3>
                  <p className="realty-block-desc">국가데이터처 출산율 및 행정안전부 인구감소(89곳)·관심(18곳) 지역 공표 집계입니다.</p>
                </div>
              </div>
              <span className="realty-block-badge">인구 통계</span>
            </div>
            <RealtyPeoplePanel />
          </section>

          <section className="realty-block-card">
            <div className="realty-block-header">
              <div className="realty-block-title-wrap">
                <span className="realty-block-icon">🏘️</span>
                <div>
                  <h3 className="realty-block-title">공실률, 빈집 현황 및 전월세 점유율</h3>
                  <p className="realty-block-desc">한국부동산원 시도별 공실 현황 및 총조사 빈집 통계, 소득 대비 주거비 지표입니다.</p>
                </div>
              </div>
              <span className="realty-block-badge">주거 실태</span>
            </div>
            <RealtyStressPanel focusId={focusId ? realtyMetroForPlace(focusId) : null} npl={npl} />
          </section>
        </>
      )}

      {/* ============================================================== */}
      {/* 탭 5: 💡 팩트체크 & 뉴스                                        */}
      {/* ============================================================== */}
      {showTab("claims") && (
        <>
          <section className="realty-block-card">
            <div className="realty-block-header">
              <div className="realty-block-title-wrap">
                <span className="realty-block-icon">💡</span>
                <div>
                  <h3 className="realty-block-title">시중 통설 vs 공식 통계 팩트체크 (평균의 함정)</h3>
                  <p className="realty-block-desc">
                    부동산 시장에서 흔히 퍼지는 11대 속설을 통계청 및 한국은행 공식 확정 통계와 직접 대조합니다.
                  </p>
                </div>
              </div>
              <span className="realty-block-badge">팩트 검증</span>
            </div>
            <RealtyClaimsPanel
              items={displayNews.map((n) => ({
                id: n.id,
                title: n.title,
                url: n.url,
                publisher: n.publisher,
              }))}
            />
          </section>

          <section className="realty-block-card">
            <div className="realty-block-header">
              <div className="realty-block-title-wrap">
                <span className="realty-block-icon">📰</span>
                <div>
                  <h3 className="realty-block-title">부동산 주요 뉴스 피드</h3>
                  <p className="realty-block-desc">공식 언론사 부동산 주요 동향 (뉴스 본문은 저장하지 않습니다).</p>
                </div>
              </div>
              <span className="realty-block-badge">실시간 피드</span>
            </div>
            {news.isLoading && <p className="muted" style={{ margin: "4px 0 12px" }}>최신 피드 실시간 동기화 중…</p>}
            <div className="realty-news-grid">
              {displayNews.slice(0, 6).map((n) => (
                <a
                  key={n.id}
                  href={n.url}
                  target="_blank"
                  rel="noreferrer"
                  className="realty-news-card"
                >
                  <div>
                    <div className="realty-news-meta">
                      <span className="realty-news-pub">{n.publisher || "언론사 공표"}</span>
                      <span className="realty-news-time">{fmtAt(n.publishedAt)}</span>
                    </div>
                    <h4 className="realty-news-title">{n.title}</h4>
                    <p className="realty-news-sum">{n.summary}</p>
                  </div>
                  <div className="realty-news-link">
                    <span>기사 원문 보기</span>
                    <span>↗</span>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <section className="realty-block-card">
            <div className="realty-block-header">
              <div className="realty-block-title-wrap">
                <span className="realty-block-icon">🔗</span>
                <div>
                  <h3 className="realty-block-title">부동산·금융 공식 정보 포털 바로가기</h3>
                  <p className="realty-block-desc">정부 부처 및 공공기관의 공식 데이터 포털 링크입니다.</p>
                </div>
              </div>
              <span className="realty-block-badge">공식 링크</span>
            </div>
            <div className="starter-list">
              {REALTY_REF_LINKS.map((l) => (
                <a key={l.id} className="starter" href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
