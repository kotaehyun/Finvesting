# Finvesting

> 🇺🇸 English: [README.en.md](./README.en.md)

**개인 자산·투자·돈의 흐름을 한곳에서 파악하고, 수집한 시장 정보를 바탕으로 로컬 LLM 챗봇과 대화하며 투자 판단을 돕는 개인용 금융 업무 터미널.**

계좌·카드·증권·코인 잔액과 거래를 모아 순자산과 월 현금흐름(수입 대비 소비율·저축률)을 보여주고, 소득·자산·비상금·위험 성향에 따라 예적금/투자/소비를 어떻게 나눌지 가이드합니다. 뉴스·시세·물가·금리·환율은 수집기가 자동으로 모으고, 그 데이터와 본인 재무 상황을 컨텍스트로 챗봇에 질문해 투자 판단을 내립니다. 금융 데이터는 외부로 나가지 않고 로컬에서 처리합니다.

- **현재 단계**: 자체 로컬 사용 목적의 MVP 1단계 (스캐폴딩 완료, 첫 실행 검증 전)
- **장기**: 최적화가 끝나면 서비스화 — 프리랜서·소규모 사업자용 세무·회계·노무 모듈로 확장
- **원본 기획**: `Finvesting_프로젝트_소개서.pdf` (Concept Brief v0.1) → 정리본 [docs/tech/overview.md](./docs/tech/overview.md)

---

## 폴더 구조

```
Finvesting/
├─ apps/                      실행되는 애플리케이션
│  ├─ web/                    Next.js 15 — 웹 대시보드(/), 챗봇(/chat), tRPC API(/api/trpc)
│  ├─ mobile/                 Expo(React Native) — 모바일 대시보드, 웹과 같은 API 사용
│  └─ worker/                 수집기 — node-cron으로 뉴스 RSS·시세·거시지표를 주기 수집해 DB 저장
│     └─ src/sources/         소스별 어댑터 (rss, upbit, ecos, fred, yahoo, dart, edgar)
├─ packages/                  앱들이 공유하는 라이브러리
│  ├─ db/                     Drizzle ORM 스키마·마이그레이션 (PostgreSQL 16 + pgvector)
│  │  ├─ src/schema/          accounts, transactions, investments, market, profile, fundamentals
│  │  └─ seed/                확장(pgvector) 설치, 기본 사용자 SQL
│  ├─ core/                   순수 도메인 로직 — 현금흐름 요약, 배분 가이드, 포지션·손익 계산
│  ├─ api/                    tRPC 라우터 — accounts, dashboard, market, chat
│  ├─ interop/                외부 파일 변환 — 통장·카드·증권 CSV/XLSX 가져오기, 더존·위하고·세무사랑 양식 내보내기
│  └─ ai/                     LLM 프로바이더 추상화 (Ollama → 맥스튜디오 → DGX Spark/vLLM), 프롬프트
├─ docs/                      프로젝트 문서 — 단일 진실 원천(SSOT)
│  ├─ progress/               진행 로그(최신순), 로드맵
│  ├─ tech/                   기술 문서 — 개요, 아키텍처, 데이터 모델, 수집 소스, AI, 환경 설정, ADR
│  ├─ logs/                   오류·실행 기록과 해결법
│  ├─ review/                 코드 리뷰 기록
│  ├─ verification/           AI 모델별 검증 기록 — 무엇이 실제 실행으로 확인됐고 무엇이 아직인지
│  └─ prompts/                AI 모델 공통 프롬프트 (세션 시작·작업별·종료)
├─ AGENTS.md / CLAUDE.md / ChatGPT.md   AI 도구 공통 지침 (docs를 가리킴)
├─ README.en.md               영문 README (핵심 문서는 *.en.md 로 영문 미러 유지)
├─ docker-compose.yml         로컬 PostgreSQL(pgvector)
├─ turbo.json, pnpm-workspace.yaml, tsconfig.base.json
└─ .env.example               환경변수 목록 (복사해 .env로)
```

### 데이터 흐름

