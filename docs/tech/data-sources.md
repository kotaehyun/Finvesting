# 데이터 수집 소스

수집기: `apps/worker`. 소스별 어댑터는 `src/sources/*.ts`, 스케줄은 `src/index.ts`.
원칙: **정식 API 우선, 크롤링은 API가 없는 것만.** 뉴스 본문은 저장하지 않는다(저작권).
범위: **국내 + 해외.** 해외주식·코인·환율 판단에는 미국 금리·CPI·달러·VIX가 국내 지표만큼 중요하므로 처음부터 함께 수집한다. `macro_indicators.code`는 국가 접두어로 구분(`US_*`, 접두어 없음 = 한국).

## 현재 구현
| 소스 | 어댑터 | 방식 | 스케줄 | 키 | 저장 테이블 |
|---|---|---|---|---|---|
| 국내 뉴스 RSS — 한국경제(금융)·매일경제·연합뉴스(경제) | `rss.ts` | RSS | 15분 | 불필요 | `market_news` (raw.lang=ko, board=news). 웹 `/news` 분류: 한경=국내 금융, 매경·연합=국내 경제 |
| 해외 뉴스 RSS — CNBC, MarketWatch, Fed·ECB 보도자료 | `rss.ts` | RSS | 15분 | 불필요 | `market_news` (raw.lang=en, board=news). 웹 `/news` 분류: CNBC·MW=해외 시황, Fed·ECB=중앙은행 |
| 오피니언 RSS — 한경·연합 오피니언, Seeking Alpha, Project Syndicate, FT Opinion | `rss.ts` | RSS. 2026-09-13 GET 확인. 매경 공식 RSS 목록에 오피니언 없음. 증권사 리포트 공개 RSS 없음 | 15분 | 불필요 | `market_news` (raw.board=opinion). 웹 `/opinions`: 국내 칼럼·애널리스트·해외 오피니언. 애널리스트 열은 SA + 국내 뉴스 제목(목표가·투자의견) |
| 업비트 일봉 | `upbit.ts` | 공개 API. 대상 = 보유·관심 `market=UPBIT` ∪ `UPBIT_TARGETS`(있으면) | 5분 | 불필요 | `market_quotes` |
| 한국은행 ECOS — 원/달러, 기준금리, CPI, 국고채3년 | `ecos.ts` | API | 09·18시 | `ECOS_API_KEY` | `macro_indicators` (USDKRW, BOK_BASE_RATE, CPI, KTB_3Y) |
| 미국 FRED — 연방기금금리, CPI, 국채 2y/10y, 달러지수, 실업률, VIX | `fred.ts` | API | 07·19시 | `FRED_API_KEY` (무료) | `macro_indicators` (US_*, DXY_BROAD, VIX) |
| Yahoo Finance — 보유·관심 종목 시세 + 세계 지수 + `KRW=X`→USDKRW | `yahoo.ts` | 비공식 `yahoo-finance2` v3. 대상 = trades∪watchlist ∪ `YAHOO_TARGETS` ∪ `core/world-indices`(KOSPI·S&P 등, 2026-09-13 chart 확인). KRX는 `.KS` 실패 시 `.KQ`. `KRW=X`는 `macro_indicators` USDKRW. 429 → `YAHOO_GAP_MS` | 30분 | 불필요 | `market_quotes`, `instrument_fundamentals`, `macro_indicators`. 웹 `/invest` |
| 금감원 DART — 한국 상장사 연결 재무제표 + 감사의견 | `dart.ts` | 공식 API. 타깃은 `종목코드:corp_code:이름`. 재무는 `fnlttSinglAcnt`, 감사는 `accnutAdtorNmNdAdtOpinion`(감사인·의견·강조·핵심감사사항만, 본문 X). 형식 불량이거나 금액 파싱 실패는 skip | 매주 월 | `DART_API_KEY`, `DART_TARGETS` | `financial_statements`, `audit_reports`. 웹 `/statements` |
| SEC EDGAR — 미국 상장사 10-K/10-Q (XBRL companyfacts) | `edgar.ts` | 공식 API. `SEC_USER_AGENT` 없으면 skip. 같은 기간·항목은 `end`가 최신인 fact | 매주 월 | `SEC_USER_AGENT` 필수, `EDGAR_TARGETS` | `financial_statements` |

