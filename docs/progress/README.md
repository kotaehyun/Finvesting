# 진행 로그

최신이 위. 형식: 날짜 / 한 일 / 다음 할 일 / 막힌 것.

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
