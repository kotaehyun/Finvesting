# 진행 로그

최신이 위. 형식: 날짜 / 한 일 / 다음 할 일 / 막힌 것.

## 2026-09-02 (5) — Cursor 리뷰 검토 + 보류 항목 처리 (Claude)
**한 일**
- Cursor 변경분 검토: 수정 내용 타당, 7개 패키지 typecheck 재확인 통과
- 리뷰 #18 모바일 env: `apps/mobile/app.config.ts`에서 루트 `.env`의 `EXPO_PUBLIC_*` 로드 (app.json은 유지, extra.apiUrl 추가)
- 리뷰 #19 해외 포지션: `core/portfolio.ts`에 `fxRate` 가중평균(`avgFxRate`)·원화 실현/평가손익(`realizedPnlKrw`, `pnlKrw`) 추가 + 테스트
- 리뷰 #21 eslint 설정 없는 `lint` 스크립트 제거 (필요 시 eslint 도입 후 복구)
- 리뷰 #22 worker 기동 시 즉시 1회 수집 (`WORKER_RUN_ON_START`, 기본 true)
- `pnpm-lock.yaml` 커밋, `*.tsbuildinfo` gitignore

**다음 할 일** — (3)과 동일. 최우선: `pnpm db:generate/migrate` → seed → `pnpm dev:worker`로 수집 확인
**막힌 것**
- yahoo `today`를 KST로 잡으면 미국 장 마감 데이터가 KST 다음날 날짜로 저장될 수 있음 — 실제 거래일(`regularMarketTime`) 기준으로 바꿀지 첫 실행 후 결정
- 증권사 수수료가 원화로 청구되는 경우 `TradeLike.fee`는 종목 통화로 환산해 넣어야 함 (CSV 파서에서 처리)

## 2026-09-02 (4) — mobile tsconfig expo/tsconfig.base 미해결
**한 일**
- `apps/mobile/tsconfig.json`이 `expo/tsconfig.base`를 확장해 IDE에서 `File 'expo/tsconfig.base' not found` 발생. pnpm은 expo를 `apps/mobile/node_modules`에만 두므로 루트 IDE가 못 찾음
- `../../tsconfig.base.json` + `jsx: react-native`로 교체. `pnpm --filter @finvesting/mobile typecheck` 통과

**다음 할 일** — (3)과 동일
**막힌 것** — (3)과 동일

## 2026-09-02 (3) — 폴더별 오류 점검·수정
**한 일**
- 전 폴더 정적 리뷰 (`docs/review/2026-09-02-scaffold.md`)
- 대시보드 월 말일(`YYYY-MM-31`) Postgres 오류 + KST 월 기준 수정
- pnpm 격리: api에 `drizzle-orm`, worker/db/api/ai에 `@types/node`
- 루트 `.env` 로딩: worker `lib/env.ts`, drizzle.config, Next는 `next.config.ts`에서 루트 `.env` 직접 파싱
- `instruments (symbol, market)` unique, watchlist `user_id` FK
- upbit가 `ensureInstrument` 사용·마켓별 실패 격리, yahoo 시세일 KST, DART/EDGAR 입력 방어
- core·interop vitest 추가, 범용 통장 파서 헤더 탐지 수정
- `.nvmrc`, `OLLAMA_EMBED_MODEL`, turbo typecheck `^typecheck`, 미사용 core 의존 제거
- `pnpm install` 완료, `pnpm typecheck` 8패키지 통과, core 7·interop 3 테스트 통과

**다음 할 일**
1. `pnpm db:generate/migrate` 후 seed 적용, worker `run:once`
2. `pnpm dev:web` 기동 확인
3. 모바일 `.env` 경로(`EXPO_PUBLIC_API_URL`) 결정
4. 계좌 등록 + 거래 CSV 업로드 UI
5. Ollama 연결 후 /chat 동작 확인

**막힌 것**
- 모바일은 Expo가 `apps/mobile/.env`만 읽음 — 루트 `.env`의 `EXPO_PUBLIC_API_URL`은 미적용
- 해외 포지션 `fxRate`는 스키마에만 있고 `core/portfolio` 계산에 미반영
- yahoo-finance2@2.14.2 deprecated 경고. 첫 `run:once`에서 API 시그니처 확인 필요

