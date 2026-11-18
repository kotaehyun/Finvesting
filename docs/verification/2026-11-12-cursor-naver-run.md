# 2026-11-12 — Cursor (네이버 뉴스 1회)
- 환경: 맥북, Colima. Postgres `finvesting-db`는 uid 501로 재기동 후 accepting connections
- 범위: `collectNaverNews` 1회와 키 확인용 검색 1회

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| 수집기 | worker `collectNaverNews` | `{skipped:"no korean names", inserted:0, page:0, pages:0}` |
| 보유·관심 | `trades` ∪ `watchlist` | 2건. AAPL `Apple Inc.`, BTC `BTC`. 한글 이름 없음 |
| 키 | `GET /search/v1/news?query=삼성전자&display=1&sort=date` | HTTP 200. 항목에 제목·링크 있음. 저장하지 않음 |

## 이어서 (저장된 KRX 이름)
| 항목 | 방법 | 결과 |
|---|---|---|
| 대상 | `naverNewsCollectRows` + vitest | 11 passed. KRX 한글 이름만 검색, `INDEX` 은은 제외 |
| 수집 | `collectNaverNews` | inserted 39, queries 4, errors 없음, embedded 16 |
| 저장 | `market_news.source = naver:news` | 삼성전자 10, 삼성SDI 10, 펄어비스 10, 에코프로비엠 9 |

## 화면
- `http://127.0.0.1:3000/news`. 전체 3076, 국내 2098, 해외 978
- 국내 금융에서 제목 검색 `삼성SDI` → 10건. 요약에 삼성SDI가 있는 네이버 수집 제목(조선비즈·조이뉴스 등)이 보임

## 검증 못 함 / 다음 AI에게
- 언론 필터로 `naver:news`만 고르는 버튼은 없음. 호스트 버튼으로만 구분
