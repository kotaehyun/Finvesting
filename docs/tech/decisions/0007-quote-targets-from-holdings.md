# 0007 — 시세 수집 대상은 보유·관심 종목
- 상태: 채택 (2026-09-13)
- 배경: worker가 `YAHOO_TARGETS`·업비트 고정 4종만 모아 `/holdings`에 넣은 종목은 시세가 비었다. ECOS 키가 없으면 `USDKRW`도 없어 해외 평가손익이 체결 환율에 고정됐다.
- 결정:
  - 수집 대상 = `trades`에 체결이 있는 종목 ∪ `watchlist`. env `*_TARGETS`는 있으면 합집합.
  - `UPBIT` → 업비트 `KRW-<심볼>`. `NASDAQ|NYSE|AMEX|US` → 야후 심볼 그대로. `KRX` → 야후 `<심볼>.KS`, 실패 시 `.KQ`. KIS는 나중에.
  - 원/달러는 야후 `KRW=X`를 `macro_indicators.code=USDKRW` `source=yahoo`로 넣는다. 같은 날짜에 ECOS가 있으면 ECOS가 덮어쓴다.
  - 매핑은 `packages/core/src/quote-targets.ts` 순수 함수.
- 결과: 체결만 넣어도 다음 `run:once`에서 시세·환율이 붙는다. 국내 정식 시세는 여전히 KIS.
