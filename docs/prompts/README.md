# prompts — AI 모델 공통 프롬프트

어떤 AI 모델/도구(Claude, GPT/Codex, Gemini, Cursor, Copilot, 로컬 LLM…)를 쓰든 **여기 프롬프트를 그대로 붙여 넣고 시작**한다. 모델이 바뀌어도 같은 규칙·같은 맥락으로 개발이 이어지게 하는 것이 목적.

## 사용법
1. 새 세션 시작: [`00-bootstrap.md`](./00-bootstrap.md) 전체를 첫 메시지(또는 시스템 프롬프트)로 넣는다.
2. 작업 종류에 맞는 템플릿을 골라 빈칸을 채워 이어서 넣는다.
3. 세션 끝: [`90-session-end.md`](./90-session-end.md)를 넣어 문서 갱신을 시킨다.
4. 프롬프트가 잘 안 먹히거나 모델이 반복해서 틀리는 부분이 있으면 **해당 프롬프트를 고치고** 아래 변경 이력에 남긴다.

## 목록
| 파일 | 용도 |
|---|---|
| [00-bootstrap.md](./00-bootstrap.md) | 세션 시작 — 프로젝트 맥락·규칙 주입 (필수) |
| [10-feature.md](./10-feature.md) | 기능 추가 |
| [11-bugfix.md](./11-bugfix.md) | 버그 수정 (logs/ 연동) |
| [12-schema-change.md](./12-schema-change.md) | DB 스키마 변경 |
| [13-data-source.md](./13-data-source.md) | 수집 소스(어댑터) 추가 |
| [14-ai-chatbot.md](./14-ai-chatbot.md) | 챗봇·프롬프트·RAG 작업 |
| [20-code-review.md](./20-code-review.md) | 코드 리뷰 (review/ 연동) |
| [21-ledger-correctness-fixes.md](./21-ledger-correctness-fixes.md) | 2026-09-15 금융 원장 오류 5건 수정·회귀 검증 |
| [90-session-end.md](./90-session-end.md) | 세션 종료 — 문서 갱신 |
| [conventions.md](./conventions.md) | 코딩 컨벤션 (프롬프트에서 참조) |

## 변경 이력
| 날짜 | 변경 | 이유 |
|---|---|---|
| 2026-09-02 | 초기 작성 | |
| 2026-09-02 | 부트스트랩·세션 종료에 `docs/verification/` 기록 단계 추가 | 모델별 검증 여부를 구분하기 위해 |

| 2026-09-15 | 금융 원장 오류 5건 수정 프롬프트 추가 | 리뷰 재현 사례·완료 조건·데이터 보존 정책 인계 |
