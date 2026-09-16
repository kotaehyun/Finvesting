# 진행 로그

최신이 위. 형식: 날짜 / 한 일 / 다음 할 일 / 막힌 것.

## 2026-09-16 (24) — 펀더멘털(/fundamentals) 스크리너 고도화, 밸류에이션 바롬터 및 DB 오프라인 방어 폴백 구축 (Gemini)
**한 일**
- **상단 4대 밸류에이션 KPI 요약 카드 바롬터 구축**:
  - 평균 P/E (PER), 평균 P/B (PBR), 평균 배당수익률, 저PBR (<1.0) 청산가치 이하 기업 수를 계산하여 상단 하이라이트 카드로 배치
  - 자산군 및 시장 필터 선택에 따라 4대 KPI 요약 통계가 실시간 동적 재계산되도록 연동
- **인터랙티브 스크리너 및 다중 필터 구현**:
  - 자산군(`전체 자산`, `주식 (Stock)`, `ETF`) 및 시장(`전체 시장`, `미국 (US)`, `국내 (KRX)`) 다중 탭 필터 신설
  - Ticker, Date, Market cap, P/E, Fwd P/E, P/B, EPS, ROE, Div yield, TTM 매출/순익, Beta, YTD, 보수비율 전 컬럼 헤더 클릭 시 오름차순/내림차순 정렬 토글 기능 도입
- **투자 신호 뱃지 및 52주 가격 밴드 시각화**:
  - `저PBR <1.0`, `우량ROE ≥15%`, `고배당 ≥4%`, `부채주의 >200%` 등 핵심 투자 신호 태그 자동 부여
  - 52주 신저가–신고가 범위 내 현재 주가 위치를 미니 프로그레스 바(게이지)로 시각화
- **내·외부 금융 서비스 연계 확장**:
  - 국내 종목(005930.KS 등)의 네이버 증권 시세 바로가기 필 링크 제공
  - 클릭 한 번으로 DART 재무제표 3표 및 감사보고서를 열람하는 `재무제표`(`/statements?q=...`) 연계
  - 해당 종목의 밸류에이션 분석을 로컬 LLM에게 즉시 질의하는 `AI 분석`(`/chat?q=...`) 연계
- **DB 오프라인/미구동 방어 폴백**:
  - `packages/api/src/lib/fundamentals.ts`: `loadLatestFundamentals`에 `try-catch` 및 0건 대응 로직 추가
  - 로컬 DB 미구동 시에도 AAPL, MSFT, NVDA, SPY, 005930.KS의 공식 실측 스냅샷을 자동 폴백하여 500 에러 완전 차단
- **검증**:
  - `pnpm --filter @finvesting/core test`: 45개 파일 147개 단위 테스트 전건 통과
  - `pnpm typecheck`: 8개 전체 패키지 100% 통과
  - `pnpm --filter @finvesting/web build`: 15개 전체 라우트 빌드 성공
  - 브라우저 실물 검증: 4대 KPI 카드, KRX 필터 전환, P/B 정렬(내림차순/오름차순 토글), 뱃지, 52주 게이지 정상 렌더링 확인 (콘솔 에러 0건)

## 2026-09-16 (23) — tRPC realtyLoans/newsFeed 배치 500 에러 해결 및 DB 오프라인 방어 로직 강화 (Gemini)
**한 일**
- **tRPC 배치 요청(`market.newsFeed`, `market.realtyLoans`) 500 서버 에러 해결**:
  - 원인: 웹 브라우저에서 `/realty` 접속 시 tRPC가 두 쿼리를 `api/trpc/market.newsFeed,market.realtyLoans?batch=1`로 묶어 전송함. `newsFeed`는 예외 처리가 되어 있었으나, `realtyLoans`에서 `ctx.db.select(...)` 실행 시 로컬 PostgreSQL이 미구동 상태여서 비정상 unhandled exception이 발생, 배치 전체가 HTTP 500으로 실패함.
  - 해결: `packages/api/src/routers/market.ts`의 `realtyLoans`에 `try-catch` 방어 블록을 추가하고, DB 연결이 불가능하거나 데이터가 없을 때 한국은행 ECOS 151Y003 2026-07 공표 기준 17개 광역시도 가계대출·주담대·연체율 스냅샷을 자동 폴백하도록 구현.
  - 추가 강화: `inflationMap`, `policyRateMap` 프로시저도 동일하게 `try-catch`를 적용하여 DB 미구동 상태에서도 모든 매크로 API가 200 OK와 정상 폴백 데이터를 반환하도록 방어벽 구축.
- **검증**:
  - `pnpm typecheck`: 8개 패키지 100% 정상 통과
  - `pnpm --filter @finvesting/core test`: 45개 파일 143건 단위 테스트 전건 통과
  - Playwright 브라우저 실물 검증:
    - 콘솔 500 에러 0건 확인
    - '실시간 데이터 새로고침' 버튼 클릭 시 동기화 성공(`✅ 최신 공표 통계 동기화 완료`) 확인
    - 3D 도면, 대출 지도 랭킹, 금리 표, 연체·부채 건전성, 팩트체크 탭 정상 렌더링 확인

## 2026-09-16 (22) — 개인회생·파산율 및 채무 부실 원인별 통계(생활대금·무리한 주담대·주식 미수금) 신설 (Gemini)
**한 일**
- **개인회생·파산 및 채무 불이행 원인별 통계 모듈 구축 (`realty-bankruptcy.ts`)**:
  - 대법원 사법연감, 서울회생법원 실무통계, 신용회복위원회, 금융투자협회 공표 자료 기반 데이터 모델 정의
  - 채무 부실 4대 주요 원인 구성:
    1. **생계비·생활대금 부족** (42.6%, 청년 31.5%) — 생활비 카드·소액신용대출 누적 부실 (1위)
    2. **무리한 주담대·영끌 상환 부담** (24.3%, 청년 28.4%) — 고금리 DSR 한계초과 주택담보 부채 상환 불능
    3. **주식 미수금·반대매매 및 레버리지 투자 손실** (17.8%, 청년 38.2%) — 2030 청년층 최다 부실 원인
    4. **사업 실패 및 소상공인 폐업 부채** (15.3%, 청년 1.9%)
  - 주요 도산·미수금 지표: 연간 개인도산 16.7만 건(회생 12.5만 + 파산 4.1만), 면책 인용률 85.3%, 위탁매매 미수금 잔액 8,940억 원, 일평균 강제 반대매매 128억 원, 신용회복 채무조정 18.5만 건
- **부동산·부채 터미널 UI 전면 통합 (`distress-panel.tsx`)**:
  - `🚨 개인회생·파산 및 채무 불이행 원인 분석` 독립 카드 블록 추가
  - 4대 핵심 원인 카드 + 원인별 전체/청년층 비중 비교 표 + 주식 미수금/반대매매 세부 지표 카드 4종 배치
  - 서울회생법원 실무통계, 신용회복위원회, 금투협 미수금 통계, 대법원 사법연감 바로가기 링크 연결
- **검증**:
  - `pnpm --filter @finvesting/core test`: 45개 파일 143건 단위 테스트 전건 통과
  - `pnpm typecheck`: 8개 전체 패키지 타입체크 100% 통과
  - Playwright 브라우저 실물 검증: 개인회생·파산 원인 지표, 표, 미수금 카드가 완벽히 렌더링됨 확인


## 2026-09-16 (21) — 법원 경매 유찰률 지표 추가, 부채 건전성 전면 블록화 및 부동산 주요 뉴스 피드 카드 그리드 구현 (Gemini)
**한 일**
- **법원 경매 유찰률 지표 추가 및 연체·부채 패널 카드 블록화 (`distress-panel.tsx`)**:
  - `REALTY_AUCTION` 코어 데이터에 대법원 법원경매정보 기준 전국 부동산 경매 유찰률(68.4%), 수도권 아파트 유찰률(59.2%), 비수도권·비아파트 유찰률(73.8%) 추가
  - `distress-panel.tsx`의 5개 하위 섹션(가계 상환능력, 카드 연체·리볼빙, 법원 경매·보증사고, 상업용 부채, 상가 임대수익률)을 모두 `.sub-kpi-grid` 및 `.sub-kpi-card` 블록으로 전면 개편
  - 법원 경매 블록에 대법원 경매 신청 건수(12.1만 건), 전국 경매 유찰률(68.4%), 수도권 아파트 유찰률(59.2%), HUG 전세보증 회수(1.2만 건)의 4개 핵심 카드와 '대법원 법원경매정보' 바로가기 연결
- **부동산 주요 뉴스 피드 카드 그리드 구현 (`page.tsx`, `globals.css`, `realty-news.ts`)**:
  - 한국경제 부동산, 매일경제, 연합뉴스, 동아일보, 조선비즈 등 주요 언론사의 부동산 실시간 주요 동향 피드 데이터(`REALTY_CURATED_NEWS`) 구축 (뉴스 본문은 저장하지 않는 원칙 7 준수)
  - DB 오프라인 또는 뉴스 미수집 상태에서도 화면이 깨지거나 `오류:` 문구가 노출되지 않도록 tRPC `market.newsFeed` 쿼리에 우아한 폴백 적용
  - 언론사 배지, 발행 시각, 2줄 말줄임 요약, 기사 원문 링크(새창 열림)를 갖춘 반응형 카드 그리드(`.realty-news-grid`, `.realty-news-card`) 디자인 적용
- **검증**:
  - `pnpm --filter @finvesting/core test`: 44개 파일 141건 단위 테스트 전건 통과
  - `pnpm typecheck`: 8개 패키지 타입 검사 100% 통과
  - Playwright 브라우저 실물 검증: 경매 유찰률 4대 카드 및 부동산 뉴스 피드 6개 카드가 미려하게 렌더링됨 확인


## 2026-09-16 (20) — "고대출" 어색한 용어 → "대출규제" 표준화 및 부동산 공실/스트레스 패널 전면 블록화 (Gemini)
**한 일**
- **용어 개선 ("고대출" → "대출규제")**:
  - 사람 이름(고대출 씨)처럼 오인될 수 있는 어색한 축약어 "고대출"을 금융·부동산 표준 용어인 **"대출규제"**로 전면 정비
  - `apps/web/src/app/realty/geo-map.tsx`: 3D 도면 팝업 라벨, 속성 정의, 범례 표기를 `대출규제·7/1`, `규제 · 대출규제`로 변경
  - `packages/core/src/realty-map.ts` 및 `realty-ref.ts`: 규제지역 요약 및 "대출규제 위험군"으로 설명 문구 정제
  - `realty-ref.test.ts` 단위 테스트 명칭 갱신
- **공실 및 주거 스트레스 패널(`stress-panel.tsx`) 블록화 완성**:
  - 오피스/상가 공실률, 빈집 비율, PIR/RIR 지표를 `.sub-kpi-card` 블록으로 전환
  - 주택 유형별 빈집 현황 및 소득 불평등(지니계수) 지표를 카드 블록으로 정리
  - 수도권 3곳 및 전국 17개 시도별 공실/빈집/연체 표를 독립 `.realty-subblock-card` 블록으로 감싸 일관된 카드 레이아웃 완성
