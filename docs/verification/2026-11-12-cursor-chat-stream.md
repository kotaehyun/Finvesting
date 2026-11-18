# 2026-11-12 — Cursor (챗 스트리밍)

- 환경: 맥북. Next `127.0.0.1:3000`. Ollama `gemma4:12b` · `nomic-embed-text` 로드됨
- 범위: `chat.askStream`과 `/chat` 멈추기

## 검증됨
| 항목 | 방법 | 결과 |
|---|---|---|
| 델타 파서 | `node --test packages/ai/src/ollama-delta.test.ts` | 1 passed |
| 타입 | `tsc --noEmit` ai · api · web | 통과 |
| 스트림 간격 | 임시 절차로 가·나·다를 400ms 간격 송신 후 삭제 | 도착 0.32s · 0.72s · 1.12s. `content-type`은 `application/json` |
| 멈추기 | `/chat` 「숫자 1만 답해」 후 멈추기 | 약 5분 뒤 「멈췄습니다.」 POST `chat.askStream` 200, 301837ms |

## 검증 못 함
- `gemma4:12b` 첫 글자가 화면에 붙는 것. 5분 안에 델타가 오지 않아 멈춤
