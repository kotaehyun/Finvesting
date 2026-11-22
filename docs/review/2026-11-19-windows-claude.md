# 2026-11-19 — 윈도우 저장소 점검 (Claude)

- 날짜: 2026-11-19
- 리뷰어: Claude (윈도우 PC `desktop-47nss4k`에 직접 연결, 읽기 전용 git 명령)
- 대상: `C:\dev_task\workspace\project\self_project\Finvesting`
- 기준: `origin/dev` = `862a4b1` (11-18). 윈도우 현재 브랜치 `feat/market-terminal-2` = `d23b53e` + 커밋 안 된 15파일·새 파일 4개
- 한계: 윈도우 `node_modules`는 이 세션의 리눅스 셸에서 실행되지 않아 **typecheck·테스트를 직접 돌리지 못했다.** 실행 결과는 `docs/verification/2026-11-19-cursor.md`(Cursor, 윈도우)를 인용했다.
- 같이 볼 문서: `docs/review/2026-11-19-claude.md` (원격 `dev` 전체 리뷰, 22건)

## 결론

윈도우에는 **GitHub에 한 번도 올라가지 않은 커밋이 날짜별로 네 덩어리** 있다.

| 날짜 | 덩어리 | 판단 |
|---|---|---|
| 09-05 ~ 09-11 | 9월 기능 사슬 8개 브랜치 + 초기 브랜치 5개 | **머지 금지.** 출처 없는 통계·시세를 코드에 박았다. 보관 후 삭제 |
| 10-25 | 로컬 `dev`의 차트 완화·회계 전표 색 (2패치) | **살린다.** `origin/dev`와 충돌 0 |
| 11-09 | `feat/kis-quotes` (104파일) | **그대로 머지 금지.** ADR 번호·마이그레이션 번호가 `dev`와 겹치고, KIS 결정이 반대. 쓸 만한 부분만 골라 다시 |
| 11-18 ~ 11-19 | `feat/market-terminal-2` 로컬 6커밋 + 오늘 미커밋 이상 지출 기능 | 코드는 `dev`와 같고 문서 3파일만 다르다. 이상 지출은 새 브랜치로 옮긴다 |

맥북 `dev`가 정본이고, 윈도우는 두 달 동안 따로 갈라져 있었다. 같은 기능(뉴스 매칭)을 두 기기에서 따로 구현한 일도 있었다. 정리 후에는 기기를 바꿀 때마다 "시작 전 fetch, 끝나면 push"를 지켜야 한다.

---

## 날짜별 브랜치 현황

`origin/dev`에 들어가지 않은 로컬 브랜치 전부다. "고유 패치"는 `git cherry` 기준으로 `dev`에 같은 내용이 없는 커밋 수다.

| 마지막 커밋 | 브랜치 | 출발점 | 고유 패치 | 변경 | 판단 |
|---|---|---|---|---|---|
| 09-05 | `chore/windows-setup` | 09-02 | 2 | 9파일 +122 | 보관. GEMINI.md만 확인 후 필요하면 옮김 |
| 09-05 | `feat/csv-import` | 09-02 | 3 | 25파일 +1,970 | 보관. 맥 `feat/accounts-csv`(09-07)가 대체 |
| 09-05 | `dev-backup-old` | 09-02 | 3 | 25파일 +1,970 | 보관. `csv-import`와 같은 내용 |
| 09-05 | `feat/fundamentals-screen` | 09-02 | 4 | 29파일 +2,586 | 보관. 맥 `/fundamentals`·`/statements`가 대체 |
| 09-10 | `feat/sync-mac-work` | 09-08 | 1 | 19파일 +2,336 | 9월 사슬 1번째 |
| 09-10 | `feat/profile-budget-guide` | 09-08 | 2 | 25파일 +2,818 | 사슬 2 |
| 09-10 | `feat/smart-market-terminal` | 09-08 | 3 | 27파일 +3,550 | 사슬 3 |
| 09-10 | `feat/global-money-flow-recommendation` | 09-08 | 4 | 31파일 +4,443 | 사슬 4 |
| 09-10 | `feat/domestic-money-flow` | 09-08 | 5 | 32파일 +4,876 | 사슬 5 |
| 09-10 | `feat/peer-benchmark-distribution` | 09-08 | 6 | 35파일 +5,737 | 사슬 6 |
| 09-10 | `feat/lifecycle-realestate-loan-planner` | 09-08 | 7 | 38파일 +6,453 | 사슬 7 |
| 09-11 | `feat/real-estate-market-analytics` | 09-08 | 8 | 41파일 +7,025 | 사슬 끝 (09-21부터 "미통합"으로 지적됨) |
| 10-25 | `fix/accounting-journal-palette` | 10-10 | 1 | 6파일 +557/−378 | 살림 (로컬 `dev`에 포함) |
| 10-25 | `dev` (로컬) | 10-10 | 2 | 11파일 +801/−509 | 살림. 원격보다 4 앞, 15 뒤 |
| 11-05 | `backup/merged-kis-quotes` | 11-05 | 2 | 11파일 | 보관 |
| 11-09 | `feat/kis-quotes` | 10-10 | 3 | 104파일 +7,833/−692 | 골라서 다시 (W2) |
| 11-18 | `feat/market-terminal-2` | 11-18 | 5 | 문서 3파일 +34 | 문서만 옮김 (W6) |

