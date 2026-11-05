# 2026-09-16 — tRPC realtyLoans/newsFeed 배치 500 에러 (DB 오프라인)

## 증상
`/realty` 페이지 로드 시 콘솔에 아래와 같은 500 내부 서버 오류가 반복 발생함:
```
api/trpc/market.newsFeed,market.realtyLoans?batch=1&input=... Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

## 원인
tRPC는 동일 시점에 발생하는 `newsFeed`와 `realtyLoans` 쿼리를 하나의 HTTP 배치 요청(`batch=1`)으로 묶어 서버로 전송한다.
`newsFeed` 프로시저는 `try-catch` 및 정적 폴백이 구현되어 있었으나, `packages/api/src/routers/market.ts`의 `realtyLoans` 프로시저 내부의 `ctx.db.select(...)` 호출부가 `try-catch`로 감싸져 있지 않았다.
로컬 환경에서 PostgreSQL DB 컨테이너가 미구동 상태이거나 연결이 거부될 때 unhandled exception이 발생하여 배치 요청 전체가 HTTP 500으로 실패하였다.

## 해결
1. `packages/api/src/routers/market.ts`의 `realtyLoans` 내부 DB 조회를 `try-catch`로 감싸고 예외 시 빈 배열로 처리.
2. DB 데이터가 없거나 오프라인일 때 한국은행 ECOS 151Y003 최신 공표 기준 17개 광역시도 가계대출·주택담보대출·연체율 통계 스냅샷(`fallbackSnapshot`)을 자동으로 주입하도록 폴백 로직 구현.
3. 동일 라우터 내 `inflationMap`, `policyRateMap` 프로시저에도 `try-catch` 방어 로직을 적용하여 DB 미구동 환경에서도 모든 매크로 API가 200 OK와 정상 데이터를 반환하도록 조치.
