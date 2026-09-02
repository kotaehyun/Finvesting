# 코딩 컨벤션

프롬프트에서 참조하는 규칙 모음. 새 규칙이 생기면 여기에 추가한다.

## 일반
- TypeScript strict. `any` 금지(불가피하면 `// eslint-disable` 대신 `unknown` + 좁히기).
- ESM(`"type": "module"`), 내부 import는 `.js` 확장자 표기.
- 패키지 매니저 pnpm. 워크스페이스 참조는 `workspace:*`.
- 커밋: `type(scope): 요약` — type은 feat/fix/docs/refactor/chore/test, scope는 web/mobile/worker/db/core/api/ai/docs.

## 금액·날짜
- DB `numeric` ↔ 앱 `Number()`. 코인 수량은 소수점 8자리.
- `date`는 `YYYY-MM-DD` 문자열, `timestamp`는 `with time zone`. 스케줄은 `Asia/Seoul`.
- 원화 표시는 `toLocaleString("ko-KR")` + "원".

## 계층
- `core`: 순수 함수만, 외부 의존 0. 함수마다 vitest 테스트.
- `db`: 스키마·연결만. 비즈니스 로직 금지.
- `api`: zod 입력 검증 필수. `ctx.userId`로 사용자 범위 제한.
- `worker`: 어댑터는 `collect<Name>()` 하나 export, 멱등 upsert, 실패는 throw.
- `ai`: `LlmProvider` 인터페이스 뒤에만 구현. 프롬프트는 `prompts.ts`에 상수로.

## 문서
- 문서·주석 한국어, 식별자 영어.
- 스키마 변경 = 마이그레이션 + `docs/tech/data-model.md` 동시 갱신.
- 모든 세션은 `docs/progress/README.md` 갱신으로 끝난다.
