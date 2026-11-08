# 2026-11-08 — Cursor (종목 뉴스 매핑)
- 환경: 맥북 darwin, Node, vitest 2.1.9
- 범위: 짧은 티커가 제목에 붙지 않는지, RSS가 종목 코드를 넣는지

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| `statement-mcap.test.ts` | `packages/core` vitest | 6 tests passed |

## 검증 못 함
- RSS 수집을 다시 돌려 새 행의 `symbols`를 DB에서 확인
- `/invest` 관심 종목 뉴스 클릭
- KIS 시세, RAG 임베딩
