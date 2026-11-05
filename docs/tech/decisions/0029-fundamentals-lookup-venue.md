# 0029. 펀더멘털 조회는 국내 네이버·해외 Yahoo

- 상태: 채택
- 날짜: 2026-09-16

## 배경
`/fundamentals` 티커가 국내·해외 모두 Yahoo로 열렸다. 국내 조회 창구는 네이버 증권이다.

## 결정
- 국내(`.KS`/`.KQ`/6자리·KRX): 종목 링크는 네이버 시세. Yahoo 통계 필 없음.
- 해외: 종목 링크는 Yahoo 시세. 보조는 Yahoo key-statistics. 네이버 없음.
- 표 숫자는 계속 Yahoo 일 스냅샷. 공시 3표는 `/statements`(ADR 0028).
- 시장 필터가 국내면 네이버 홈만, 미국이면 Yahoo 홈만 조회 카드에 둔다.

## 결과
`core/yahoo-fundamentals.ts` `fundamentalLookups`·`fundamentalVenueLookups`, `/fundamentals`.
