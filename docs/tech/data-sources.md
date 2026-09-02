# 데이터 수집 소스

수집기: `apps/worker`. 소스별 어댑터는 `src/sources/*.ts`, 스케줄은 `src/index.ts`.
원칙: **정식 API 우선, 크롤링은 API가 없는 것만.** 뉴스 본문은 저장하지 않는다(저작권).
범위: **국내 + 해외.** 해외주식·코인·환율 판단에는 미국 금리·CPI·달러·VIX가 국내 지표만큼 중요하므로 처음부터 함께 수집한다. `macro_indicators.code`는 국가 접두어로 구분(`US_*`, 접두어 없음 = 한국).

## 현재 구현
| 소스 | 어댑터 | 방식 | 스케줄 | 키 | 저장 테이블 |
|---|---|---|---|---|---|
| 국내 뉴스 RSS — 한국경제·매일경제·연합뉴스 | `rss.ts` | RSS | 15분 | 불필요 | `market_news` (raw.lang=ko) |
| 해외 뉴스 RSS — CNBC, MarketWatch, Fed·ECB 보도자료 | `rss.ts` | RSS | 15분 | 불필요 | `market_news` (raw.lang=en) |
| 업비트 BTC/ETH/SOL/XRP 일봉 | `upbit.ts` | 공개 API | 5분 | 불필요 | `market_quotes` |
| 한국은행 ECOS — 원/달러, 기준금리, CPI, 국고채3년 | `ecos.ts` | API | 09·18시 | `ECOS_API_KEY` | `macro_indicators` (USDKRW, BOK_BASE_RATE, CPI, KTB_3Y) |
| 미국 FRED — 연방기금금리, CPI, 국채 2y/10y, 달러지수, 실업률, VIX | `fred.ts` | API | 07·19시 | `FRED_API_KEY` (무료) | `macro_indicators` (US_*, DXY_BROAD, VIX) |
| Yahoo Finance — 미국 주식/ETF/지수 시세 + 핵심 지표(시총·PER·PBR·EPS·배당·베타) | `yahoo.ts` | 비공식 라이브러리 `yahoo-finance2` | 30분 | 불필요, `YAHOO_TARGETS` | `market_quotes`, `instrument_fundamentals` |
| 금감원 DART — 한국 상장사 연결 재무제표(사업보고서) | `dart.ts` | 공식 API | 매주 월 | `DART_API_KEY`, `DART_TARGETS` | `financial_statements` |
| SEC EDGAR — 미국 상장사 10-K/10-Q (XBRL companyfacts) | `edgar.ts` | 공식 API | 매주 월 | 키 불필요, `SEC_USER_AGENT` 필수, `EDGAR_TARGETS` | `financial_statements` |

ECOS 통계코드는 `ecos.ts`의 `SERIES`에 있으며 ECOS 사이트에서 검증 필요(코드가 바뀌기도 함).

## 재무제표·스크리너 사이트별 방침
| 사이트 | 정식 API | 방침 |
|---|---|---|
| **DART** (한국) | 있음(무료) | 재무제표 원천. `dart.ts` |
| **SEC EDGAR** (미국) | 있음(무료) | 재무제표 원천. `edgar.ts` |
| **Yahoo Finance** | 없음(비공식 라이브러리) | 개인 사용은 `yahoo-finance2`. 서비스화 시 정식 공급자(Polygon, EODHD, Financial Modeling Prep 등)로 교체 |
| **Finviz** | 무료 API 없음(Elite는 CSV export) | 스크리너 결과 페이지 크롤링은 약관 위반 소지. 개인 사용 한정으로 `finviz` npm 라이브러리 검토, 저장은 `instrument_fundamentals.extra`에. 서비스화 시 제거 |
| **TradingView** | 없음 | 크롤링 금지(약관). 대신 **공식 임베드 위젯**(차트, 스크리너, 경제 캘린더)을 웹 화면에 삽입 — 데이터 저장 없이 화면 표시용 |
| **Investing.com** | 없음 | Cloudflare 차단·약관 문제로 크롤링 비권장. 경제 캘린더는 대안(TradingView 위젯, FRED 발표 일정, 금통위·FOMC 공식 일정 페이지) 사용 |
| **재무제표 해설 서비스** (예: 증권사 리포트, 유튜브 요약) | 없음 | 저장하지 않음. 필요하면 DART/EDGAR 원본을 로컬 LLM이 요약하는 기능으로 대체 (`docs/tech/ai.md` 계획) |

## 표준 재무 항목 키 (`financial_statements.items`)
`revenue`, `operating_income`, `net_income`, `eps_diluted`, `total_assets`, `total_liabilities`, `total_equity`, `cfo`. 소스별 계정명 매핑은 각 어댑터의 `ACCOUNT_MAP`/`TAGS`. 새 키를 추가하면 여기와 `data-model.md`에 반영.

## 계획
| 소스 | 방식 | 용도 | 상태 |
|---|---|---|---|
| 한국투자증권 KIS Open API | API (키 필요) | 국내·해외 주식 시세 | 미구현 |
| 네이버 뉴스 검색 API | API | 종목별 뉴스 | 미구현 |
| 경제 캘린더 (예: investing.com / 금통위·FOMC 일정) | 크롤링 | `economic_events` | 미구현 |
| DART corpCode.xml / SEC company_tickers.json | 파일 | 종목코드↔corp_code, 티커↔CIK 자동 매핑 (지금은 환경변수 수동) | 미구현 |
| watchlist·trades 테이블 → 수집 대상 자동화 | 내부 | 환경변수 대신 관심·보유 종목에서 대상 읽기 | 미구현 |
| Finviz 스크리너 (개인용) | 라이브러리/크롤링 | 스크리너 조건 결과 → 관심 종목 후보 | 미구현 |
| TradingView 위젯 | 임베드 | 차트·경제캘린더 화면 표시 | 미구현 (web) |
| ECB SDW, BOJ, 중국 인민은행 | API·크롤링 | 유로·엔·위안 금리·환율 | 미구현 |
| 국제 원자재 (금·WTI) | FRED(일부) / 크롤링 | `macro_indicators` | 미구현 |
| 글로벌 경제 캘린더 (FOMC, ECB, CPI 발표, 실적) | 크롤링 | `economic_events` | 미구현 |
| 은행·카드·증권 거래내역 | CSV/엑셀 수동 업로드 | `transactions`, `trades` | 미구현 (파서 필요) |

## 어댑터 추가 방법
1. `src/sources/<name>.ts`에 `export async function collect<Name>()` 작성, `onConflictDoNothing/Update`로 멱등하게
2. `src/index.ts`의 `jobs`에 스케줄 추가, `run-once.ts`에도 추가
3. 이 문서 표 갱신

## 크롤링 주의
- robots.txt 확인, 요청 간격 두기, User-Agent 명시
- 이용약관상 금지된 사이트(증권사 HTS 데이터 등)는 크롤링하지 않음
- 저장은 제목·링크·요약·발행시각·수치까지만
