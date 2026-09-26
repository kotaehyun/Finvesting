# 데이터 수집 소스

수집기: `apps/worker`. 소스별 어댑터는 `src/sources/*.ts`, 스케줄은 `src/index.ts`.
원칙: **정식 API 우선, 크롤링은 API가 없는 것만.** 뉴스 본문은 저장하지 않는다(저작권).
범위: **국내 + 해외.** 해외주식·코인·환율 판단에는 미국 금리·CPI·달러·VIX가 국내 지표만큼 중요하므로 처음부터 함께 수집한다. `macro_indicators.code`는 국가 접두어로 구분(`US_*`, 접두어 없음 = 한국).

## 현재 구현
| 소스 | 어댑터 | 방식 | 스케줄 | 키 | 저장 테이블 |
|---|---|---|---|---|---|
| 국내 뉴스 RSS — 한국경제(금융)·매일경제·연합뉴스(경제)·한경 부동산 | `rss.ts` | RSS | 15분 | 불필요 | `market_news`. 웹 `/news`·`/realty` |
| 해외 뉴스 RSS — CNBC, MarketWatch, Fed·ECB, CoinDesk, Cointelegraph, FXStreet | `rss.ts` | RSS. 2026-09-14 CoinDesk·Cointelegraph·FXStreet·한경 부동산 GET 확인 | 15분 | 불필요 | `market_news`. `/news`·`/markets` |
| 오피니언 RSS — 한경·연합 오피니언, Seeking Alpha, Project Syndicate, FT Opinion | `rss.ts` | RSS. 2026-09-13 GET 확인. 매경 공식 RSS 목록에 오피니언 없음. 증권사 리포트 공개 RSS 없음 | 15분 | 불필요 | `market_news` (raw.board=opinion). 웹 `/opinions`: 국내 칼럼·애널리스트·해외 오피니언. 애널리스트 열은 SA + 국내 뉴스 제목(목표가·투자의견) |
| 업비트 일봉 | `upbit.ts` | 공개 API. 대상 = 보유·관심 `market=UPBIT` ∪ `UPBIT_TARGETS`(있으면). 최근 90일 일봉 | 5분 | 불필요 | `market_quotes`. 웹 `/invest` 비트코인 칸(원화) |
| 한국은행 ECOS — 원/달러, 기준금리, CPI, 국고채3년, **예금은행 지역별 가계대출 말잔**, **예금은행 가중평균 대출금리** | `ecos.ts` | API. 대출 잔액은 `151Y003` 월. 금리는 `121Y006`·`121Y015` 항목 이름 매칭. 시·구 없음 | 09·18시 | `ECOS_API_KEY` | `macro_indicators` (USDKRW, BOK_BASE_RATE, CPI, KTB_3Y, `ECOS_HHLOAN_*`, `ECOS_LOAN_*`) |
| 미국 FRED — 연방기금금리, CPI, 국채 2y/10y, 달러지수, 실업률, VIX | `fred.ts` | API | 07·19시 | `FRED_API_KEY` (무료) | `macro_indicators` (US_*, DXY_BROAD, VIX) |
| Yahoo Finance — 보유·관심 종목 시세 + 세계 지수·비트코인·원자재 + 원환율 + `KRW=X`→USDKRW + 주식·ETF 펀더멘털 | `yahoo.ts` | 비공식 `yahoo-finance2` v3. 대상 = trades∪watchlist ∪ `YAHOO_TARGETS` ∪ `DEFAULT_YAHOO_STOCKS`(카카오 `035720.KS`) ∪ `core/world-indices`(KOSPI·S&P·BTC-USD·GC=F·SI=F·HG=F·CL=F·BZ=F 등). 세계 지수는 `quote` 당일 + 일봉이 40일 미만이면 `chart` 90일. 환율은 `core/fx-pairs`(달러·유로·엔·위안·파운드)를 `macro_indicators`에. USDKRW는 같은 날짜 ECOS가 있으면 덮지 않음. KRX는 `.KS` 실패 시 `.KQ`. 주식·ETF는 `quote` + `quoteSummary`. 지수·상품·코인은 시세만. 429 → `YAHOO_GAP_MS` | 30분 | 불필요 | `market_quotes`, `instrument_fundamentals`, `macro_indicators`. 웹 `/invest`·`/fundamentals` |
| 금투협 FreeSIS — 투자자예탁금·신용융자 | `kofia.ts` | 메인 HTML (`stat/main.do`) 파싱. 단위 백만원. 위탁매매 미수금은 메인에 없어 저장하지 않음 | 평일 08·18시 | 불필요 | `macro_indicators` (`KOFIA_INVESTOR_DEPOSIT`, `KOFIA_CREDIT`, HTML에 있으면 `KOFIA_MARGIN`). 웹 `/invest` 도넛 |
| 금감원 DART — 한국 상장사 연결 재무제표 + 감사의견 | `dart.ts` | 공식 API. 타깃은 `종목코드:corp_code:이름`. 재무는 `fnlttSinglAcnt`, 감사는 `accnutAdtorNmNdAdtOpinion`(감사인·의견·강조·핵심감사사항만, 본문 X). 형식 불량이거나 금액 파싱 실패는 skip | 매주 월 | `DART_API_KEY`, `DART_TARGETS` | `financial_statements`, `audit_reports`. 웹 `/statements` |
| Yahoo 종목 검색 | (api `market.searchSymbols`) | `query1.finance.yahoo.com/v1/finance/search`, `newsCount=0`. 저장 없음 | 요청 시 | 불필요 | 웹 `/invest`·`/markets` |
| 세계은행 연간 CPI 상승률 | `worldbank.ts` | 공개 API `FP.CPI.TOTL.ZG`. 키 없음. 최신 연도 결측이면 이전 연도 | 매주 월 08시 | 불필요 | `macro_indicators` `WB_INFL_<ISO2>`. 웹 `/markets` |
| BIS 중앙은행 정책금리 | `bis.ts` | 공개 SDMX `WS_CBPOL` 월. 키 없음. 18개월보다 오래된 시계열은 저장 안 함 | 월·목 08시 | 불필요 | `macro_indicators` `BIS_POL_<ISO2>`. 웹 `/markets` |
| SEC EDGAR — 미국 상장사 10-K/10-Q (XBRL companyfacts) | `edgar.ts` | 공식 API. `SEC_USER_AGENT` 없으면 skip. 같은 기간·항목은 `end`가 최신인 fact | 매주 월 | `SEC_USER_AGENT` 필수, `EDGAR_TARGETS` | `financial_statements` |