## 2026-09-02 (2) — 문서 구조 정리 + 해외 데이터 수집 추가
**한 일**
- docs를 progress · tech · logs · review · prompts 5개 폴더로 재구성, 루트 README를 프로젝트 지도로 재작성
- docs/prompts: 모델 무관 공통 프롬프트(부트스트랩, 작업별 템플릿, 세션 종료, 컨벤션)
- 수집 범위를 국내+해외로 확장: FRED 어댑터(연준금리·CPI·국채 2y/10y·달러지수·실업률·VIX), 해외 뉴스 RSS(CNBC·MarketWatch·Fed·ECB), 업비트 SOL/XRP 추가
- 결정: `macro_indicators.code`는 국가 접두어(`US_*`)로 구분, 접두어 없음 = 한국
- 재무제표·펀더멘털 수집 추가: 스키마 `financial_statements`, `instrument_fundamentals`, `instrument_identifiers`; 어댑터 DART(한국, 공식), SEC EDGAR(미국, 공식), Yahoo Finance(미국 시세·지표, 비공식 라이브러리)
- `packages/interop` 신설: 통장 CSV/XLSX 범용 파서, 세무사 전달용 장부 CSV 내보내기 초안, 더존·위하고·세무사랑 연동 계획(interop.md)
- 사이트별 방침 정리(data-sources.md): Finviz는 개인용 한정, TradingView는 공식 위젯 임베드만, Investing.com은 크롤링 비권장

**다음 할 일** — 아래 첫 항목과 동일 (첫 실행 검증이 최우선)
**막힌 것** — FRED·ECOS·DART 키 발급 필요, 해외 RSS URL은 변경될 수 있어 첫 실행 때 확인. DART 계정명 매핑·yahoo-finance2 API 시그니처·SEC 태그는 실제 응답으로 검증 필요(코드에 TODO). 수집 대상 종목은 아직 환경변수(`*_TARGETS`)로 수동 지정

## 2026-09-02 — 프로젝트 스캐폴딩
**한 일**
- 기획서(Concept Brief v0.1) 기준으로 핵심 사용자(본인, 근로자 투자자)와 MVP 1단계 범위 확정
- 기술 스택 결정 (ADR 0001~0005)
- 모노레포 뼈대 생성: apps/web·mobile·worker, packages/db·core·api·ai
- DB 스키마 초안: users, financial_profiles, accounts, transactions, instruments, trades, investment_incomes, research_notes, watchlist, market_quotes, macro_indicators, market_news(pgvector), economic_events
- core: 현금흐름 요약, 월 배분 가이드(50/30/20 + 비상금·위험성향 조정), 포지션 계산(평균단가법)
- worker: RSS 뉴스, 업비트 시세, ECOS 거시지표 어댑터 + cron 스케줄
- api: accounts, dashboard.overview, market, chat 라우터
- web: 대시보드(/), 챗봇(/chat) 최소 UI
- mobile: Expo 대시보드 최소 UI
- docs/ 구조(progress · tech · logs · review · prompts)와 README, AGENTS.md/CLAUDE.md
- docs/prompts: 모델 무관 공통 프롬프트(부트스트랩, 기능/버그/스키마/수집/AI/리뷰 템플릿, 세션 종료, 컨벤션)

**아직 안 한 것 (의존성 설치·실행 전)**
- `pnpm install` 및 첫 실행 검증 — 패키지 버전 충돌 가능성 있음
- 마이그레이션 생성·적용
- 실제 계좌·거래 데이터 입력 UI 또는 CSV 업로드

**다음 할 일**
1. 맥에서 `pnpm install` → 타입체크 → `pnpm dev:web` 기동 확인
2. `pnpm db:generate/migrate` 후 seed 적용, worker `run:once`로 뉴스·시세 수집 확인
3. 계좌 등록 + 거래 CSV 업로드(은행·카드 내보내기 파서) 구현
4. financial_profiles 입력 화면 → 배분 가이드 표시 확인
5. Ollama 연결 후 /chat 동작 확인

**막힌 것 / 미결정**
- 윈도우 작업 경로 미정
- KIS Open API 키 발급 여부
- 두 기기 DB 데이터 동기화 방식 (현재: 맥북에만 실데이터)