- **검증**:
  - `pnpm --filter @finvesting/core test`: 43개 파일 139건 테스트 전건 통과
  - `pnpm typecheck`: 8개 전체 패키지 타입체크 100% 통과
  - Playwright 브라우저 실물 검증: 지도 범례에 `대출규제·7/1`이 깔끔하게 표시됨 확인


## 2026-09-15 (19) — 부동산 터미널(/realty) 시각적 블록 분할 및 탭 네비게이션 전면 개편 (Gemini)
**한 일**
- 과도한 수직 스크롤(12,962px)과 데이터 과부하 해소를 위해 `/realty` 화면 구조 전면 개편:
  - 1) **상단 4대 핵심 KPI 바롬터 카드** 신설: 한국은행 기준금리(3.00%), 가계/카드 연체율(1.05%/1.54%), 임차 점유/월세 비중(38.0%/68.3%), 고위험 청년가구 비중(34.9%)을 시각적으로 돋보이는 4컬러 하이라이트 카드로 배치
  - 2) **6대 카테고리 세그먼트 탭 네비게이션** 도입: `[ 📊 전체 보기 ]`, `[ 🗺️ 도면 & 대출 지도 ]`, `[ 📉 금리 & 부채·연체 ]`, `[ 🏛️ 자산 편중 & 세금 ]`, `[ 👥 인구 & 주거·공실 ]`, `[ 💡 팩트체크 & 뉴스 ]`
  - 3) **독립 카드 블록 시스템(`.realty-block-card`)** 적용: 각 섹션마다 전용 아이콘, 제목, 설명, 태그 배지가 달린 독립 카드로 시각적 경계선 및 여백 부여
  - 4) **하위 세부 지표 블록 분할(`.realty-subblock-card`)**: 가계 상환능력, 카드 연체·리볼빙, 법원 경매, 상업용 부채, 상가 임대수익률을 개별 카드 블록으로 분할하여 가독성 개선
  - 5) **팩트체크·생애 코호트 및 자산/세금 지표 블록화(`.sub-kpi-card`)**: 초혼/출산 연령, 미혼율, 신혼 PIR뿐 아니라 순자산 분위 점유율, 종부세/법인 비중, 증여·상속세, 공직자 통계를 명확한 카드 블록 그리드로 전환
  - 6) **화면 노이즈 및 빈칸 대청소**: 데이터가 없는 무의미한 빈칸(아파트 매입 연령대, 가구주 소비 등) 16종(`—`) 및 임대료·공급 8칸 플레이스홀더 완전 제거, 방어적 사족 문구("안 긁습니다, 비밀입니다") 정제
- `apps/web/src/app/globals.css`: KPI 바, 탭 버튼, 블록 카드, 서브블록 카드(`.realty-subblock-card`), 서브 KPI 카드(`.sub-kpi-card`) 스타일 추가 (다크/라이트 모드 대응)
- Next.js 웹 타입체크 100% 통과, 단위 테스트 150건 전건 통과, Playwright 브라우저 렌더링 및 탭 전환 검증 완료

**다음 할 일**
1. 사용자가 요청하는 추가 화면들의 블록형 UI 정돈 확장
2. 금융 원장 정합성 수정 검토

**막힌 것**
- 없음

## 2026-09-15 — 금융 원장 수정 프롬프트 작성 (Codex)
**한 일**
- 사용자 요청으로 docs/prompts/21-ledger-correctness-fixes.md 작성. 리뷰 5건의 재현·완료 조건·검증 명령·데이터 보존 정책 포함.
- 프롬프트 목록과 리뷰 문서에 연결.
**다음 할 일**
1. 새 작업에서 해당 프롬프트로 수정 및 회귀 검증 진행.
**막힌 것 / 미결정**
- 문서 작성만 수행. 제품 코드 수정·추가 테스트 실행 없음.

## 2026-09-15 — 금융 원장 재검토 (Codex)
**한 일**
- 타입 검사 8/8 및 core 139 + interop 11 테스트 통과 재확인.
- 소수 전량 매도, 동일 시각 체결 정렬, 하루치 내림차순 잔액 오류 재현.
- 반복 거래 누락·외화 합산 미해결 확인. docs/review/2026-09-15-codex-ledger.md 기록.
**다음 할 일**
1. 재현된 P1 세 항목 수정 및 회귀 테스트.
2. 가져오기 식별·통화 정책 구현 후 테스트 DB 통합 검증.
**막힌 것 / 미결정**
- 이번 범위는 리뷰. 제품 코드와 DB 수정 없음. DB·브라우저·외부 서비스 실행 검증 미수행.

## 2026-09-15 (18) — 맥 원격 최신 작업(feat/yahoo-fundamentals) 윈도우 환경 실행 및 풀스택 교차 검증 (Gemini)
**한 일**
- 맥에서 푸시된 `origin/feat/yahoo-fundamentals` 브랜치(18 커밋, 296 파일 변경) 윈도우 로컬 체크아웃
- `pnpm install` 완료 (9개 프로젝트 패키지 락파일 동기화)
- `packages/core/src/world-indices.ts`: `tvSymbolOverviewSymbols` 반환 타입 `[string, string][]` 명시하여 `noUncheckedIndexedAccess` TS2532 에러 해결
- 단위 테스트 150건 전건 통과:
  - `packages/core`: 43개 테스트 파일, 139개 테스트 통과
  - `packages/interop`: 2개 테스트 파일, 11개 테스트 통과
- 전체 8개 패키지 타입체크(`pnpm -r typecheck`) 100% 통과 (core, db, api, ai, interop, worker, web, mobile)
- Next.js 15.5.25 프로덕션 빌드(`pnpm --filter @finvesting/web build`): 15개 전체 라우트(`/`, `/realty`, `/profile`, `/news`, `/invest`, `/markets`, `/holdings`, `/statements`, `/fundamentals`, `/opinions`, `/chat`) 빌드 성공
- `pnpm dev:web` 로컬 기동(`http://127.0.0.1:3000`) 및 Playwright 브라우저 실물 확인:
  - `/realty`: MapLibre 3D 전국 17개 시도 벡터 도면 및 마커, 카메라 조작 렌더 완료, 대출 순위, 기준금리 및 COFIX 표, 인구/연체 패널 렌더 확인
  - `/profile`: 11개 서브메뉴(01~11), 03 보장 육각/칠각 레이더, 04 급여·연말정산 계산기, 08 적금 패널 렌더 확인
  - `/news`: 10개 카테고리 필터 탭 전환, 검색창 반응 확인 (본문 미저장·미표시 원칙 준수)
  - `/invest` & `/markets`: TradingView 위젯, Yahoo 심볼 검색(`AAPL`), 체결 입력 폼 확인
  - `/chat`: 12문항 스타터 칩 표시 및 질의 인터랙션 확인
- 검증 기록 `docs/verification/2026-09-15-gemini.md` 작성 및 `docs/verification/README.md` 윈도우 항목 갱신

**다음 할 일**
1. 윈도우 로컬 작업 브랜치(`feat/real-estate-market-analytics`)와의 기능 차이 분석 및 사용자 지시 시 통합
2. 모바일 Expo 기동 환경 점검

**막힌 것**
- 윈도우 로컬 Docker 미기동 상태로 인해 로컬 Postgres DB 쓰기/읽기는 미실행 (맥 환경에서 Docker Postgres 검증 완료 상태 유지)

## 2026-09-15 (17) — 전월세·카드연체·리볼빙
**한 일**
- `/realty` 점유 임차 38.0%, 거래 월세 누계 68.3%(아파트 52.4%). 금감원 카드 연체 1.54%·카드대출 3.35%
- 리볼빙(결제성) 6.88조, 카드론+현금+리볼빙 대비 12.1%. ADR 0026

**다음 할 일**
1. 주거실태 전세·월세 전국 칸(통계누리 원문)
2. 2026-09-30 8월 가중평균 공표 후 표 갱신
3. ECOS 키로 시도 가계대출·연체율

**막힌 것**
- 전세자금대출/가계대출 비중 통계코드 확인 전
- 커밋·push 없음

## 2026-09-15 (16) — 대출 금리 표
**한 일**
- `/realty`에 한은 기준금리 3.00%, 7월 가중평균(주담대 4.48·전세 4.19·가계 4.64), COFIX 8월(신규 3.18·잔액 3.05)
- ECOS 대출금리 항목은 이름 매칭만. 은행 상품금리는 링크. ADR 0025

**다음 할 일**
1. 2026-09-30 8월 가중평균 공표 후 표 갱신
2. ECOS 키로 시도 가계대출·연체율
3. 부동산원 거래주체별 원문 표

**막힌 것**
- 개별 은행 주담대 금리는 공식 시계열로 안 긁음
- 커밋·push 없음

## 2026-09-15 — 백엔드·AI 확장 방향 문서화 (Codex)
**한 일**
- [ADR 0025](../tech/decisions/0025-backend-ai-evolution.md): 현재 스택 유지, 단계적 RAG, 별도 서버 재검토 조건 기록.
- Java는 필수 조건이 아니며 Python·Spring·FastAPI·LangChain·LangGraph 도입도 미결정임을 명시.
- AI 기술 문서와 ADR 목록 연결. 제품 코드·DB·설정·의존성 변경 없음.

**다음 할 일**
1. 최신 코드 기준 금융 데이터 안정화·수집 상태·복구 기능 확인.
2. 실제 질문 기반 RAG 범위와 평가 사례 정의 후 구현.

**막힌 것 / 미결정**
- 별도 AI 서버 필요성·언어·프레임워크는 요구가 생기면 재검토. 이번 작업은 문서화만 수행.

## 2026-09-15 (15) — 고액 자산 비중·이동 채널
**한 일**
- `/realty`에 가금복 상위 10% 점유 46.1%·실물 75.8%, 상속·증여 결정세액, 부동산신탁사 수탁고. 연예인·임원 실명 없음
- 이동은 법인·다주택·증여·상속·신탁 채널 표. 거래주체·DART는 칸. ADR 0024

**다음 할 일**
1. 부동산원 거래주체별·거래원인별 원문 표(스크래핑 없이)
2. TASIS 상속·증여 자산종류별(부동산) 셀
3. ECOS 키로 시도 가계대출·연체율

**막힌 것**
- 연예인·사적 자산가 공식 명단 없음
- 10분위 내부 부동산 구성비는 원문 표
- 커밋·push 없음

## 2026-09-15 (14) — 공실 정의·상환·경매·빌딩
**한 일**
- 부동산원 공실=자가·무상 제외. 총조사 유형별 빈집(아파트 7.1%). 한은 연체·고위험 청년 34.9%, 대법원 경매신청 12.1만, 부동산업 연체 3.01%·RTI 1.5·상가 수익률
- 급매·유찰 월별·상권 매출·만기 잔액은 칸. 주장에 영끌·꼬마빌딩 카드. ADR 0023

