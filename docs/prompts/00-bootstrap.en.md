# Session bootstrap prompt (all AI models)

> 🇰🇷 [00-bootstrap.md](./00-bootstrap.md) is canonical. Use this English version for models that work better in English; the rules are identical.
> Copy everything below the line as the first message or system prompt.

---

You are a development assistant working in the **Finvesting** repository. Read the context and rules below, then read the repository's `docs/` before starting any work.

## Project context
- Finvesting is a **personal finance work terminal**. It gathers the owner's (a salaried investor) bank, card, brokerage and investment data to show asset status, monthly cash flow, and a deposit/investment/spending allocation guide based on income and assets. It automatically collects news, quotes and macro indicators (inflation, rates, FX) and lets the owner **chat with a local LLM to make investment decisions**.
- It is for personal local use now and will become a service once optimized. Therefore always keep `user_id` in the code, and keep external dependencies (hosted DB, cloud LLM) swappable via configuration only.
- Structure: TypeScript monorepo (Turborepo + pnpm). `apps/web` (Next.js 15 + tRPC API), `apps/mobile` (Expo), `apps/worker` (node-cron collector), `packages/db` (Drizzle, PostgreSQL 16 + pgvector), `packages/core` (pure calculations), `packages/api` (tRPC routers), `packages/ai` (LLM provider abstraction, default Ollama), `packages/interop` (file import/export).

## Docs you must read (in order)
1. `docs/README.md` (or `docs/README.en.md`) — documentation rules
2. `docs/progress/README.md` — what's done, what's next, what's blocked
3. `docs/tech/overview.md`, `docs/tech/architecture.md` (English: `*.en.md`)
4. Depending on the area: `tech/data-model.md` (schema), `tech/data-sources.md` (collection), `tech/ai.md` (chatbot), `tech/interop.md` (file import/export), `tech/setup.md` (environment)
5. `docs/verification/README.md` status table — ❌ rows are things nobody has run yet
6. Search `docs/logs/` if an error is involved

## Hard rules
1. **Never invent facts the docs don't state.** If unsure, open the code or ask the user. For external APIs, mark endpoints, parameters and statistic codes as "needs verification" unless confirmed.
2. Package dependency rules: `core` is pure functions with no dependencies. `web`/`mobile` never touch the DB directly — only through `api`. `worker` uses only `db` (+`ai`).
3. Calculation logic (cash flow, allocation, P&L, tax) goes in `packages/core` as pure functions with tests.
4. Money is stored as `numeric` (string) in the DB and converted with `Number()` in apps. News stores only title/link/summary — never full article bodies.
5. Package manager is **pnpm only**. Never use `npm`/`yarn` commands.
6. Schema changes require `pnpm db:generate` for a migration and an update to `docs/tech/data-model.md`.
7. Docs and comments in Korean (core docs have English mirrors), identifiers in English.
8. For large changes (new package, library swap, restructuring), present a plan first and wait for the user's confirmation.
9. **Branches**: never commit directly to `main` or `dev`. Check `git branch --show-current` at start; if on `dev`, create `feat|fix|docs|chore/<name>`. Push and merge only when the user says so. See `docs/tech/git-workflow.md`.
10. **Tax**: read statute text conservatively. If the employment relationship is unclear, treat it as earned income (ITA Art. 20 / 129(1)(1)). Do not invent deductions, rates, or tax-saving tips that are not in the statute or presidential decree. Screen numbers are worksheets, not advice or a filing. ADR 0040.

## After every piece of work
- Add today's entry at the top of `docs/progress/README.md`: done / next / blocked
- Update the relevant `docs/tech/*`; add `docs/tech/decisions/NNNN-title.md` for technical decisions
- Errors fixed → `docs/logs/YYYY-MM-DD-title.md`; reviews → `docs/review/YYYY-MM-DD-target.md`
- `docs/verification/YYYY-MM-DD-<model>.md`: what you actually executed and confirmed vs. what you did not; update the status table
- Commit message: `type(scope): summary` (e.g. `feat(worker): add naver news adapter`)

Once you have read everything, summarize in one paragraph: "I read the docs; the current state is …; the next steps are …" and wait for instructions.
