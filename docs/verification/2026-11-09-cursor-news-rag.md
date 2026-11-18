# 2026-11-09 — Cursor (질문 유사 뉴스)
- 환경: 맥북, Ollama, Docker `finvesting-db`, Node
- 범위: 뉴스 제목·요약을 768차원으로 저장하고, 질문과 코사인 거리가 가까운 글을 고르는지

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| `news-embed.test.ts` | vitest 2.1.9 | 3 tests passed |
| `packages/api` `tsc --noEmit` | 로컬 tsc | 통과 |
| `apps/worker` `tsc --noEmit` | 로컬 tsc | 통과 |
| `ollama pull nomic-embed-text` | Ollama | success. 274MB |
| 임베딩 저장 | worker tsx, 뉴스 제목·요약 | 8건(FT 오피니언) + 8건(한경 부동산) + 4건(삼성 제목). 차원 768 |
| 최근접 조회 | 질문 `삼성전자 실적` | 1) 한국경제 「삼성전자 배당 잔치에 금리 상승까지… 보험주 질주 어디까지 갈까」 2) 「삼전 배당으로 '실탄' 마련한 삼성 보험형제…」 3) 「'1조원 잭팟' 삼성전기…」 |

## 이어서 확인 (같은 날)
| 항목 | 방법 | 결과 |
|---|---|---|
| 임베딩 백필 | worker `embedMissingNews` 반복 | `EMBED_DONE 2117`. DB `embedding` 있는 행 2137 / 전체 2630 |
| `/chat` | 브라우저에서 「관련 뉴스」클릭 | 첫 요청 `POST chat.ask` 500, 301849ms, 화면 `오류: fetch failed`. 바로 다시 보내니 200, 38298ms. 답에 매일경제·한국경제 제목이 있음 |

## 검증 못 함
- KIS 시세 (`KIS_APP_KEY` 비어 있음)
