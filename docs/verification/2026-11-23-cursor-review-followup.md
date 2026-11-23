# 2026-11-23 — Claude 리뷰 후속 (Cursor)

- 환경: macOS, `DATABASE_URL=localhost:5432/finvesting`(앱이 쓰는 DB). Colima `finvesting-db`와 **별개**일 수 있음 — 검증·수집은 워커 연결 기준.
- 브랜치: `feat/valuation-triangle`

## 확인한 것
| 항목 | 방법 | 결과 |
|---|---|---|
| 작업 트리 4커밋 분리 | git log | ✅ `7752060`→`746674e`→`2cc4849`→`7340134` |
| `fix/data-cleanup-rate-period` push | git push | ✅ `origin/fix/data-cleanup-rate-period` |
| A2 통화 가드 | vitest valuation-triangle | ✅ 통화 다르면 filledPer false |
| A5 explainFundamentals | 코드+정적 | ✅ NOT_FOUND / `{status:unavailable}`. 브라우저 클릭은 ❌ |
| A6·A7 연도·배당 기본값 | 코드 | ✅ KST 연도, 금액 빈 칸 |
| M2 isSpendingCategory | vitest cashflow·spend-anomaly | ✅ |
| core vitest 전체 | `npx vitest run` | ✅ 87파일 412 |
| web·api tsc | `tsc --noEmit` | ✅ |
| 국내 DART 재수집 | `tsx src/run-dart-once.ts` | ✅ targets=40, upserted=2275, years 2022–2026 |

### DART Q3 누적 매출 대조 (OpenDART `thstrm_add_amount` ↔ DB `items.revenue`)
| 종목 | 연도 | DART 원문(누적) | DB | 일치 |
|---|---|---|---|---|
| 005930 삼성전자 | 2026 Q3 | 500626123000000 | 500626123000000 | ✅ |
| 005930 삼성전자 | 2025 Q3 | 239768567000000 | 239768567000000 | ✅ |
| 000660 SK하이닉스 | 2026 Q3 | 236510516000000 | 236510516000000 | ✅ |
| 035420 NAVER | 2025 Q3 | 8839922977621 | 8839922977621 | ✅ |

## 못 한 것 / 사용자
- `fix/data-cleanup-rate-period` → `dev` 머지·rebase는 사용자 확인 후
- AI 분석 버튼 Ollama 켠/끈 브라우저 실클릭 ❌
- `docs/fred-api-key-setup` push·`stash@{0}` 미처리
- Colima `docker exec finvesting-db`로 보면 앱 DB와 숫자가 다를 수 있음(이중 Docker 런타임). 앱·워커는 localhost:5432 기준
