# worker run:once: DATABASE_URL is not set
- 날짜: 2026-09-02
- 환경: 맥북, Node 26.7.0(!), pnpm 9
- 어디서: `pnpm --filter @finvesting/worker run:once`
- 증상: `Error: DATABASE_URL is not set` (packages/db/src/index.ts:6)
- 원인: `apps/worker/src/lib/env.ts`가 루트 `.env`를 `../../../.env`로 찾음 → `apps/.env`(한 단계 부족). 폴백 `config()`도 cwd(apps/worker)의 `.env`라 실패
- 해결: `../../../../.env`로 수정, 못 찾으면 경고 출력하도록 추가
- 재발 방지: `import.meta.url` 기준 상대 경로는 파일 깊이를 세어 주석으로 남긴다. drizzle.config(packages/db 루트, 2단계)·next.config(apps/web 루트, 2단계)는 정확함
- 참고: 맥 Node가 26.7.0 — `.nvmrc`는 22. `fnm use` / `nvm use`로 맞출 것
