# 2026-11-11 — Cursor (네이버 뉴스 검색)
- 환경: 맥북, vitest 2.1.9, tsc 5.9.3. pnpm은 corepack 링크가 없어 패키지 `node_modules`의 vitest·tsc를 직접 실행
- 범위: NAVER API HUB 뉴스 검색 수집기. 실호출은 키가 있을 때만

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| 검색어·태그 제거·행 변환 | `packages/core` vitest `naver-news.test.ts` `news-category.test.ts` | 16 passed |
| core·worker 타입 | `tsc --noEmit` | 통과 |

## 정적 검토
| 항목 | 판단 |
|---|---|
| 요청 주소·헤더 | 공식 문서 `api.ncloud-docs.com` 뉴스 검색 (2026-09-17). `GET https://naverapihub.apigw.ntruss.com/search/v1/news`, 헤더 `X-NCP-APIGW-API-KEY-ID`·`X-NCP-APIGW-API-KEY` |
| 저장 | 제목·원문 링크·요약 500자·호스트. 본문·응답 원문 없음 |

## 검증 못 함 / 다음 AI에게
- 이 맥 `.env`의 두 키는 빈 문자열이라 HTTP 호출은 하지 않음. 키가 채워지면 `collectNaverNews` 1회와 `market_news.source = naver:news` 행을 확인할 것
- origin 브랜치에는 이 수집 커밋이 없었음
