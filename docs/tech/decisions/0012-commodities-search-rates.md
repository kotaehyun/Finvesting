# 0012. 원자재·기업검색·정책금리는 공식 API·임베드

- 상태: 채택
- 날짜: 2026-09-14

## 배경
금·은·구리·원유, 기업 검색, 세계 금리 지도를 `/invest`·`/markets`에서 보고 싶다.

## 결정
- **원자재**: Yahoo 선물 종가 `GC=F`·`SI=F`·`HG=F`·`CL=F`·`BZ=F` (2026-09-14 chart 확인). 두바이유는 Yahoo 검색에 없어 넣지 않음. Investing.com은 링크만 (ADR 0009).
- **기업 검색**: Yahoo `v1/finance/search`, `newsCount=0`, `lang=ko-KR`. 제목·심볼·거래소만. 한글 회사명은 Yahoo HTTP 400이라 종목코드·영문. 관심 종목은 검색에서 `watchAdd` (지수·선물 제외). 한국 `.KS`/`.KQ`는 네이버·DART 링크.
- **금리 맵**: BIS `WS_CBPOL` 월 정책금리 → `macro_indicators` `BIS_POL_<ISO2>`. 국가 도형 아님. 독일·프랑스·이탈리아 국내 시계열이 끊기면 유로(XM, ECB).

## 결과
웹 `/invest` 원자재 칸·검색. `/markets` 금리 칸·검색.
