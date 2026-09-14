# 0009. 투자 대시보드는 위젯 임베드 + 링크 (크롤링 금지)

- 상태: 채택
- 날짜: 2026-09-13

## 배경
세계 지수·스크리너·캘린더를 Investing.com·TradingView·Finviz·Seeking Alpha처럼 한 화면에 보고 싶다.

## 결정
- **TradingView**: 공식 `s3.tradingview.com/external-embedding` 위젯만. 시세 저장 없음.
- **Investing.com**: Cloudflare·약관. 크롤링·위젯 스크rape 없음. 세계 지수·캘린더 페이지 링크만.
- **Finviz**: 스크리너 크롤링 없음. 맵·스크리너 원문 링크만.
- **Seeking Alpha**: 이미 수집 중인 RSS 제목·링크·요약만 `/invest`에 재사용.
- 우리 숫자: Yahoo `yahoo-finance2`로 세계 지수 종가를 `market_quotes`에 둠 (`core/world-indices`).

## 결과
`/invest`. 서비스화 시 TradingView 위젯 약관·Yahoo 비공식 라이브러리를 다시 본다.
