# 2026-11-11 — Cursor (종목 뉴스 오탐)
- 환경: 맥, pnpm 9.15.0, vitest 2.1.9, turbo 2.10.12. 브랜치 `feat/market-terminal-2`
- 범위: 티커·영문 회사명 대소문자, 한글 회사명 조사, `watchNews`가 최신 400건만 보던 회귀

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| `@finvesting/core` 테스트 | `pnpm --filter @finvesting/core test` | 79 files, 346 tests passed. `statement-mcap.test.ts` 10 |
| 타입체크 | `pnpm typecheck` | 8패키지 통과. 직전 실행은 `statement-mcap.ts` `title[at - 1]`이 `string \| undefined`라 core만 실패했고, `charAt`으로 고친 뒤 통과. 관심·시가총액 조회를 같은 후보 함수로 옮긴 뒤 다시 8패키지 통과 |

## 정적 검토
| 항목 | 판단 |
|---|---|
| 관심 목록·시가총액·`watchNews` | 종목마다 `symbols @>` 또는 티커 4글자·회사명 2글자 제목 `ILIKE`. 후보 200건 후 `matchNewsForSymbol`. 시가총액만 오피니언 소스 제외 |

## 검증 못 함
- DB에 붙여 관심 목록·시가총액 화면이 며칠 전 글을 보여 주는지. 이 시점에는 Docker 데몬이 꺼져 있고 `127.0.0.1:3000`도 열려 있지 않음