```
외부 소스 (RSS · Upbit · ECOS · KIS · …)
   │ apps/worker (스케줄 수집)
   ▼
PostgreSQL ── market_news · market_quotes · macro_indicators · economic_events
           └─ accounts · transactions · trades · financial_profiles
   │ packages/db
   ▼
packages/api (tRPC) ── packages/core (계산) ── packages/ai (LLM)
   ├─ apps/web     브라우저
   └─ apps/mobile  Expo Go
```

---

## 문서 위치 안내

| 알고 싶은 것 | 문서 |
|---|---|
| 지금 어디까지 했고 다음에 뭘 하나 | [docs/progress/README.md](./docs/progress/README.md) |
| 단계별 계획·백로그 | [docs/progress/roadmap.md](./docs/progress/roadmap.md) |
| 제품이 뭔지, 누구를 위한 건지 | [docs/tech/overview.md](./docs/tech/overview.md) |
| 구조·스택·패키지 의존 규칙 | [docs/tech/architecture.md](./docs/tech/architecture.md) |
| 테이블이 무슨 뜻인지 | [docs/tech/data-model.md](./docs/tech/data-model.md) |
| 어떤 데이터를 어디서 어떻게 수집하나 | [docs/tech/data-sources.md](./docs/tech/data-sources.md) |
| 챗봇·LLM·RAG 설계 | [docs/tech/ai.md](./docs/tech/ai.md) |
| 통장·카드 파일 가져오기, 회계 프로그램 내보내기 | [docs/tech/interop.md](./docs/tech/interop.md) |
| 맥/윈도우 환경 설정과 실행 명령 | [docs/tech/setup.md](./docs/tech/setup.md) |
| 왜 이렇게 결정했나 | [docs/tech/decisions/](./docs/tech/decisions/README.md) |
| 이 오류 전에도 났었나 | [docs/logs/](./docs/logs/README.md) |
| 코드 리뷰 결과 | [docs/review/](./docs/review/README.md) |
| 어떤 AI가 무엇을 실제로 검증했나, 아직 검증 안 된 것 | [docs/verification/](./docs/verification/README.md) |
| AI에게 뭐라고 시작 프롬프트를 주나 | [docs/prompts/](./docs/prompts/README.md) |
| 코딩 규칙 | [docs/prompts/conventions.md](./docs/prompts/conventions.md) |

---

## AI 도구로 작업하기

어떤 모델(Claude, GPT/Codex, Gemini, Cursor, Copilot, 로컬 LLM)을 쓰든 같은 방식으로 일합니다.

1. 세션 시작: [docs/prompts/00-bootstrap.md](./docs/prompts/00-bootstrap.md)를 첫 메시지로 붙여 넣는다.
2. 작업 종류에 맞는 템플릿(`10-feature`, `11-bugfix`, `12-schema-change`, `13-data-source`, `14-ai-chatbot`, `20-code-review`)을 이어 붙인다.
3. 세션 끝: [docs/prompts/90-session-end.md](./docs/prompts/90-session-end.md)로 문서 갱신과 인수인계 요약을 시킨다.

문서에 없는 것은 추측하지 않고, 작업 후엔 반드시 `docs/progress`를 갱신하는 것이 규칙입니다. 상세는 [docs/README.md](./docs/README.md).

---

## 시작하기

```bash
corepack enable && corepack prepare pnpm@9.15.0 --activate
pnpm install && cp .env.example .env
pnpm db:up                         # Docker Postgres
pnpm dev:web                       # http://localhost:3000
```

DB 초기화, 수집기, 모바일, 윈도우 주의사항 등 전체 절차는 [docs/tech/setup.md](./docs/tech/setup.md).

## 개발 환경
- 맥북: `/Users/th/개발/workspace/Finvesting` (주 작업 기기, 실데이터 보관)
- 윈도우: 미정 — 코드는 Git으로 동기화, DB 데이터는 기기별 로컬
- 원격 저장소: https://github.com/kotaehyun/Finvesting (`main`)
- Node 22, pnpm 9, Docker, Ollama

## 언어 정책
한국어 `*.md`가 정본. 핵심 문서(README, docs 안내, 개요, 아키텍처, 부트스트랩 프롬프트, AGENTS)는 옆에 `*.en.md` 영문 미러를 둔다. 한국어 문서를 고치면 같은 세션에서 `.en.md`도 갱신한다. `.en.md`가 없는 문서는 당분간 한국어만.
