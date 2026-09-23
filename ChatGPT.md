# ChatGPT.md — ChatGPT / Codex용 지침

ChatGPT(웹·앱)나 Codex로 이 저장소를 작업할 때 적용한다. 내용은 `AGENTS.md`와 동일하며, ChatGPT 웹처럼 저장소를 직접 못 읽는 환경에서는 아래 순서로 컨텍스트를 붙여 넣는다.

## ChatGPT 웹/앱에서 시작하는 법
1. `docs/prompts/00-bootstrap.md` 전체를 첫 메시지로 붙여 넣는다.
2. 이어서 `docs/progress/README.md` 상단(최신 항목)과 `docs/verification/README.md`의 검증 현황 표를 붙여 넣는다.
3. 작업할 파일의 내용을 붙여 넣고, 작업 종류에 맞는 `docs/prompts/1x-*.md` 템플릿을 채워 요청한다.
4. 결과 코드를 저장소에 반영한 뒤, `docs/prompts/90-session-end.md`를 붙여 넣어 문서 갱신 내용을 받아 적용한다.
5. 검증 기록은 `docs/verification/YYYY-MM-DD-chatgpt.md`. ChatGPT 웹은 코드를 실행하지 못하므로 **"정적 검토"로만 기록**하고, 실행 검증은 맥/윈도우에서 사람이나 Codex가 한 것만 ✅로 올린다.

## 공통 규칙

1. 세션은 `docs/prompts/00-bootstrap.md`의 규칙으로 시작하고 `docs/prompts/90-session-end.md`로 끝낸다. 작업 전 `docs/README.md`와 `docs/progress/README.md`를 읽는다. 문서가 SSOT다.
2. 문서에 없는 사실은 추측하지 않는다. 코드를 확인하거나 사용자에게 묻는다.
3. 작업 후 `docs/progress/README.md`에 기록하고, 변경한 영역의 `docs/tech/` 문서를 갱신한다. 기술 결정은 `docs/tech/decisions/`에 ADR 추가.
4. 오류를 만나면 `docs/logs/`를 먼저 검색하고, 해결하면 기록한다. 코드 리뷰는 `docs/review/`에 남긴다.
5. 세션 종료 시 `docs/verification/YYYY-MM-DD-<모델>.md`에 실제 실행해 확인한 것/못 한 것을 남기고 현황 표를 갱신한다. `docs/verification/README.md`의 ❌ 항목은 아무도 검증 안 한 것이니 됐다고 가정하지 않는다.
6. 패키지 의존 규칙(`docs/tech/architecture.md`)을 지킨다: core는 순수, web/mobile은 DB 직접 접근 금지.
7. 금액은 `numeric` 문자열 ↔ `Number()` 변환. 뉴스 본문은 저장하지 않는다.
8. 언어: 문서·주석은 한국어, 식별자는 영어. 패키지 매니저는 pnpm만.
9. 세무 화면은 법령 문언만 보수적으로 읽는다. 애매하면 근로소득(소득세법 제20조·제129조 제1항 제1호). 절세 특강·유튜브 해석을 넣지 않는다. ADR 0040.
10. 브랜치: `main`·`dev`에 직접 커밋하지 않는다. `feat|fix|docs|chore/<name>`에서만 작업하고, push·merge는 사용자가 말할 때만 한다(`docs/tech/git-workflow.md`).
11. 데이터는 공식 출처에서 가져온 것만 쓴다. 통계·수치·금리·비율·건수를 AI가 만들어 넣지 않는다. 출처가 없거나 불확실하면 칸을 비우고, 문서·코드에 "데이터 없음"으로 표시한다. 실패·부재는 `{status: empty|stale|unavailable}`로 응답한다. 샘플 데이터는 `DEMO_MODE=true`에서만, 화면에 「샘플」 배지.

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
11. Use only data from official sources. Never invent statistics, figures, rates, ratios, or counts. If a source is missing or uncertain, leave the field empty and mark "no data" in docs and code. Failures and missing data respond with `{status: empty|stale|unavailable}`. Sample data only when `DEMO_MODE=true`, with a 「샘플」 badge on screen.
