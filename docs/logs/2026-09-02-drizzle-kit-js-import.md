# drizzle-kit generate: Cannot find module './common.js'
- 날짜: 2026-09-02
- 환경: 맥북, Node 22, pnpm 9, drizzle-kit 0.30.6
- 어디서: `pnpm db:generate` (첫 실행)
- 증상: `Error: Cannot find module './common.js'` — `packages/db/src/schema/index.ts:1`
- 원인: 스키마 파일이 `from "./common.js"`처럼 `.js` 확장자로 import. drizzle-kit은 스키마를 CJS `require`로 로드하는데 실제 파일은 `.ts`라 `.js`를 못 찾음. tsc(moduleResolution Bundler)·tsx·Next는 `.js`→`.ts` 매핑을 해주지만 drizzle-kit은 안 함
- 해결: 저장소 전체 상대 import에서 `.js` 제거 (29개 파일). 컨벤션 문서 갱신
- 재발 방지: 상대 import는 확장자 없이. `conventions.md`에 명시

# drizzle-kit migrate: url: undefined
- 같은 날, 같은 실행
- 증상: `Please provide required params for Postgres driver: [x] url: undefined`
- 원인: 루트 `.env`가 없었음 (`.env.example`만 존재). `cp .env.example .env`를 건너뜀
- 해결: `.env` 생성. `DATABASE_URL` 기본값은 docker-compose와 일치하므로 그대로 사용 가능
- 재발 방지: setup.md 첫 실행 절차 1번에 있음 — 건너뛰지 말 것. 이후 seed의 `relation "users" does not exist`는 마이그레이션 미적용의 후속 오류
