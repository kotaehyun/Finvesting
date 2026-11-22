# Product overview

> 🇰🇷 [overview.md](./overview.md) is canonical.

## One-liner
A personal finance work terminal that connects scattered account, card, brokerage and investment data into one money flow, and uses collected market information to support investment decisions.

## Core user (decided)
**The owner.** The filled books today are the **salaried investor** (asset home and profile). Freelancer / sole-proprietor / corporation work (`/erp`) and the realty terminal (`/realty`) are **deferred / frozen** (ADR 0050). Household salary is never treated as sales or service income.

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
- Investment dashboard at `/invest` (indices, bitcoin, commodities, FX, KOFIA investor-deposit/credit doughnut — unpaid margin is a slot unless it appears on the main HTML, Yahoo market-cap ranks for collected KR/overseas names with related news headlines, company search that adds a watchlist, holdings; links out to markets)
- Markets `/markets` (World Bank inflation and BIS policy-rate cells, volume heatmap, KRX flow links, crypto/FX heatmaps and news, technical analysis, company search)
- ~~Realty `/realty`~~ **frozen** (ADR 0050). Route kept; nav and roadmap exclude it; no new features
- Statements & audit opinion at `/statements` (`?q=` selects that ticker only when collected; otherwise official lookup links; Korea DART / US EDGAR numbers + opinion; “재무제표를 읽는 사람들” only on Korean lookups; no report body; local LLM reading)
- Yahoo Fundamentals table at `/fundamentals` (daily market-cap, PE, PB snapshot; empty/DB failure is a status, not sample rows; 52-week gauge uses last close; mixed-currency money sort is off on All markets; Korea lookup is Naver plus Kakao Pay Securities home, overseas is Yahoo; Kakao `035720.KS` is a default collect ticker; no filing tables or commentary columns)
- Profile pay details (menu 07): monthly wage slip plus **year-end** MOL-style annual slip and tax-base worksheet (not a Hometax filing)
- Profile 12 year-end (MOL annual slip plus deduction panes for donations, children count, etc.; no credit-rate math; ADR 0037)
- Profile 13 CGT/dividends (overseas-stock taxable after the ₩2.5M allowance, dividend/interest totals, household journal CSV; CGT/gift/holding statute rate tables; ADR 0041)
- ~~Work `/erp`~~ **deferred** (ADR 0050). Route and trial worksheets kept; no nav or ledger-schema follow-up. Own rate tables stay on profile 13
- Profile investment style & advice (`/profile` menu 10, after holdings; questionnaire maps to risk tolerance; no product picks)
- Market collection: news RSS (KR + global), Upbit quotes, ECOS/FRED macro, Yahoo quotes & fundamentals, DART/EDGAR financial statements (worker)
- Invest Bot AI (`투자 봇AI`): local Ollama + collected data as context. `/chat` is a conversation layout (greeting, composer at the bottom; ADR 0048). Replies append as tokens arrive and can be stopped (ADR 0058). Turns stay on this machine (ADR 0059). It is not ChatGPT.
### Later
- Phase 2 Market Terminal: watchlist, per-symbol news mapping, and RAG are done. Korea Investment quotes are not used. Quotes are Yahoo and Upbit (ADR 0053)
- Phase 3 Tax + Year-End: own year-end settlement, overseas-stock capital gains, and dividend/interest monitoring are done
- Phase 4: Douzone, WEHAGO, and Semusarang export is done. Multi-user auth, hosted DB move, worker container, and payroll/social insurance are not. Payroll and social insurance stay deferred (ADR 0050)
- Phase 5: chat streaming and saved conversations are done (ADR 0058, 0059). Anomaly spending (ADR 0062), risk text (ADR 0063), repeated loss-then-rebuy patterns (ADR 0064), and home/chat proactive alerts that reuse those results without push or email (ADR 0065) are done. Still open: DGX Spark/vLLM provider

## Original brief
`Finvesting_프로젝트_소개서.pdf` (Concept Brief v0.1) — 9 modules (Account, Investment, Market Terminal, Tax, Year-End, Accounting, Labor/HR, Research, AI Assistant); signature feature: Financial Timeline.
