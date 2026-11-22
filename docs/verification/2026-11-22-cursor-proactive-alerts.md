# 2026-11-22 — Cursor (능동 알림)

- 환경: macOS. `pnpm typecheck`, `pnpm --filter @finvesting/core test`. 웹 http://127.0.0.1:3000
- 범위: 홈 「확인할 일」에 기존 계산 모으기

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| `pnpm typecheck` | turbo | 8패키지 통과 |
| core 테스트 | vitest | 86개 파일 404개 통과. `proactive-alerts.test.ts` 포함 |
| 홈 확인할 일 | 브라우저 | 「보유 집중 BTC 100.0% (경험 규칙 40%)」, 「코인 100.0% · 성향 중립 (경험 규칙 20%)」. 푸시 문구 안내 |

## 검증 못 함
- 챗 「확인할 일」로 모델 답을 확인하지 않음
- 커밋·`dev` 합침은 사용자 지시 전. 브랜치 `feat/repeat-mistake`
