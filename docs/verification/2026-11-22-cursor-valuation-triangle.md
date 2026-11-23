# 2026-11-22 — Cursor (ROE·PER·PBR 삼각)
- 환경: 맥, `pnpm --filter @finvesting/core test`, web typecheck, localhost:3000
- 범위: `feat/valuation-triangle`

## 검증됨
| 항목 | 방법 | 결과 |
|---|---|---|
| core | `vitest run valuation-triangle` | 5통과 |
| web typecheck | `pnpm --filter @finvesting/web typecheck` | 통과 |
| `/fundamentals` | 브라우저 AAPL 검색 | 「AAPL · ROE·PER·PBR 삼각」+ 절대 축 안내(필터 1종목) |

## 검증 못 함
- push·merge
- 전체 목록 peer 순위 스케일 화면 캡처
