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
- Account + Investment: register accounts, transactions, holdings
- Home `/`: current net worth, selected-month spending and saving/investing outflows, monthly cash flow, follow-ups, three news items. Past months do not present today’s balances as that month’s net worth. There is no month-end snapshot table. **Unrealized P&L uses a signed `+`/`−` and Korean red-up / blue-down** (same as index cells)
- News dashboard at `/news` (KR/global plus economy/finance/realty/markets/crypto/FX/central-bank; title, link, summary only)
- Opinion/column dashboard at `/opinions` (KR columns, analyst takes, global opinion; title/link/summary only; no sell-side report RSS)
- Investment dashboard at `/invest` (indices, bitcoin, commodities, FX, company search that adds a watchlist, holdings; links out to markets and realty)
- Markets `/markets` (World Bank inflation and BIS policy-rate cells, volume heatmap, KRX flow links, crypto/FX heatmaps and news, technical analysis, company search)
- Realty `/realty` (nationwide 3D municipalities; metro bank household loans; BOK weighted-average and COFIX rate table; occupancy vs lease-trade wolse share; card NPL and revolving; vacancy excluding owner-use/free occupancy, empty homes by type, PIR/Gini; repayment, court-auction filings, CRE NPL and shop yields; top-decile net-worth share plus gift/inherit/trust channels with no celebrity or executive names; corporate comprehensive-tax channel; ethics disclosures only — no grade-4 registry; census age vs marriage/newlywed facts on rumor cards; listing-type slots; Hankyung RSS; refresh refetches news and loans)
- Statements & audit opinion at `/statements` (DART/EDGAR numbers + opinion; official lookup and “재무제표를 읽는 사람들” as outbound links only; no report body; local LLM reading)
- Yahoo Fundamentals table at `/fundamentals` (English column labels; daily market-cap, PE, PB, ROE, yield snapshot; separate from statements)
- Profile pay details (menu 07): monthly wage slip plus **year-end** MOL-style annual slip and tax-base worksheet (not a Hometax filing)
- Profile investment style & advice (`/profile` menu 10, after holdings; questionnaire maps to risk tolerance; no product picks)
- Market collection: news RSS (KR + global), Upbit quotes, ECOS/FRED macro, Yahoo quotes & fundamentals, DART/EDGAR financial statements (worker)
- AI chatbot: local Ollama + collected data as context
### Later
- Phase 2: Market Terminal UI (watchlist, charts, economic calendar), KIS domestic/overseas quotes
- Phase 3: Tax + Year-End (year-end tax settlement on own salary, overseas stock capital gains, dividend income)
- Phase 4: Accounting + Labor/HR — extend to freelancers and small businesses when productizing
- Phase 5: AI upgrades (RAG, anomaly spending detection, risk explanations)

## Original brief
`Finvesting_프로젝트_소개서.pdf` (Concept Brief v0.1) — 9 modules (Account, Investment, Market Terminal, Tax, Year-End, Accounting, Labor/HR, Research, AI Assistant); signature feature: Financial Timeline.