ECOS 통계코드는 `ecos.ts`의 `SERIES`에 있으며 ECOS 사이트에서 검증 필요(코드가 바뀌기도 함).

## 재무제표·스크리너 사이트별 방침
| 사이트 | 정식 API | 방침 |
|---|---|---|
| **DART** (한국) | 있음(무료) | 재무제표 원천. `dart.ts` |
| **SEC EDGAR** (미국) | 있음(무료) | 재무제표 원천. `edgar.ts` |
| **Yahoo Finance** | 없음(비공식 라이브러리) | 개인 사용은 `yahoo-finance2`. 서비스화 시 정식 공급자(Polygon, EODHD, Financial Modeling Prep 등)로 교체 |
| **Finviz** | 무료 API 없음(Elite는 CSV export) | 크롤링 안 함. `/invest`에 맵·스크리너 원문 링크만 (ADR 0009) |
| **TradingView** | 없음 | 크롤링 금지. `/invest`에 공식 임베드(`s3.tradingview.com/external-embedding`, 2026-09-13 GET 200). 데이터 저장 없음 |
| **Investing.com** | 없음 | 크롤링 안 함(Cloudflare 403). `/invest`에 세계 지수·캘린더 링크만 |
| **재무제표 해설 서비스** (예: 증권사 리포트, 유튜브 요약) | 없음 | 저장하지 않음. DART/EDGAR 숫자 + 감사의견을 로컬 LLM이 `/statements` 「읽어주기」·챗에서 설명 (`docs/tech/ai.md`) |
| **재무제표를 읽는 사람들** (`drcr.co.kr`) | 없음 | 참조 링크만. `/statements` 「기업정보 조회 · 해설 참조」. 본문·크롤링 금지 |
| **DART 기업개황·회사별 공시·감사보고서 검색, OpenDART 재무정보조회** | 조회 UI | 링크만 (`core/disclosure-links`). 감사의견은 의견 한 줄 + 회계법인 홈·DART 원문 |

## `/statements` 외부 링크 (`packages/core/src/disclosure-links.ts`)
- 기업개황 `dsae001`, 기업정보 팝업 `SearchCompanyIR_M.html?textCrpNM=`, 회사별 공시 `dsab001`, OpenDART 재무조회 `fnltt/singlindx`, 감사보고서 검색 `dsab007`, 뷰어 `dsaf001?rcpNo=`
- 회계법인: 삼일(PwC)·삼정(KPMG)·안진(Deloitte)·한영(EY) 홈. 미매칭은 한국공인회계사회 (`kicpa.or.kr`)

## 표준 재무 항목 키 (`financial_statements.items`)
`revenue`, `operating_income`, `net_income`, `eps_diluted`, `total_assets`, `total_liabilities`, `total_equity`, `cfo`. 소스별 계정명 매핑은 각 어댑터의 `ACCOUNT_MAP`/`TAGS`. 새 키를 추가하면 여기와 `data-model.md`에 반영.

## 계획
| 소스 | 방식 | 용도 | 상태 |
|---|---|---|---|
| 한국투자증권 KIS Open API | API (키 필요) | 국내·해외 주식 시세 | 미구현 |
| 네이버 뉴스 검색 API | API | 종목별 뉴스 | 미구현 |
| 경제 캘린더 (예: investing.com / 금통위·FOMC 일정) | 크롤링 | `economic_events` | 미구현 |
| DART corpCode.xml / SEC company_tickers.json | 파일 | 종목코드↔corp_code, 티커↔CIK 자동 매핑 (지금은 환경변수 수동) | 미구현 |
| watchlist·trades 테이블 → 수집 대상 자동화 | 내부 | 보유+관심 종목이 본 대상, env는 보조 | **구현** (`core/quote-targets.ts`, ADR 0007). KIS 국내 시세는 미구현 |
| Finviz 스크리너 (개인용) | 라이브러리/크롤링 | 스크리너 조건 결과 → 관심 종목 후보 | 미구현 |
| TradingView 위젯 | 임베드 | `/invest` 차트·히트맵·스크리너·캘린더 | **구현** (ADR 0009) |
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
