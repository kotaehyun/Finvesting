# 검증 — 2026-11-05 Cursor (국내 부문매출 재수집)

## 실행한 것
- `collectDartCompanyProfile()` 1회 (`apps/worker`, tsx)
- 결과: `{ upserted: 326, catalog: "ok", unmatched: [], years: [2025,2024,2023], elapsedMs: 596646 }`
- DB: `company_year_facts` kind=segment source=dart · 비어 있지 않은 행 **46** · 종목 **23**
- 샘플: 삼성 2024 DX/DS/SDC/Harman · 하이닉스 2025 DRAM/NAND/기타 · 네이버 2024 서치·커머스·콘텐츠·핀테크·클라우드
- `/statements` 웹 서버 기동 중(200). 이번 세션에서 종목별 사업부문 칸 클릭 전수 확인은 안 함

## 못 한 것 / 비움
- empty 경고 다수(XBRL에 OperatingSegments·Revenue 축 없거나 구조 다름). upsert는 행 있을 때만
- 미국 EDGAR 부문 수집 미실행
