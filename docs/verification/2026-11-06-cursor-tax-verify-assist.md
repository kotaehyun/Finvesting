# 검증 — 2026-11-06 Cursor (tax 원문 대조 보조)

> 준비표: [2026-09-26-tax-verify-prep.md](./2026-09-26-tax-verify-prep.md).  
> **AI는 JSON `value`·`verifiedBy`를 바꾸지 않음.** 아래는 공식 출처와 저장값 비교 결과. 최종 `verifiedBy=사용자`는 사용자 확인 후.

## 실행한 것
- 공식 페이지·고시·법령정보 검색으로 `payroll-rates-2026` · `ei-stability` · `brackets`(소득세법 제55조 구간) 대조
- `origin/dev`를 `main`(`dcf1f0f`)과 fast-forward 동기화·push

## 1. `payroll-rates-2026.json`

| id | 저장값 | 출처 요지 | 판정 |
|---|---|---|---|
| rates.year | 2026 | — | ✅ |
| rates.nationalPensionEmployee | 0.0475 | 전체 9.5%의 근로자 분담 4.75% (4insure·복지부) | ✅ |
| rates.nationalPensionFloor | 410000 | 복지부고시 제2026-31호 하한 410천원 | ⚠️ 값 일치. **적용은 2026.7.1~2027.6.30**. 1~6월은 하한 40만원 |
| rates.nationalPensionCap | 6590000 | 동 고시 상한 6,590천원 | ⚠️ 값 일치. **적용 동일(7월~)**. 1~6월 상한 637만원 |
| rates.healthInsuranceTotal | 0.0719 | 건정심·복지부 보도 7.19% (2026) | ✅ |
| rates.healthInsuranceEmployeeShare | 0.5 | 직장가입자 가입자·사용자 각 50% (4insure) | ✅ |
| rates.longTermCareIncomeRate | 0.009448 | 소득 대비 장기요양 0.9448% (복지부) | ✅ |
| rates.employmentInsuranceEmployee | 0.009 | 실업급여 근로자 0.9% (4insure·고용부) | ✅ |
| rates.localIncomeTaxOnNational | 0.1 | 지방소득세 = 소득세의 10% (관행·지방세법) | ✅ (문언 재확인 권장) |
| basicPersonalExemption | 1500000 | 본인 기본공제 150만원 | ✅ (소득세법 제50조 문언 재확인 권장) |

출처 링크: [4insure 모의계산](https://www.4insure.or.kr/pbiz/ntcn/inscSmlCalcView.do) · [고시 제2026-31호](https://www.law.go.kr/admRulLsInfoR.do?admRulSeq=2100000274228) · [건보 7.19%](https://www.mohw.go.kr/board.es?act=view&bid=0027&list_no=1487279&mid=a10503000000) · [장기요양 0.9448%](https://www.mohw.go.kr/board.es?act=view&bid=0027&list_no=1487817&mid=a10503010100&nPage=1&tag=)

## 2. `ei-stability.json`

| id | 저장값 | 출처 요지 | 판정 |
|---|---|---|---|
| minWage2026.hourly | 10320 | 고용노동부고시 제2025-47호 시급 10,320원 | ✅ |
| minWage2026.monthly209 | 2156880 | 동 고시 월 환산 2,156,880원(209시간) | ✅ |
| eiStabilityBands[0..3].rateBp | 25/45/65/85 | 고용산재보험료징수법 시행령 제12조 · 4insure 표(0.25~0.85%) | ✅ |

출처: [최저임금 고시](https://www.law.go.kr/admRulLsInfoP.do?admRulSeq=2100000262710) · [4insure 고용보험료율](https://www.4insure.or.kr/pbiz/feii/inscIntroView.do)

## 3. `brackets.json` — `itaArt55` (8구간)

NTS 서식 세율표(2023년 이후)와 저장값:

| 구간 | floor~cap | rateBp | addWon | quickDeductionWon | 판정 |
|---|---|---|---|---|---|
| 0 | 0~14,000,000 | 600 | 0 | 0 | ✅ |
| 1 | 14M~50M | 1500 | 840,000 | 1,260,000 | ✅ |
| 2 | 50M~88M | 2400 | 6,240,000 | 5,760,000 | ✅ |
| 3 | 88M~150M | 3500 | 15,360,000 | 15,440,000 | ✅ |
| 4 | 150M~300M | 3800 | 37,060,000 | 19,940,000 | ✅ |
| 5 | 300M~500M | 4000 | 94,060,000 | 25,940,000 | ✅ |
| 6 | 500M~1,000M | 4200 | 174,060,000 | 35,940,000 | ✅ |
| 7 | 1,000M~ | 4500 | 384,060,000 | 65,940,000 | ✅ |

`ihtaArt26` · `ltaArt111House` · `cretArt9_*` 전 칸은 이번 미실행(조문별 재대조 필요).

## 못 한 것 / 사용자 액션
1. JSON `verifiedBy`/`verifiedOn` 갱신 — 사용자만
2. 국민연금 상·하한: 연중 두 구간이면 스키마·effective 기간 분리 여부 결정(지시 시)
3. brackets 상속·지방·종부 구간 원문 대조
4. 홈택스 XLSX · `/erp`는 별도
