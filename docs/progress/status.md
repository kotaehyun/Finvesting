# Finvesting — 현황 요약 (2026-11-03)

> 정본은 저장소 `docs/progress/README.md`·`docs/verification/README.md`.

## 결정 사항
- 핵심 사용자 본인(근로자 투자자), 로컬 사용 → 서비스화 검토. TS 모노레포. `docs/`=SSOT. `main`←`dev`←`feat/*`.
- 통계 `{status}`·세무 ADR 0040·AGENTS 11번.
- **2026-09-26:** ERP **보류** (ADR 0050). `/erp` 라우트 유지·내비 숨김·기능 추가 금지.
- **2026-10-11:** 부동산 내비 복원. `/realty` 링크만. 새 패널은 별도 지시.

## 현재 상태
- **Git:** `origin/dev` = `27d1f8a` (2026-10-10). 작업 브랜치 `feat/statements-pipeline` (로컬 커밋·push는 지시 시).
- **활성 화면:** 근로자 대장·투자·시장·뉴스·챗·타임라인·세금·회계전표·재무제표·부동산.
- **보류:** `/erp`는 URL로만.
- **데이터:** `packages/core/data` tax=entries / realty=defaults. 원문 대조는 미검증. 우선 3파일 준비표: `docs/verification/2026-09-26-tax-verify-prep.md`.
- **재무제표:** 0~4단계 코드·문서 완료(5년·분기, 개황·주주·배당 패널, 챗 컨텍스트, 시총 보기). `/invest` Yahoo 시총 국내·해외 수집분+뉴스. typecheck 통과.
- **미검증:** 브라우저 `/invest` 시총 UI · Ollama 「읽어주기」 · `/statements` 연도 전환 클릭.

## 미해결 우선 과제
1. 🟠 tax 3파일 원문 대조(사용자) — payroll / brackets / ei-stability
2. 🟡 브라우저 `/invest` 시총·딥링크 · LLM 「읽어주기」실호출
3. 🟡 DART 현금흐름 계정 매핑 · 부문매출 공시 경로
4. 🟡 홈택스 간소화·연말정산 XLSX (로드맵 3단계)
5. ⏸ `/erp` 재개 — 사용자 지시 전 금지
6. push / `dev` merge · 윈도우 10/10 이후 원격 반영은 지시 시