9월 사슬 8개는 각각이 앞 브랜치를 그대로 포함한다(`sync-mac-work ⊂ profile-budget-guide ⊂ … ⊂ real-estate-market-analytics`). 사실상 브랜치 하나이고, 마지막 `feat/real-estate-market-analytics`만 보관하면 나머지 7개는 그 안에 다 들어 있다.

기타: `main`(로컬)은 원격보다 45 뒤, `mac`은 7 뒤. 둘 다 새 작업은 없다.

---

## 발견한 문제

### 🔴 W1. 9월 사슬: 출처 없는 통계·시세를 코드에 박음 (09-10 ~ 09-11)
- 위치: `feat/real-estate-market-analytics` 기준
  - `packages/core/src/benchmark.ts`: 주석에 "통계청(가계금융복지조사)·고용노동부(임금구조기본통계조사) 기반"이라고 적었지만, 연령 × 학력별 월소득·순자산의 p10~p90·평균 값을 `2900000`, `55000000`처럼 **반올림한 숫자로 직접 넣었다.** 출처 URL, 기준 시점, 표 번호가 없다.
  - `packages/core/src/realestate-analytics.ts`: 권역별 평당가(`89000000`), 전세가율(`49.2`), 리츠 시가총액(`5200000000000`)이 코드 상수다. 출처 URL 0건.
  - `packages/core/src/allocation.ts`(+385줄), `realestate-planner.ts`: 연령·성별·소득별로 ETF 테마 비중을 추천하는 엔진이다. 근거 없는 투자 비중 숫자가 들어 있다.
- 왜 문제인가: AGENTS.md의 "통계·기사·과거값 생성 금지, 실패는 빈 칸+status" 규칙(09-16 추가)보다 먼저 만든 코드라, 규칙을 정면으로 어긴다. 사용자는 "통계청 기반"이라는 문구를 믿고 자기 위치를 판단하게 된다.
- 판단: **머지하지 않는다.** 출발점도 09-08이라 `dev`와 70커밋 넘게 벌어져 있다. 아이디어(또래 비교, 생애주기 플래너, 부동산 사이클)는 나중에 실제 공표 표(KOSIS API 등)를 받아 새로 만든다.
- 조치: 보관 태그를 만든 뒤 로컬 브랜치를 삭제한다(아래 「정리 순서」).

### 🔴 W2. `feat/kis-quotes`: ADR·마이그레이션 번호가 `dev`와 겹치고 결정이 반대 (11-09)
- 텍스트 충돌은 0건이다(`git merge-tree` 확인). 하지만 머지하면 의미가 깨진다.
- **ADR 번호 7개가 전부 겹친다.**

  | 번호 | `origin/dev` | `feat/kis-quotes` |
  |---|---|---|
  | 0051 | 네이버 뉴스 API 안 씀 | KIS 시세가 Yahoo를 덮음 |
  | 0052 | 뉴스 종목 매칭 | KRX 거래대금 순위 |
  | 0053 | **한투(KIS) 시세 API 지금 호출 안 함** | 재무제표 회사 팔로우 |
  | 0054 | 국민연금 구간·해외주식 | 재무제표 회사명 검색 |
  | 0055 | worker 컨테이너 | 국내 수요 vs 이익 |
  | 0056 | 로컬 비밀번호 세션 | 재무제표 열면 DART 조회 |
  | 0057 | 네이버 뉴스 검색 | 국내 수요 AI 해석 |

  특히 KIS: 윈도우는 10-25에 KIS 시세를 구현했고(ADR 0051), 맥은 11-09에 "키 발급 안 함, 호출 안 함"으로 정했다(ADR 0053). 머지하면 서로 반대인 결정 두 개가 같이 남는다.
