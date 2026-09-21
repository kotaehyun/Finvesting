# Finvesting — 현황 요약 (2026-09-21 3차 검토 기준)

> 정본은 저장소 `docs/progress/README.md`·`docs/verification/README.md`. 검토: `docs/review/2026-09-13-claude.md` → `2026-09-16-claude.md` → `2026-09-21-claude.md`. 이 문서는 Claude 프로젝트 `claude/finvesting-status.md`와 같은 내용.

## 결정 사항 (변경 없음)
- 핵심 사용자 본인(근로자 투자자), 로컬 사용 → 서비스화 검토. TS 모노레포(Next 15+tRPC / Expo / node-cron worker / Drizzle+Postgres+pgvector / Ollama gemma4:12b). `docs/`=SSOT. `main`←`dev`←`feat/*`. 외부 연동은 수동 업로드.
- 09-13: 시세 대상 = 보유·관심 종목(ADR 0007). USDKRW = Yahoo `KRW=X`. 투자자산 = 보유 평가액 + 예수금.
- 09-16: 통계 응답 `{status: ok|empty|stale|unavailable, items}`. 부동산은 공표만(ADR 0027). 세무 화면은 조문 문언만, 애매하면 근로소득(ADR 0040).

## 현재 상태 (2026-09-21)
- **Git:** `dev`=`de705f8`(09-08)에서 13일째 정지. `feat/yahoo-fundamentals`=`e15f070`(09-16, 마지막 커밋). **09-16 이후 커밋 0, 미커밋 125파일**(수정 54, 신규 71 = 4,920줄). 09-13 이후 커밋 20개가 feat 브랜치 9개 이름으로 한 줄에 쌓임(선형, dev fast-forward 가능). 윈도우에 별도 `feat/real-estate-market-analytics` 미통합.
- **기능:** 화면 13개 — `/` `/accounts` `/holdings` `/profile`(메뉴 12) `/chat` `/invest` `/markets` `/news` `/opinions` `/statements` `/fundamentals` `/realty` `/erp`. 09-18에 ERP 업무홈·부가세·법인세·프리랜서 3.3%·직원 명부·건보 자격취득·공무원 호봉표·양도/증여/보유 세율표 추가(ADR 0032~0047) — **전부 원장 저장 없이 화면·계산만**.
- **데이터:** Codex 7건(가상 폴백) 09-18 맥에서 마감(미커밋). `realty-*.ts` 상수 557개 + 세율·요율·호봉표가 코드 상수(출처 URL 있음, asOf·검증자 없음).
- **검증:** 타입체크 통과(맥 8/8, VM core·api·web). core 157·interop 11. Grok Chrome으로 `/fundamentals` 게이지·`/statements` q·`/realty` 재조회 확인. Expo ❌. ECOS·FRED·DART·EDGAR 키 없음.

## 미해결 우선 과제 (09-21 검토)
1. 🔴 미커밋 125파일 → `feat/erp-tax-desk` 커밋·push → `dev` fast-forward to `e15f070` → 죽은 feat 브랜치 삭제. **명령은 리뷰 문서에 그대로 있음**
2. 🔴 AGENTS.md에 "통계·기사·과거값 생성 금지, 실패는 빈 칸+status, 샘플은 DEMO_MODE만" 추가 (09-16 #2, 아직 없음)
3. 🔴 부동산 상수 + 세율·요율·호봉표 → `packages/core/data/**.json` (`effectiveFrom, sourceUrl, article, verifiedBy, verifiedOn`)
4. 🔴 ERP·세무 화면은 스키마 없이 더 만들지 않음. 본인이 쓸 역할만 남기고 나머지 4단계로
5. 🟠 **사용자 결정 대기:** (1) 부동산 터미널 편입/동결 (2) ERP 개인사업자·법인·공무원 계속/보류
6. 🟠 검증 표 통계 행 ✅ = 원문 대조. 진행 로그 하루 1항목. ADR 0025 중복 → 백엔드·AI는 0049로 정리
7. 🟡 `profile/page.tsx` 1,133줄 분리. AGENTS.md 한/영 번호 불일치

결정 전 AI 세션 지시: **"새 화면·새 ADR 금지. 커밋·머지·규칙 추가·상수 JSON화만."**

## 경로
- 맥북 `/Users/th/개발/workspace/Finvesting` (Node 26, `.nvmrc` 22). 윈도우: 09-15 clone(경로 문서 확인 필요). 원격 https://github.com/kotaehyun/Finvesting
- `_to_delete/`(09-13 VM 잔여물) 아직 남아 있음 — 폴더째 삭제
