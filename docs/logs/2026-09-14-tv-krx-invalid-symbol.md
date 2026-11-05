# 2026-09-14 — TradingView 「잘못된 심볼」

## 증상
`/invest` 주요 지수 `symbol-overview`가 빈 화면 + 「잘못된 심볼」. 탭이 `FOREXCOM:SPXUSD`처럼 티커로 보임.

## 원인
1. `symbol-overview` 심볼 배열은 `[표시이름, 심볼|기간]`이다. 티커 테이프 `[proName, title]`을 그대로 넣으면 두 번째 칸(「S&P 500」)을 심볼로 해석한다.
2. `KRX:KOSPI`는 무료 위젯에 없는 경우가 많다(ADR 0009).

## 해결
`tvSymbolOverviewSymbols()` — 국내 제외, `[label, tv|1D]`. 코스피·코스닥 그래프는 Yahoo 종가 스파크라인.
