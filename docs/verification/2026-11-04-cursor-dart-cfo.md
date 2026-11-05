# 2026-11-04 — Cursor (DART 현금흐름 cfo)
- 환경: 맥북, Docker DB, DART_API_KEY
- 범위: `fnlttSinglAcntAll` CF → `cfo` 매핑·재수집

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| `dart-accounts.test.ts` | vitest | 7건 통과 |
| 삼성 2024 FY 매핑 | OpenDART + upsert | cashflow `{ cfo: 72982621000000 }` only |
| `collectDart()` | worker tsx | upserted 116, years 2022–2026 |
| DB cashflow | psql | dart cashflow 36행, 전부 `items.cfo` 있음 (005930·000660) |

## 정적 검토
| 항목 | 판단 |
|---|---|
| SinglAcnt만으로는 CF 불가 | OpenDART 응답 BS·IS만 확인 |
| CF 당기순이익 → income 키 차단 | `mapDartFsRow` + `DART_KEYS_BY_STATEMENT` |

## 검증 못 함
- `/statements` 브라우저에서 현금흐름 칸 표시 클릭
- 커밋·push
