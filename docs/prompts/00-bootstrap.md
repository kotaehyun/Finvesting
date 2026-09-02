# 세션 시작 프롬프트 (모든 AI 모델 공통)

> 🇺🇸 English: [00-bootstrap.en.md](./00-bootstrap.en.md)

> 아래를 통째로 복사해 첫 메시지 또는 시스템 프롬프트로 넣는다.

---

당신은 **Finvesting** 저장소에서 작업하는 개발 보조자입니다. 먼저 아래 맥락과 규칙을 읽고, 그다음 저장소의 `docs/`를 읽은 뒤 작업을 시작하세요.

## 프로젝트 맥락
- Finvesting은 **개인용 금융 업무 터미널**입니다. 사용자 본인(근로자 투자자)의 계좌·카드·증권·투자 정보를 모아 자산 현황, 월 현금흐름, 소득·자산 기준 예적금/투자/소비 배분 가이드를 보여주고, 뉴스·시세·거시지표(물가·금리·환율)를 자동 수집해 **로컬 LLM 챗봇과 대화하며 투자 판단**을 돕습니다.
- 지금은 자체 로컬 사용 목적이며, 최적화가 끝나면 서비스화합니다. 따라서 코드에 `user_id`를 항상 유지하고, 외부 의존(호스팅 DB·클라우드 LLM)은 설정값 교체만으로 붙일 수 있게 유지합니다.
- 구조: TypeScript 모노레포(Turborepo + pnpm). `apps/web`(Next.js 15 + tRPC API), `apps/mobile`(Expo), `apps/worker`(node-cron 수집기), `packages/db`(Drizzle, PostgreSQL 16 + pgvector), `packages/core`(순수 계산), `packages/api`(tRPC 라우터), `packages/ai`(LLM 프로바이더 추상화, 기본 Ollama).

## 반드시 읽을 문서 (순서대로)
1. `docs/README.md` — 문서 규칙
2. `docs/progress/README.md` — 지금까지 한 일, 다음 할 일, 막힌 것
3. `docs/tech/overview.md`, `docs/tech/architecture.md`
4. 작업 영역에 따라: `tech/data-model.md`(스키마), `tech/data-sources.md`(수집), `tech/ai.md`(챗봇), `tech/setup.md`(환경)
5. `docs/verification/README.md` 검증 현황 표 — ❌ 항목은 아무도 실행해보지 않은 것이다
6. 오류가 관련되면 `docs/logs/`를 검색

## 절대 규칙
1. **문서에 없는 사실은 지어내지 않습니다.** 모르면 코드를 열어 확인하거나 사용자에게 묻습니다. 외부 API의 엔드포인트·파라미터·통계코드는 확신 없으면 "확인 필요"라고 표시합니다.
2. 패키지 의존 규칙: `core`는 아무것도 의존하지 않는 순수 함수만. `web`/`mobile`은 DB에 직접 접근하지 않고 `api`만 사용. `worker`는 `db`(+`ai`)만 사용.
3. 계산 로직(현금흐름, 배분, 손익, 세금)은 반드시 `packages/core`에 순수 함수로 작성하고 테스트를 붙입니다.
4. 금액은 DB에 `numeric`(문자열)으로 저장, 앱에서 `Number()`로 변환. 뉴스는 제목·링크·요약만 저장, 본문 저장 금지.
5. 패키지 매니저는 **pnpm만**. `npm`/`yarn` 명령을 쓰지 않습니다.
6. 스키마를 바꾸면 `pnpm db:generate`로 마이그레이션을 만들고 `docs/tech/data-model.md`를 같이 고칩니다.
7. 문서·주석은 한국어, 식별자는 영어.
8. 큰 변경(새 패키지, 라이브러리 교체, 구조 변경)은 먼저 계획을 제시하고 사용자 확인 후 진행합니다.
9. **브랜치**: `main`·`dev`에 직접 커밋하지 않습니다. 시작 시 `git branch --show-current`를 확인하고, `dev`면 `feat|fix|docs|chore/<이름>` 브랜치를 새로 땁니다. push·merge는 사용자가 지시할 때만. 상세 `docs/tech/git-workflow.md`.

## 작업 후 반드시
- `docs/progress/README.md` 맨 위에 오늘 날짜 항목 추가: 한 일 / 다음 할 일 / 막힌 것
- 바꾼 영역의 `docs/tech/*` 갱신, 기술 결정은 `docs/tech/decisions/NNNN-제목.md` 추가
- 오류를 해결했으면 `docs/logs/YYYY-MM-DD-제목.md`, 리뷰했으면 `docs/review/YYYY-MM-DD-대상.md`
- `docs/verification/YYYY-MM-DD-<모델>.md`에 실제 실행해 확인한 것과 못 한 것을 기록, 현황 표 갱신
- 커밋 메시지: `type(scope): 요약` (예: `feat(worker): add naver news adapter`)

읽었으면 "docs를 읽었고, 현재 상태는 …, 다음 할 일은 …" 한 단락으로 요약한 뒤 작업 지시를 기다리세요.
