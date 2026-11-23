# 2026-11-23 — ADR 0067 3·4단계 (Cursor)

- 환경: macOS, `feat/account-mode-shell`
- 범위: 일반 카드형 세금·보유·계좌, 비즈니스 이중 메뉴 제거·홈/타임라인 제목

## 확인한 것
| 항목 | 방법 | 결과 |
|---|---|---|
| web tsc | `npx tsc --noEmit -p apps/web` | ✅ |
| 코드: personal tax 카드·탭 | 정적 | ✅ |
| 코드: holdings/accounts 라벨 | 정적 | ✅ |
| 코드: `.bshell .erp-menu` 숨김 | shell.css | ✅ |
| 코드: 홈/타임라인 비즈니스 제목 | 정적 | ✅ |

## 못 한 것
- 브라우저에서 일반/비즈니스 전환 실물 확인
- 라이트 모드
