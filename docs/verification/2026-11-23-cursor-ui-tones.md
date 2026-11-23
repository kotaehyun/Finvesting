# 2026-11-23 — UI 톤·다크 1단계 (Cursor)

- 환경: macOS, `feat/ui-unify-tones`(base `feat/valuation-triangle`). 시스템 다크 모드 위주.
- 범위: U1~U4 (`docs/review` Claude UIUX 점검)

## 확인한 것
| 항목 | 방법 | 결과 |
|---|---|---|
| `--tone-up/down/flat/warn`, `.up/.down/.flat/.warn` | globals.css | ✅ |
| 타임라인 KPI·이벤트 금액 색 | CSS highlight → tone | ✅ 코드. 브라우저 스크린샷 ❌ |
| net-worth 0원 | pnlTone flat → 「변동 없음」 | ✅ 코드 |
| 세금 양도세 `-0원` | deductWon→signedWon | ✅ 코드 |
| wehago 다크가 밝은 색 강제 | dark 블록을 erp 변수로 | ✅ 코드 |
| 프로필 erp-props th | `--erp-label` 다크 #e2e8f0 | ✅ 코드 |
| web tsc | 아래 | 기록 |

## 못 한 것
- 홈·타임라인·세금·펀더멘털·재무제표·프로필 라이트/다크 실물 스크린샷
- 라이트 모드 전환 확인(시스템 다크만)
