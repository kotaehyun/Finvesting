# DB 스키마 변경 프롬프트

---

## 작업: 스키마 변경 — {테이블/컬럼}

**변경 내용**: {추가/수정/삭제 대상과 이유}
**영향 받는 코드**: {api 라우터, worker 어댑터, core 함수 등}

### 진행 순서
1. `docs/tech/data-model.md`와 `packages/db/src/schema/*.ts`를 읽는다.
2. 기존 데이터가 있을 때의 마이그레이션 영향(NOT NULL 추가, 타입 변경, 컬럼 삭제)을 먼저 설명한다.
3. 스키마 파일 수정 → `pnpm db:generate` → 생성된 SQL을 검토해 보여준다.
4. 관련 tRPC 라우터·worker·core 타입을 맞춘다. `pnpm typecheck` 통과.
5. `docs/tech/data-model.md` 표 갱신, `docs/progress/README.md` 갱신.

### 규칙
- 사용자 데이터 테이블에는 `user_id` 필수
- 금액 `numeric`, 시각 `timestamp with time zone`, 날짜 `date`
- 수집 테이블은 멱등 upsert가 가능하도록 유니크 인덱스 필수
