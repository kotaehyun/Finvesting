# Architecture

> 🇰🇷 [architecture.md](./architecture.md) is canonical.

## Stack
| Area | Choice | Why |
|---|---|---|
| Language | TypeScript everywhere | share code across web, mobile, worker and domain logic; one language to learn |
| Monorepo | Turborepo + pnpm workspaces | dependency management between apps and packages |
| Web | Next.js 15 (App Router) | dashboard and API routes in one app |
| Mobile | Expo (React Native) | shares the tRPC client and types with web |
| API | tRPC v11 | end-to-end type safety, no separate schema files |
| DB | PostgreSQL 16 + pgvector (Docker) | relational fit for financial data, embedding search, migrates as-is when productizing |
| ORM | Drizzle | type-safe schema and migrations |
| Collection | node-cron + rss-parser + cheerio (+ Playwright if needed) | |
| AI | Ollama (local) behind a provider interface swappable for vLLM / cloud | follows the hardware plan |

## Data flow
```
[External] RSS · Upbit · ECOS · FRED · Yahoo · DART · EDGAR · (KIS, Naver, crawlers)
      │  apps/worker (cron)
      ▼
[PostgreSQL] market_news · market_quotes · macro_indicators · economic_events · financial_statements
             accounts · transactions · trades · financial_profiles
      │  packages/db (Drizzle)
      ▼
[packages/api] tRPC routers ── packages/core (calculations) ── packages/ai (LLM)
      │
      ├─ apps/web  (Next.js /api/trpc) ── browser
      └─ apps/mobile (Expo) ── same API over HTTP
```

## packages/interop
Converts external files to/from internal models (import bank/card/brokerage exports; export to Douzone, WEHAGO, Semusarang and accountant-friendly formats). Pure functions only, no DB access — like `core`. Details in [interop.md](./interop.md).

## Package dependency rules
- `core` and `interop` depend on neither DB nor network (pure functions). Calculations live in `core`, file conversion in `interop`.
- `db` knows nothing about `core` — schema and connection only.
- `api` composes `db` + `core` + `ai` + `interop` (file import is parsed by interop and stored by api).
- `web` / `mobile` import only types from `api`; no direct DB access.
- `worker` uses only `db` (+ `ai` for embeddings); it does not go through `api`.

## Auth
Single-user mode, fixed via `DEFAULT_USER_ID`. Every user-data table has `user_id`, so productizing only requires adding authentication.

## Runtime
- Local: `pnpm dev` (web + worker together), Docker Postgres
- Mobile: Expo Go on the same Wi-Fi, calling the MacBook's IP on port 3000
- As a service: web on Vercel/container, worker as one container, DB on Supabase/RDS — swap `DATABASE_URL` only, no code change
