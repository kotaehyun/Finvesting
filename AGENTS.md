# AGENTS.md — AI 도구 공통 지침 (Cursor, Codex, Copilot, Claude 등)

1. 작업 전 `docs/README.md`와 `docs/70-progress/README.md`를 읽는다. 문서가 SSOT다.
2. 문서에 없는 사실은 추측하지 않는다. 코드를 확인하거나 사용자에게 묻는다.
3. 작업 후 `docs/70-progress/README.md`에 기록하고, 변경한 영역의 문서(20-data-model, 30-data-sources, 40-ai 등)를 갱신한다. 기술 결정은 `docs/60-decisions/`에 ADR 추가.
4. 패키지 의존 규칙(`docs/10-architecture`)을 지킨다: core는 순수, web/mobile은 DB 직접 접근 금지.
5. 금액은 `numeric` 문자열 ↔ `Number()` 변환. 뉴스 본문은 저장하지 않는다.
6. 언어: 문서·주석은 한국어, 식별자는 영어. 패키지 매니저는 pnpm만.
