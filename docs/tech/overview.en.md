# Product overview

> 🇰🇷 [overview.md](./overview.md) is canonical.

## One-liner
A personal finance work terminal that connects scattered account, card, brokerage and investment data into one money flow, and uses collected market information to support investment decisions.

## Core user (decided)
**The owner — a salaried investor.** Built for personal use; evaluate turning it into a service once optimized.

## What the user wants
- Asset overview (cash, deposits, stocks, crypto) and net worth on one screen
- Monthly cash flow: spending and saving rates against salary, fixed vs. variable costs
- **A deposit / investment / spending allocation guide** based on income and asset structure
- **Automatic collection** of macro indicators (inflation, rates, FX), news and quotes
- **Chatting with a bot to make investment decisions**, using collected data plus personal data as context

## Scope
### MVP phase 1 (current)
- Account + Investment: register accounts, transactions, holdings; dashboard
- News dashboard at `/news` (KR/global RSS; title, link, summary only)
- Market collection: news RSS (KR + global), Upbit quotes, ECOS/FRED macro, Yahoo quotes & fundamentals, DART/EDGAR financial statements (worker)
- AI chatbot: local Ollama + collected data as context
### Later
- Phase 2: Market Terminal UI (watchlist, charts, economic calendar), KIS domestic/overseas quotes
- Phase 3: Tax + Year-End (year-end tax settlement on own salary, overseas stock capital gains, dividend income)
- Phase 4: Accounting + Labor/HR — extend to freelancers and small businesses when productizing
- Phase 5: AI upgrades (RAG, anomaly spending detection, risk explanations)

## Original brief
`Finvesting_프로젝트_소개서.pdf` (Concept Brief v0.1) — 9 modules (Account, Investment, Market Terminal, Tax, Year-End, Accounting, Labor/HR, Research, AI Assistant); signature feature: Financial Timeline.