ECOS 통계코드는 `ecos.ts`의 `SERIES`에 있으며 ECOS 사이트에서 검증 필요(코드가 바뀌기도 함).

## 재무제표·스크리너 사이트별 방침
| 사이트 | 정식 API | 방침 |
|---|---|---|
| **DART** (한국) | 있음(무료) | 재무제표 원천. `dart.ts` |
| **SEC EDGAR** (미국) | 있음(무료) | 재무제표 원천. `edgar.ts` |
| **Yahoo Finance** | 없음(비공식 라이브러리) | 개인 사용은 `yahoo-finance2`. `/fundamentals` **해외** 조회 링크(시세·key-statistics). 국내 종목 조회 링크는 아님 |
| **Finviz** | 무료 API 없음(Elite는 CSV export) | 크롤링 안 함. `/invest`에 맵·스크리너 원문 링크만 (ADR 0009) |
| **TradingView** | 없음 | 크롤링 금지. `/invest`에 공식 임베드(`tradingview-widget.com/embed-widget` iframe. 로더 스크립트는 React에서 contentWindow 오류가 나서 안 씀). 데이터 저장 없음 |
| **Investing.com** | 없음 | 크롤링 안 함(Cloudflare 403). `/invest`에 세계 지수·환율·비트코인·캘린더 링크만 |
| **네이버 증권** | 없음 | 크롤링 안 함. `/fundamentals` **국내** 조회 링크(`stock.naver.com/.../price`). `/invest`에 국내증시·코스피·코스닥 원문 링크 (2026-09-14 GET 200) |
| **카카오페이증권** | 없음 | 크롤링 안 함. `/fundamentals` 국내 조회 보조 링크(홈만. 종목별 URL 없음) |
| **금융투자협회 FreeSIS** | 일별 미수금 API 없음 | 메인 HTML만. `/invest` 예탁금·신용 그래프. 위탁매매 미수금은 칸(ADR 0030) |
| **한국투자증권** | KIS Open API(키) | HTS 크롤링 금지. `/invest`에 홈 링크만. API 시세는 미구현 |
| **한국거래소** | 공공데이터(키) | `/invest`에 `open.krx.co.kr` 링크만 |
| **재무제표 해설 서비스** (예: 증권사 리포트, 유튜브 요약) | 없음 | 저장하지 않음. DART/EDGAR 숫자 + 감사의견을 로컬 LLM이 `/statements` 「읽어주기」·챗에서 설명 (`docs/tech/ai.md`) |
| **재무제표를 읽는 사람들** (`drcr.co.kr`) | 없음 | 국내 한정. `/statements` 한국 조회에만 링크. `/fundamentals`·해외 종목에는 없음. 본문·크롤링 금지 |
| **DART 기업개황·회사별 공시·감사보고서 검색, OpenDART 재무정보조회** | 조회 UI | 한국 종목만 (`core/disclosure-links` `filingVenueFor`). 감사의견은 의견 한 줄 + 회계법인 홈·DART 원문 |
| **SEC EDGAR 회사검색·browse-edgar** | 조회 UI | 미국 티커만. `/statements`·`/invest` 검색. `/fundamentals`에는 없음 |