- **DB 마이그레이션 번호 0008이 겹친다.** `dev`는 `0008_company_profiles`·`0009_chat_sessions`, 윈도우는 `0008_reflective_cargill`(`statement_companies` 테이블)이다. 그대로 합치면 drizzle 저널이 꼬인다.
- 살릴 만한 것(코드를 읽어 본 범위):
  - `pickDartAudit`: 감사보고서 응답 첫 행 대신 고르는 함수. `dev`의 `dart.ts:229`는 여전히 `list?.[0]`을 쓴다.
  - `dart-corps.ts`·`dart-statements.ts`(+테스트): 회사명 검색과 재무제표 보조
  - `krx-trade-rank.ts`, `kr-demand.ts`·`kr-demand-reading.ts`(+테스트), `holdings-summary.ts`
  - 화면: `site-nav.tsx`, `market-rail.tsx`, `kr-demand.tsx`, `kr-trade-leaders.tsx`, `portfolio-mix.tsx`
- 판단: 브랜치째 머지하지 않는다. 위 항목을 기능 하나씩 새 브랜치로 옮기고, ADR은 0063번부터, 마이그레이션은 `0010`으로 다시 만든다. KIS 코드(`lib/kis.ts`, `sources/kis.ts`)는 ADR 0053을 유지하는 동안 보관만 한다.

### 🟠 W3. 로컬 `dev`가 원격과 갈라짐 (10-25)
- 로컬 `dev`(`45caf2c`)는 원격보다 4커밋 앞서고 15커밋 뒤처져 있다.
- 앞선 4개 중 실제 내용은 2개다:
  - `514fde0` 회계 전표 화면을 남색·흰 장부 틀로 정리
  - `448a5dc` 홈·프로필 차트를 연한 색과 곡선으로 완화
- `origin/dev`와 합쳐도 충돌 0이다.
- 조치: 이 2개를 `feat/softer-charts-palette` 새 브랜치로 옮긴다. 로컬 `dev`는 `origin/dev`로 맞춘다. 이 상태로 `dev`에서 `pull`·`push`하면 머지 커밋이 꼬인다.

### 🟠 W4. 오늘(11-19) 커밋 안 된 「이상 지출」 기능
- 위치: `packages/core/src/spending-anomaly.ts`(+테스트 6건), `packages/api/src/lib/overview.ts`, `routers/chat.ts`, `apps/web/src/app/page.tsx`, ADR 0062
- 좋은 점: 평균·배율·표준편차를 만들지 않고 "이 원장의 이전 최댓값"과만 비교한다. 규칙과 맞다. 이전 소비가 없으면 `status: empty`. 저축·투자·이체 제외도 `summarizeCashflow`와 같은 정의를 쓴다.
- 문제
  1. **이미 머지된 브랜치 위에서 작업 중이다.** `feat/market-terminal-2`는 11-18에 `dev`로 들어갔다. 새 브랜치(`feat/spending-anomaly`)로 옮겨야 한다.
  2. **홈·챗을 열 때마다 전체 거래 이력을 읽는다.** `overview.ts`의 새 조회는 `date <= 이번 달 말`만 있고 시작일이 없다. 몇 년치 CSV를 넣으면 매번 수천 행이다. 최근 24개월로 자르거나, 월·분류 합계를 SQL `GROUP BY`로 받는다(건별 최댓값도 `max()`로 가능).
  3. **처음 몇 달은 거의 모든 분류가 「이상」으로 뜬다.** 2개월째에는 비교 대상이 1개월뿐이라, 조금만 더 써도 다 올라온다. 이전 기간이 N개월 미만이면 목록을 내지 않는 조건을 ADR 0062에 적는다(N은 사용자가 정함). 화면에 "이전 1달" 같은 표시는 이미 있다.
  4. **처음 나온 분류의 큰 지출은 안 잡힌다.** 이전 기록이 없는 분류는 비교하지 않는다. 의도라면 ADR에 한 줄 적는다.
  5. 분류 이름표가 두 벌이다. 챗은 core의 `LABELS`, 화면은 web의 `categoryLabel`을 쓴다. 하나로 합친다.
