# 2026-11-22 — 맥북 저장소 전체 점검 (Claude)

- 날짜: 2026-11-22 15:00
- 리뷰어: Claude (맥북 `thui-macbookpro-local`에 직접 연결, 읽기 전용)
- 대상: `/Users/th/개발/workspace/Finvesting`, 브랜치 `dev` = `f680b8d` (= `origin/dev`), 작업 트리 깨끗함
- 범위
  - 오늘 들어온 5단계 기능 4개: `f7f23fe`·`945f1fc` (이상 지출 ADR 0062, 리스크 설명 0063, 반복 패턴 0064, 확인할 일 0065)
  - 11-22 오전 리뷰(`2026-11-22-claude.md`) N1~N6 반영 여부
  - 맥에만 있는 것: `docs/fred-api-key-setup` 브랜치, `stash@{0}`, 문서 상태
- 한계: 이 연결에서는 맥의 로컬 Postgres에 접속할 수 없어 DB 상태(DART 재수집 범위 등)는 보지 못했다. 테스트·타입체크는 Cursor 검증 기록을 인용했다(4건 모두 8패키지 typecheck 통과, core 404개 통과).

## 결론

오늘 4개 기능은 **"원장 숫자만 쓰고, 규칙은 제품 규칙이라고 밝히고, 결과는 저장하지 않는다"**는 원칙을 일관되게 지켰다. 이상 지출은 윈도우판에서 지적했던 문제(전체 이력 조회, 초기 오탐)를 처음부터 피했다(직전 6개월, 소비 있는 달 3개월 이상).

그런데 **같은 기능이 윈도우에도 있다.** 번호까지 같은 ADR 0062다. 세 번째 이중 작업이다. 윈도우판은 버린다.

11-22 오전 리뷰의 N1~N4(DART 재수집, 2027년 요율 기간, 덮인 코스닥, 로그인 429)는 아직 하나도 손대지 않았다. 진행 기록은 DART 재수집을 「요청이 있을 때」로 미뤄 두고 있다. 지금 요청한다.

---

## 1. 오늘 들어온 기능 리뷰

### 🔴 M1. 이상 지출이 맥과 윈도우에 따로 있다 (ADR 0062 번호 중복)
| | 맥 (`dev`, 커밋됨) | 윈도우 (`feat/market-terminal-2`, 미커밋) |
|---|---|---|
| ADR | `0062-spend-anomaly.md` | `0062-spending-anomaly.md` |
| 코드 | `core/src/spend-anomaly.ts` | `core/src/spending-anomaly.ts` |
| 비교 기준 | 직전 6개월 분류 월합 최댓값 | 처음부터 지금까지 전체의 최댓값 |
| 최소 기간 | 소비 있는 달 3개월 이상 | 없음 (2개월째부터 거의 다 뜸) |
| 조회 | 직전 6개월 | 전체 거래 이력 매번 |

- 판단: **맥판을 쓴다.** 윈도우판은 push하지 않고 버린다. 11-19 윈도우 리뷰의 W4·정리 순서 2번("이상 지출을 `feat/spending-anomaly`로 옮겨 push")은 **취소**한다.
- 윈도우에서 할 일: 보관 태그만 만들고 미커밋 변경을 버린다(아래 「윈도우」 절).
- 원인: 맥에서 시작할 때 윈도우 미커밋 작업을 알 방법이 없었다. 이중 작업 방지 규칙을 `CLAUDE.md`·`AGENTS.md`에 넣는다(M9).

### 🟠 M2. 이상 지출의 「소비」가 홈의 소비와 다르다
- ADR 0062 결정 1: "소비는 홈의 고정비·변동비와 같다. 저축·투자·이체·미분류는 빼 둔다."
- 실제
  - 홈(`summarizeCashflow`): 변동비는 저축·투자·고정비를 뺀 **나머지 출금 전부**다. `uncategorized`와 목록에 없는 분류도 들어간다.
  - 이상 지출(`SPEND_ANOMALY_CATEGORIES`): 손으로 적은 15개 분류만 본다. 미분류와 새 분류는 빠진다.
