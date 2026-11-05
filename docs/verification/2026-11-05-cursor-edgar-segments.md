# 검증 — 2026-11-05 Cursor (미국 10-K 부문매출)

## 실행한 것
- `packages/core` `edgar-xbrl-segments` vitest 4건 통과
- `collectEdgarCompanyProfile()` 1회: `{ upserted: 126, catalog: "ok", years: [2026,2025,2024], elapsedMs: ~82s }`
- DB `company_year_facts` kind=segment source=edgar · 비어 있지 않은 행 **81** · 종목 **38**
- 샘플: AAPL 2026 IPhone 254.1B / Service 123.3B / Mac·Wearables·IPad. GOOGL·NVDA·AMZN·WMT 등도 행 있음

## 못 한 것 / 비움
- 일부 종목·연도 XML은 있으나 파서가 인식하는 단일 차원 매출 없으면 empty
- 주주·배당 EDGAR 수집 없음
- `/statements?q=AAPL` 사업부문 칸 브라우저 클릭 전수 확인은 이번 미실행
