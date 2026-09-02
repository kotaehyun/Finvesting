# 진행 로그

최신이 위. 형식: 날짜 / 한 일 / 다음 할 일 / 막힌 것.

## 2026-09-02 (2) — 문서 구조 정리 + 해외 데이터 수집 추가
**한 일**
- docs를 progress · tech · logs · review · prompts 5개 폴더로 재구성, 루트 README를 프로젝트 지도로 재작성
- docs/prompts: 모델 무관 공통 프롬프트(부트스트랩, 작업별 템플릿, 세션 종료, 컨벤션)
- 수집 범위를 국내+해외로 확장: FRED 어댑터(연준금리·CPI·국채 2y/10y·달러지수·실업률·VIX), 해외 뉴스 RSS(CNBC·MarketWatch·Fed·ECB), 업비트 SOL/XRP 추가
- 결정: `macro_indicators.code`는 국가 접두어(`US_*`)로 구분, 접두어 없음 = 한국

**다음 할 일** — 아래 첫 항목과 동일 (첫 실행 검증이 최우선)
**막힌 것** — FRED·ECOS 키 발급 필요, 해외 RSS URL은 변경될 수 있어 첫 실행 때 확인

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