- 그래서 "홈과 같다"는 문장이 틀렸다. 새 분류가 생기면 홈 합계에는 들어가는데 이상 지출에서는 조용히 빠진다.
- 수정: `cashflow.ts`에 `isSpendingCategory(category)`를 하나 두고 홈과 이상 지출이 같이 쓴다. 미분류를 빼는 건 이상 지출 쪽에서 따로 한 줄로 뺀다. ADR 문장은 "홈 소비에서 미분류만 뺀 것"으로 고친다.

### 🟡 M3. 반복 패턴: 기간 제한이 없다
- 위치: `core/src/repeat-mistake.ts`
- 내용: 손실 매도 뒤 같은 종목을 **언제** 다시 사든 1회로 센다. 2022년 손절 → 2026년 재매수도 같은 "반복"이다. 일부만 손실로 판 뒤 추가 매수(물타기)도 센다.
- 판단: 제품 규칙이라 틀린 건 아니다. 다만 사용자가 오해하기 쉽다.
- 수정(택1): ① 샘플마다 "매도 후 N일 뒤 재매수"를 같이 보여 준다. ② ADR 0064에 "기간 제한 없음, 일부 매도 포함"을 한 줄 적는다. ①이 사용자에게 더 낫다.

### 🟡 M4. 홈과 챗을 열 때마다 체결을 두 번 읽는다
- 위치: `api/src/lib/overview.ts` → `loadHoldings`(체결 전체) + `loadRepeatMistakes`(체결 전체 다시)
- 지금 규모에선 문제없다. 체결이 수천 건이 되면 `loadHoldings`가 읽은 행을 넘겨받게 바꾼다.

### 🟡 M5. 작은 것
- `risk-explain.ts`: 원/달러를 `${input.usdkrw}` 그대로 찍는다. `1387.2500000001` 같은 값이 화면·챗에 나올 수 있다. 소수 둘째 자리로 맞춘다.
- `proactive-alerts.ts`: 「반복 패턴」 알림이 `/holdings`로 가는데, 그 화면에는 패턴이 없다. 홈의 반복 패턴 카드(`#repeat-mistake`)나 거래 화면으로 보낸다.
- `docs/progress/README.md`: 11-20~22 다섯 기록의 「다음 할 일」에 같은 문장("국내 DART 나머지 재수집은 요청이 있을 때")이 복사돼 있다. 해결된 것처럼 밀려 내려가는 중이다(M6).

### 잘된 점
- 네 기능 모두 숫자 기준(6개월·3개월·5건·40%·20%·2회)을 상수로 빼고 "제품 규칙이며 공표 통계가 아니다"라고 코드와 ADR에 적었다.
- 챗 시스템 프롬프트에 블록마다 "적힌 숫자만 인용, 이유를 만들지 않음"을 넣었다. 조회 월이 진행 중이면 "○일까지의 거래"라고 덧붙인다.
- 리스크 설명은 변동성·VaR 같은 숫자를 만들지 않고 비중·통화만 말한다. "가격 변동폭은 계산하지 않습니다"를 명시했다.
- `overview.ts`가 6개월치를 읽으면서도 현금흐름·미분류 건수는 `monthTxns`로 이번 달만 쓴다. 범위를 넓히면서 생길 버그를 피했다.
- 기능마다 테스트(이상 지출 9·리스크 8·반복 7·확인할 일 4개)와 검증 기록이 있고, "챗 답은 확인하지 않음"을 정직하게 적었다.

---

## 2. 11-22 오전 리뷰 반영 현황

| # | 내용 | 상태 |
|---|---|---|
| N1 | 국내 DART 나머지 재수집 | ❌ 진행 기록에 「요청이 있을 때」로 미뤄 둠 → **지금 요청** |
| N1-b | 누적 칸이 전부 없을 때 옛 행이 남음 | ❌ |
| N2 | 2027-01~06 급여가 2026 요율로 ok | ❌ (`payroll.ts`에 `effectiveTo` 대조 없음) |
| N3 | 예전에 덮인 코스닥 시장 되돌리기 | ❌ |
| N4 | 로그인 동시 요청 429 | ❌ |
| N5 | 손익 없으면 다른 표도 숨김 | ❌ (낮음) |
| N6 | 리뷰 문서 저장소에 없음 | ❌ `docs/review/`에 11-19·11-22 문서 없음 |

