# Product overview

> 🇰🇷 [overview.md](./overview.md) is canonical.

## One-liner
A personal finance work terminal that connects scattered account, card, brokerage and investment data into one money flow, and uses collected market information to support investment decisions.

## Core user (decided)
**The owner.** The filled books today are the **salaried investor** (asset home and profile). **Freelancer / sole-proprietor / corporation work** lives at `/erp`. Household salary is never treated as sales or service income.

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
- Investment dashboard at `/invest` (indices, bitcoin, commodities, FX, KOFIA investor-deposit/credit doughnut — unpaid margin is a slot unless it appears on the main HTML, company search that adds a watchlist, holdings; links out to markets and realty)
- Markets `/markets` (World Bank inflation and BIS policy-rate cells, volume heatmap, KRX flow links, crypto/FX heatmaps and news, technical analysis, company search)
- Realty `/realty` (nationwide 3D municipalities; metro bank household loans; BOK weighted-average and COFIX rate table; occupancy vs lease-trade wolse share; card NPL and revolving; vacancy excluding owner-use/free occupancy, empty homes by type, PIR/Gini; repayment, court-auction filings, personal rehabilitation/bankruptcy counts and overlapping cause shares, CRE NPL and shop yields; top-decile net-worth share plus gift/inherit/trust channels with no celebrity or executive names; corporate comprehensive-tax channel; ethics disclosures only — no grade-4 registry; census age vs marriage/newlywed facts on rumor cards; listing-type slots; Hankyung RSS when collected; the reload button refetches stored news/loans only)
- Statements & audit opinion at `/statements` (`?q=` selects that ticker only when collected; otherwise official lookup links; Korea DART / US EDGAR numbers + opinion; “재무제표를 읽는 사람들” only on Korean lookups; no report body; local LLM reading)
- Yahoo Fundamentals table at `/fundamentals` (daily market-cap, PE, PB snapshot; empty/DB failure is a status, not sample rows; 52-week gauge uses last close; mixed-currency money sort is off on All markets; Korea lookup is Naver plus Kakao Pay Securities home, overseas is Yahoo; Kakao `035720.KS` is a default collect ticker; no filing tables or commentary columns)
- Profile pay details (menu 07): monthly wage slip plus **year-end** MOL-style annual slip and tax-base worksheet (not a Hometax filing)
- Profile 12 year-end (MOL annual slip plus deduction panes for donations, children count, etc.; no credit-rate math; ADR 0037)
- Profile 13 CGT/dividends (overseas-stock taxable after the ₩2.5M allowance, dividend/interest totals, household journal CSV; CGT/gift/holding statute rate tables; ADR 0041)
- Work `/erp` (pick a role first; freelancer and sole proprietor share one desk, corporation is separate; freelancer 3.3% only for entertainers, models, independent developers, influencers, or licensed professionals; part-time wages are earned income, not business-income 3%; journal entries with debit and credit account titles (bank name under ordinary deposits); VAT 10%; exempt/export/import slots (ITA Art. 78 Feb. 10 workplace-status filing; certificate is 부가가치세면세사업자수입금액증명; association/farm VAT Act Art. 26; export Art. 21 zero-rate; import Art. 50 customs); labor pay-grade form is Civil Service Pay Decree Schedule 3 monthly salary (allowances and other schedules stay empty); staff register then NHI workplace-subscriber acquisition (LSA Art. 41; NHI Act Art. 8(2) within 14 days, Form 6; example is register → acquisition → official links; EDI workbook and Open API wait); GIT in May; CIT schedules 50 and 54 plus CIT only on the corporation desk; tax screens read statute text conservatively; CGT/gift/holding rate tables from statute; trial CSV leaves blanks blank; ADR 0034–0047)
- Profile investment style & advice (`/profile` menu 10, after holdings; questionnaire maps to risk tolerance; no product picks)
- Market collection: news RSS (KR + global), Upbit quotes, ECOS/FRED macro, Yahoo quotes & fundamentals, DART/EDGAR financial statements (worker)
- Invest Bot AI (`투자 봇AI`): local Ollama + collected data as context. `/chat` is a conversation layout (greeting, composer at the bottom; ADR 0048). It is not ChatGPT. Turns are not stored.
### Later
- Phase 2: Market Terminal UI (watchlist, charts, economic calendar), KIS domestic/overseas quotes
- Phase 3: Tax + Year-End (year-end tax settlement on own salary, overseas stock capital gains, dividend income)
- Phase 4: Accounting + Labor/HR — extend to freelancers and small businesses when productizing
- Phase 5: AI upgrades (RAG, anomaly spending detection, risk explanations)

## Original brief
`Finvesting_프로젝트_소개서.pdf` (Concept Brief v0.1) — 9 modules (Account, Investment, Market Terminal, Tax, Year-End, Accounting, Labor/HR, Research, AI Assistant); signature feature: Financial Timeline.
