# 데이터 모델

스키마 소스: `packages/db/src/schema/*.ts`. 이 문서와 스키마가 다르면 스키마 변경 시 문서를 같이 고친다.

## 사용자·프로필
| 테이블 | 역할 |
|---|---|
| `users` | 단일 사용자로 시작. 서비스화 대비 |
| `financial_profiles` | 세후 월소득, 월 고정비, 비상금 목표 개월, 위험 성향, 목표 배분(JSON). **배분 가이드 계산 입력** |

## 계좌·거래 (Account)
| 테이블 | 역할 |
|---|---|
| `accounts` | 계좌. `type`(checking/savings/installment/brokerage/crypto/card/cash/pension/loan)이 자산 배분 분류 기준. `balance`는 현재 잔액 |
| `transactions` | 입출금 원장. `amount`는 항상 양수, `direction`(in/out/transfer)으로 방향. `category`로 수입/고정비/변동비/저축·투자 분류. `raw`에 CSV 원본 행 보존 |

카테고리 → 현금흐름 분류 매핑은 `packages/core/src/cashflow.ts`의 상수가 기준.

## 투자 (Investment)
| 테이블 | 역할 |
|---|---|
| `instruments` | 종목 마스터. `(symbol, market)` **유니크**. 시세·뉴스·보유가 모두 참조 |
| `trades` | 체결 원장. 보유 수량·평단·실현손익은 저장하지 않고 `core/portfolio.ts`로 계산 |
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
pgvector 확장은 첫 마이그레이션 전에 `CREATE EXTENSION IF NOT EXISTS vector;` 필요 (seed/000_extensions.sql).