### 🔴 M6. DART 재수집은 「요청 있을 때」가 아니다
- 국내 18종목 외에는 반기·3분기 손익이 예전 3개월치인데, 화면은 이제 `반기 누적`·`3분기 누적`이라고 표시한다. 오늘 들어온 챗 컨텍스트도 이 숫자를 쓴다.
- 이번 리뷰로 **요청한다.** 세션 C 맨 앞에서 돌리고, 끝나면 2~3종목을 DART 원문과 대조한다.

---

## 3. 맥에만 있는 것 / 문서

### 🟠 M7. `docs/fred-api-key-setup` (커밋 `ca6cdd0`, push 안 됨)
- 내용 정확함. push·머지하면 된다.
- 같은 절에 추가: ECOS·DART·`SEC_USER_AGENT`(키가 아니라 `이름 이메일`)·NAVER(한시 무료, 콘솔 한도 설정) 발급 절차, `SESSION_SECRET` 생성 명령 `openssl rand -base64 48`.
- 같은 파일 「경로」 표: 윈도우 `C:\dev_task\workspace\project\self_project\Finvesting`, 원격 "브랜치 `main`" → "작업 기준 `dev`".

### 🟠 M8. `stash@{0}` (11-19, CLAUDE.md·로드맵)
- 아직 그대로 있다. 오늘 로드맵 5단계는 `dev`에서 따로 갱신됐으므로, stash의 로드맵 부분은 **버리고** `CLAUDE.md` 부분만 살린다.
- stash의 `CLAUDE.md` 「지금 범위」는 "다음은 5단계 이상 지출"이라 이미 낡았다. 살릴 때 고친다(M9).
- stash가 목록에 넣은 `docs/verification/2026-11-19-cursor-claude-md.md`는 파일이 없다.

### 🟠 M9. 이중 작업 방지 규칙과 지금 범위
`CLAUDE.md`(지금은 `AGENTS.md` 복사본), `AGENTS.md`, `ChatGPT.md` 세 곳에 같이 넣는다.
- 시작 절차: "기기를 바꿨으면 `git fetch`, `git status -sb`, `git stash list`. 다른 기기에 미커밋 작업이 있다고 들었으면 그 기기에서 먼저 push."
- 종료 절차: "끝나면 작업 브랜치를 push한다. 머지는 하지 않아도 push는 한다."
- 지금 범위: "5단계 이상 지출·리스크·반복 패턴·확인할 일은 완료(ADR 0062~0065). 다음은 리뷰 N1~N4, 그다음 DGX Spark/vLLM."

---

## 4. 윈도우에서 할 일 (11-19 윈도우 리뷰 정정)

```powershell
cd C:\dev_task\workspace\project\self_project\Finvesting
git fetch origin
# 1. 보관 태그 (11-19 정리 순서 1번 그대로)
$keep = "chore/windows-setup","feat/csv-import","dev-backup-old","feat/fundamentals-screen","feat/real-estate-market-analytics","backup/merged-kis-quotes","feat/kis-quotes","dev","feat/market-terminal-2"
foreach ($b in $keep) { git tag ("archive/2026-11-19/" + $b) $b }
# 2. 윈도우판 이상 지출은 버린다 (맥판 ADR 0062가 정본). 버리기 전 stash로 보관만
git stash push -u -m "windows spending-anomaly (superseded by mac ADR 0062) 2026-11-19"
# 3. 10-25 차트·전표 색 2커밋만 살림
git switch -c feat/softer-charts-palette origin/dev
git cherry-pick 514fde0 448a5dc
git push origin feat/softer-charts-palette
# 4. 로컬 dev·main 맞추기
git branch -f dev origin/dev
git branch -f main origin/main
```
- 11-19 정리 순서의 2번(이상 지출 브랜치 만들기)과 6번의 `feat/spending-anomaly` push는 **하지 않는다.**
- `cherry-pick`이 `apps/web/src/app/page.tsx`에서 충돌할 수 있다(오늘 맥에서 홈이 크게 바뀜). 충돌하면 거기서 멈추고 출력을 Claude에게 보낸다.

---

## 5. 할 일 순서
1. **🔴 세션 C** (프롬프트 아래) — DART 재수집 + N1-b·N2·N3·N4 + M2
2. **🟠 문서 세션** — M7(FRED 브랜치 보강), M8·M9(CLAUDE.md·규칙), 리뷰 문서 4건 커밋
3. **🟠 윈도우 정리** — 위 4절
4. 🟡 M3·M4·M5, N5

## 세션 C 프롬프트