**다음 할 일**
1. 법원경매정보 매각률 원문 표(스크래핑 없이)
2. 소상공인365 공공데이터 키로 상권 매출
3. ECOS 키로 시도 가계대출·연체율

**막힌 것**
- 법인 자가로 뺀 공실 면적 공표 없음
- 꼬마빌딩 전용 대출 시계열 없음
- 커밋·push 없음

## 2026-09-15 (13) — 평균의 함정·팩트 칩
**한 일**
- `/realty` 떠도는 말 칸에 총조사 연령 막대(최빈 50대 vs 주황 30·40대 28.3%), 초혼·출산·청년/신혼 주택 숫자
- 주장 11장에 공식 `facts` 칩. 평균만 보면 된다 카드. ADR 0022

**다음 할 일**
1. 부동산원 매입자연령대별 표로 칸 채우기
2. 가계동향조사 가구주 연령별 소비 키
3. ECOS 키로 시도 가계대출·연체율

**막힌 것**
- 등기정보광장 매입 연령은 긁지 않음
- 커밋·push 없음

## 2026-09-15 (12) — 공실·지니·법인 명의 창구
**한 일**
- `/realty`에 부동산원 2025.4분기 시도 공실, 빈집 2024 시도·2025 전국 8.5%, PIR·지니, 급매·압류·유찰 칸
- 법인 주택분 종부세 5.9만·세액 비중. 4급 등록·연예인 실명은 넣지 않는 창구 표. 데이터 업데이트는 뉴스·대출 refetch. ADR 0021

**다음 할 일**
1. 부동산원 거래주체별 아파트 매매 API·파일로 법인 비중 채우기
2. ECOS 키로 시도 가계대출·연체율
3. TASIS 법인×지역 종부세 셀(스크래핑 없이)

**막힌 것**
- 4급 재산등록·개인 등기·연예인 명단 공개 없음
- 급매 호수·유찰률 공식 시계열 없음(법원 원문)
- 커밋·push 없음

## 2026-09-15 (11) — 국세 집계로 고가주택 소재
**한 일**
- `/realty`에 기재부 2025 종부세 고지 수도권 3곳 인원·비중. 서울 60.7%·수도권 83.7%. 고위공직자 섹션과 분리
- 개인 세금 조회·자산가 명단 없음. 양도세 물건지는 TASIS·data.go.kr 칸만. ADR 0020

**다음 할 일**
1. ECOS 키로 전국 시도 가계대출·전세자금 비중 코드 확인
2. TASIS 원문에서 17개 시도 양도세·고가주택 양도 숫자(스크래핑 없이)
3. HUG 사고 첨부·data.go.kr 실거래

**막힌 것**
- 홈택스 개인 납부액 API 없음. 종부세에서 고위공직자만 뺀 표 없음
- TASIS WebSquare라 시도 셀은 칸만
- 커밋·push 없음

## 2026-09-15 (10) — 인구·공직자 자산 방향·주장 비교
**한 일**
- `/realty`에 국가데이터처 2025 출산율·권역 순이동, 행안부 인구감소 89·관심 18
- 고위공직자: 인사혁신처 2026-03-26 집계 + 광역단체장 관할 밖 수도권 주택 6명 표. 사적 자산가 명단 없음
- 기사·유튜브 주장은 카드로만. 유튜브 안 긁음. ADR 0019

**다음 할 일**
1. ECOS 키로 전국 시도 가계대출·전세자금 비중 코드 확인
2. HUG 사고 첨부·data.go.kr 실거래
3. 시도 전입·전출 인원 원문 표

**막힌 것**
- 사적 자산가 이동 공식 공개 없음. 공직윤리시스템 스크래핑 안 함
- 커밋·push 없음

## 2026-09-15 (9) — 전국 도면·토지 칸
**한 일**
- `/realty` 도면을 통계청 2018 전국 시군구로. 멀리서는 17개 시도, 확대하면 시·구. 규제 색은 수도권만
- 예금은행 가계대출 이름 매칭을 부산·제주까지. 순위 17곳. 유형 칸에 토지. ADR 0018

**다음 할 일**
1. ECOS 키로 전국 시도 가계대출 시계열·비중
2. data.go.kr 실거래로 유형별(토지 포함) 건수

**막힌 것**
- 시·구 가계대출·포털 매물 호수 없음
- 커밋·push 없음

## 2026-09-15 (8) — 가계대출 비중·유형별 매물 칸
**한 일**
- `/realty` 대출 패널에 시도 전국 대비 비중·순위(어디가 많은지). 가계신용/GDP는 칸만
- 아파트·오피스텔·다가구/빌라·연립·상가·빌딩 빈 그래프. 포털 매물 호수는 안 긁음. ADR 0017

**다음 할 일**
1. ECOS 키로 시도 가계대출 시계열·비중
2. data.go.kr 실거래로 유형별 건수
3. 가계신용/GDP는 통계코드 확인 후

**막힌 것**
- 시·구 가계대출·포털 매물 호수 공식 시계열 없음
- 커밋·push 없음

## 2026-09-15 (7) — 도면에 시·구 이름
**한 일**
- `/realty` 시군구 면에 종로·성북·강남·광명·화성·동탄 등 이름. 경계선 추가. 이름 클릭 시 그 구로 확대 + 시도 대출 패널

**다음 할 일**
1. ECOS 키로 시도 가계대출 시계열
2. 동탄구 신설 경계, data.go.kr 실거래

**막힌 것**
- 시·구 가계대출 공식 시계열 없음
- 커밋·push 없음

## 2026-09-15 (6) — 부동산 3D·시도 대출 그래프
**한 일**
- `/realty` 도면을 MapLibre fill-extrusion 3D로. 시·구를 고르면 예금은행 광역시도 가계대출 총액·전년동월 증가율 그래프
- ECOS `151Y003` 말잔. 지역 코드는 항목 목록 이름 매칭. 시·구 숫자는 없음. ADR 0016

**다음 할 일**
1. 동탄구 신설 경계가 공개되면 면으로 교체
2. data.go.kr 실거래·임대료 숫자

**막힌 것**
- 시·구 가계대출 공식 시계열 없음
- 필지·동 경계는 토지이음
- 커밋·push 없음

## 2026-09-15 (5) — 부동산 시군구 도면
**한 일**
- OSM 타일·점을 빼고 통계청 2018 시군구 면으로 칠함. 규제 주황/빨강, 권선·처인은 규제 아님
- 동탄구 면은 원본에 없어 화성 위 점선 원. ADR 0015

**다음 할 일**
1. 동탄구 신설 경계가 공개되면 면으로 교체
2. data.go.kr 실거래·임대료 숫자

**막힌 것**
- 필지·동 경계는 토지이음
- 커밋·push 없음

## 2026-09-15 (4) — 부동산 OSM 지도
**한 일**
- `/realty` 상단에 Leaflet+OSM 지도. 규제·고대출은 주황/빨강 점, 과밀·성장·자연은 작은 점
- 좌표는 Nominatim 행정 중심(2026-09-15). 칩을 누르면 그 점으로 이동. ADR 0015

**다음 할 일**
1. 시군구 폴리곤(공개 GeoJSON·키)이면 면으로 칠하기
2. data.go.kr 실거래·임대료 숫자
3. 지정 고시가 바뀌면 `realty-ref`·`realty-map`만 고침

**막힌 것**
- 필지·동 경계는 토지이음. 카카오/네이버 지도 키 없음
- 커밋·push 없음

## 2026-09-15 (3) — 부동산 지역 마인드맵
**한 일**
- `/realty` 상단을 중앙 「수도권」→ 정비권역·규제지역·고대출 위험군 마인드맵으로 바꿈
- 규제 시·구는 정책브리핑 10.15·2026-07-01 요약. 금융위 LTV 40%·한도 6·4·2억·스트레스 DSR 3% 등. ADR 0014

**다음 할 일**
1. data.go.kr 실거래·임대료 숫자
2. 지정 고시가 바뀌면 `realty-ref`만 고침
3. 모바일 Expo

**막힌 것**
- 필지·동 단위 토허는 토지이음. 개인 대출 한도 계산 없음
- 커밋·push 없음

## 2026-09-15 (2) — 관심종목·Fundamentals 영문·연말정산
**한 일**
- 검색에서 관심 추가·목록에서 삭제 (`market.watchAdd`/`watchRemove`). 지수·선물 제외
- `/fundamentals` 영문 칸·내비 Fundamentals
- 07 급여상세 연말정산: 고용노동부 지급|공제 연 합 + 과세표준 기초. ADR 0013

**다음 할 일**
1. 관심 추가 직후 시세 한 줄 수집
2. 홈택스 간소화·부양가족 공제
3. data.go.kr 실거래·KRX 수급, 모바일 Expo

**막힌 것**
- 연말정산 결정세액·환급은 간이세액표 없음
- 커밋·push 없음

## 2026-09-15 — 평가손익 +/- · 적청
**한 일**
- `core/signed-amount.ts`: `signedWon`·`signedPct`·`pnlTone`. 웹 `Pnl` 칸
- 홈·`/invest`·`/holdings`·프로필 09 투자내역. 챗 컨텍스트도 `+`/`−`
- 색은 지수 칸과 같음: 상승 빨강·하락 파랑·0은 회색

**다음 할 일**
1. 관심 종목 추가 UI
2. data.go.kr 실거래·KRX 수급 숫자
3. ECOS·FRED·DART 키, 모바일 Expo

**막힌 것**
- 실현손익 칸은 이번 표시 대상 아님
- 커밋·push 없음

## 2026-09-14 (10) — 원자재·기업검색·금리 맵
**한 일**
- `/invest` 원자재 칸: 금·은·구리·WTI·브렌트 Yahoo 선물. 두바이유는 Yahoo에 없음
- 기업 검색: Yahoo search (`newsCount=0`). 종목코드·영문. 한글 회사명은 Yahoo 400
- `/markets` BIS 정책금리 칸. 독일·프랑스·이탈리아는 ECB. ADR 0012

**실행 확인**
- core 107 테스트, worker·web·api typecheck
- BIS 14 upsert / 3 stale. Yahoo 은·구리·브렌트 차트 186봉
- 브라우저 검색 `005930.KS` 네이버·DART. 금리 한국 2.75·미국 3.63·튀르키예 37

**다음 할 일**
1. 관심 종목 추가 UI
2. data.go.kr 실거래·KRX 수급 숫자
3. ECOS·FRED·DART 키, 모바일 Expo

**막힌 것**
- 두바이유 Yahoo 심볼 없음
- 한글 회사명 검색은 Yahoo가 거절
- 커밋·push 없음

