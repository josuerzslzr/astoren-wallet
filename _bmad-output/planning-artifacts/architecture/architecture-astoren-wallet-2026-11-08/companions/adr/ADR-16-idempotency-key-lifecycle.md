# ADR-16: Idempotency key lifecycle

- **Status:** Accepted, 2026-11-19
- **Spine rule:** [AD-16](../../ARCHITECTURE-SPINE.md#ad-16--idempotency-semantics-adopted); related AD-4, AD-12, AD-33
- **Binds:** API edge, CommandExecutor, web client; NFR-2, FR-19

## Context

Networks fail in the worst place: the server commits an exchange, but the response never reaches the browser. The user (or the client's retry) sends again. Without protection, money moves twice. NFR-2 requires that a repeated request has the same effect as one.

An **idempotency key** is a unique id the client attaches to a request. The server remembers the key and the outcome, and replays the stored outcome when it sees the key again instead of running the operation twice.

The hard parts are *when* the client creates a new key, and *where* on the server the duplicate check happens.

## Options considered

| Option | Pros | Cons |
| --- | --- | --- |
| New key per HTTP attempt | Trivial client | Defeats the purpose; a retry looks like a new request |
| **One key per user intent (confirm sheet), reused on every retry** (chosen, user) | Retries, double clicks and reloads collapse into one execution | Client must store the key and must not change the body while the outcome is unknown |
| Dedupe in an HTTP interceptor, outside the business transaction | Clean separation | Two concurrent duplicates can both pass the check before either commits. **Rejected** |
| Stripe-style `409 in progress` for a concurrent duplicate | Fast answer | The client sees an error for a request that will succeed, which can look like lost funds. **Rejected**: the duplicate waits and replays |
| Separate dedupe tables for client keys, partner events and outbox consumers, or one shared table | | Resolved: this table is for **client keys only**; partner events dedupe on the `partners` inbox (AD-4), outbox consumers on `platform.consumed_event` (AD-33) |

## Decision

**Client side**
- The client mints an `Idempotency-Key` (UUID) **when a confirm sheet opens** and keeps it in `sessionStorage` while in flight.
- Quote refreshes keep the key while it is unsent.
- The **first send binds the key to that exact body**. Double clicks, timeouts and reloads resend the same body + key and get the stored result replayed.
- A **new key is minted only after a definitive refusal**. While an outcome is unknown the body must not change; the client resends with backoff.
- A `401` is decided before `CommandExecutor`, so the client refreshes the token and resends with the same key.

**Server side**
- `@Idempotent()` only marks the route and validates the key (missing or malformed -> HTTP 400).
- **Dedupe happens inside `CommandExecutor`**, in the business transaction: table unique on `(user_id, key)` with `user_id NOT NULL`, request hash, status and stored response.
- Same key + different body -> **HTTP 422**. **Refusals are stored outcomes** too.
- A **concurrent duplicate waits on the unique index and replays**.
- Keys expire after about 24 h (cleaned up by the worker's housekeeping, AD-19).

## Consequences

**Positive**
- A money-moving request executes at most once per intent, regardless of retries, reloads or double clicks.
- Concurrent duplicates never race past a check, because the check is inside the transaction.
- The user never sees a misleading error for a request that actually succeeded.

**Negative**
- The client carries real logic (mint, persist, bind, resend with backoff, new key only after refusal); it must be tested.
- A duplicate request holds a database connection while it waits on the unique index.
- After about 24 h a resend with an old key is treated as new.

**Follow-ups and revisit triggers**
- **UX handoff:** copy for when the server stays unreachable ("check Activity before trying again" rather than "Nothing has moved").
- Duplicate keys in flight and a lost race followed by a new-key confirm are part of the required real-Postgres concurrency tests (AD-27).
