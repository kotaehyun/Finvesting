# AGENTS.md — AI 도구 공통 지침 (Cursor, Codex, Copilot, Claude 등)

1. 세션은 `docs/prompts/00-bootstrap.md`의 규칙으로 시작하고 `docs/prompts/90-session-end.md`로 끝낸다. 작업 전 `docs/README.md`와 `docs/progress/README.md`를 읽는다. 문서가 SSOT다.
2. 문서에 없는 사실은 추측하지 않는다. 코드를 확인하거나 사용자에게 묻는다.
3. 작업 후 `docs/progress/README.md`에 기록하고, 변경한 영역의 `docs/tech/` 문서를 갱신한다. 기술 결정은 `docs/tech/decisions/`에 ADR 추가.
4. 오류를 만나면 `docs/logs/`를 먼저 검색하고, 해결하면 기록한다. 코드 리뷰는 `docs/review/`에 남긴다.
5. 세션 종료 시 `docs/verification/YYYY-MM-DD-<모델>.md`에 실제 실행해 확인한 것/못 한 것을 남기고 현황 표를 갱신한다. `docs/verification/README.md`의 ❌ 항목은 아무도 검증 안 한 것이니 됐다고 가정하지 않는다.
6. 패키지 의존 규칙(`docs/tech/architecture.md`)을 지킨다: core는 순수, web/mobile은 DB 직접 접근 금지.
7. 금액은 `numeric` 문자열 ↔ `Number()` 변환. 뉴스 본문은 저장하지 않는다.
8. 언어: 문서·주석은 한국어, 식별자는 영어. 패키지 매니저는 pnpm만.
9. 세무 화면은 법령 문언만 보수적으로 읽는다. 애매하면 근로소득(소득세법 제20조·제129조 제1항 제1호). 절세 특강·유튜브 해석을 넣지 않는다. ADR 0040.

---

## English (same rules)

1. Start a session with the rules in `docs/prompts/00-bootstrap.md` (`00-bootstrap.en.md`) and end it with `docs/prompts/90-session-end.md`. Read `docs/README.md` and `docs/progress/README.md` first. The docs are the single source of truth.
2. Never guess facts the docs don't state — check the code or ask the user.
3. After work, record in `docs/progress/README.md` and update the `docs/tech/` doc for the area you changed. Add an ADR under `docs/tech/decisions/` for technical decisions.
4. On an error, search `docs/logs/` first and record the fix. Leave code reviews in `docs/review/`.
5. At session end, write `docs/verification/YYYY-MM-DD-<model>.md` listing what was actually run and confirmed vs. not, and update the status table. ❌ rows in `docs/verification/README.md` are unverified — do not assume they work.
6. Follow the package dependency rules in `docs/tech/architecture.md`: `core` is pure; `web`/`mobile` never access the DB directly.
7. Money: `numeric` string ↔ `Number()`. Never store full news article bodies.
8. Language: docs and comments in Korean (core docs mirrored as `*.en.md`), identifiers in English. Package manager: pnpm only.
9. Tax screens read statute text conservatively. If the employment relationship is unclear, treat it as earned income (ITA Art. 20 / 129(1)(1)). Do not put YouTube tax-saving tips on screen. ADR 0040.
10. Branches: never commit directly to `main` or `dev`. Work only on `feat|fix|docs|chore/<name>` branches; push and merge only when the user says so (`docs/tech/git-workflow.md`).
