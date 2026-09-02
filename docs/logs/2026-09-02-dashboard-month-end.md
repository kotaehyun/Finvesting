# 대시보드 월 종료일 Postgres date 오류
- 날짜: 2026-09-02
- 환경: 맥북, 코드 정적 점검 (실행 전)
- 어디서: `packages/api/src/routers/dashboard.ts` overview 쿼리
- 증상: 9월(및 2·4·6·11월)에 `lte(transactions.date, 'YYYY-MM-31')` → Postgres `date/time field value out of range`
- 원인: 월 마지막 날을 31로 고정. 기본 월도 `toISOString()`이라 UTC
- 해결: KST 기준 `YYYY-MM` + `new Date(y, m, 0)`로 해당 월 말일
- 재발 방지: date 상한은 항상 실제 말일 또는 다음달 1일 미만(`lt`)으로
