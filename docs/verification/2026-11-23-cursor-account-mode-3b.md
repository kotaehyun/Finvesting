# 2026-11-23 — ADR 0067 3단계 보강 (Cursor)

- 환경: macOS Darwin 25.6, `feat/account-mode-shell` (`d709e76`)
- 범위: 일반 모드 기업 숫자·재무제표·급여/공제 카드형

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| web tsc | `npx tsc --noEmit -p apps/web/tsconfig.json` | ✅ exit 0 |

## 정적 검토 (실행 없이 코드 읽기)
| 항목 | 판단 |
|---|---|
| `/fundamentals` personal: `card-page`·종목 칩·`useUiMode` | 코드상 분기 확인 |
| `/statements` personal: 카드 머리말·`statements-personal-nav` | 코드상 분기 확인 |
| `/profile` personal: 급여·공제 탭·쉬운 말 머리말 | 코드상 분기 확인 |
| `shell.css` `.fund-personal` / `.statements-personal` / `.profile-personal` | 스타일 추가 확인 |

## 검증 못 함 / 다음 AI에게
- 브라우저에서 일반/비즈니스 전환 실물 확인(기업 숫자·재무제표·프로필)
- 라이트/다크 스크린샷
- 8패키지 일괄 `pnpm typecheck`
