# Finvesting — 현황 요약 (2026-11-03)

> 정본은 저장소 `docs/progress/README.md`·`docs/verification/README.md`.

## 결정 사항
- 핵심 사용자 본인(근로자 투자자), 로컬 사용 → 서비스화 검토. TS 모노레포. `docs/`=SSOT. `main`←`dev`←`feat/*`.
- 통계 `{status}`·세무 ADR 0040·AGENTS 11번.
- **2026-09-26:** ERP **보류** (ADR 0050). `/erp` 라우트 유지·내비 숨김·기능 추가 금지.
- **2026-10-11:** 부동산 내비 복원. `/realty` 링크만. 새 패널은 별도 지시.

## 현재 상태
- **Git:** `origin/main` = `dcf1f0f` (dev merge). `origin/dev`는 문서 후속 merge 대기 가능.
- **활성 화면:** 근로자 대장·투자·시장·뉴스·챗·타임라인·세금·회계전표·재무제표·부동산.
- **보류:** `/erp`는 URL로만.
- **데이터:** `packages/core/data` tax=entries / realty=defaults. 원문 대조는 미검증. 우선 3파일 준비표: `docs/verification/2026-09-26-tax-verify-prep.md`.
- **재무제표:** 0~4단계 + DART `cfo`·국내/미국 부문 XBRL. `/invest` 시총·뉴스.
- **사용자 확인(2026-11-04):** `/invest`·딥링크 브라우저, Ollama 「읽어주기」완료.
- **최근 수집(2026-11-05):** 국내 segment 46행·23종목. 미국 edgar segment 81행·38종목.

## 미해결 우선 과제
1. 🟠 tax 3파일 원문 대조(사용자) — payroll / brackets / ei-stability
2. 🟡 홈택스 간소화·연말정산 XLSX (로드맵 3단계)
3. ⏸ `/erp` 재개 — 사용자 지시 전 금지
