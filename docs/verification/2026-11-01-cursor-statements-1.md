# 2026-11-01 — Cursor (Composer) — statements pipeline 1단계

- 환경: macOS, Node 26, npx vitest/tsc, Docker `finvesting-db`
- 브랜치: `feat/statements-pipeline`
- 범위: 보유·관심 ∪ env 대상, DART corpCode.xml / SEC company_tickers.json 매핑

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| `statement-targets.test.ts` | vitest | 14 tests pass |
| `statement-regions.test.ts` | vitest | 12 tests pass |
| typecheck core / worker / api | `tsc --noEmit` | 0 errors |
| `run:once` edgar | worker | `{ upserted: 96, catalog: "ok", unmatched: [] }` |
| `instrument_identifiers` | psql | `sec` 2건 (AAPL·MSFT CIK). `dart` 1건 (000660 corp) |
| `financial_statements` | psql | `edgar` 96건. `dart` 0건 |

## 검증 못 함
- DART 재무·감사 실데이터: API가 `인증키가 누락되었습니다`. `.env` `DART_API_KEY`는 따옴표로 감쌌으나 값 형태가 OpenDART 키가 아님(코드·값은 기록하지 않음). 유효 키는 사용자.
- `DART_TARGETS` 첫 토큰은 종목코드가 아니라 skip. `000660`만 요청 시도.
- 2~5단계. 브라우저 `/statements` 이번 미실행.

## 교차 검증
- 없음
