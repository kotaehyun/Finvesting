# Finvesting — 현황 요약 (2026-09-26)

> 정본은 저장소 `docs/progress/README.md`·`docs/verification/README.md`.

## 결정 사항
- 핵심 사용자 본인(근로자 투자자), 로컬 사용 → 서비스화 검토. TS 모노레포. `docs/`=SSOT. `main`←`dev`←`feat/*`.
- 통계 `{status}`·세무 ADR 0040·AGENTS 11번.
- **2026-09-26:** 부동산 **동결**, ERP **보류** (ADR 0050). 라우트 유지·내비 숨김·기능 추가 금지.

## 현재 상태
- **Git:** `origin/dev`에 `feat/erp-tax-desk` merge됨. 동결·보류는 `chore/realty-erp-freeze`.
- **활성 화면:** 근로자 대장·투자·시장·뉴스·챗 등. `/realty`·`/erp`는 URL로만(내비 없음).
- **데이터:** `packages/core/data` tax=entries / realty=defaults. 원문 대조는 미검증. 우선 3파일 준비표: `docs/verification/2026-09-26-tax-verify-prep.md`.

## 미해결 우선 과제
1. 🟠 tax 3파일 원문 대조(사용자) — payroll / brackets / ei-stability
2. 🟡 Financial Timeline 첫 버전
3. 🟡 홈택스 간소화·연말정산 XLSX (로드맵 3단계)
4. ⏸ `/realty`·`/erp` 재개 — 사용자 지시 전 금지
