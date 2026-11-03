# 2026-11-03 — Cursor (`/invest` 시총 보드)
- 환경: 맥북, Next dev `127.0.0.1:3000`, DB 기동
- 범위: `market.mcapBoard`·core 시총/뉴스 매칭 단위 테스트

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| `statement-mcap.test.ts` | vitest (npx) | 5건 통과 |
| `market.mcapBoard` limit=5 | tRPC GET | `status=ok`, asOf=2026-11-03, kr/world 각 5. kr1=005930+뉴스1건, world1=AAPL |

## 정적 검토 (실행 없이 코드 읽기)
| 항목 | 판단 |
|---|---|
| `/invest` `McapBoard` 배치 | 관심 터미널 위. 탭·뉴스·딥링크 |
| `/statements` `area`/`browse` 쿼리 | page→StatementsView 초기값 |

## 검증 못 함 / 다음 AI에게
- 브라우저에서 `/invest` 패널 클릭·뉴스 펼침·재무제표 이동 UI
- 전체 패키지 타입체크·web build
