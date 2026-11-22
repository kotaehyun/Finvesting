# 2026-11-22 — Cursor (반복 패턴)

- 환경: macOS. `pnpm typecheck`, `pnpm --filter @finvesting/core test`. 웹은 이미 떠 있던 `pnpm dev:web` (http://127.0.0.1:3000)
- 범위: 손실 매도 뒤 재매수 횟수, 홈 카드

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| `pnpm typecheck` | turbo | 8패키지 통과 |
| core 테스트 | vitest | 85개 파일 400개 통과. `repeat-mistake.test.ts` 7개 포함 |
| 홈 「반복 패턴」 | 브라우저 | 「2회 이상인 종목이 없습니다.」 (이 원장에 해당 패턴 없음) |

## 정적 검토
| 항목 | 판단 |
|---|---|
| ADR 0064 | 2회·손실만·계좌×종목. 실수 단정 없음 |

## 검증 못 함 / 다음 AI에게
- 2회 이상 패턴이 있는 원장은 테스트로만 확인. 홈 목록 UI는 이 DB에서 못 봄
- 챗 「반복 패턴」으로 모델 답을 확인하지 않음
- `dev`에 합치지 않음. 브랜치는 `feat/repeat-mistake`
