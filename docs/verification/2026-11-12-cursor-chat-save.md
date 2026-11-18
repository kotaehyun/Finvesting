# 2026-11-12 — Cursor (챗 대화 저장)

- 환경: 맥북. Postgres `finvesting-db`. Next `127.0.0.1:3000`
- 범위: `0009_chat_sessions`와 `/chat` 다시 열기

## 검증됨
| 항목 | 방법 | 결과 |
|---|---|---|
| 마이그레이션 | `drizzle-kit migrate` | 적용됨 |
| 타입 | `tsc --noEmit` api · web | 통과 |
| 저장 | `/chat`에 「저장 확인」 후 멈추고 새 대화 | `chat_sessions.title` = 저장 확인, 메시지 role user 1행 |
| 목록·다시 열기 | 빈 화면 버튼, `chat.thread` 200 | 제목과 시각이 보이고, 열면 같은 질문이 남음 |

확인에 쓴 세션은 지웠다.

## 검증 못 함
- 답이 끝난 뒤 assistant 행이 붙는 것. 모델 첫 글자 전에 멈춤
