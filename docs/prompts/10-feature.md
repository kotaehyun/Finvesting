# 기능 추가 프롬프트

> 00-bootstrap 이후에 사용. 빈칸을 채운다.

---

## 작업: 기능 추가 — {기능 이름}

**목표**: {한 문장. 사용자가 무엇을 할 수 있게 되는가}
**영향 범위**: {apps/web | apps/mobile | apps/worker | packages/db | packages/core | packages/api | packages/ai 중 해당}
**참고 문서**: {docs/tech/… 경로}

### 진행 순서
1. 관련 문서와 기존 코드를 읽고, **변경할 파일 목록과 이유를 먼저 제시**한다. 새 테이블·라이브러리가 필요하면 여기서 밝힌다.
2. 내 확인을 받은 뒤 구현한다.
3. 계산 로직은 `packages/core`에 순수 함수 + `vitest` 테스트.
4. API가 필요하면 `packages/api/src/routers/`에 tRPC 프로시저 추가 (zod 입력 검증 필수).
5. 화면은 `apps/web` 먼저, 모바일은 요청 시.
6. `pnpm typecheck` 통과 확인.
7. `docs/progress/README.md` 갱신, 필요 시 `docs/tech/*` 갱신.

### 완료 조건
- {체크 가능한 조건 1}
- {체크 가능한 조건 2}
