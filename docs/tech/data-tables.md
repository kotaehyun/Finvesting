# 데이터 표 (packages/core/data)

코드에 박힌 통계·세율·요율·호봉 숫자를 JSON으로 옮긴 목록이다. **새 숫자를 만들지 않는다.** 원문 대조 전 항목은 `verifiedBy: "미검증"`.

## 규칙
- 파일 하나 ≈ 출처 하나. 각 숫자 잎은 `entries[]`에 `{ value, unit, asOf, effectiveFrom, effectiveTo, sourceTitle, sourceUrl, article, verifiedBy, verifiedOn }`를 둔다.
- 코드(`packages/core/src/*.ts`)는 JSON을 import해 기존 export 이름·함수 시그니처를 유지한다.
- 실패·부재 API는 `{status: empty|stale|unavailable}`. 샘플은 `DEMO_MODE=true` + 「샘플」 배지 (`AGENTS.md` 11번).

## 파일 목록

| 경로 | 내용 | 갱신 주기 |
|---|---|---|
| `realty/bankruptcy.json` | 개인회생·파산 신청·파탄원인 | 법원통계·회생법원 공표 시 |
| `realty/card.json` | 카드 연체·리볼빙 | 금감원·여신협 실적 공표 시 |
| `realty/claims.json` | 주장 대비 공식 근거(숫자 잎 소수) | 근거 교체 시 |
| `realty/cohort.json` | 혼인·출산 코호트 | 통계청 공표 시 |
| `realty/distress.json` | 공실·연체·경매 등 | 공표 시 |
| `realty/loans.json` | ECOS 가계대출 코드·시도 목록 | 코드표 변경 시 |
| `realty/map.json` | 지도 점·권역 스타일 | 규제지역 고시 변경 시 |
| `realty/nts.json` | 국세 집계 | 국세 통계 공표 시 |
| `realty/officials.json` | 공직자 재산 | 공개 시 |
| `realty/pop.json` | 인구·가구 | 통계청 공표 시 |
| `realty/rates.json` | 한은·COFIX 금리 | 금리 공표 시 |
| `realty/ref.json` | 정비·규제 참고(라벨) | 고시 변경 시 |
| `realty/stress.json` | 공실·PIR·지니 | 공표 시 |
| `realty/tenure.json` | 전월세 비중 | 공표 시 |
| `realty/wealth.json` | 고액 자산 이동 | 공표 시 |
| `tax/brackets.json` | 양도·증여·재산·종부 세율 구간 | 세법 개정 시(보통 매년 1월) |
| `tax/corp-local-rate.json` | 법인지방소득세 10% | 지방세법 개정 시 |
| `tax/payroll-rates-2026.json` | 4대보험 근로자 부담·기본공제 | 매년 1월·7월(연금 상하한 등) |
| `tax/ei-stability.json` | 최저임금·고용안정 요율 | 매년 1월(최저임금)·요율 고시 |
| `tax/civil-pay-2026.json` | 공무원보수규정 별표 3 | 매년 1월 봉급표 |

## 갱신 절차
1. 공식 원문(URL)을 연다. 값을 대조한다.
2. 해당 JSON의 `value`·`asOf`·`effectiveFrom`/`To`를 고친다. `verifiedBy`를 `사용자` 등으로, `verifiedOn`을 오늘 날짜로.
3. `pnpm --filter @finvesting/core test` — `data-tables.test.ts` 통과.
4. 화면에 「기준 YYYY-MM-DD · 출처」가 보이면 그대로, 없으면 `defaults.asOf`·`sourceTitle`을 표시한다.
5. `docs/verification/`에 원문 대조만 ✅로 올린다(렌더만이면 ⏸).
