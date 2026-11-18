# worker 한 개. 비밀은 이미지에 넣지 않는다. DATABASE_URL 은 compose 가 넘긴다.
FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages/ai/package.json packages/ai/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/db/package.json packages/db/package.json

RUN pnpm install --frozen-lockfile --filter @finvesting/worker...

COPY apps/worker apps/worker
COPY packages/ai packages/ai
COPY packages/core packages/core
COPY packages/db packages/db

ENV WORKER_RUN_ON_START=false

CMD ["pnpm", "--filter", "@finvesting/worker", "start"]
