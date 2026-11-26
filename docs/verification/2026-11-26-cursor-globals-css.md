# 2026-11-26 — Cursor
- 환경: 맥북, Next.js 15.5.25, `apps/web`에서 `next build` 후 `next start` (127.0.0.1:3210)
- 범위: ADR 0067 5단계 `globals.css` 분리. 규칙 본문이 분리 전과 같은지, 화면에서 스타일이 붙는지

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| 규칙 본문 916개 | 분리 전 `globals.css`와 `styles/*.css` 규칙 문자열 비교 | 개수 일치, 빠진 규칙 0, 추가 규칙 0 |
| `.mind-zones` `.mind-regs` `.mind-loans` 중복 2회 | `card.css` 안 순서 | 같은 파일에 앞·뒤 그대로 |
| `next build` | `apps/web` | Compiled successfully, 정적 페이지 21 |
| 다크 모드 토큰 | `/` computed style | 배경 `rgb(15, 17, 21)` (`--bg` 다크), `.up` `rgb(248, 113, 113)` |
| 스타일시트에 네 묶음 | 로드된 CSS 검색 | `.chat-shell`, `.erp-titlebar`, `.news-board`, `--tone-up` 있음 |
| `/tax` 일반 카드 | 브라우저 | `card-page tax-personal`, 제목 24px |
| `/chat` | 브라우저 | 배경 `rgb(20, 18, 16)`, 인사 글자 `rgb(244, 238, 228)`, 보내기 버튼 `rgb(45, 212, 191)` |

## 정적 검토 (실행 없이 코드 읽기)
| 항목 | 판단 |
|---|---|
| 파일 간 선택자 중복 | 분리 구간을 나눈 뒤 같은 선택자가 두 파일에 없음. 캐스케이드 승자는 유지 |

## 검증 못 함 / 다음 AI에게
- 라이트 모드 화면은 이번 브라우저가 다크라 따로 열지 않음
- 비즈니스 모드 스위치 클릭은 하지 않음. `shell.css`는 수정하지 않았고, ERP 규칙은 번들에 포함됨
- 8패키지 `pnpm typecheck`는 실행하지 않음. web 빌드의 타입 검사는 통과

## 교차 검증
- 없음
