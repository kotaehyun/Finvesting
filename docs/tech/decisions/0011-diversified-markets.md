# 0011. 다양 투자·부동산은 공식 API·임베드·링크

- 상태: 채택
- 날짜: 2026-09-14

## 배경
거래량, 외국인·기관 수급, 인플레이션, 크립토·외환 뉴스, 부동산 과밀권역·가격 추이, 기술분석을 한 제품에서 보고 싶다.

## 결정
- **수급**: 네이버·HTS 크롤링 없음. KRX 정보데이터시스템 원문 링크. 숫자는 공공데이터 키 이후.
- **인플레이션 맵**: 세계은행 `FP.CPI.TOTL.ZG`(키 없음) → `macro_indicators` `WB_INFL_<ISO2>`. 국가 도형이 아니라 칸.
- **거래량·크립토·외환 그림**: TradingView 공식 iframe (`stock-heatmap` 상대거래량, `crypto-coins-heatmap`, `forex-heat-map`, `technical-analysis`).
- **뉴스**: CoinDesk·Cointelegraph(크립토), FXStreet(외환), 한경 부동산 RSS. 제목·링크·요약만.
- **부동산 `/realty`**: 수도권정비계획법 시행령 별표1 **요약**(서울 전역 + 시 목록, 인천·남양주·시흥은 일부 제외). 동 단위는 법령·토지이음. 임대료·실거래·공급 숫자는 키 없이 빈 칸. 지역 UI·규제·대출 위험은 ADR 0014.
- **기술 설명**: `core/ta-lessons` 우리 문장. 매매 신호 아님.

## 결과
웹 `/markets`, `/realty`. 실거래·KRX 수급 시계열은 키 발급 후 워커.
