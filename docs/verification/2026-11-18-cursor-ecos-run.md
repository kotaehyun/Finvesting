# 2026-11-18 — Cursor (ECOS 수집)
- 환경: 맥북. Postgres `finvesting-db` accepting connections. `collectEcos` 1회
- 범위: `ECOS_API_KEY`로 국고채 5년과 시도 가계대출을 받는다

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| Postgres | `pg_isready -U finvesting` | accepting connections |
| `collectEcos` | worker 1회 | `upserted` 0. 대출 지역 0, 금리 코드 0 |

## 정적 검토
| 항목 | 판단 |
|---|---|
| `ECOS_API_KEY` 줄 | `#`로 시작하고 공백과 한글이 있다. 발급 키가 아니라 설명이라 dotenv가 빈 값으로 읽거나, 그대로 넣으면 주소가 깨진다 |

## 검증 못 함
- 키를 출력하지 않음. 5년 금리 숫자와 `ECOS_HHLOAN%` 행은 없음
