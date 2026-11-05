# 2026-11-04 — Cursor (부문매출 XBRL)
- 환경: 맥북, DART_API_KEY, Docker DB
- 범위: `fnlttXbrl` → 연결 부문/제품 매출

## 검증됨 (실제 실행)
| 항목 | 방법 | 결과 |
|---|---|---|
| `dart-xbrl-segments.test.ts` | vitest | 4건 통과 |
| 삼성 2024 | OpenDART XBRL upsert | DX 175조·DS 111조·SDC 29조·Harman 14조 |
| 하이닉스 2024 | 동일 | DRAM 45조·NAND 19조·기타 2조 |
| 네이버 2024·2023 | 동일 | 서치·커머스·콘텐츠·핀테크·클라우드 |

## 검증 못 함 / 비움
- 삼성·네이버 2022, 하이닉스 2023–2022: 파서 기준 매칭 0 (구조 상이 가능)
- 섹터 전 종목 일괄 프로필 수집
- `/statements` 브라우저 사업부문 칸

## 정적 검토
| 항목 | 판단 |
|---|---|
| SinglAcntAll member 경로 | 공식 문서상 account_detail는 SCE 전용 → XBRL로 교체 |
