# 2026-09-15 — MapLibre GeoJSON이 안 칠해짐 (worker URL)

## 증상
`/realty` MapLibre 캔버스는 생기는데 시군구 면이 안 나옴. `isSourceLoaded('plan')`이 계속 false.

## 원인
MapLibre GL 6는 GeoJSON을 웹워커에서 타일화한다. Next 개발 서버는 기본 워커 URL이 비어 있어 소스가 영원히 안 올라간다.

## 해결
`public/maplibre-gl-worker.mjs` + `maplibre-gl-shared.mjs`를 두고 `setWorkerUrl(origin + '/maplibre-gl-worker.mjs')`를 `new Map` 전에 호출.
