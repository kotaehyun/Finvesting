# 2026-11-22 — Cursor (세션 C data-cleanup-rate-period)
- 환경: 맥, Node v26.7.0, pnpm, Colima `finvesting-db` Up
- 범위: N1-b·N2·N3·N4 (`fix/data-cleanup-rate-period`, tip `f680b8d` 이후)

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| core 테스트 | `pnpm --filter @finvesting/core test` | 87파일 411통과 |
| typecheck | `pnpm typecheck` | 8패키지 통과 |
| N3 dry-run | `tsx apps/worker/src/scripts/repair-kosdaq-market.ts` | candidates 36, evidence 0, restore 0, skip 36. APPLY 안 함 |

## 정적 검토
| 항목 | 판단 |
|---|---|
| N2 `2027-01` | 요율 entry `effectiveTo` 2026-12-31 → unavailable |
| N1-b | H1/Q3 income 0칸이면 dart 행 delete |
| N4 | `loginGate` + SESSION 32자 + tRPC INTERNAL |

## 검증 못 함 / 다음 AI에게
- N1 전체 DART 재수집(요청 전 미실행)
- N3 APPLY=1(근거 없음)
- 로그인 429 브라우저 연타
- N5 alignStatementRows

## dry-run skip 샘플(앞 10)
035720, 005930, 035420, 042700, 000990, 259960, 036570, 051910, 003670, 005380
