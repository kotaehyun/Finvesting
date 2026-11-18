# 2026-11-12 — Cursor (세율 사용자 스탬프)

> 준비표: [2026-09-26-tax-verify-prep.md](./2026-09-26-tax-verify-prep.md).  
> 사용자가 「맞은 칸만 스탬프」를 고름. `value`는 바꾸지 않음.

## 실행한 것
- `payroll-rates-2026.json` defaults+entries 13, `brackets.json` 156, `ei-stability.json` 7
- `verifiedBy` 「사용자」, `verifiedOn` `2026-11-12`
- core `data-tables`·`payroll`·`tax-brackets`·`tax` 26테스트 통과. 집계: tax entries 432, 미검증 259

## 그대로 둔 것
- `civil-pay-2026.json` 258칸, `corp-local-rate.json` 1칸. ERP 보류라 이번 3파일 밖
- `cgtFlatRates`·`giftDeductions`는 `verifiedBy` 칸이 없음. 11-09 대조에서 세율·공제액은 조문과 같았음
