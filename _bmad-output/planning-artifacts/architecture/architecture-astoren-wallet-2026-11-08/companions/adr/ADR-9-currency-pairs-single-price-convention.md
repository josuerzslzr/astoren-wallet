# ADR-9: Currency pairs and the single price convention

- **Status:** Accepted, 2026-11-19
- **Spine rule:** [AD-9](../../ARCHITECTURE-SPINE.md#ad-9--currency-pairs-and-the-single-price-convention-adopted); related AD-7, AD-8, AD-10
- **Binds:** exchange, contracts, web client; FR-12, FR-13, FR-18, FR-21, FR-22, SM-1

## Context

An exchange rate can be written two ways: "1.08 USD per 1 EUR" or "0.9259 EUR per 1 USD". Spreads and margins can likewise be applied "up" or "down". If two builders pick different conventions, one of them will invert a rate or apply a markup in the wrong direction, and users will get a worse price than the house ceiling allows (SM-1).

Terms:
- **Currency pair, base/quote**: in "EUR/USD", EUR is the *base* and USD is the *quote* currency; the price says how much quote currency buys 1 base.
- **Market rate**: the mid-market rate from the FX feed (the midpoint of wholesale buy and sell prices). The project says "market rate", never "mid".
- **Spread / add-on**: the house's visible markup; the add-on applies only while the market is closed (weekend).

## Options considered

| Option | Pros | Cons |
| --- | --- | --- |
| Rates held **per direction** (a USD->EUR rate and an EUR->USD rate, each with its own spread) | Each screen reads "its" rate directly | Two stored truths that can disagree; percentages applied over different bases. **Superseded** by the user |
| **One canonical price per pair, quote per 1 base** (chosen, user) | Single source of truth; one formula for spreads and margins | Every consumer must convert per side through one helper |
| Hardcoded USD and EUR in types and code | Simplest for the pilot | Design only works for two currencies. **Superseded**: currencies and pairs are data |
| Store inverted rates for convenience | Cheaper display | Two numbers that can drift. **Rejected**: no inverted rate is ever stored |

## Decision

- Each supported currency pair has **one canonical direction (base/quote)** and **one market rate row**.
- **Every stored and transmitted price is quote currency per 1 base.** The pilot has one pair, **EUR/USD (USD per 1 EUR)**.
- An **offer stores its source currency** (what the maker gives), **target currency** (what the maker gets) and **price in the pair's canonical unit**.
- **House price per side** is computed from the market rate so the taker receives `(1 - (spread + addOn))` of market value, where `addOn` is the weekend add-on while the session is closed and 0 otherwise.
- "Better for taker" and the FR-21 worse-than-house check use the **`packages/money` comparator**.
- **No inverted rate is ever stored.** The client may display the inverse for presentation only.
- Code, DB and API say **`market rate`** (`market_rate`, `market_rate_at`), never `mid`. **Side, bid and ask never appear in the UI.**

## Consequences

**Positive**
- One formula, one comparator, one place to get it right; the house cost to the taker equals the configured spread, which is what SM-1 checks.
- Adding a currency or pair is data, not code (AD-7).
- Rounding stays in `convert()` only, always in the house's favour (AD-8).

**Negative**
- Every per-side calculation goes through `packages/money`; a builder doing math inline is a bug even if the result looks right.
- Displaying "EUR per USD" requires a client-side inverse computed with the decimal library, rounded for display only.

**Follow-ups and revisit triggers**
- **Handoff to PRD/UX:** a rate display direction toggle (quote-per-base vs inverse): priority, placement, default, persistence.
- **Additional currencies and pairs** (Deferred): revisit when product adds a currency; AD-7 and AD-9 already model them as data.
