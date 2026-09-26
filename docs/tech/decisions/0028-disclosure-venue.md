# 0028. 공시 창구는 시장별, 펀더멘털에는 해설을 붙이지 않음

- 상태: 채택
- 날짜: 2026-09-16

## 배경
해외 종목에도 DART와 「재무제표를 읽는 사람들」(drcr.co.kr)을 붙였다. 둘 다 국내 한정이다. 펀더멘털 표에 재무제표·AI 분석 필을 넣으면 Yahoo 스냅샷과 공시 3표·해설 칼럼이 한 행에 섞인다.

## 결정
- 공시 창구는 심볼로 가른다. 한글 이름·6자리·`.KS`/`.KQ`는 DART. 미국 티커는 EDGAR. 그 외는 Yahoo 재무 링크만.
- 「재무제표를 읽는 사람들」은 `/statements` 국내 조회에만 둔다. 본문 저장·크롤링 없음.
- `/fundamentals`는 Yahoo 일 스냅샷과 시세 링크(Yahoo, 국내는 네이버)만. 재무제표 필·AI 분석 필·국내 해설은 없음. 화면 이동은 InvestTrail.
- `/statements?q=`가 있으면 목록이 비어도 그 심볼로 창구를 가른다.

## 결과
`core/disclosure-links.ts` `filingVenueFor`·`lookupServices`, `yahoo-search.ts` `edgarUrl`, `/fundamentals`, `/statements`, `/invest` 검색.