```
# 작업: DART 재수집과 데이터·요율 정리 (docs/review/2026-11-22-mac-claude.md M2 M6, 2026-11-22-claude.md N1-b N2 N3 N4)

## 시작 전
- AGENTS.md대로 docs/prompts/00-bootstrap.md로 시작. docs/README.md·docs/progress/README.md 먼저 읽기.
- `git fetch`, `git status -sb`, `git stash list` 확인.
- `dev`(f680b8d 이후)에서 `fix/data-cleanup-rate-period` 브랜치. main·dev 직접 커밋 금지. push·merge 금지. 새 기능 금지.
- 추측해서 데이터를 바꾸지 않는다. 근거가 없으면 목록만 남긴다.

## 순서
0. (M6·N1) 국내 DART 전체 재수집. 사용자가 요청했다.
   - 중간에 끊기면 이어서 돌 수 있게 시작 종목 옵션(예: DART_RESUME_FROM=종목코드)을 먼저 넣는다.
   - 끝나면 국내 2~3종목(삼성전자 제외)의 2026 Q3 누적 매출을 DART 원문 thstrm_add_amount와 대조해 검증 기록에 표로 남긴다.
1. (N1-b) dart.ts upsertDartFs: H1·Q3에서 손익 누적 칸이 하나도 없으면 같은 키의 기존 income 행을 지운다. 판단은 core + 테스트.
2. (N2) payroll.ts statutoryWithholding: payMonth가 있으면 요율 항목(nationalPensionEmployee, healthInsuranceTotal,
   healthInsuranceEmployeeShare, longTermCareIncomeRate, employmentInsuranceEmployee)의 effectiveFrom~effectiveTo도 대조.
   하나라도 밖이면 unavailable. 테스트: 2027-01 unavailable, 2026-12 ok.
3. (N3) 6자리·market KRX인 instruments 중, 사용자가 넣은 시장 기록(trades·가져오기 원본)이 KOSDAQ인 것만 되돌리는 1회 스크립트.
   근거 없는 종목은 바꾸지 않고 목록만. dry-run 출력을 검증 기록에.
4. (N4) login route: nextAllowedAt 전 요청은 비교 없이 429 + Retry-After. SESSION_SECRET 32자 미만이면 키 없음 처리.
   trpc.ts는 키 없을 때 INTERNAL_SERVER_ERROR "서버 설정: SESSION_SECRET 없음". core 판단 함수 + 테스트.
5. (M2) cashflow.ts에 isSpendingCategory를 두고 summarizeCashflow와 spend-anomaly가 같이 쓴다.
   이상 지출은 거기서 uncategorized만 뺀다. ADR 0062 결정 1 문장을 "홈 소비에서 미분류만 뺀 것"으로 고친다.
   테스트: 목록에 없는 새 분류가 홈 변동비와 이상 지출 양쪽에 들어가는지.

## 끝나면
- pnpm typecheck, pnpm --filter @finvesting/core test 결과 그대로.
- docs/progress 1항목. 「다음 할 일」에 이전 기록 문장을 복사하지 않는다.
- docs/verification/YYYY-MM-DD-<모델>.md (확인함/못 함).
- 커밋은 항목별. 끝나면 작업 브랜치 push (머지는 사용자가 말할 때).
```

## 반영 표
| # | 심각도 | 위치 | 내용 | 반영 |
|---|---|---|---|---|
| M1 | 높음 | 맥 `dev` / 윈도우 미커밋 | 이상 지출 이중 구현, ADR 0062 중복 | |
| M2 | 중간 | core spend-anomaly, cashflow | 「소비」 정의 불일치 | |
| M3 | 낮음 | core repeat-mistake | 기간 제한 없음 표시 | |
| M4 | 낮음 | api overview | 체결 두 번 조회 | |
| M5 | 낮음 | risk-explain, proactive-alerts, progress | 환율 표기, 알림 링크, 복사된 다음 할 일 | |
| M6 | 높음 | DB | DART 재수집 요청 | |
| M7 | 중간 | `docs/fred-api-key-setup` | push + 키 발급 절차 보강 | |
| M8 | 중간 | `stash@{0}` | CLAUDE.md만 살림 | |
| M9 | 중간 | CLAUDE·AGENTS·ChatGPT.md | 이중 작업 방지 규칙, 지금 범위 | |
