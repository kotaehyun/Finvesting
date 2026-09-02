# docs — 프로젝트 문서 (SSOT)

> 🇺🇸 English: [README.en.md](./README.en.md)

사람과 AI 도구(Claude, ChatGPT/Codex, Cursor, Copilot 등) 모두가 참조하는 — 루트의 `AGENTS.md`(Cursor·Codex·Copilot), `CLAUDE.md`, `ChatGPT.md`가 모두 이 폴더를 가리킨다. **단일 진실 원천**. 코드와 문서가 어긋나면 반드시 맞춘다.

## 폴더

| 폴더 | 내용 | 갱신 시점 |
|---|---|---|
| [`progress/`](./progress/README.md) | 진행 로그(최신순), [로드맵](./progress/roadmap.md) | **매 작업 세션** |
| [`tech/`](./tech/README.md) | 기술 문서 — 제품 개요, 아키텍처, 데이터 모델, 수집 소스, AI, 환경 설정, 결정 기록(ADR) | 구조·스키마·소스·AI·설정 변경 시 |
| [`logs/`](./logs/README.md) | 실행 로그, 오류 기록과 해결 방법 | 오류를 만나거나 해결했을 때 |
| [`review/`](./review/README.md) | 코드 리뷰 기록 — 발견한 문제, 개선 제안, 반영 여부 | 리뷰할 때 |
| [`verification/`](./verification/README.md) | AI 모델별 검증 기록 — 누가 무엇을 실제로 실행해 확인했는지, 아직 아무도 확인 안 한 것 | **매 작업 세션** (검증 현황 표 갱신) |
| [`prompts/`](./prompts/README.md) | AI 모델 공통 프롬프트 — 어떤 모델을 쓰든 세션 시작·작업별·종료 프롬프트를 여기서 복사 | 프롬프트가 부족하거나 모델이 반복해 틀릴 때 |

## AI 도구 작업 규칙

0. 새 세션은 `prompts/00-bootstrap.md`를 붙여 넣어 시작하고, `prompts/90-session-end.md`로 끝낸다.

1. 작업 시작 전 `progress/README.md`, `tech/overview.md`, `tech/architecture.md`를 읽는다. 건드리는 영역의 tech 문서도 읽는다.
2. 문서에 없는 것은 **추측하지 말고** 코드를 확인하거나 사용자에게 묻는다.
3. 작업 후 반드시 `progress/README.md`에 날짜·한 일·다음 할 일을 추가한다.
4. 구조/스키마/소스/AI/설정을 바꿨으면 해당 `tech/` 문서를 갱신하고, 중요한 기술 선택은 `tech/decisions/`에 ADR 한 장 추가.
5. 오류를 만나면 `logs/`에, 코드를 리뷰하면 `review/`에 기록한다.
6. 세션마다 `verification/YYYY-MM-DD-<모델>.md`에 **실제로 실행해 확인한 것**과 **못 한 것**을 남기고, `verification/README.md`의 검증 현황 표를 갱신한다. 실행 안 해본 것을 검증됐다고 쓰지 않는다.
7. 문서는 한국어, 코드 식별자는 영어 그대로. 핵심 문서는 `*.en.md` 영문 미러가 있으니 한국어를 고치면 같은 세션에서 영문도 갱신한다.