## 2026-09-14 (9) — 시장·부동산 대시보드
**한 일**
- `/markets`: 세계은행 인플레이션 칸, 거래량 히트맵, KRX 수급 링크, 크립토·외환 히트맵, CoinDesk·FXStreet 뉴스, 기술분석 위젯+설명 (`ta-lessons`)
- `/realty`: 과밀억제권역 요약, 공식 조회 링크, 임대료·가격·거래량·공급 빈 칸, 한경 부동산 RSS
- worker `worldbank.ts`, RSS 4피드 추가. ADR 0011

**실행 확인**
- core 104 테스트, worker·web typecheck
- 세계은행 16국, RSS 크립토·외환·부동산 삽입
- 브라우저 `/markets` `/realty`. tRPC 뉴스 분류 부동산 50·크립토 55·외환 30

**다음 할 일**
1. data.go.kr 키로 실거래·임대료 숫자
2. KRX 투자자별 거래실적 숫자
3. ECOS·FRED·DART 키, 모바일 Expo

**막힌 것**
- 외국인·기관 일별 수급 숫자는 키 없이 원문만
- 부동산 시계열 숫자는 키 없이 빈 칸
- 커밋·push 없음

## 2026-09-14 (8) — 투자 대시보드 비트코인·환율
**한 일**
- `/invest` 주요 지수에 비트코인. 원화는 업비트 90일 일봉, 없으면 Yahoo BTC-USD. TradingView 탭 `BITSTAMP:BTCUSD`
- 환율 칸: 달러·유로·엔(100엔)·위안·파운드. Yahoo `macro_indicators` (`core/fx-pairs`). USDKRW는 같은 날 ECOS가 있으면 유지
- Investing.com은 크롤링하지 않음. 각 칸·외부 참고에 환율·비트코인 원문 링크

**다음 할 일**
1. 월말 순자산 스냅샷 스키마가 필요하면 ADR 후 시계열
2. 관심 종목 추가 UI, 수집 job 성공/실패 테이블
3. ECOS·FRED·DART 키 검증, 모바일 Expo

**막힌 것**
- Investing.com 시세는 Cloudflare·약관으로 안 받음 (ADR 0009)
- 위안은 이번 수집에서 일봉이 하루치라 선이 없음
- 커밋·push 없음 (지시 대기)

## 2026-09-14 (7) — 투자 대시보드 주요 지수 그래프
**한 일**
- `/invest` 주요 지수 칸에 Yahoo 종가 스파크라인. worker가 일봉 40일 미만이면 `chart` 90일을 채움 (이번 실행 624봉)
- TradingView `symbol-overview`를 같은 카드에 표시. `[표시이름, 심볼|1D]` (`tvSymbolOverviewSymbols`). 국내 심볼·티커테이프 순서는 넣지 않음(「잘못된 심볼」)
- 상세 차트 탭 제거(중복)

**다음 할 일**
1. 월말 순자산 스냅샷 스키마가 필요하면 ADR 후 시계열
2. 관심 종목 추가 UI, 수집 job 성공/실패 테이블
3. ECOS·FRED·DART 키 검증, 모바일 Expo

**막힌 것**
- 코스피·코스닥 큰 차트는 TradingView에 없음. Yahoo 선 + 네이버 링크
- 커밋·push 없음 (지시 대기)

## 2026-09-14 (6) — 홈·투자 대시보드 개편
**한 일**
- 웹 typecheck: React 19 타입만 쓰도록 `apps/web/tsconfig.json` 분리. 단언 없음. [로그](../logs/2026-09-14-web-react-types.md)
- 내부 이체: 입·출금에서 `transfer` 분류 허용. `summarizeCashflow`에서 수입·소비 제외
- 가져오기: 가장 늦은 날짜 잔액만 반영, 기존 최신 거래보다 오래된 파일은 잔액 미갱신, 빈 잔액≠0, `commitImport`/`workspaceSave` DB 트랜잭션
- 체결: 시간순 재검증, 매도>보유 시 오류. core `Math.min` 제거
- 홈: 조회 월·기준일·가져오기, 현재 순자산/월 소비/저축·투자 실행/평가손익, 현금흐름 한 줄, 확인할 일, 뉴스 3, AI 진입. 뉴스 10·칼럼·고정비 목록·InvestTrail·빈 카드 여러 개 축소
- 투자: 지수 요약 + 보유·관심 + 히트맵. 차트·스크리너·캘린더·외부 링크는 탭. Yahoo 표·티커·개요 중복 제거. 수집 명령 문구 제거
- 6개월 순자산 그래프는 스냅샷 없어 만들지 않음. 예정 납입·평가손익 기여·자산군/통화 비중은 있는 데이터만
- 기본 `next dev`는 127.0.0.1, LAN은 `dev:lan`

**다음 할 일**
1. 월말 순자산 스냅샷 스키마가 필요하면 ADR 후 시계열
2. 관심 종목 추가 UI, 수집 job 성공/실패 테이블
3. 가져오기 이력·되돌리기, 동일 거래 중복 키(P2)
4. ECOS·FRED·DART 키 검증, 모바일 Expo, Financial Timeline

**막힌 것**
- 커밋·push 없음 (지시 대기)
- 관심 종목은 DB에 행이 있을 때만 `/invest`에 보임. 추가 화면은 없음
- USD 계좌 잔액을 원처럼 합산하는 문제는 그대로(P2)

## 2026-09-14 (5) — 국내 지수 보이게 + 네이버·한투 링크
**한 일**
- `/invest` 맨 위 **국내 지수** 칸: 코스피·코스닥 Yahoo 숫자 + 네이버 링크
- 원문 링크: 네이버 증권·코스피·코스닥, 한국투자증권, 한국거래소, 다음 금융 (크롤링 없음)
- TradingView 티커에서 KRX 심볼 제외 (위젯이 국내 지수를 빼서 안 보이던 것)

**실행 확인**
- indexBoard 코스피 6,684.37 · 코스닥 806.79. 브라우저 국내 칸 표시. 네이버·한투 링크 GET 200 (`stock.naver.com` 리다이렉트)

**다음 할 일**
1. ECOS·FRED·DART 키 발급 후 소스 검증
2. 모바일 Expo 기동
3. Financial Timeline

**막힌 것**
- 네이버·한투 시세 API/크롤링은 안 함. KIS Open API는 키 필요(미구현)

## 2026-09-14 (4) — TradingView iframe contentWindow
**한 일**
- `/invest` 위젯: 로더 스크립트 대신 `tradingview-widget.com/embed-widget` iframe. 테마 확정 후 마운트
- 콘솔 `Cannot listen to the event from the provided iframe, contentWindow is not available` 대응 (`docs/logs/2026-09-14-tv-iframe-contentwindow.md`)

**실행 확인**
- 브라우저 `/invest`: iframe 4개 모두 `tradingview-widget.com/embed-widget`. 로더 스크립트 0. 2.5초 동안 contentWindow 콘솔 오류 없음

**다음 할 일**
1. ECOS·FRED·DART 키 발급 후 소스 검증
2. 모바일 Expo 기동
3. Financial Timeline

**막힌 것**
- 없음

## 2026-09-14 — Codex 문서·현재 구현 종합 검토
**한 일**
- 문서부터 읽고 현재 작업 트리의 계산·저장·수집·AI 경로 대조. [검토 보고서](../review/2026-09-14-codex.md).
- 전체 타입 검사: 7/8 성공, web React/JSX 오류 9개로 실패. core 89·interop 9 테스트 통과.
- 내부 이체 집계·과거 매도 계산·내림차순 잔액 선택 문제를 작은 예제로 재현. DB 통합 시험과 구분해 기록.
- 제품 코드·실데이터 변경, 커밋·푸시·머지 없이 수정 우선순위와 기능 제안 작성.

**다음 할 일**
1. 웹 타입 오류와 로컬 접근 범위 정리.
2. 내부 이체·잔액 기준일·원자적 저장·체결 검증 수정 및 회귀 테스트.
3. 수집 상태/실데이터 검증·백업 복원 → Financial Timeline → AI 출처·스트리밍.

**막힌 것 / 미검증**
- 현재 web 타입 검사 실패. Node 26.7.0에서 실행했으며 기준 Node 22는 미실행.
- DB·브라우저·외부 수집기·Ollama·모바일·윈도우 재검증은 미수행. 기존 미커밋 작업 유지.

## 2026-09-14 (3) — 투자내역·성향·보유 화면 연결
**한 일**
- 프로필 메뉴 순서: 09 투자내역 → 10 투자성향 → 11 보험내역
- `?menu=`과 사이드 메뉴를 맞춤. 같은 프로필 안에서 투자성향 링크가 실제로 화면을 바꿈
- 투자내역·성향·보유·펀더멘털·투자 대시보드·재무제표에 같은 관련 링크 줄 (`InvestTrail`)

**실행 확인**
- 브라우저: 메뉴 09 투자내역 → 10 투자성향 → 11 보험내역. 투자내역 관련 링크 「투자성향」→ `?menu=style`. 성향→보유→투자내역 왕복. `/invest`·`/`에도 같은 줄

**다음 할 일**
1. ECOS·FRED·DART 키 발급 후 소스 검증
2. 모바일 Expo 기동
3. Financial Timeline

**막힌 것**
- 없음. 커밋은 사용자 지시 시

## 2026-09-14 (2) — 프로필 11 투자성향·조언 (feat/yahoo-fundamentals)
**한 일**
- `/profile` 메뉴 11: 기간·경험·손실감수·목적 4문항(0–12점). 완료 저장 시 `risk_tolerance` 동기화
- 보유 비중·비상금·집중·해외통화로 조언 문장 (`core/invest-style`). AI는 재설명만, 종목 추천 없음
- `financial_profiles.invest_style` jsonb, 마이그레이션 `0007_cloudy_star_brand`
- tRPC `profile.investAdvice` / `upsertInvestStyle` / `investRecommend`. 챗 스타터 「투자성향」
- ADR 0010

**실행 확인**
- core 89 (invest-style 4). 브라우저: 11 메뉴, 설문 저장 → 보수 0/12 후 중립 5/12로 복구. 01 위험 성향 동기화. BTC 100%·비상금 부족 문장. 챗 버튼 있음
- AI 추천(Ollama)은 미실행

**다음 할 일**
1. ECOS·FRED·DART 키 발급 후 소스 검증
2. 모바일 Expo 기동
3. Financial Timeline

**막힌 것**
- 증권사 적합성 설문을 복사하지 않음 (내부 경험 규칙). 커밋은 사용자 지시 시 (Yahoo 펀더멘털과 같은 워킹트리)

## 2026-09-14 — Yahoo 펀더멘털 표 (feat/yahoo-fundamentals)
**한 일**
- `/fundamentals`: Yahoo 일 스냅샷 표 (시총·PER·선행PER·PBR·EPS·ROE·배당·TTM·D/E·베타·52주·YTD·보수)
- worker: 주식·ETF만 `quote` + `quoteSummary`(financialData·defaultKeyStatistics). 지수·선물 skip
- `market.fundamentals`, 챗 보유 종목 주입, 대화 목록 「펀더멘털」
- 단위는 2026-09-14 AAPL/SPY 실측 (배당=퍼센트 숫자, ROE=비율, D/E=×100)

