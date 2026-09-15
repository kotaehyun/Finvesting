# 2026-09-14 — TradingView iframe contentWindow

## 증상
`/invest` 콘솔: `Cannot listen to the event from the provided iframe, contentWindow is not available`

## 원인
공식 로더 `s3.tradingview.com/external-embedding/embed-widget-*.js`가 iframe을 만든 직후 `iframe.contentWindow`에 `message`를 붙인다. React Strict Mode·테마(light→dark) 재마운트가 그 iframe을 지우면 contentWindow가 null이다. 로더 소스에 같은 문구가 있다.

## 해결
로더를 쓰지 않고, 로더가 만드는 것과 같은 `https://www.tradingview-widget.com/embed-widget/<id>/` 을 iframe `src`로 직접 넣는다. 테마는 matchMedia 확정 후에만 마운트.
