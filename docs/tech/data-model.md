# 데이터 모델

스키마 소스: `packages/db/src/schema/*.ts`. 이 문서와 스키마가 다르면 스키마 변경 시 문서를 같이 고친다.

## 사용자·프로필
| 테이블 | 역할 |
|---|---|
| `users` | 단일 사용자로 시작. 서비스화 대비 |
| `financial_profiles` | 세전/세후 월소득, 근로소득세, 건보료, 기타 고정비, 비상금 개월, 위험 성향. `pay_earnings` jsonb: 임금 구성항목. `invest_style` jsonb: 투자기간·경험·손실감수·목적 설문 (`core/invest-style`). 웹 `/profile` 01 기본정보 · 10 투자성향. 세후가 없으면 세전−세금−건보. 배분 가이드의 고정비 = 기타 고정비 + `recurring_costs` 합 |
| `recurring_costs` | 매달 빠져나가는 고정 세부내역 (휴대폰, 공과금, 주거 등). `/profile` 고정비 그리드에서 인라인 수정. CSV 가져오기/내보내기 (`이름,분류,금액,출금일,메모`). `profile.workspaceSave`로 기본정보·고정비·세액을 한 번에 저장 |
| `income_tax_months` | 근로소득세 월별 추이. 프로필 저장 시 해당 월 upsert. 거래 `income_tax`와 합쳐 그래프. `/profile` 추이 메뉴는 세액·소비·저축·투자 막대+선(X=월, Y=금액) |
| `payroll_months` | 월 급여 스냅샷(기본급·수당·상여·그 밖·세전·세금·보험·실수령). 프로필 저장 시 기준월 upsert. `/profile` 07 연봉 추이 12개월 그래프+상세표 + 연말정산(고용노동부 연 합 명세·과세표준 기초, ADR 0013) |

## 계좌·거래 (Account)
| 테이블 | 역할 |
|---|---|
| `accounts` | 계좌. `name` 통장 이름, `institution` 은행/증권사. `type`(checking/savings/installment/brokerage/crypto/card/cash/pension/loan)이 자산 배분 분류 기준. **`balance`는 예수금(현금)**. 증권·코인·연금은 보유 평가액과 별개. 입출금·예적금은 통장 잔액. `/profile` 통장내역에서 은행·통장을 구분해 보고 `accounts.update`로 수정 |
| `savings_plans` | 예·적금 상품. 상품명·은행·종류(적금/예금)·연금리·단리/월복리·약정개월·월납(예금은 가입원금)·시작·만기·상품내용. 통장 `account_id`는 선택. `/profile` 08 적금내역 |
| `savings_contributions` | 상품별 월 납입. `(plan_id, month)` 유니크. 금액은 numeric |
| `insurance_policies` | 민영 보험 증권. 상품명·보험사·종류·월보험료·사망/암/뇌/심장/상해/후유장해 가입액·실손 여부. 4대보험과 별개. `/profile` 11 보험내역. 보장 분석은 `core/insurance-coverage.ts` (육각·칠각). AI 추천은 `insurance.recommend` (상품명 금지) |
| `transactions` | 입출금 원장. `amount`는 항상 양수, `direction`(in/out/transfer)으로 방향. `category`로 수입/고정비/변동비/저축·투자/이체 분류. CSV 가져오기는 입금=`other_income`, 출금=`uncategorized`. `/accounts`에서 `transactions.updateCategory`로 수정(입·출금 모두 `transfer` 가능). 이체는 `summarizeCashflow`에서 수입·소비에 넣지 않음. `source`는 `csv:<파서id>`, `raw`에 원본 행. 같은 계좌·날짜·금액·방향·메모는 재업로드 시 건너뜀. 잔액은 파일에서 **가장 늦은 날짜**의 값을 쓰고, 그 날짜가 계좌의 기존 최신 거래보다 오래면 현재 잔액을 덮지 않음. `commitImport`·`profile.workspaceSave`는 DB 트랜잭션 |

카테고리 → 현금흐름 분류 매핑은 `packages/core/src/cashflow.ts`의 상수가 기준. 고정비에 `phone`·`income_tax`·`health_insurance` 포함. 분류 `transfer`와 `direction=transfer`는 수입·소비·저축에서 제외. `/profile` 07 임금명세서는 근로기준법 시행령 제27조의2·고용노동부 작성 예시(지급|공제 양란, 매월지급·격월/부정기). 연말정산 칸은 같은 양란의 12개월 합 + 소득세법 과세표준 기초(홈택스 제출 아님). 차변=지급, 대변=공제·보통예금(실수령). 급여전표 차변합=대변합=세전. 월 보통예금 여유=차변−대변. 추이(`core/trends.ts`) 소비는 이체·저축·투자·근로소득세를 뺀 출금. 통장내역은 `transactions.listAll`.

홈 `dashboard.overview`는 선택 월의 거래로 현금흐름을 계산하고, 계좌 `balance`는 항상 현재 값이다. 월말 순자산 스냅샷 테이블은 없다. 확인할 일(미분류·시세 누락)과 적금·고정비 **예정**은 프로필 데이터로만 표시하고 실제 거래와 구분한다.