- 우선순위: 재무제표 숫자 문제(11-19 리뷰 #1~#4)가 아직 그대로인데 새 기능이 먼저 들어왔다.

### 🟠 W5. `dev` 자체가 web 타입체크 실패
- Cursor 11-19 기록: `pnpm --filter @finvesting/web typecheck`가 `apps/web/src/app/realty/geo-map.tsx` 301·308행에서 실패한다.
- 이 파일은 `origin/dev`와 똑같다(diff 없음). 즉 **원격 `dev`가 지금 web 타입체크를 통과하지 못하는 상태다.** 11-18 지도 작업에서 들어왔다.
- 해당 줄: `highlightPaint`·`heightPaint`의 maplibre `DataDrivenPropertyValueSpecification` 캐스팅.
- 조치: 다음 세션 맨 앞에서 고친다. 11-19 리뷰 세션 A 프롬프트의 "시작 전"에 넣는다.

### 🟡 W6. `feat/market-terminal-2` 로컬 6커밋은 문서만 다름 (11-09 ~ 11-18)
- 윈도우에서 11-09 뉴스 매칭 수정을 따로 구현했다. 맥 버전(`dfc1368`)을 그 위에 머지한 결과, **코드는 `origin/dev`와 한 글자도 다르지 않다.**
- 다른 것은 문서 3파일뿐이다: `docs/review/2026-11-09-news-match.md`, `docs/review/README.md` 1줄, `docs/verification/2026-11-09-cursor.md`
- 조치: 이 3파일만 새 브랜치에 넣는다. 나머지 커밋은 버려도 잃는 것이 없다.

### 🟡 W7. PowerShell 5.1에서 한글 커밋 메시지가 깨짐
- 저장소 데이터는 정상이고, 콘솔이 UTF-8을 CP949로 읽어서 생기는 표시 문제다.
- PowerShell 프로필(`notepad $PROFILE`)에 아래를 넣는다.
  ```powershell
  [Console]::OutputEncoding = [Text.UTF8Encoding]::new()
  $env:LESSCHARSET = "utf-8"
  ```

### 🟡 W8. 기기 간 이중 작업
- 9월과 11월 두 번, 같은 영역을 맥과 윈도우에서 따로 만들었다(CSV 가져오기, 재무 화면, 부동산, 뉴스 매칭).
- `docs/tech/git-workflow.md`(09-02)에 기기 전환 체크리스트가 이미 있다. 지켜지지 않았다.
  - 시작 전: `git fetch`, `git status -sb`, 뒤처졌으면 먼저 `pull`
  - 끝날 때: 작업 브랜치 `push` (머지하지 않아도 push는 한다)

### 🟡 W9. 원격에 남은 오래된 브랜치
- `chore/realty-erp-freeze`, `docs/main-merge-statements`, `feat/accounts-csv`, `feat/erp-tax-desk`, `feat/yahoo-fundamentals`, `feat/market-terminal-2`는 모두 `dev`에 들어갔다. 원격에서 지워도 된다.

---

## 정리 순서 (윈도우 PowerShell)

**아무것도 잃지 않도록 1번(보관 태그)을 먼저 한다.** 태그는 커밋을 가리키는 이름표라, 브랜치를 지워도 언제든 되살릴 수 있다.

### 1. 보관 태그 (지우기 전에 반드시)
```powershell
cd C:\dev_task\workspace\project\self_project\Finvesting
git fetch origin
$keep = "chore/windows-setup","feat/csv-import","dev-backup-old","feat/fundamentals-screen","feat/real-estate-market-analytics","backup/merged-kis-quotes","feat/kis-quotes","dev","feat/market-terminal-2"
foreach ($b in $keep) { git tag ("archive/2026-11-19/" + $b) $b }
git tag -l "archive/*"
```
`feat/real-estate-market-analytics` 하나가 9월 사슬 8개를 다 포함하므로, 사슬의 나머지 7개는 따로 태그하지 않아도 된다.

### 2. 오늘 작업(이상 지출)을 새 브랜치로 옮김
커밋 안 된 변경은 브랜치를 새로 만들어도 그대로 따라온다.
```powershell
git switch -c feat/spending-anomaly origin/dev
git status -sb
```
`git switch`가 충돌로 거부하면, 거기서 멈추고 Claude에게 출력을 보낸다.

### 3. 10-25 차트·전표 색 2커밋을 새 브랜치로 (W3)
```powershell
git stash push -u -m "spending-anomaly 2026-11-19"
git switch -c feat/softer-charts-palette origin/dev
git cherry-pick 514fde0 448a5dc
git switch feat/spending-anomaly
git stash pop
```

### 4. 11-09 문서 3파일 (W6)
`feat/spending-anomaly`에서 같이 커밋해도 되고, 따로 해도 된다.
```powershell
git checkout feat/market-terminal-2 -- docs/review/2026-11-09-news-match.md docs/verification/2026-11-09-cursor.md
```
`docs/review/README.md`의 한 줄은 손으로 옮긴다(오늘 리뷰 2건 줄도 같이).

### 5. 로컬 `dev`·`main` 맞추기, 보관한 브랜치 지우기
```powershell
git branch -f dev origin/dev
git branch -f main origin/main
git branch -D mac feat/sync-mac-work feat/profile-budget-guide feat/smart-market-terminal feat/global-money-flow-recommendation feat/domestic-money-flow feat/peer-benchmark-distribution feat/lifecycle-realestate-loan-planner feat/real-estate-market-analytics chore/windows-setup feat/csv-import dev-backup-old feat/fundamentals-screen backup/merged-kis-quotes fix/accounting-journal-palette
```
`feat/kis-quotes`와 `feat/market-terminal-2`는 W2 작업이 끝날 때까지 남겨 둔다.

### 6. 올리기
```powershell
git push origin feat/spending-anomaly feat/softer-charts-palette
git push origin --tags
```
태그 push는 공개 저장소에 보관본을 남긴다. 9월 코드(W1)를 공개로 남기기 싫으면 `--tags`는 빼고 로컬에만 둔다.

---

## 사용자가 정할 것
1. **KIS**: ADR 0053(호출 안 함)을 유지할지. 유지하면 W2의 KIS 코드는 보관만 한다.
2. **9월 아이디어**: 또래 비교, 생애주기 플래너, 부동산 사이클 중 다시 만들 것이 있는지. 다시 만든다면 실제 공표 표부터 받는다.
3. **이상 지출 최소 비교 기간**: W4-3의 N개월.
4. **보관 태그 공개 여부**: 6번의 `--tags`.

## 잘된 점
- 윈도우에서 한 작업도 검증 기록을 빠짐없이 남겼다(`2026-10-25-cursor-*`, `2026-11-01-cursor-*` 9건, `2026-11-19-cursor.md`). "확인 못 함"(web 타입체크 실패, 이상 항목 실데이터 미확인)도 정직하게 적었다.
- 이상 지출은 원장 숫자만 쓰는 규칙을 ADR로 먼저 정하고 만들었다.
- KIS 구현은 ADR 0051에 공식 샘플 저장소, TR ID, 덮어쓰기 규칙까지 근거를 붙였다. 다시 열 때 그대로 쓸 수 있다.

## 반영 표
| # | 심각도 | 위치 | 내용 | 반영 |
|---|---|---|---|---|
| W1 | 높음 | 9월 사슬 8브랜치 | 출처 없는 통계·시세 하드코딩, 투자 비중 추천 | |
| W2 | 높음 | `feat/kis-quotes` | ADR 0051~0057·마이그레이션 0008 중복, KIS 결정 반대 | |
| W3 | 중간 | 로컬 `dev` | 갈라짐(4 앞/15 뒤), 2패치 살리기 | |
| W4 | 중간 | 미커밋 이상 지출 | 머지된 브랜치 위 작업, 전체 이력 조회, 초기 오탐 | |
| W5 | 중간 | `realty/geo-map.tsx:301,308` | `origin/dev` web 타입체크 실패 | |
| W6 | 낮음 | `feat/market-terminal-2` | 문서 3파일만 미반영 | |
| W7 | 낮음 | PowerShell | 한글 표시 | |
| W8 | 낮음 | 작업 방식 | 기기 간 이중 작업 | |
| W9 | 낮음 | 원격 | 머지된 브랜치 6개 | |
