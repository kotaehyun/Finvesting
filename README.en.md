# Finvesting

> 🇰🇷 한국어: [README.md](./README.md) — Korean is the canonical version; this English file mirrors it.

**A personal finance terminal that unifies assets, investments and cash flow in one place, collects market data automatically, and helps you reason about investment decisions by chatting with a local LLM.**

It pulls together bank, card, brokerage and crypto balances and transactions to show net worth and monthly cash flow (spending and saving rates against income), and suggests how to split money between deposits, investments and spending based on income, assets, emergency fund and risk tolerance. A worker collects news, quotes, inflation, interest rates and FX automatically; that data plus your own financial situation becomes the context for an investment-assistant chatbot. Financial data never leaves your machine — everything runs locally.

- **Current stage**: MVP phase 1 for personal local use (scaffolding done, first run not yet verified)
- **Long term**: once optimized, evolve into a service — extend with tax, accounting and payroll modules for freelancers and small businesses
- **Original brief**: `Finvesting_프로젝트_소개서.pdf` (Concept Brief v0.1) → summarized in [docs/tech/overview.md](./docs/tech/overview.md)

---

## Folder structure

```
Finvesting/
├─ apps/                      Runnable applications
│  ├─ web/                    Next.js 15 — web dashboard (/), chatbot (/chat), tRPC API (/api/trpc)
│  ├─ mobile/                 Expo (React Native) — mobile dashboard, same API as web
│  └─ worker/                 Collector — node-cron jobs that fetch news RSS, quotes and macro data into the DB
│     └─ src/sources/         One adapter per source (rss, upbit, ecos, fred, yahoo, dart, edgar)
├─ packages/                  Shared libraries
│  ├─ db/                     Drizzle ORM schema & migrations (PostgreSQL 16 + pgvector)
│  │  ├─ src/schema/          accounts, transactions, investments, market, profile, fundamentals
│  │  └─ seed/                pgvector extension, default user SQL
│  ├─ core/                   Pure domain logic — cash-flow summary, allocation guide, position/P&L math
│  ├─ api/                    tRPC routers — accounts, dashboard, market, chat
│  ├─ interop/                External file conversion — import bank/card/brokerage CSV/XLSX, export to Douzone/WEHAGO/Semusarang formats
│  └─ ai/                     LLM provider abstraction (Ollama → Mac Studio → DGX Spark/vLLM), prompts
├─ docs/                      Project documentation — single source of truth (SSOT)
│  ├─ progress/               Progress log (newest first), roadmap
│  ├─ tech/                   Technical docs — overview, architecture, data model, data sources, AI, setup, ADRs
│  ├─ logs/                   Error & run logs with fixes
│  ├─ review/                 Code review records
│  ├─ verification/           Per-AI-model verification records — what was actually run and confirmed, what is still unverified
│  └─ prompts/                Model-agnostic prompts (session start, per-task templates, session end)
├─ AGENTS.md / CLAUDE.md / ChatGPT.md   Shared instructions for AI tools (all point to docs/)
├─ docker-compose.yml         Local PostgreSQL (pgvector)
├─ turbo.json, pnpm-workspace.yaml, tsconfig.base.json
└─ .env.example               Environment variables (copy to .env)
```

### Data flow

```
External sources (RSS · Upbit · ECOS · FRED · Yahoo · DART · EDGAR · …)
   │ apps/worker (scheduled collection)
   ▼
PostgreSQL ── market_news · market_quotes · macro_indicators · economic_events · financial_statements
           └─ accounts · transactions · trades · financial_profiles
   │ packages/db
   ▼
packages/api (tRPC) ── packages/core (calculations) ── packages/ai (LLM)
   ├─ apps/web     browser
   └─ apps/mobile  Expo Go
```

---

## Where to find things

| Want to know… | Doc |
|---|---|
| What's done and what's next | [docs/progress/README.md](./docs/progress/README.md) |
| Phase plan & backlog | [docs/progress/roadmap.md](./docs/progress/roadmap.md) |
| What the product is and who it's for | [docs/tech/overview.md](./docs/tech/overview.md) · [EN](./docs/tech/overview.en.md) |
| Structure, stack, package dependency rules | [docs/tech/architecture.md](./docs/tech/architecture.md) · [EN](./docs/tech/architecture.en.md) |
| What each table means | [docs/tech/data-model.md](./docs/tech/data-model.md) |
| What data is collected, from where, how | [docs/tech/data-sources.md](./docs/tech/data-sources.md) |
| Chatbot / LLM / RAG design | [docs/tech/ai.md](./docs/tech/ai.md) |
| Importing bank/card files, exporting to accounting software | [docs/tech/interop.md](./docs/tech/interop.md) |
| Mac/Windows setup and run commands | [docs/tech/setup.md](./docs/tech/setup.md) |
| Why decisions were made | [docs/tech/decisions/](./docs/tech/decisions/README.md) |
| Has this error happened before | [docs/logs/](./docs/logs/README.md) |
| Code review results | [docs/review/](./docs/review/README.md) |
| Which AI verified what, and what is still unverified | [docs/verification/](./docs/verification/README.md) |
| What to paste as the starting prompt for an AI | [docs/prompts/](./docs/prompts/README.md) · [bootstrap EN](./docs/prompts/00-bootstrap.en.md) |
| Coding conventions | [docs/prompts/conventions.md](./docs/prompts/conventions.md) |

---

## Working with AI tools

Any model (Claude, GPT/Codex, Gemini, Cursor, Copilot, a local LLM) works the same way:

1. Session start: paste [docs/prompts/00-bootstrap.md](./docs/prompts/00-bootstrap.md) (or the [English version](./docs/prompts/00-bootstrap.en.md)) as the first message.
2. Append the template for the task type (`10-feature`, `11-bugfix`, `12-schema-change`, `13-data-source`, `14-ai-chatbot`, `20-code-review`).
3. Session end: paste [docs/prompts/90-session-end.md](./docs/prompts/90-session-end.md) to update docs and produce a handover summary.

Rules: never guess what the docs don't say; always update `docs/progress` after work; record in `docs/verification` only what was actually run. Details in [docs/README.md](./docs/README.md) · [EN](./docs/README.en.md).

---

## Getting started

```bash
corepack enable && corepack prepare pnpm@9.15.0 --activate
pnpm install && cp .env.example .env
pnpm db:up                         # Docker Postgres
pnpm dev:web                       # http://localhost:3000
```

Full procedure (DB init, worker, mobile, Windows notes): [docs/tech/setup.md](./docs/tech/setup.md).

## Dev environment
- MacBook: `/Users/th/개발/workspace/Finvesting` (primary machine, holds real data)
- Windows: TBD — code synced via Git, DB data stays local per machine
- Node 22, pnpm 9, Docker, Ollama

## Language policy
Korean (`*.md`) is canonical. English mirrors live next to them as `*.en.md` for the core docs (README, docs guide, overview, architecture, bootstrap prompt, AGENTS). When a Korean doc changes, update its `.en.md` in the same session; docs without an `.en.md` are Korean-only for now.
