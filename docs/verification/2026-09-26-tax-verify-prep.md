# 2026-09-26 — tax 원문 대조 준비 (3파일)

- 환경: 저장소 JSON만. **값 대조·`verifiedBy` 갱신은 사용자가 한다.** AI는 숫자를 바꾸지 않음.
- 범위: `payroll-rates-2026.json` · `brackets.json` · `ei-stability.json`
- 절차: 아래 URL·조문을 연 뒤 entries `value`를 원문과 맞춘다. 맞으면 해당 entry(또는 defaults)의 `verifiedBy`를 `"사용자"`, `verifiedOn`을 `YYYY-MM-DD`로. 틀리면 값만 고치고 메타도 갱신.

## 1. `tax/payroll-rates-2026.json` (entries 10)
| 필드 | 내용 |
|---|---|
| defaults.asOf | `2026` |
| defaults.sourceTitle | 4대보험 연계센터·복지부 건정심(건강보험) |
| defaults.sourceUrl | https://www.4insure.or.kr/ |
| defaults.effectiveFrom~To | 2026-01-01 ~ 2026-12-31 |

| id | 현재 value | 대조 힌트 |
|---|---|---|
| rates.year | 2026 | 연도 |
| rates.nationalPensionEmployee | 0.0475 | 국민연금 근로자분(전체 9.5%의 절반) |
| rates.nationalPensionFloor | 410000 | 기준소득월액 하한(원) |
| rates.nationalPensionCap | 6590000 | 기준소득월액 상한(원). 기간 고시 확인 |
| rates.healthInsuranceTotal | 0.0719 | 건강보험 전체 요율 |
| rates.healthInsuranceEmployeeShare | 0.5 | 근로자 부담 비율 |
| rates.longTermCareIncomeRate | 0.009448 | 장기요양 소득 대비 |
| rates.employmentInsuranceEmployee | 0.009 | 고용보험 실업급여 근로자 |
| rates.localIncomeTaxOnNational | 0.1 | 지방소득세 = 국세의 10% |
| basicPersonalExemption | 1500000 | 본인 기본공제(원) |

## 2. `tax/brackets.json` (entries 155)
| 필드 | 내용 |
|---|---|
| defaults.asOf | `null` (조문 시행일에 맞춤 권장) |
| defaults.sourceTitle | 국세법령정보시스템·조문 문언 |
| defaults.sourceUrl | https://www.law.go.kr/ |
| defaults.article | 소득세법 제55조 등 |

구간 id 접두사 → 조문:

| prefix | 조문 | 칸 수(대략) |
|---|---|---|
| `itaArt55[i].{floor,cap,rateBp,addWon,quickDeductionWon}` | 소득세법 제55조 제1항 | 8칸 |
| `ihtaArt26[i].…` | 상속세 및 증여세법 제26조 | 5칸 |
| `ltaArt111House[i].…` | 지방세법 제111조 제1항 제3호 나목 | 4칸 |
| `cretArt9_2house[i].…` | 종부세법 제9조 제1항 제1호(2주택 이하) | 7칸 |
| `cretArt9_3house[i].…` | 종부세법 제9조 제1항 제2호(3주택 이상) | 7칸 |

`rateBp`는 베이시스포인트(600 = 6%). `cap` null = 그 이상. 라벨 문자열은 `bracketLabels`(숫자 아님).

## 3. `tax/ei-stability.json` (entries 6)
| 필드 | 내용 |
|---|---|
| defaults.asOf | `2026-01-01` |
| defaults.sourceTitle | 고용노동부 고시 제2025-47호 · 고용산재보험료징수법 시행령 제12조 |
| defaults.sourceUrl | https://www.moel.go.kr/ |
| defaults.article | 고용산재보험료징수법 시행령 제12조 |

| id | 현재 value | 대조 힌트 |
|---|---|---|
| minWage2026.hourly | 10320 | 시급(원). 고시 제2025-47호 |
| minWage2026.monthly209 | 2156880 | 월(209시간) |
| eiStabilityBands[0].rateBp | 25 | 상시 150명 미만 (0.25%) |
| eiStabilityBands[1].rateBp | 45 | 150명 이상 우선지원 |
| eiStabilityBands[2].rateBp | 65 | 150~1000명(우선지원 제외) |
| eiStabilityBands[3].rateBp | 85 | 1000명 이상·국가·지자체 |

`bandLabels`·`minWage2026.source`는 문자열만. `industrialAccidentNote`는 산재 업종요율 칸 안내.

## 대조 후
1. JSON만 수정. 새 숫자·새 id 금지.
2. `pnpm --filter @finvesting/core test` (data-tables는 미검증 개수 고정 없음).
3. 이 파일에 대조한 날짜·결과를 한 줄 남기거나 `docs/verification/YYYY-MM-DD-사용자.md`에 ✅.
