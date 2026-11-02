# Brainstorm Intent: Hybrid P2P USD/EUR Exchange Wallet (MVP)

Source: brainstorming session 2026-11-02 to 2026-11-04 (status: complete). Captures the MVP scope as converged.

## Context & Goal
- Practice project: practise BMad and AI agent-driven development using: **WebSockets, webhooks, NestJS, React**.
- Builder: 13-year Java/TS/AWS/event-driven/distributed-systems engineer. Domain: fintech.
- Deliver MVP first, in phases; bigger ideas go to later phases.

## Problem & Product Concept
- Pain: currency exchange (e.g. USD->EUR) is too expensive.
- Product: a cheap, transparent **USD/EUR multi-currency wallet** with a **hybrid quote board**:
  - **House quote** always present: tracks the live market rate in near real time, priced slightly above market (not extortionate). It is the **guaranteed ceiling**, and that is the trust promise.
  - **P2P offers** stream in live alongside it; the user can take any offer that beats the house rate, or post their own offer as a maker.
- P2P market makers solve the liquidity/wait-time problem of pure P2P matching.
- Allow and welcome P2P trading and market making (it is the liquidity), but **do not market it as a trading platform**.

## Users
| User | Needs / fears |
|---|---|
| First user (funding ~$800) | Gives up if funding is costly or complex (e.g. 5% to fund) or rates are aggressive; losing ~$50 on $800 across funding plus exchange is a deal-breaker. Needs an upfront all-in cost. |
| P2P market maker / FX-savvy user | Posts tight pegged orders to earn the spread, or arbitrages the P2P board against the house rate. A reason to prefer the wallet. |
| House (platform treasury) | Provides liquidity from simulated seeded USD and EUR treasury balances and bears the FX risk. Must be protected from stale-rate sniping, round-trip arbitrage and excess exposure. |
| Saver ("Marta"), later phase | Expects ~APR/12 credited monthly; $0 returns or an unexplained balance drop reads as fishy and she withdraws. Deferred along with yield. |

## MVP Scope (MoSCoW, confirmed)
**Must**
- USD/EUR wallet with balance buckets: available, held, pending.
- Simulated top-up gateway using signed webhooks.
- Live market rate feed (simulated tick generator).
- House quote: spread, quote-lock, staleness check, exposure limits (widen or pause the quote).
- Live quote board.
- Post P2P order (pegged or fixed) with a balance hold.
- Atomic take, first taker wins.
- Lost-race message.
- All-in cost preview before funding or exchanging.
- Simulated bank withdrawal.
- All abuse guards as ACs, plus rate limiting and no self-match.

**Should**: price alerts ("notify me when an offer beats X on USD->EUR"); notify the maker when their order is taken; one-tap lost-race recovery (next-best offer pre-selected plus house fallback).

**Could**: partial fills; order expiry; trader reputation/completion badges; "auto-take next best within X% of my pick".

**Won't (this time), later phases**: savers pool, APR yield and reserve fund; LP/daily streak rewards (Duolingo-style); WhatsApp-style chat-native money; virtual/smart-currency card; quote skewing; treasury dashboard; other fiat and crypto pairs (BTC, USDT, USDC, ETH).

## Key Product Decisions
- **Currencies:** USD and EUR only.
- **Order types:** *pegged* (live market rate ± a user-chosen %, set when the order is created; reprices on every tick) and *fixed* rate.
- **House rate** tracks the market in near real time, so orders never use a stale rate.
- **Settlement:** no escrow. All funds live inside the platform, so a take is one atomic internal ledger transaction for both sides (double-entry ledger). Posting an order places a hold: held funds cannot be withdrawn or offered again. Concurrent losers get a live "order gone" push.
- **Lost race:** explain that the order was taken; the user picks another P2P offer or house fulfilment.
- **Balance buckets:** *available* (spendable); *held* (reserved by the user's own open orders); *pending* (in flight with the external gateway: a top-up not yet confirmed, or a withdrawal not yet settled). Pending exists only because of the async webhook edge.
- **All-in cost preview**, e.g. "fund $800 -> receive EUR X, total cost $Y (Z%) vs typical bank ~$40".
- **Simulated gateway** as its own small service that calls the wallet through HMAC-signed webhooks, with configurable delays, retries, duplicate and out-of-order deliveries, and failures. The builder writes both sides of the webhooks. Stripe test mode is an alternative.
- **Market rate:** simulated tick generator, not a real FX API.
- **Dropped:** the speed/price slider. **Deferred:** the savings yield, so balances can be kept in the wallet without interest.

## Integrity & Abuse Guards (all in MVP)
Each guard is an acceptance criterion on the feature it protects. Only the cross-cutting guards are separate stories. Do not create a trailing "abuse epic" that could get cut.

| Owning feature | Guards (ACs) |
|---|---|
| Take order | Conditional update / first-taker-wins (no double-take); idempotency key on take requests |
| Top-up / withdrawal | HMAC signature, timestamp window, event-id dedupe (forgery/replay); pending until the gateway confirms (no withdrawal before a top-up settles); no double-withdraw |
| Ledger / balances | Integer minor units or decimal math; rounding toward the house; minimum trade size; `CHECK (available >= 0)`; held funds cannot be spent |
| House quote | Quote TTL/quote-lock (re-validate at take); max staleness check; spread larger than the typical tick move; exposure limits; per-user velocity limits (round-trip arbitrage) |
| **Cross-cutting stories** | Order rate limiting plus minimum order size (spoofing/order spam); self-match prevention (wash trades) |

## Where the Learning Targets Live
| Tech | Home |
|---|---|
| WebSockets | Simulated ticker -> repricing quote board -> "order gone" / lost race, price alerts, maker notifications |
| Webhooks | Simulated gateway: top-ups and withdrawals (signed, with retries, duplicates, out-of-order delivery) |
| NestJS | Wallet API and the gateway service |
| React | Quote board UI |

## Carried Forward to Architecture
- PostgreSQL ACID is enough for internal trades on a single DB: `UPDATE ... WHERE status='open' RETURNING` (or `SELECT FOR UPDATE`), `CHECK` constraints, consistent lock ordering to avoid deadlocks, idempotency keys.
- **Transactional outbox** to publish post-commit events to the WebSocket fan-out.
- **Sagas** only at the external edges (bank deposit and withdrawal webhooks).
- The user deferred the ledger, outbox and saga design to `bmad-architecture`.

## Open Items
- The user wants guidance on modelling the top-up use case.
- How guards map to stories (recommendation above) is decided in `bmad-create-epics-and-stories`.
