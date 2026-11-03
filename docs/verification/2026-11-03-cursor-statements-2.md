# 2026-11-03 — Cursor (Composer) — statements pipeline 2단계

- 환경: macOS, Node 26, npx vitest/tsc, Docker `finvesting-db`
- 브랜치: `feat/statements-pipeline`
- 범위: 수집 기간 5년 + DART 분기(사업·1Q·반기·3Q). 조회 시 FY 우선

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| `statement-collect.test.ts` | vitest | 3 tests pass |
| typecheck core / api / worker | `tsc --noEmit` | 0 errors |
| `collectDart` | worker | `{ upserted: 80, catalog: "skipped", unmatched: [], years: [2026..2022] }` |
| `collectEdgar` | worker | `{ upserted: 120, catalog: "ok", unmatched: [] }` |
| `financial_statements` dart | psql | 삼성·하이닉스 FY 2022–2025, Q1/H1/Q3(2026은 Q1·H1). period당 income+balance(2) — cashflow 계정 미매핑 |
| `audit_reports` dart | psql | 2022–2025 각 종목 적정/적정의견 8건 |
| `financial_statements` edgar | psql | AAPL·MSFT 2022– 연·분기. MSFT에 FY 2027 Q1(회사 회계연도) |

## 검증 못 함
- `/statements` 브라우저에서 연도 버튼 전환
- 3단계 기업개황 패널·4단계 챗 컨텍스트
- DART 현금흐름 계정명 추가 매핑

## 교차 검증
- 없음
