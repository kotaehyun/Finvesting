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