**실행 확인**
- core 85 (yahoo-fundamentals 6) · api/worker typecheck 통과. web은 기존 ReactMarkdown JSX 오류(fundamentals 파일 아님)
- `YAHOO_TARGETS=AAPL,MSFT,SPY` 수집 13/13. 표 AAPL 4.85T·ROE 148.8%·배당 0.33% / SPY YTD 13.07%·보수 0.0945%
- 브라우저 `/fundamentals` 200, ETF 필터=SPY만. `/statements`·`/invest`·`/holdings`·챗 스타터 링크 확인

**다음 할 일**
1. ECOS·FRED·DART 키 발급 후 소스 검증
2. 모바일 Expo 기동
3. Financial Timeline

**막힌 것**
- 키 발급은 사용자. 챗 펀더멘털은 보유 주식·ETF가 있을 때만 주입 (지금은 코인만이면 비어 있음)
- `.env` `YAHOO_TARGETS`는 검증용으로만 넘겼고 파일은 비워 둠

## 2026-09-13 (11) — 투자 대시보드 (feat/invest-dashboard)
**한 일**
- `/invest`: TradingView 공식 위젯(티커·개요·히트맵·차트·스크리너·캘린더). 시세 저장 없음
- Investing.com·Finviz는 원문 링크만 (크롤링 안 함). Seeking Alpha는 기존 RSS
- Yahoo 세계 지수 10종 항상 수집 (`core/world-indices`). ADR 0009

**실행 확인**
- core 79 · api/worker typecheck 통과. web은 기존 ReactMarkdown JSX 오류(invest 파일 아님)
- yahoo 10/10 upsert. indexBoard KOSPI 6909.91 등. `/invest` 200. TV iframe 6. SA 6건

**다음 할 일**
1. ECOS·FRED·DART 키 발급 후 소스 검증
2. Yahoo 펀더멘털 표
3. 모바일 Expo 기동

**막힌 것**
- Investing.com 페이지 403(Cloudflare). 전일 대비는 시세 2일치 있어야 함

## 2026-09-13 (10) — 오피니언·칼럼 대시보드 (feat/opinions-dashboard)
**한 일**
- `/opinions`를 뉴스와 분리. 열: 국내 칼럼 · 애널리스트 · 해외 오피니언
- RSS: 한경 오피니언, 연합 오피니언, Seeking Alpha, Project Syndicate, FT Opinion (2026-09-13 GET 확인)
- 매경은 공식 RSS 목록에 오피니언 없음. 증권사 리포트 공개 RSS 없음 → 국내 뉴스 제목의 목표가·투자의견만 애널리스트 열
- `/news`·홈 최근 뉴스는 오피니언 소스 제외. 챗에 칼럼 8건 + 스타터

**실행 확인**
- core 77 · typecheck 통과
- worker rss 신규 163. 오피니언 피드 50+16+30+20+25
- opinionFeed 143 (칼럼 66 · 애널리스트 32 · 해외 45). newsFeed 907 (오피니언 언론 없음)
- 브라우저 `/opinions` 3열, 애널리스트=SA+한경 목표가 2건. `/` 오피니언 섹션. 한경 원문 탭은 522 timeout

**다음 할 일**
1. ECOS·FRED·DART 키 발급 후 소스 검증
2. Yahoo 펀더멘털 표
3. 모바일 Expo 기동

**막힌 것**
- 증권사 리서치 센터 공개 RSS 없음. 매경 오피니언 RSS 없음

## 2026-09-13 (9) — 기업정보 조회 + 재무제표 읽어주는 사이트 참조
**한 일**
- `/statements`에 DART 기업개황·기업정보·회사별 공시·OpenDART 재무조회·감사보고서 검색 링크
- 해설은 「재무제표를 읽는 사람들」(`drcr.co.kr`) 참조만. 본문 저장 없음
- 감사의견은 의견 한 줄 + 회계법인 홈·DART 원문. KAM/강조 전문은 나열하지 않음
- `core/disclosure-links.ts`

**실행 확인**
- core 71 · typecheck 통과
- `/statements` 200. 조회 6링크. 해설 `drcr.co.kr`·DART 기업개황 클릭 확인. list 0

**다음 할 일**
1. ECOS·FRED·DART 키 발급 후 소스 검증
2. Yahoo 펀더멘털 표
3. 모바일 Expo 기동

**막힌 것**
- DART 키 없으면 수집·실데이터 읽어주기·감사인 링크는 skip. EDGAR는 감사의견 API 없음

## 2026-09-13 (8) — 재무제표 읽어주기 + 감사의견 (feat/statements-reader)
**한 일**
- `/statements`: 수집된 종목의 손익·재무상태·현금흐름 + DART 감사인·의견·강조·핵심감사사항
- 「읽어주기」=`statements.explain`. 유튜브·증권사 해설은 저장하지 않음. 감사보고서 본문(PDF)도 저장하지 않음
- `audit_reports`. worker `accnutAdtorNmNdAdtOpinion`. 챗에 보유 종목 재무·감사 주입, 대화 목록 2문항

**실행 확인**
- core 66 · typecheck 통과. migrate `0006_absent_jetstream`
- DART skip(키 없음). `/statements` 200 빈 안내. 챗에 읽어줘·감사의견 버튼

**다음 할 일**
1. ECOS·FRED·DART 키 발급 후 소스 검증
2. Yahoo 펀더멘털 표
3. 모바일 Expo 기동

**막힌 것**
- DART 키 없으면 수집·실데이터 읽어주기는 skip. EDGAR는 감사의견 API 없음

## 2026-09-13 (7) — 뉴스 카테고리 분할 (feat/news-dashboard)
**한 일**
- `/news`를 국내·해외뿐 아니라 **국내 경제 · 국내 금융 · 해외 시황 · 중앙은행** 열로 나눔
- 분류는 RSS 태그(173건만 있음)가 아니라 `source` → `core/news-category`. 한경=금융, 매경·연합=경제, CNBC·MW=시황, Fed·ECB=중앙은행
- `market.newsFeed`에 `category` 필터. 전체 보기일 때 분류별 최근 40건씩

**실행 확인**
- core 60(news-category 6) · api/web/worker typecheck
- newsFeed 885 = 경제 513 · 금융 159 · 시황 167 · 중앙은행 46
- 브라우저 4열. 국내 금융=한경만. 해외=시황+중앙은행. 중앙은행=ECB·Fed 46

**다음 할 일**
1. ECOS·FRED·DART 키 발급 후 소스 검증
2. 종목 재무제표·펀더멘털 화면
3. 모바일 Expo 기동

**막힌 것**
- 종목별 뉴스 매핑·RAG는 없음. 기사 본문 분류는 하지 않음

## 2026-09-13 (6) — 뉴스 전용 대시보드 (feat/news-dashboard)
**한 일**
- `/news`: 국내·해외 2열, 언론 필터, 제목 검색. 제목·링크·요약만 (본문 없음)
- `market.newsFeed` (lang·publisher, embedding/raw 제외). 내비 **뉴스**. `/`는 최근 뉴스 + 링크

**실행 확인**
- typecheck 8패키지. GET `/news` 200. newsFeed 전체 885 (국내 672·해외 213)
- 브라우저 국내 80건 한글만, 해외 80건 영문만. `/` 순자산+뉴스 대시보드 링크

**다음 할 일**
1. ECOS·FRED·DART 키 발급 후 소스 검증
2. 종목 재무제표·펀더멘털 화면
3. 모바일 Expo 기동

**막힌 것**
- 종목별 뉴스 매핑·RAG는 없음. push 대기

## 2026-09-13 (5) — 보험 공백 AI 추천 (feat/insurance-coverage)
**한 일**
- `/profile` 10 **AI 추천**: `insurance.recommend`가 부족한 축을 우선순위로 설명. 특정 보험사·상품명 금지
- 챗 컨텍스트에 칠각 보장 요약 주입. 대화 목록 「부족한 보험」
- `core/formatCoverageContext`. tRPC `maxDuration` 120초

**실행 확인**
- core 6(coverage) 통과. typecheck 8패키지
- tRPC recommend ~46초. 사망 2.52억 → 뇌·심장·상해·장해 → 암 부족 2,040만. 실손은 됨. 상품명 없음
- 브라우저 AI 추천 클릭 → 같은 우선순위 렌더

**다음 할 일**
1. ECOS·FRED·DART 키 발급 후 소스 검증
2. 종목 재무제표·펀더멘털 화면
3. 모바일 Expo 기동

**막힌 것**
- 추천은 가이드. 견적·상품 비교 없음. push 대기

## 2026-09-13 (4) — 프로필대장 보험 보장 레이더 (feat/insurance-coverage)
**한 일**
- `/profile` 10 보험내역: 민영 증권 입력 + 칠각(7축)·육각(6축) 레이더. 바깥선=권장, 안쪽 칠=가입 비율
- 축: 사망·실손·암·뇌혈관·심장·상해·후유장해. 육각은 뇌+심장을 중대질병으로 합침
- `insurance_policies` (`0005_free_blonde_phantom`). `core/insurance-coverage.ts`. ADR 0008 (권장액은 연소득 경험 규칙)
- 4대보험(급여 공제)과 별개

**실행 확인**
- core 53개 통과 (insurance-coverage 5). typecheck 8패키지. migrate 0005 적용
- `insurance.list` 연소득 50,400,000. 브라우저 신규→검증 실손(실손 가입·암 3천만) 저장
- 육각 표: 실손 100% · 암 60%(부족 2,040만) · 사망·중대질병·상해·후유장해 0%. 가장 약한 축 사망

**다음 할 일**
1. ECOS·FRED·DART 키 발급 후 소스 검증
2. 종목 재무제표·펀더멘털 화면
3. 모바일 Expo 기동

**막힌 것**
- 권장액은 공식 고시 아님. 설계사 견적·상품 추천 없음. 검토 5~14·push는 대기

## 2026-09-13 (3) — 투자 비서 대화 목록 (feat/quote-targets)
**한 일**
- `/chat`에 자산·현금흐름·보유·시장·판단 12문항 목록. 클릭하면 해당 질문 전송
- `apps/web/src/app/chat/starters.ts`

**실행 확인**
- `/chat` 12버튼 렌더. 「순자산 구성」 클릭 → 비서: 순자산 3,749,802 · 유동 3,645,000 · 투자 104,802 · 부채 0

**다음 할 일**
1. ECOS·FRED·DART 키 발급 후 소스 검증
2. 종목 재무제표·펀더멘털 화면
3. 모바일 Expo 기동

**막힌 것**
- 없음. 검토 5~14·push는 대기

