# Finvesting — 현황 요약 (Claude 프로젝트 문서 복사본)

> **정본은 [README.md](./README.md)(진행 로그)와 [../verification/README.md](../verification/README.md)(검증 현황)이다.**
> 이 파일은 Claude 프로젝트("Finvesting")의 `claude/finvesting-status.md`를 그대로 복사한 요약본으로, Claude가 새 세션에서 맥락을 이어받기 위해 쓴다. 저장소에서 고치면 Claude 프로젝트 쪽도 같이 갱신한다(Claude 세션에서 요청).

---

# Finvesting — 개발 현황 (2026-09-05)

## 결정 사항
- **핵심 사용자:** 본인(근로자 투자자). 자체 로컬 사용 목적, 최적화 후 서비스화 검토.
- **MVP 1단계 범위:** 자산 현황·현금흐름·배분 가이드 + 투자 정보 자동 수집(국내·해외 뉴스, 시세, 거시지표, 재무제표) + 로컬 LLM 챗봇으로 투자 판단.
- **스택:** TypeScript 모노레포(Turborepo+pnpm). `apps/web`(Next.js 15 + tRPC API), `apps/mobile`(Expo), `apps/worker`(node-cron 수집기). `packages/db`(Drizzle, Postgres 16 + pgvector, Docker), `core`(순수 계산), `api`(tRPC), `ai`(LLM 프로바이더 추상화), `interop`(통장·카드 CSV 가져오기, 더존·위하고·세무사랑 내보내기 — 뼈대만).
- **DB:** 로컬 Docker Postgres. 맥북에만 실데이터, 필요 시 Supabase로 `DATABASE_URL`만 교체.
- **AI:** 맥북 Ollama `gemma4:12b`(대안 exaone3.5:7.8b) → 연말 맥스튜디오 M5 Ultra 고려 → 서비스화 시 DGX Spark(vLLM).
- **문서화:** `docs/` = SSOT. 폴더: progress / tech(decisions 포함) / logs / review / verification(AI별 검증 기록) / prompts(모델 무관 프롬프트). 한국어 정본 + 핵심 문서 `*.en.md`. 루트 README.md·README.en.md·AGENTS.md·CLAUDE.md·ChatGPT.md.
- **Git:** `main`(검증됨) ← `dev`(통합) ← `feat|fix|docs|chore/*`. AI는 기능 브랜치에서만 커밋, push·merge는 사용자 지시 시. 원격 https://github.com/kotaehyun/Finvesting
- **컨벤션 주의:** 상대 import에 `.js` 붙이지 않음(drizzle-kit CJS 로더 때문). 한글 Enter 전송은 `isComposing` 체크.

## 검증된 것 (2026-09-02, 맥북)
`pnpm install`, 타입체크 8패키지, core·interop 테스트, Docker Postgres + pgvector, 마이그레이션(16 테이블) + seed, worker 수집(RSS 국내3·해외5 피드, Upbit 4종목, Yahoo v3 4종목), `pnpm dev:web` 대시보드·뉴스 렌더, `/chat` Ollama 질의 응답.
**미검증:** ECOS·FRED·DART·EDGAR(키/대상 없음), Expo 모바일, 윈도우 환경. fx 포트폴리오 테스트는 2026-09-02 Grok이 9/9 통과 확인. 2026-09-05 리뷰 반영분(`/`·`/chat` 브라우저)은 Docker 꺼져 있어 미재확인.

## 경로
- 맥북: `/Users/th/개발/workspace/Finvesting` (Node 26 설치돼 있음 — `.nvmrc`는 22, 맞출 것)
- 윈도우: 미정

## 다음 할 일
1. ECOS·FRED·DART 키 발급 → 거시지표·재무제표 수집 검증
2. Expo 모바일 기동 확인, 윈도우 경로 정하고 clone
3. Financial Timeline
4. 뉴스 임베딩 RAG

## 2026-09-14 추가
- Yahoo 펀더멘털 표 `/fundamentals`, 프로필 10 투자성향·조언 (`invest_style`, 09 다음). 관련 화면 링크 줄. 브랜치 `feat/yahoo-fundamentals`, 미커밋.
