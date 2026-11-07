# Addendum: Hybrid P2P USD/EUR Exchange Wallet

Detail for downstream documents (architecture, epics and stories) that doesn't fit in the PRD itself. Sources: the brainstorm (`_bmad-output/brainstorming/brainstorm-fintech-practice-project-2026-11-02/brainstorm-intent.md`, 2026-11-04), PRD discovery (2026-11-04 to 2026-11-06), and two research reports in `_bmad-output/planning-artifacts/research/`: the UglyCash competitive research and the domain research on USD accounts and foreign cash handling in the EU (both 2026-11-06).

## Architecture notes (for bmad-architecture)

The user deferred ledger, outbox and saga design to `bmad-architecture`.

### Learning-target stack
| Tech | Where it lives |
|---|---|
| WebSockets | Simulated ticker → repricing quote board → "offer gone" / lost race, price alerts, maker notifications |
| Webhooks | Simulator: deposits and withdrawals (signed, with retries, duplicates, out-of-order delivery) |
| NestJS | Wallet API and the simulator service |
| React | Quote board UI |

### Core mechanism notes
- PostgreSQL ACID transactions are enough for internal exchanges on a single database: `UPDATE ... WHERE status='open' RETURNING` (or `SELECT FOR UPDATE`), `CHECK (available >= 0)` constraints, consistent lock ordering to avoid deadlocks, and idempotency keys.
- Double-entry ledger; integer minor units or decimal math.
- A **transactional outbox** publishes post-commit events to the WebSocket fan-out.
- **Sagas** only at the external edges (bank deposit and withdrawal webhooks).
- The simulator runs as its own small service and calls the wallet through HMAC-signed webhooks. Delays, retries, duplicate and out-of-order deliveries, and failures are configurable. Stripe test mode was an alternative, but payment processors are out of scope for the pilot (PRD §5).
- The market rate comes from the simulator acting as the FX quote service (a tick generator), not a real FX API (PRD §5, FR-29).
- Going live: use a streaming rate feed (several updates per second for EUR/USD). A polling API that updates once a minute would constantly trip FR-15's 10-second staleness limit. Consider a secondary rate source to fail over to, so whole-board pauses (FR-15) stay rare.

### Simulated rails: mechanism notes (from PRD discovery, 2026-11-06)
- User's proposal: every deposit and withdrawal, bank and cash, runs through an internally built simulation service. In the pilot, all money in the wallet is test money.
- Direction of calls as the user sees it:
  - **Withdrawals:** the wallet initiates them by calling the simulator (e.g. "issue withdrawal code", "send bank payout"). The simulator later reports the outcome (paid out, rejected, expired).
  - **Deposits:** the simulator originates them (e.g. "USD cash deposited with reference X", "bank transfer received") and calls the wallet to credit the balance.
- Open for architecture: one simulator for both directions, or separate deposit and withdrawal simulators; and how the wallet authenticates simulator callbacks (the core mechanism notes propose HMAC-signed webhooks with configurable delays, duplicates, out-of-order delivery and failures).
- The UglyCash research suggests these patterns are worth simulating: per-user virtual account numbers, a pooled account plus payment reference, and cash in and out by code at retail points.
- **Triggering events (2026-11-06):** an operator drives the simulator with API calls (curl/Postman); there is no teller UI in the pilot. Recommended flow: operator → simulator API ("cash deposited, ref X, $500") → simulator → wallet's partner-facing callback. The wallet's public API never gets a "credit this balance" endpoint, so only the path a real bank would use is exercised. Failure injection (reject, expire, duplicate, delay, out-of-order) uses the same simulator API.

### Cash funding: mechanism notes (from PRD discovery, 2026-11-04)
- User's idea: a wallet user deposits USD cash at a bank counter into the wallet's **USD-denominated** receiving account, then submits the reference in the app. The wallet credits the balance once the bank confirms. The account must be in USD because the bank would convert a deposit into a EUR account at its own rate.
- Real-world patterns for architecture to weigh:
  - (a) A user-submitted reference matched against the bank's incoming-deposit notification.
  - (b) A per-user virtual account number or reference issued upfront, so the bank notification identifies the user without a manual form.
  - (c) Retail cash-load networks.
- In the simulation, the simulator emits a "deposit received" webhook carrying the reference, and the wallet matches it like any other deposit (PRD FR-6, FR-7). Deposits never pass through the pending bucket; they are credited straight to available.

### Cash withdrawal settlement: accounting notes (from UJ-1 discussion)
- The user hasn't designed the accounting yet. Their mental model: on bank confirmation, the wallet user's funds move to a company account, and the cash partner pays out and settles against that company account.
- Suggestion for architecture: on confirmation, debit the user's pending balance and credit a **cash-partner settlement / payable** ledger account, kept separate from the house FX treasury so withdrawals don't distort exposure figures. Reconcile periodically against the cash partner's statement.
- Race to design for: an in-app cancel or 24-hour expiry at the same moment as a redemption at any cash partner (PRD FR-10). Only one can win; this is the same conditional-update pattern as first-taker-wins.

## Story-mapping guidance (for bmad-create-epics-and-stories)
- Each abuse guard is an acceptance criterion on the feature it protects. Only cross-cutting guards (offer rate limiting plus minimum offer size; self-match prevention) become separate stories. Don't create a trailing "abuse epic" that could get cut.

## Landscape research (2026-11-04 web scan)
Indicative only: several figures come from comparison or affiliate sites.

**Comparables**
- **CurrencyFair** (nearest analogue): a P2P marketplace (2010–) where users took the best rate on offer or posted their own to a queue, with a fallback spot rate when nothing matched. Reportedly dropped P2P in 2023 after merging into Zai (secondhand source). https://blog.currencyfair.com/the-exchange
- **Kantox**: B2B P2P matching backed by wholesale/partner liquidity. Its CEO said even the largest banks match only about 25% of their own books internally.
- **Wise**: mid-market rate plus one fee itemised up front. Positions itself against banks' hidden markups. https://wise.com/compare/
- **Revolut**: close-to-market exchange up to a plan allowance, then a 1% fair-usage fee and a 0.5–1% weekend markup.
- **Binance P2P**: fixed or floating (% of market) ads. Trust comes from escrow plus verified merchants. Pure-P2P LocalBitcoins and Paxful shut down in 2023.
- **WeSwap**: traveller-to-traveller swaps. Entered administration in 2021 after travel demand collapsed.

**Why pure P2P struggles:** buyers and sellers must be present at the same moment, and backup liquidity ends up filling most trades (Euromoney). Hybrid models (CurrencyFair's spot fallback, Kantox's liquidity providers) solve this with a guaranteed fill.

**Cost benchmarks (USD→EUR)**
- Bank FX markup is typically 1–3.5%, and card foreign-transaction fees are about 3% (https://wise.com/us/blog/us-bank-foreign-transaction-fees).
- Worked example on $1,000: a bank cost 3.26% (about $32.61), against Wise at about 0.33% plus $5 (https://sum.money/exchange-rate-margin-calculator/).
- On $800, that implies a bank cost of about $8–28 (1–3.5%). The brainstorm's "typical bank ~$40" figure (5%) sits above that range.

**UX patterns seen**
- Quote-lock countdown: Wise's guaranteed-rate window; Binance Convert's few-second auto-refresh.
- Target-rate alerts by email or push (Wise).
- Visible order queue before the user posts their own rate (CurrencyFair).
