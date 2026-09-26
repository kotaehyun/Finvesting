# 0031. 펀더멘털은 수집분만, 화면 상태는 ok/empty/unavailable

- 상태: 채택
- 날짜: 2026-09-16

## 배경
DB 장애·0건을 AAPL 등 고정 스냅샷으로 채워 공식 Yahoo처럼 보였다. 52주 게이지는 중간값, 시총 정렬은 KRW·USD를 섞었다. `/statements?q=`는 첫 종목을 골랐다.

## 결정
- `loadLatestFundamentals`는 `{ status, items }`만. 고정 행 없음. 종가는 `market_quotes` 최신 close.
- `/statements`는 서버 `searchParams` → 클라이언트 q. 목록도 `{ status, items }`. 목록에 없으면 다른 회사 3표를 대상처럼 보이지 않음.
- 전체 시장에서 금액(시총·매출·순익·EPS) 정렬 금지. 배수·비율은 유지.
- `/realty` 버튼은 DB 재조회. 외부 수집 완료처럼 쓰지 않음.

## 결과
`core/yahoo-fundamentals.ts`, `api/lib/fundamentals.ts`, `/fundamentals`, `/statements`, `/realty`.