## 2026-09-13 (2) — 워커 시세·USDKRW 실행 확인 (feat/quote-targets)
**한 일**
- Docker Desktop 기동, `pnpm db:up`, `run:once` + tRPC로 검토 2~4 실데이터 확인

**실행 확인**
- upbit 보유 BTC만 1건. 2026-09-13 종가 104,802,000
- USDKRW 1,342.4 (`source=yahoo`). holdings `usdkrw` 동일. 평가 104,802 · 손익 6,835.2
- overview 투자 104,802 = 평가+예수금 0

**다음 할 일**
1. ECOS·FRED·DART 키 발급 후 소스 검증
2. 종목 재무제표·펀더멘털 화면
3. 모바일 Expo 기동

**막힌 것**
- KRX·해외 체결 없어 `.KS`/환율 환산 경로는 미실행. 검토 5~14 미반영. push·dev 머지는 사용자 지시 대기

## 2026-09-13 — 시세 대상·USDKRW·투자자산 (feat/quote-targets)
**한 일**
- Claude 검토 1: `feat/financial-profile`에 09-05~09-12 작업 6커밋. `_to_delete/` 제외
- 검토 2: 수집 대상 = trades∪watchlist, env는 합집합. KRX는 `.KS`/`.KQ`. ADR 0007
- 검토 3: Yahoo `KRW=X` → `USDKRW` (ECOS가 같은 날짜를 덮어씀)
- 검토 4: 투자자산 = 보유 평가액 + 증권·코인·연금 예수금 (`core/invested.ts`)

**실행 확인**
- `pnpm typecheck` 8패키지 통과. core 48 · interop 9
- Docker 데몬이 꺼져 `run:once`·`trades.holdings` tRPC는 못 함 → 같은 날 (2)에서 실행

**다음 할 일**
1. Docker 켜고 `pnpm --filter @finvesting/worker run:once` → BTC 시세·USDKRW 확인
2. ECOS·FRED·DART 키 발급 후 소스 검증
3. 종목 재무제표·펀더멘털 화면
4. 모바일 Expo 기동

**막힌 것**
- Docker 미기동. 검토 5~14 미반영. push·dev 머지는 사용자 지시 대기

## 2026-09-12 (11) — 프로필대장 투자내역 (feat/financial-profile)
**한 일**
- `/profile` 09 투자내역: 증권·코인·연금 **계좌별** 카드 + 주식/ETF/채권/펀드/코인/기타 소계·비중 + 보유·체결 그리드
- 포지션을 계좌×종목으로 계산. 매도 수량 검사도 그 계좌 보유만 봄
- `core/holdings-summary.ts`. 체결 입력은 `/holdings` (계좌·자산군 열 추가)

**실행 확인**
- core 37개 통과 (holdings-summary 4). api/web typecheck 통과
- `/profile?menu=invest` 200. `trades.holdings` byClass 6칸(코인 1 · 평가 108,852, 주식·ETF·채권·펀드 0). byAccount `검증 코인` 1건. 체결 목록에 계좌명·자산군
- 증권 2계좌 더미 체결 삽입은 로컬 데이터 변경이라 미실행. 계좌별 합산·매도 수량 계좌 한정은 테스트·코드로 확인

**다음 할 일**
1. 종목 재무제표·펀더멘털 화면
2. ECOS·FRED·DART 키 발급 후 소스 검증
3. 모바일 Expo 기동

**막힌 것**
- 대장에서 체결 직접 입력은 없음 (보유 화면으로 이동)

## 2026-09-12 (10) — 급여상세 연봉 추이 (feat/financial-profile)
**한 일**
- 07 급여상세에 기본급·수당·상여·성과 명세서 + 12개월 기본급/세금/보험/세전 그래프와 상세표
- `payroll_months` 월 스냅샷. 저장 시 기준월 upsert. `core/pay-trends.ts`

**실행 확인**
- core 33개 · api/web typecheck 통과. `0004_big_captain_stacy` migrate
- `statement.payTrend` 12개월. 7·8월은 세액만 24만·24.5만. 9월 기본급 420만 · 세금 27.5만 · 보험 408,130. 연 합계 세전 420만 · 세금 76만

**다음 할 일**
1. 종목 재무제표·펀더멘털 화면
2. ECOS·FRED·DART 키 발급 후 소스 검증
3. 모바일 Expo 기동

**막힌 것**
- 과거 달은 그달 명세서를 저장해야 기본급·보험이 채워짐. 세액만 있는 달은 세금만 표시

## 2026-09-12 (9) — 적금내역 (feat/financial-profile)
**한 일**
- `savings_plans` / `savings_contributions`: 상품명·은행·금리·단리/월복리·약정·월납·상품내용·월 납입
- 만기 추정은 `core/savings.ts` (정기적금 단리, 월복리, 예금)
- `/profile` 08 적금내역. `savings.list` / `upsert` / `remove`

**실행 확인**
- core 30개 · web/api/db typecheck 통과. `0003_curious_dreaming_celestial` migrate
- `savings.upsert` 월 10만·연 3.6%·12개월 단리 → 원금 1,200,000 · 이자 23,400 · 만기 1,223,400. 납입 1건 후 삭제로 목록 0

**다음 할 일**
1. 종목 재무제표·펀더멘털 화면
2. ECOS·FRED·DART 키 발급 후 소스 검증
3. 모바일 Expo 기동

**막힌 것**
- 우대금리 조건·중도해지·세금 공제는 없음
- 통장 거래와 납입 내역 자동 연동은 없음

## 2026-09-12 (8) — 임금명세서 고용노동부 예시 (feat/financial-profile)
**한 일**
- 지급 칸을 근로기준법 시행령 제27조의2 · 고용노동부 임금명세서 작성 예시에 맞춤
- 매월지급: 기본급·연장/야간/휴일근로수당·가족수당·식대·직급수당. 부정기: 상여금·성과급. 공제란: 소득세·지방소득세·국민연금·고용보험·건강보험·장기요양
- 01 기본정보·07 급여상세에 지급|공제 양란. `core/pay-earnings.ts`가 기본 항목 SSOT

**실행 확인**
- core 27개 · web/api typecheck 통과
- `/profile?menu=books` 200. `statement` 차변 기본급 4,200,000 = 대변(소득세 포함) 4,200,000 · net 0

**다음 할 일**
1. 종목 재무제표·펀더멘털 화면
2. ECOS·FRED·DART 키 발급 후 소스 검증
3. 모바일 Expo 기동

**막힌 것**
- 브라우저에서 수당 금액 입력·저장은 도구 없으면 tRPC로 대체
- 노동조합비·연장시간 산출식은 저장 필드 없음 (예시의 계산방법 란은 미구현)

## 2026-09-12 (7) — 급여상세 차·대변 정정 (feat/financial-profile)
**한 일**
- 보통예금 전표로 맞춤: 차변=들어오는 지급(기본급·수당·입금), 대변=나가는 공제(보험·세금)·보통예금(실수령)·출금
- `buildPayrollLedger` / `buildMonthlyLedger`의 차·대변과 `net`(차변−대변) 수정
- `financial_profiles.pay_earnings` jsonb로 지급 항목 저장. 합이 있으면 세전으로 사용
- `/profile` 07 급여상세: 지급 그리드 + 급여전표·월 보통예금 안내문 교체

**실행 확인**
- core 테스트 23개 통과. api/web/db typecheck 통과. `0002_yielding_paibok` migrate
- `profile.statement` 급여전표: 차변 기본급 4,200,000 = 대변 4대보험+국세+지방세+보통예금 3,516,870, 합 4,200,000 · net 0
- 지급을 기본급 340만+식대 80만으로 저장하면 차변 두 줄, 합 420만 유지. 검증 후 기본급 420만으로 복구
- 월 보통예금: 차변 실수령 3,810,000 · 대변 출금 1,386,000 · 증가 2,424,000

**다음 할 일**
1. 종목 재무제표·펀더멘털 화면
2. ECOS·FRED·DART 키 발급 후 소스 검증
3. 모바일 Expo 기동

**막힌 것**
- 브라우저에서 지급 그리드 클릭·저장은 도구 없으면 tRPC로 대체

## 2026-09-12 (6) — 파일 변환·통장내역·추이 그래프 (feat/financial-profile)
**한 일**
- 가져오기: CSV·엑셀·워드(docx) 표를 `fileToRows`로 변환하고, 프로필대장에 **변환 내용** 표를 보여 준 뒤 고정비 또는 통장으로 저장
- 양식·내보내기: 고정비·통장 템플릿을 CSV/엑셀/워드로. `recurringExport`도 세 형식
- `/profile` 06 통장내역: 계좌별 거래 조회·분류 수정 (`transactions.listAll`)
- 05 추이: 세액·소비·저축·투자 막대+선 그래프, X=월 Y=금액, 아래 XY 표. `core/trends.ts`
- 07 메뉴 이름을 차대변 → **급여상세 내역**으로 변경
- 06 통장내역: 은행·통장 이름·종류·잔액을 카드와 거래표에 표시. 은행 비어 있으면 프로필에서 수정 (`accounts.update`)

**실행 확인**
- core 19 · interop 9 · api/web typecheck 통과
- `previewFile` 통장 CSV 2건, 고정비 CSV·xlsx·docx 인식. 워드 표 헤더 `이름,분류,금액,출금일,메모`
- `trends` 12개월. 2026-07/08/09 세액 24만·24.5만·25만, 9월 소비 65,000
- `listAll` 2026-09 6건. `/profile?menu=trends` 200

**다음 할 일**
1. 종목 재무제표·펀더멘털 화면
2. ECOS·FRED·DART 키 발급 후 소스 검증
3. 모바일 Expo 기동

**막힌 것**
- 구형 `.doc`는 미지원 (docx로 저장)
- 브라우저에서 가져오기 버튼 클릭·차트 호버는 미실행 (tRPC로 대체)

## 2026-09-12 (5) — 프로필대장 (feat/financial-profile)
**한 일**
- `/profile`을 더존·위하고식 **프로필대장**으로 분리. 홈 대시보드는 자산·뉴스 그대로, 프로필은 조회·저장·신규·삭제 툴바 + 좌측 메뉴 + 그리드 편집
- 메뉴: 기본정보 · 급여공제(2026 요율 표시) · 고정비 인라인 그리드 · 세액추이 · 차대변 전표
- `profile.workspaceSave` 일괄 저장, `profile.previewPay`로 국세 입력 중 4대보험·지방세 미리보기
- 고정비 CSV 양식·가져오기·내보내기는 툴바에 유지. `?menu=fixed`로 고정비 화면 진입

**실행 확인**
- api·web typecheck 통과
- `/profile`·`/profile?menu=fixed` 200, HTML에 프로필대장·erp 포함
- `previewPay` 세전 4,200,000·국세 250,000 → 국민연금 199,500 · 건보 150,990 · 장기요양 19,840 · 고용 37,800 · 지방세 25,000 · 공제합 683,130
- `workspaceSave` 대장검증 1,000원 추가 후 삭제로 원상복구. 고정비 휴대폰·전기·가스 유지

