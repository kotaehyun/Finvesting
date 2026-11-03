# 2026-11-03 — Cursor (Composer) — statements pipeline 3단계

- 환경: macOS, Node 26, npx vitest/tsc, Docker `finvesting-db`
- 브랜치: `feat/statements-pipeline`
- 범위: 기업개황·주주·배당·부문 수집 + `/statements` 오른쪽 칸

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| migrate `0008_company_profiles` | drizzle-kit migrate | ok |
| `company-profile.test.ts` + regions | vitest | 18 pass |
| typecheck core/api/worker/web | tsc | 0 errors |
| `collectDartCompanyProfile` | worker | upsert 14. years 2025–2023 |
| `collectEdgarCompanyProfile` | worker | upsert 2 |
| `company_overviews` | psql | 삼성·하이닉스(dart)·AAPL·MSFT(edgar) |
| `company_year_facts` | psql | holders·dividend만. segment 0행 |

## 검증 못 함
- 브라우저에서 오른쪽 칸 육안 확인
- 4단계 챗 컨텍스트
- 부문매출(삼성·하이닉스 XBRL member 매출 없음)

## 교차 검증
- 없음
