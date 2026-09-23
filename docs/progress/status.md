# Finvesting — 현황 요약 (2026-09-23 Cursor 세션 기준)

> 정본은 저장소 `docs/progress/README.md`·`docs/verification/README.md`. 검토: `docs/review/2026-09-13-claude.md` → `2026-09-16-claude.md` → `2026-09-21-claude.md` → `2026-09-21-claude-2.md`.

## 결정 사항 (변경 없음)
- 핵심 사용자 본인(근로자 투자자), 로컬 사용 → 서비스화 검토. TS 모노레포(Next 15+tRPC / Expo / node-cron worker / Drizzle+Postgres+pgvector / Ollama). `docs/`=SSOT. `main`←`dev`←`feat/*`.
- 통계 응답 `{status: ok|empty|stale|unavailable, items}`. 세무는 조문 문언만(ADR 0040). AGENTS 11번: 공식 출처만·생성 금지·실패는 status·샘플은 DEMO_MODE.

## 현재 상태 (2026-09-23)
- **Git:** `origin/dev`=`e15f070`. 작업 브랜치 `feat/erp-tax-desk`(ERP·세무·데이터 규칙·상수 JSON). `dev` merge는 사용자 지시 후.
- **기능:** 화면 13개(`/erp`·`/chat` 투자 봇AI 포함). ERP는 **원장 저장 없음**(스키마 후). 새 화면·ADR은 이 세션에서 추가하지 않음.
- **데이터:** `packages/core/data/**/*.json` 20파일. 숫자 entries **992**개, 전부 `verifiedBy: "미검증"`. 목록·갱신 절차는 `docs/tech/data-tables.md`.
- **검증:** core `tsc` 통과, vitest 230 통과(`docs/verification/2026-09-21-cursor.md`). 원문 대조 통계 ✅ 없음. 루트 pnpm typecheck는 CLI 링크로 미실행.

## 미해결 우선 과제
1. 🟠 **사용자 결정:** (1) 부동산 터미널 편입/동결 (2) ERP 개인사업자·법인·공무원 계속(스키마부터)/보류
2. 🟠 ERP 원장 스키마 — 결정 후. 스키마 없는 화면 추가 금지
3. 🟡 992개 미검증 항목 원문 대조 → `verifiedBy`/`verifiedOn` 갱신. 화면 「기준·출처」 빠진 곳 보강
4. 🟡 루트 `pnpm` CLI 복구 후 web·api typecheck·빌드
5. 🟡 `profile/page.tsx` 분리. 부동산 ADR 통합(작업 기록 vs 결정)

결정 전 AI 세션 지시: **"새 화면·새 ADR 금지."** 한 기기 = 한 AI 세션.

## 경로
- 맥북 작업 트리 `Finvesting` (Node 26, `.nvmrc` 22). 원격 https://github.com/kotaehyun/Finvesting