**다음 할 일**
1. 종목 재무제표·펀더멘털 화면
2. ECOS·FRED·DART 키 발급 후 소스 검증
3. 모바일 Expo 기동

**막힌 것**
- 브라우저 클릭·그리드 탭 이동은 이번 세션에서 도구 없음 — curl/tRPC로 대체
- 더존·위하고 **전표 엑셀 양식 내보내기**는 실제 템플릿 필요 (interop.md 미구현)

## 2026-09-12 (4) — 고정비 펼침 + CSV (feat/financial-profile)
**한 일**
- `/profile` 고정비 ▶/▼로 세부내역을 접고 펼침. 대시보드 권장 배분에도 같은 화살표
- 고정비 CSV 양식·가져오기·내보내기 (`이름,분류,금액,출금일,메모`). 한글 분류(휴대폰·공과금 등) 인식. 같은 이름은 갱신
- interop `parseRecurringCostCsv` / `recurringCostsToCsv`

**실행 확인**
- interop 6 · core 16 · api/web typecheck 통과
- CSV 가져오기: 가스요금 추가 1 · 휴대폰 55,000→56,000 갱신 1. 내보내기에 가스요금 포함

**다음 할 일**
1. 종목 재무제표·펀더멘털 화면
2. ECOS·FRED·DART 키 발급 후 소스 검증
3. 모바일 Expo 기동

## 2026-09-12 (3) — 건보·세금·고정 세부·차대변 (feat/financial-profile)
**한 일**
- 프로필에 세전, 근로소득세, 건보료. 세후 비우면 세전−공제. 마이그레이션 `0001_breezy_lester`
- `recurring_costs`: 휴대폰·공과금 등 고정 세부. `income_tax_months` + 거래 `income_tax`로 근로소득세 추이 막대
- `/profile` 차대변: 급여 명세서(세전=세금+건보+실수령), 월 손익(예정 고정+실거래)
- 거래 분류에 `phone`·`income_tax`·`health_insurance`. 배분 가이드 고정비에 세부 합계 포함

**실행 확인**
- core 13개·api/web typecheck 통과. `0001_breezy_lester` migrate 성공
- 세전 4,200,000 − 세금 250,000 − 건보 140,000 = 실수령 3,810,000. 급여 명세서 차대변 합 일치
- 휴대폰 55,000·전기 40,000 추가. 월 손익 차변 1,360,000 · 대변 3,810,000 · 여유 2,450,000
- 세액 추이 7월 24만 · 8월 24.5만 · 9월 25만. Chrome `/profile` 동일

**다음 할 일**
1. 종목 재무제표·펀더멘털 화면
2. ECOS·FRED·DART 키 발급 후 소스 검증
3. 모바일 Expo 기동

**막힌 것**
- 국민연금·고용보험 항목은 아직 없음 (건보·근로소득세만)

## 2026-09-12 (2) — 보유·체결 + 평가손익 (feat/financial-profile)
**한 일**
- `/holdings`: 종목 선택/신규, 매수·매도 체결, 보유 평단·평가손익, 체결 삭제
- `trades.holdings` / `create` / `list` / `remove` / `ensureInstrument`. 평가손익은 `core` 평균단가법 + 최근 종가. USD는 `USDKRW`가 있으면 원화 환산
- 대시보드 투자 자산 = 증권·코인·연금 잔액과 보유 평가액 중 큰 쪽. 챗 보유 줄에 현재가·평가손익

**실행 확인**
- api·web typecheck 통과, core 9개 통과
- BTC(UPBIT) 0.001 매수(종가의 90%). 보유: 현재가 108,852,000(2026-09-05 upbit) → 평가 108,852 · 손익 +10,885 (11.1%)
- 매도 1 > 보유 0.001 → 400 `매도 수량이 보유(0.001)보다 많습니다`
- 대시보드 순자산 3,753,852 (유동 3,645,000 + 투자 108,852). Chrome `/`·`/holdings` 동일 숫자
- 검증용 계좌 `검증 코인`(잔액 0)과 체결 1건을 DB에 남김

**다음 할 일**
1. 재무제표·펀더멘털 화면
2. ECOS·FRED·DART 키 발급 후 소스 검증
3. 모바일 Expo 기동

**막힌 것**
- KRX 시세는 KIS 전이라 국내 주식 평가손익은 종가 없으면 표시 안 됨
- ECOS 키 없어 USDKRW 없음 — 해외 체결은 환율을 직접 넣어야 원화 평가가 맞음

## 2026-09-12 — 재무 프로필 + 거래 분류 (feat/financial-profile)
**한 일**
- `/profile`: 세후 월소득·고정비·비상금 개월·위험 성향 저장 (`profile.get` / `upsert`). 월소득이 있으면 대시보드 권장 배분 표시, 챗 컨텍스트에 가이드 주입
- `/accounts` 최근 거래에 분류 선택. `transactions.updateCategory` — 입금은 수입 분류, 출금은 지출·저축만
- 가이드는 `packages/core` `monthlyBudgetGuide` 그대로 (50/30/20 + 비상금·위험성향)

**실행 확인**
- api·web typecheck 통과, core 테스트 9개 통과
- `/` `/profile` `/accounts` 200. 프로필 저장 후 대시보드: 필수 1,750,000 · 여가 700,000 · 저축·투자 1,050,000 (예적금 840,000 / 투자 210,000), 비상금 부족 노트
- Chrome: `/profile`에 저장된 값 표시, `/accounts`에서 입금 분류 6개·출금 15개. `점심` 미분류 → 식비. 입금에 식비 지정은 거절

**다음 할 일**
1. 보유 종목·체결 입력, 평가손익(시세 연동)
2. 재무제표·펀더멘털 화면
3. ECOS·FRED·DART 키 발급 후 소스 검증
4. 모바일 Expo 기동

**막힌 것**
- 윈도우·안티그래비티 작업은 원격에 없음
- ECOS·FRED·DART 키, `SEC_USER_AGENT` 없음
- 은행별 전용 파서는 실제 내보내기 샘플 필요

## 2026-09-05 (2) — 계좌 등록 + CSV 가져오기 (feat/accounts-csv)
**한 일**
- `/accounts`: 계좌 추가·목록, 범용 통장 CSV/XLSX 미리보기 후 저장
- `transactions.previewImport` / `commitImport` / `list` — api가 `@finvesting/interop`로 파싱. EUC-KR/UTF-8 자동, 같은 계좌·날짜·금액·방향·메모는 중복 skip. 마지막 `잔액`으로 계좌 잔액 갱신. 입금=`other_income`, 출금=`uncategorized`
- 대시보드에 계좌 0건이면 `/accounts` 링크

**실행 확인**
- `GET /accounts` 200, 계좌 생성 200
- 샘플 CSV 3건 preview → commit inserted 3, 잔액 3,150,000. 재업로드 duplicate 3
- 대시보드: 순자산 3,150,000 · 수입 3,200,000 · 변동 50,000
- 2026-09-06 Chrome UI: `UI검증 입출금` 추가 + CSV 2건 저장 → 대시보드 순자산 3,635,000 · 수입 3,700,000 · 변동 65,000

**다음 할 일**
1. 재무 프로필 입력 화면 → 배분 가이드
2. 거래 분류(카테고리) 수정 UI
3. ECOS·FRED·DART 키 발급 후 소스 검증
4. 모바일 Expo 기동

**막힌 것**
- 은행별 전용 파서는 실제 내보내기 샘플이 필요
- DB에 검증용 계좌 `테스트 입출금`과 거래 3건이 남아 있음 (삭제 여부 사용자)

## 2026-09-05 — 리뷰 반영 (fix/first-run-review)
**한 일**
- `latestNews`는 제목·url·publisher·날짜·요약만 (embedding/raw 제외), `published_at DESC NULLS LAST`
- 챗: 거시지표 코드별 최신 1건, 뉴스 요약, 계좌·거래·체결이 있으면 자산/현금흐름/보유 주입. 프롬프트는 없는 데이터를 지어내지 않게 수정. 메시지 40턴·8000자
- Yahoo/Upbit upsert에 당일 OHLC·거래량. Yahoo 펀더멘털 날짜를 시세일(NY)과 맞춤
- DART 타깃 형식 검증, 금액 파싱 실패는 skip. EDGAR는 `SEC_USER_AGENT` 없으면 skip, fact는 `end` 최신
- Next `.env` 인라인 주석 제거, `.env.example` 주석을 윗줄로. Ollama 기본 `gemma4:12b`, setup.md 일치
- 대시보드 조회를 `packages/api/src/lib/overview.ts`로 공유