## 투자 (Investment)
| 테이블 | 역할 |
|---|---|
| `instruments` | 종목 마스터. `(symbol, market)` **유니크**. 시세·뉴스·보유가 모두 참조. 워커 `ensureInstrument` 또는 `trades.ensureInstrument`로 생성 |
| `trades` | 체결 원장. 보유 수량·평단·실현손익은 저장하지 않고 `core/portfolio.ts`로 계산. **계좌별**로 포지션을 나눔(같은 종목이 증권사마다 있으면 행이 둘). 자산군·계좌 소계는 `core/holdings-summary.ts`, 통화 비중·평가손익 기여도도 같은 파일. 웹 `/holdings`에서 입력, `/profile` 09 투자내역에서 전체·계좌·주식/ETF/채권/펀드/코인을 조회. 평가손익은 종목 최근 `market_quotes.close` (해외는 `USDKRW`가 있으면 원화 환산). 화면 표시는 `core/signed-amount.ts`로 `+`/`−`와 한국식 적청(상승 빨강·하락 파랑). 추가·삭제 시 해당 계좌 체결을 시간순으로 다시 계산해 어느 시점에도 매도가 보유를 넘지 않게 한다. **대시보드 투자자산 = 보유 평가액 + 증권·코인·연금 예수금** (`core/invested.ts`) |
| `investment_incomes` | 배당·이자 수취 (세금·현금흐름 양쪽에 사용) |
| `research_notes` | 종목 노트, 매수/매도 근거 |
| `watchlist` | 관심 종목. `user_id` → `users.id` FK. 워커 수집 대상. 웹 검색에서 `market.watchAdd` / 목록에서 삭제 |

## 재무제표·펀더멘털 (worker가 채움)
| 테이블 | 역할 | 유니크 |
|---|---|---|
| `financial_statements` | 기간별 재무제표. `statement`(income/balance/cashflow), `fiscal_period`(FY/Q1~Q4), `items` jsonb에 표준 키(revenue, operating_income, net_income, eps_diluted, total_assets, total_liabilities, total_equity, cfo). 원본은 `raw`. 웹 `/statements` | (instrument, fy, period, statement, consolidated, source) |
| `audit_reports` | DART 정기보고서 감사인·감사의견·강조사항·핵심감사사항. 본문(PDF/XML)은 저장하지 않음. 화면은 의견 + 회계법인·DART 링크. KAM/강조는 저장만 하고 전문을 나열하지 않음 | (instrument, fy, report_code, source) |
| `instrument_fundamentals` | 일 단위 지표 스냅샷: 시총, PER, forward PER, PBR, EPS, ROE, 배당수익률, TTM 매출·순이익, 부채비율, 베타. 소스별 추가 지표는 `extra`. 웹 `/fundamentals`. Yahoo 단위: 배당수익률=퍼센트 숫자, ROE=비율, D/E=×100 (2026-09-14 AAPL 확인) | (instrument, date, source) |
| `instrument_identifiers` | 외부 식별자 매핑 — dart corp_code, sec CIK, yahoo 티커, kis 코드 | (provider, external_id) |

## 시장 데이터 (worker가 채움)
| 테이블 | 역할 | 유니크 |
|---|---|---|
| `macro_indicators` | 환율·기준금리·CPI·국채금리 등. `code`로 구분. 환율: USDKRW 등. 인플레이션 맵: `WB_INFL_KR`. 금리 맵: `BIS_POL_KR`. 부동산 시도 가계대출: `ECOS_HHLOAN_SE` 등(십억원, 시·구 아님). 예금은행 가중평균 대출금리: `ECOS_LOAN_NEW_HH` 등(%). 웹 `/invest` 환율 · `/markets` 물가·금리 · `/realty` 대출 그래프·금리 표 | (code, date) |
| `market_quotes` | 일봉 시세. 세계 지수는 `instruments.market=INDEX`, 비트코인 Yahoo는 `CRYPTO`(`BTC-USD`). 업비트 BTC는 원화 칸. 웹 `/invest` | (instrument_id, date) |
| `market_news` | 제목·링크·요약만 저장 (본문 X). `embedding` vector(768)는 RAG용. `/news`=`newsFeed`(오피니언 소스 제외). `/opinions`=`opinionFeed`(전용 RSS + 제목 투자의견). `/markets` 크립토·외환, `/realty` 한경 부동산. 뉴스 분류 `core/news-category`(realty·crypto·fx 포함), 오피니언 `core/opinion-category` | url |
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
`0005_free_blonde_phantom`: `insurance_policies`.
`0006_absent_jetstream`: `audit_reports`.
`0007_cloudy_star_brand`: `financial_profiles.invest_style` jsonb (투자성향 설문).
pgvector 확장은 첫 마이그레이션 전에 `CREATE EXTENSION IF NOT EXISTS vector;` 필요 (seed/000_extensions.sql).
