# 2026-09-26 — Cursor (Composer) — statements pipeline 0단계

- 환경: macOS, Node 26, pnpm 9.15 (`COREPACK_ENABLE_STRICT=0`), Docker `finvesting-db`, localhost:3000
- 브랜치: `feat/statements-pipeline` (`dev`에서 분기). **코드 수정 없음**(0단계)
- 범위: 기존 worker로 EDGAR/DART 첫 실데이터 확인

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| `.env` 키 존재 | 키 이름만 확인(값 비공개) | `SEC_USER_AGENT`·`EDGAR_TARGETS`·`DART_API_KEY`·`DART_TARGETS` 줄 있음 |
| `pnpm db:up` | docker compose | `finvesting-db` Running |
| `pnpm --filter @finvesting/worker run:once` | 로그 | `edgar { upserted: 93 }`. `dart { skipped: "DART_API_KEY not set" }` |
| `financial_statements` COUNT | psql | **93** (전부 `source=edgar`). AAPL 45 · MSFT 48 |
| `audit_reports` COUNT | psql | **0** |
| `statements.list` | tRPC | `{status:"ok", items:[AAPL, MSFT]}` years 2023–2026, sources edgar, opinions [] |
| `statements.get`(AAPL instrumentId) | tRPC | income/balance/cashflow·years·context 있음. `audit: null` |
| `/statements?q=AAPL` | 브라우저 | 200. AAPL·MSFT 칩, 연도 2023–2026, 3표 숫자, 「미국 종목(EDGAR)은 감사의견 API가 없습니다」 |

## DART skip 원인 (코드 미수정)
- 루트 `.env`에 `DART_API_KEY`/`DART_TARGETS` 문자열이 있으나 **값에 따옴표 없는 `#`**가 들어 있어 `dotenv`가 주석으로 잘라 **빈 문자열**로 파싱됨 → worker `if (!key) skip`.
- `SEC_USER_AGENT`·`EDGAR_TARGETS`는 따옴표로 감싸져 정상 로드.

## 검증 못 함 / 다음 단계
- 국내(DART) 재무·감사 실데이터 — `.env` 따옴표 수정은 **사용자**(또는 1단계 전). 0단계는 코드로 고치지 않음
- 보유·관심 자동 대상·식별자 매핑 — 1단계
- 분기·5년·기업정보 패널·챗 컨텍스트 — 2~4단계

## 교차 검증
- 없음
