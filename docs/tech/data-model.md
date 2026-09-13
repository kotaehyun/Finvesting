# 데이터 모델

스키마 소스: `packages/db/src/schema/*.ts`. 이 문서와 스키마가 다르면 스키마 변경 시 문서를 같이 고친다.

## 사용자·프로필
| 테이블 | 역할 |
|---|---|
| `users` | 단일 사용자로 시작. 서비스화 대비 |
| `financial_profiles` | 세전/세후 월소득, 근로소득세, 건보료, 기타 고정비, 비상금 개월, 위험 성향. `pay_earnings` jsonb: 임금 구성항목 `[{ name, amount }]`. 기본 칸은 고용노동부 임금명세서 예시(기본급·연장/야간/휴일근로수당·가족수당·식대·직급수당·상여금·성과급). 지급 합이 있으면 그게 세전. 웹 `/profile` 프로필대장. 세후가 없으면 세전−세금−건보. 배분 가이드의 고정비 = 기타 고정비 + `recurring_costs` 합 |
| `recurring_costs` | 매달 빠져나가는 고정 세부내역 (휴대폰, 공과금, 주거 등). `/profile` 고정비 그리드에서 인라인 수정. CSV 가져오기/내보내기 (`이름,분류,금액,출금일,메모`). `profile.workspaceSave`로 기본정보·고정비·세액을 한 번에 저장 |
| `income_tax_months` | 근로소득세 월별 추이. 프로필 저장 시 해당 월 upsert. 거래 `income_tax`와 합쳐 그래프. `/profile` 추이 메뉴는 세액·소비·저축·투자 막대+선(X=월, Y=금액) |
| `payroll_months` | 월 급여 스냅샷(기본급·수당·상여·그 밖·세전·세금·보험·실수령). 프로필 저장 시 기준월 upsert. `/profile` 07 연봉 추이 12개월 그래프+상세표 |

## 계좌·거래 (Account)
| 테이블 | 역할 |
|---|---|
| `accounts` | 계좌. `name` 통장 이름, `institution` 은행/증권사. `type`(checking/savings/installment/brokerage/crypto/card/cash/pension/loan)이 자산 배분 분류 기준. **`balance`는 예수금(현금)**. 증권·코인·연금은 보유 평가액과 별개. 입출금·예적금은 통장 잔액. `/profile` 통장내역에서 은행·통장을 구분해 보고 `accounts.update`로 수정 |
| `savings_plans` | 예·적금 상품. 상품명·은행·종류(적금/예금)·연금리·단리/월복리·약정개월·월납(예금은 가입원금)·시작·만기·상품내용. 통장 `account_id`는 선택. `/profile` 08 적금내역 |
| `savings_contributions` | 상품별 월 납입. `(plan_id, month)` 유니크. 금액은 numeric |
| `transactions` | 입출금 원장. `amount`는 항상 양수, `direction`(in/out/transfer)으로 방향. `category`로 수입/고정비/변동비/저축·투자 분류. CSV 가져오기는 입금=`other_income`, 출금=`uncategorized`. `/accounts`에서 `transactions.updateCategory`로 수정(입금은 수입 분류, 출금은 지출·저축 분류만). `source`는 `csv:<파서id>`, `raw`에 원본 행. 같은 계좌·날짜·금액·방향·메모는 재업로드 시 건너뜀 |

카테고리 → 현금흐름 분류 매핑은 `packages/core/src/cashflow.ts`의 상수가 기준. 고정비에 `phone`·`income_tax`·`health_insurance` 포함. `/profile` 07 임금명세서는 근로기준법 시행령 제27조의2·고용노동부 작성 예시(지급|공제 양란, 매월지급·격월/부정기). 차변=지급, 대변=공제·보통예금(실수령). 급여전표 차변합=대변합=세전. 월 보통예금 여유=차변−대변. 추이(`core/trends.ts`) 소비는 이체·저축·투자·근로소득세를 뺀 출금. 통장내역은 `transactions.listAll`.

## 투자 (Investment)
| 테이블 | 역할 |
|---|---|
| `instruments` | 종목 마스터. `(symbol, market)` **유니크**. 시세·뉴스·보유가 모두 참조. 워커 `ensureInstrument` 또는 `trades.ensureInstrument`로 생성 |
| `trades` | 체결 원장. 보유 수량·평단·실현손익은 저장하지 않고 `core/portfolio.ts`로 계산. **계좌별**로 포지션을 나눔(같은 종목이 증권사마다 있으면 행이 둘). 자산군·계좌 소계는 `core/holdings-summary.ts`. 웹 `/holdings`에서 입력, `/profile` 09 투자내역에서 전체·계좌·주식/ETF/채권/펀드/코인을 조회. 평가손익은 종목 최근 `market_quotes.close` (해외는 `USDKRW`가 있으면 원화 환산). **대시보드 투자자산 = 보유 평가액 + 증권·코인·연금 예수금** (`core/invested.ts`) |
| `investment_incomes` | 배당·이자 수취 (세금·현금흐름 양쪽에 사용) |
| `research_notes` | 종목 노트, 매수/매도 근거 |
| `watchlist` | 관심 종목. `user_id` → `users.id` FK |

## 재무제표·펀더멘털 (worker가 채움)
| 테이블 | 역할 | 유니크 |
|---|---|---|
| `financial_statements` | 기간별 재무제표. `statement`(income/balance/cashflow), `fiscal_period`(FY/Q1~Q4), `items` jsonb에 표준 키(revenue, operating_income, net_income, eps_diluted, total_assets, total_liabilities, total_equity, cfo). 원본은 `raw` | (instrument, fy, period, statement, consolidated, source) |
| `instrument_fundamentals` | 일 단위 지표 스냅샷: 시총, PER, forward PER, PBR, EPS, ROE, 배당수익률, TTM 매출·순이익, 부채비율, 베타. 소스별 추가 지표는 `extra` | (instrument, date, source) |
| `instrument_identifiers` | 외부 식별자 매핑 — dart corp_code, sec CIK, yahoo 티커, kis 코드 | (provider, external_id) |

## 시장 데이터 (worker가 채움)
| 테이블 | 역할 | 유니크 |
|---|---|---|
| `market_quotes` | 일봉 시세 | (instrument_id, date) |
| `macro_indicators` | 환율·기준금리·CPI·국채금리 등. `code`로 구분 | (code, date) |
| `market_news` | 제목·링크·요약만 저장 (본문 X). `embedding` vector(768)는 RAG용 | url |
| `economic_events` | 경제 캘린더 | (title, scheduled_at) |

## 금액 타입
`numeric`으로 저장, 앱에서는 `Number()`로 변환. 코인은 수량 소수점 8자리.

## 마이그레이션
```
pnpm db:generate   # 스키마 변경 → drizzle/ SQL 생성
pnpm db:migrate    # 적용
```
`0002_yielding_paibok`: `financial_profiles.pay_earnings` jsonb.
`0003_curious_dreaming_celestial`: `savings_plans` · `savings_contributions`.
`0004_big_captain_stacy`: `payroll_months`.
pgvector 확장은 첫 마이그레이션 전에 `CREATE EXTENSION IF NOT EXISTS vector;` 필요 (seed/000_extensions.sql).
