# 0030. 증시자금은 금투협 메인, 카카오는 펀더멘털 기본 종목

- 상태: 채택
- 날짜: 2026-09-16

## 배경
`/fundamentals`에 카카오(코스닥 035720)와 카카오페이증권 조회가 없었다. `/invest`에서 시장 전체 미수금 비중을 그래프로 보고 싶었으나, 금투협 FreeSIS 메인 HTML에는 투자자예탁금·신용융자만 있고 위탁매매 미수금은 없다. 고정 스냅샷을 넣으면 원문과 어긋난다(ADR 0027).

## 결정
- Yahoo 수집 기본 주식은 `DEFAULT_YAHOO_STOCKS = ["035720.KS"]`. 보드 심볼은 `035720`, 시장은 `KRX`. `.KS` 실패 시 `.KQ`.
- 국내 펀더멘털 조회: 네이버 시세(종목) + 카카오페이증권 홈. 종목별 카카오페이증권 URL은 공개 주소가 없어 홈만 둔다.
- 증시자금: FreeSIS `stat/main.do` HTML을 라이브 파싱. 워커는 `KOFIA_INVESTOR_DEPOSIT`·`KOFIA_CREDIT`·(`KOFIA_MARGIN`은 HTML에 있을 때만)를 `macro_indicators`에 저장. `/invest`는 도넛·막대로 그린다.
- 미수금이 메인에 없으면 `marginShare`는 null. 그때 그래프 가운데는 신용융자/(예탁금+신용). 숫자는 만들지 않고 증시자금 추이 링크만 둔다.

## 결과
`core/kofia-funds.ts`, `core/quote-targets.ts`, `worker/sources/kofia.ts`, `market.kofiaFunds`, `/invest` 그래프, `/fundamentals` 카카오페이증권 필.
