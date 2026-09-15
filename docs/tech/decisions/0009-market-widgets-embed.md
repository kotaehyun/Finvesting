# 0009. 투자 대시보드는 위젯 임베드 + 링크 (크롤링 금지)

- 상태: 채택
- 날짜: 2026-09-13

## 배경
세계 지수·스크리너·캘린더를 Investing.com·TradingView·Finviz·Seeking Alpha처럼 한 화면에 보고 싶다.

## 결정
- **TradingView**: 공식 `tradingview-widget.com/embed-widget` iframe. 시세 저장 없음. 로더 스크립트는 React에서 iframe을 지우면 `contentWindow is not available`가 나서 쓰지 않는다. 무료 위젯은 KRX 지연시세를 빼는 경우가 많아 코스피·코스닥은 Yahoo 칸(종가 그래프) + 네이버·한투·거래소 링크로 본다. `symbol-overview`는 `[표시이름, 심볼|1D]` (`tvSymbolOverviewSymbols`). 티커 테이프 형식 `[proName, title]`이나 `KRX:KOSPI`를 넣으면 「잘못된 심볼」만 보인다.
- **Investing.com**: Cloudflare·약관. 크롤링·위젯 스크rape 없음. 세계 지수·환율·비트코인·캘린더 페이지 링크만.
- **Finviz**: 스크리너 크롤링 없음. 맵·스크리너 원문 링크만.
- **네이버 증권·한국투자증권·한국거래소·다음 금융**: 원문 링크만. 시세·HTS 크롤링 없음. KIS Open API는 키 필요(미구현).
- **Seeking Alpha**: 이미 수집 중인 RSS 제목·링크·요약만 `/invest`에 재사용.
- 우리 숫자: Yahoo로 세계 지수·BTC-USD·원환율(`core/fx-pairs`)을 저장. 비트코인 원화는 업비트 일봉이 있으면 그 칸에 쓴다.

## 결과
`/invest`. 서비스화 시 TradingView 위젯 약관·Yahoo 비공식 라이브러리를 다시 본다.