**다음 할 일**
1. 계좌 등록 + 거래 CSV 업로드 UI (`packages/interop` 파서 연결)
2. ECOS·FRED·DART 키 발급 후 해당 소스 검증
3. 모바일 Expo 기동 검증
4. `quotes` unique에 source 넣을지 (리뷰 #7, KIS 전에 ADR)

**실행 확인 (같은 세션)**
- Docker 기동 → `pnpm db:up` → `pnpm dev:web`: `/`·`/chat` 200, tRPC 배치 200. latestNews 키에 embedding/raw 없음
- `chat.ask` 2회: 보유/현금흐름 없음 정직 응답, 뉴스 제목 3개 인용 (Ollama gemma4:12b)
- `run:once` 2회: rss 268→0, upbit/yahoo 당일 OHLC upsert, EDGAR는 UA 없어 skip

**막힌 것**
- web `tsc`: `react-markdown`이 React 19 JSX 타입과 안 맞음 (이번 변경과 무관, 기존)
- 리뷰 #7·#11·#13 미반영/보류
- 맥 Node 26 vs `.nvmrc` 22
- 브라우저 자동화 없음 — 화면 클릭/IME는 curl로 대체

## 2026-09-02 (8) — 첫 실행 이후 코드 리뷰 (docs/first-run-review)
**한 일**
- `dev`(feat/first-run 머지 후) 정적 리뷰: `docs/review/2026-09-02-first-run.md`
- core 테스트 9개(fx 3개 포함)·interop 3개 실행 통과 — 이전 표의 “fx 미실행” 해소
- 수정은 하지 않음 (리뷰만)

**다음 할 일**
1. 리뷰 반영 여부 결정 (우선: latestNews 컬럼 제한, 시세 upsert OHLC, 챗 거시지표 코드별 최신 1건)
2. ECOS·FRED·DART 키 발급 후 해당 소스 검증
3. 계좌 등록 + 거래 CSV 업로드 UI
4. 모바일 Expo 기동 검증

**막힌 것**
- 맥 Node 26.7.0 (`.nvmrc`는 22) — 지금은 동작하나 Expo 등에서 문제 가능
- yahoo-finance2 3.x deprecated 경고 — 상위 메이저 확인 필요
- Next `.env` 파서와 dotenv·모바일 파서가 인라인 주석 처리가 다름

## 2026-09-02 (7) — 첫 실행: DB 마이그레이션 성공 (feat/first-run)
**한 일**
- 브랜치 전략 적용: main/dev 푸시, `feat/first-run`에서 작업
- Docker Desktop 기동, `pnpm db:up`, pgvector 확장
- `pnpm db:generate` 실패 → 상대 import `.js` 제거(29파일)로 해결 (logs 기록)
- `pnpm db:migrate` 실패 → 루트 `.env` 생성으로 해결
- 마이그레이션 `0000_blue_carlie_cooper.sql` 적용(16 테이블), 기본 사용자 seed 완료

- worker `run:once`: env.ts 경로 버그 수정 → RSS 8개 피드 전부 응답(1차 325건), Upbit 4, Yahoo v2 429 실패 → v3 전환·백오프 후 4/4 성공. 시세일을 `regularMarketTime` 미국 동부 날짜로 변경

- `pnpm dev:web` 기동 성공: `/` 200, tRPC 대시보드·뉴스 200 (DB 실데이터로 렌더)

- `/chat` + Ollama(gemma4:12b) 질의 성공 — 수집 뉴스 기반 시장 요약 답변. 한글 IME Enter 이중 전송·색상 대비 버그 수정, 답변 마크다운 렌더(react-markdown)

**다음 할 일**
1. `pnpm install` 후 `/chat` 재확인 (react-markdown 추가)
2. `pnpm -r test` (fx 테스트 3개 포함)
3. ECOS·FRED·DART 키 발급 후 해당 소스 검증
4. feat/first-run → dev merge

**막힌 것**
- 맥 Node가 26.7.0 (`.nvmrc`는 22) — 지금은 동작하나 Expo 등에서 문제 가능, `nvm use`로 맞출 것
- yahoo-finance2 3.15.4에도 deprecated 경고 — 상위 메이저가 있는지 확인 필요

## 2026-09-02 (6) — 검증 기록 폴더, ChatGPT.md, 영문 미러 (Claude)
**한 일**
- `docs/verification/` 신설: AI 모델별 검증 기록 + 검증 현황 표
- `ChatGPT.md` 추가
- 영문 미러: `README.en.md`, `docs/README.en.md`, `tech/overview.en.md`, `tech/architecture.en.md`, `prompts/00-bootstrap.en.md`, AGENTS/CLAUDE/ChatGPT 영문 규칙 섹션. 언어 정책(한국어 정본, 핵심 문서만 `.en.md`)을 README에 명시
- 원격 저장소 미연결 — GitHub 저장소 생성 후 push 필요

**다음 할 일** — (3)과 동일 + GitHub remote 연결·push
**막힌 것** — 나머지 문서(data-model, data-sources, ai, interop, setup, 프롬프트 템플릿 등)는 아직 한국어만

## 2026-09-02 (5) — Cursor 리뷰 검토 + 보류 항목 처리 (Claude)
**한 일**
- Cursor 변경분 검토: 수정 내용 타당, 7개 패키지 typecheck 재확인 통과
- 리뷰 #18 모바일 env: `apps/mobile/app.config.ts`에서 루트 `.env`의 `EXPO_PUBLIC_*` 로드 (app.json은 유지, extra.apiUrl 추가)
- 리뷰 #19 해외 포지션: `core/portfolio.ts`에 `fxRate` 가중평균(`avgFxRate`)·원화 실현/평가손익(`realizedPnlKrw`, `pnlKrw`) 추가 + 테스트
- 리뷰 #21 eslint 설정 없는 `lint` 스크립트 제거 (필요 시 eslint 도입 후 복구)
- 리뷰 #22 worker 기동 시 즉시 1회 수집 (`WORKER_RUN_ON_START`, 기본 true)
- `pnpm-lock.yaml` 커밋, `*.tsbuildinfo` gitignore

**다음 할 일** — (3)과 동일. 최우선: `pnpm db:generate/migrate` → seed → `pnpm dev:worker`로 수집 확인
**막힌 것**
- yahoo `today`를 KST로 잡으면 미국 장 마감 데이터가 KST 다음날 날짜로 저장될 수 있음 — 실제 거래일(`regularMarketTime`) 기준으로 바꿀지 첫 실행 후 결정
- 증권사 수수료가 원화로 청구되는 경우 `TradeLike.fee`는 종목 통화로 환산해 넣어야 함 (CSV 파서에서 처리)

## 2026-09-02 (4) — mobile tsconfig expo/tsconfig.base 미해결
**한 일**
- `apps/mobile/tsconfig.json`이 `expo/tsconfig.base`를 확장해 IDE에서 `File 'expo/tsconfig.base' not found` 발생. pnpm은 expo를 `apps/mobile/node_modules`에만 두므로 루트 IDE가 못 찾음
- `../../tsconfig.base.json` + `jsx: react-native`로 교체. `pnpm --filter @finvesting/mobile typecheck` 통과

**다음 할 일** — (3)과 동일
**막힌 것** — (3)과 동일

## 2026-09-02 (3) — 폴더별 오류 점검·수정
**한 일**
- 전 폴더 정적 리뷰 (`docs/review/2026-09-02-scaffold.md`)
- 대시보드 월 말일(`YYYY-MM-31`) Postgres 오류 + KST 월 기준 수정
- pnpm 격리: api에 `drizzle-orm`, worker/db/api/ai에 `@types/node`
- 루트 `.env` 로딩: worker `lib/env.ts`, drizzle.config, Next는 `next.config.ts`에서 루트 `.env` 직접 파싱
- `instruments (symbol, market)` unique, watchlist `user_id` FK
- upbit가 `ensureInstrument` 사용·마켓별 실패 격리, yahoo 시세일 KST, DART/EDGAR 입력 방어
- core·interop vitest 추가, 범용 통장 파서 헤더 탐지 수정
- `.nvmrc`, `OLLAMA_EMBED_MODEL`, turbo typecheck `^typecheck`, 미사용 core 의존 제거
- `pnpm install` 완료, `pnpm typecheck` 8패키지 통과, core 7·interop 3 테스트 통과

**다음 할 일**
1. `pnpm db:generate/migrate` 후 seed 적용, worker `run:once`
2. `pnpm dev:web` 기동 확인
3. 모바일 `.env` 경로(`EXPO_PUBLIC_API_URL`) 결정
4. 계좌 등록 + 거래 CSV 업로드 UI
5. Ollama 연결 후 /chat 동작 확인

**막힌 것**
- 모바일은 Expo가 `apps/mobile/.env`만 읽음 — 루트 `.env`의 `EXPO_PUBLIC_API_URL`은 미적용
- 해외 포지션 `fxRate`는 스키마에만 있고 `core/portfolio` 계산에 미반영
- yahoo-finance2@2.14.2 deprecated 경고. 첫 `run:once`에서 API 시그니처 확인 필요

## 2026-09-02 (2) — 문서 구조 정리 + 해외 데이터 수집 추가
**한 일**
- docs를 progress · tech · logs · review · prompts 5개 폴더로 재구성, 루트 README를 프로젝트 지도로 재작성
- docs/prompts: 모델 무관 공통 프롬프트(부트스트랩, 작업별 템플릿, 세션 종료, 컨벤션)
- 수집 범위를 국내+해외로 확장: FRED 어댑터(연준금리·CPI·국채 2y/10y·달러지수·실업률·VIX), 해외 뉴스 RSS(CNBC·MarketWatch·Fed·ECB), 업비트 SOL/XRP 추가
- 결정: `macro_indicators.code`는 국가 접두어(`US_*`)로 구분, 접두어 없음 = 한국
- 재무제표·펀더멘털 수집 추가: 스키마 `financial_statements`, `instrument_fundamentals`, `instrument_identifiers`; 어댑터 DART(한국, 공식), SEC EDGAR(미국, 공식), Yahoo Finance(미국 시세·지표, 비공식 라이브러리)
- `packages/interop` 신설: 통장 CSV/XLSX 범용 파서, 세무사 전달용 장부 CSV 내보내기 초안, 더존·위하고·세무사랑 연동 계획(interop.md)
- 사이트별 방침 정리(data-sources.md): Finviz는 개인용 한정, TradingView는 공식 위젯 임베드만, Investing.com은 크롤링 비권장

**다음 할 일** — 아래 첫 항목과 동일 (첫 실행 검증이 최우선)
**막힌 것** — FRED·ECOS·DART 키 발급 필요, 해외 RSS URL은 변경될 수 있어 첫 실행 때 확인. DART 계정명 매핑·yahoo-finance2 API 시그니처·SEC 태그는 실제 응답으로 검증 필요(코드에 TODO). 수집 대상 종목은 아직 환경변수(`*_TARGETS`)로 수동 지정

## 2026-09-02 — 프로젝트 스캐폴딩
**한 일**
- 기획서(Concept Brief v0.1) 기준으로 핵심 사용자(본인, 근로자 투자자)와 MVP 1단계 범위 확정
- 기술 스택 결정 (ADR 0001~0005)
- 모노레포 뼈대 생성: apps/web·mobile·worker, packages/db·core·api·ai
- DB 스키마 초안: users, financial_profiles, accounts, transactions, instruments, trades, investment_incomes, research_notes, watchlist, market_quotes, macro_indicators, market_news(pgvector), economic_events
- core: 현금흐름 요약, 월 배분 가이드(50/30/20 + 비상금·위험성향 조정), 포지션 계산(평균단가법)
- worker: RSS 뉴스, 업비트 시세, ECOS 거시지표 어댑터 + cron 스케줄
- api: accounts, dashboard.overview, market, chat 라우터
- web: 대시보드(/), 챗봇(/chat) 최소 UI
- mobile: Expo 대시보드 최소 UI
- docs/ 구조(progress · tech · logs · review · prompts)와 README, AGENTS.md/CLAUDE.md
- docs/prompts: 모델 무관 공통 프롬프트(부트스트랩, 기능/버그/스키마/수집/AI/리뷰 템플릿, 세션 종료, 컨벤션)

**아직 안 한 것 (의존성 설치·실행 전)**
- `pnpm install` 및 첫 실행 검증 — 패키지 버전 충돌 가능성 있음
- 마이그레이션 생성·적용
- 실제 계좌·거래 데이터 입력 UI 또는 CSV 업로드

**다음 할 일**
1. 맥에서 `pnpm install` → 타입체크 → `pnpm dev:web` 기동 확인
2. `pnpm db:generate/migrate` 후 seed 적용, worker `run:once`로 뉴스·시세 수집 확인
3. 계좌 등록 + 거래 CSV 업로드(은행·카드 내보내기 파서) 구현
4. financial_profiles 입력 화면 → 배분 가이드 표시 확인
5. Ollama 연결 후 /chat 동작 확인

**막힌 것 / 미결정**
- 윈도우 작업 경로 미정
- KIS Open API 키 발급 여부
- 두 기기 DB 데이터 동기화 방식 (현재: 맥북에만 실데이터)


