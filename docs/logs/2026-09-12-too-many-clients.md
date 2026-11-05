# Postgres `too many clients already`

## 증상
`pnpm db:migrate`와 `/api/trpc/*`가 `53300 sorry, too many clients already`. `pg_stat_activity`에 idle 99개.

## 원인
`packages/db`가 모듈 평가마다 `postgres({ max: 10 })`를 만들었다. Next 핫리로드가 풀을 쌓음.

## 조치
1. idle 백엔드 종료 후 `0002_yielding_paibok` migrate
2. `packages/db/src/index.ts`에서 `globalThis`에 풀을 하나 유지, `max: 4`