## `/statements` 외부 링크 (`packages/core/src/disclosure-links.ts`)
- 창구는 `filingVenueFor`. 한국: 기업개황 `dsae001`, 기업정보 팝업 `SearchCompanyIR_M.html?textCrpNM=`, 회사별 공시 `dsab001`, OpenDART 재무조회 `fnltt/singlindx`, 감사보고서 검색 `dsab007`, 뷰어 `dsaf001?rcpNo=`, 「재무제표를 읽는 사람들」
- 미국: EDGAR `browse-edgar?CIK=`·회사검색, Yahoo `/financials`. drcr 없음
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
| TradingView 위젯 | 임베드 | `/invest` 지수 차트·히트맵. `/markets` 거래량·크립토·외환 히트맵·기술분석 | **구현** (ADR 0009·0011·0012) |
| 한국 부동산 실거래·임대료 | 공공데이터 API (키) | `/realty` 유형별 건수·임대료 | 미구현 (아파트·오피스텔·다가구·연립·상가·빌딩·토지 칸만). 포털 매물 호수 크롤링 없음 (ADR 0017·0018) |
| 수도권 규제지역·대출 위험 | 정책브리핑·금융위 보도 요약 (`core/realty-ref`) | `/realty` 마인드맵 | **구현** (ADR 0014). 스크래핑 없음. 지정은 고시로 바뀜 |
| 전국 시·구 도면 | 통계청 2018 시군구 (`korea-plan.json`, MapLibre 3D 타일 없음) | `/realty` 도면 | **구현** (ADR 0015·0016·0018). 동탄구 면 없음(원). 높이는 시도 대출 비율. 규제 색은 수도권 |
| 예금은행 시도 가계대출 | ECOS `151Y003` 말잔(십억원) | `/realty` 17개 시도 총액·증가율·전국 대비 비중 | **구현** (ADR 0016·0017·0018). 시·구 숫자 없음. 가계신용/GDP 아님 |
| 예금은행 대출 금리 | 한은 가중평균 보도 + ECOS `121Y006`·`121Y015` 이름 매칭, COFIX 공시 | `/realty` 금리 표 | **구현** (ADR 0025). 은행 상품금리 스크래핑 없음. 8월 가중평균은 9/30 공표 |
| 전월세 점유·거래 비중 | 주거실태조사 2024 + 국토부 2026-07 주택통계 | `/realty` 전월세 칸 | **구현** (ADR 0026). 점유와 거래 건수는 분리. 전세만의 전국 칸은 원문 |
| 카드 연체·리볼빙 | 금감원 여전사 실적 + 여신금융협회 9개사 잔액 | `/realty` 상환 칸 | **구현** (ADR 0026). 리볼빙=결제성 이월. 스크래핑 없음 |
| 인구·출산·인구감소 | 국가데이터처 출생·국내이동 확정 공표, 행안부 인구감소지역 고시 | `/realty` 표·목록 | **구현** (ADR 0019). KOSIS API 키 없음. 시도 전입·전출 인원은 원문 PDF |
| 고위공직자 재산·주택 방향 | 인사혁신처 보도 + 관보. 공직윤리시스템 링크 | `/realty` 집계·광역단체장 소재 표 | **구현** (ADR 0019). 스크래핑 없음. 사적 자산가 명단 없음 |
| 종부세·양도세 지역 집계 | 기재부 고지(KDI) + TASIS·data.go.kr 링크 | `/realty` 고가주택 세금 방향 | **구현** (ADR 0020). 개인 조회·스크래핑 없음. 수도권 3곳만 인원. 양도세는 칸 |
| 공실·빈집·PIR·지니 | 부동산원 임대동향, 주택총조사, 주거실태조사, 가계금융복지조사 | `/realty` 시도 표 | **구현** (ADR 0021·0023). 공실은 자가·무상 제외. 급매·유찰은 칸 |
| 상환·경매·임대업·상권 | 한은 금안보, 대법원 경매신청, 금융위 RTI, 부동산원 수익률 | `/realty` 상환·빌딩 섹션 | **구현** (ADR 0023·0027). 영끌=고위험 청년 비중. 상권 매출·유찰 월별은 칸. 스크래핑 없음 |
| 개인회생·파산 원인 | 법원통계월보 신청 + 서울회생법원 파탄원인(중복응답) | `/realty` 상환 칸 | **구현** (ADR 0027). 주담대 전용 비중·면책률은 칸 |
| 금투협 증시자금 | FreeSIS 메인 HTML (백만원) | `/invest` 도넛·막대 | **구현** (ADR 0030). 예탁금·신용은 메인. 위탁매매 미수금 일별은 칸 |
| 법인 명의 주택 | 종부세 법인 집계 + 부동산원 거래주체별 링크 | `/realty` 창구 표 | **구현** (ADR 0021). 4급 등록·연예인 실명 없음 |
| 고액 자산 비중·이동 채널 | 가계금융복지조사, 상속·증여세(e-나라지표), 금감원 신탁업, 종부세 유형 | `/realty` 비중·채널 표 | **구현** (ADR 0024). 실명·등기 조회 없음. 거래원인·DART는 칸. 부동산신탁≠명의신탁 |
| 부동산 주장 vs 공식 | `core/realty-claims` + 한경 부동산 제목 키워드 | `/realty` 카드·숫자 칩 | **구현** (ADR 0019·0022). 유튜브 본문 저장 금지 |
| 혼인·출산 연령 코호트 | 총조사 연령대, 혼인·출생 공표, 주거실태조사 청년·신혼 | `/realty` 떠도는 말 칸 위 막대 | **구현** (ADR 0022). 매입 연령·연령별 소비는 칸. 등기광장 스크래핑 없음 |
| KRX 투자자별 거래실적 | 공공데이터·정보데이터시스템 | `/markets` 수급 숫자 | 미구현 (원문 링크) |
| ECB SDW, BOJ, 중국 인민은행 | API·크롤링 | 유로·엔·위안 금리·환율 | 미구현 |
| 국제 원자재 (금·은·구리·WTI·브렌트) | Yahoo 선물 | `/invest` 원자재 칸 | **구현** (ADR 0012). 두바이유 Yahoo 없음 |
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
