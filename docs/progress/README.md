# 진행 로그

최신이 위. 형식: 날짜 / 한 일 / 다음 할 일 / 막힌 것.

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
