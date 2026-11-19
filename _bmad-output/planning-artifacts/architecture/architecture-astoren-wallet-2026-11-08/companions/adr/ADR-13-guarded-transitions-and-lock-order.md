# ADR-13: Races settled by guarded transitions, with a fixed lock order

- **Status:** Accepted, 2026-11-19
- **Spine rules:** [AD-13](../../ARCHITECTURE-SPINE.md#ad-13--races-are-settled-by-guarded-transitions-adopted) and [AD-14](../../ARCHITECTURE-SPINE.md#ad-14--lock-order-adopted); related AD-12, AD-15, AD-27
- **Binds:** offers, exchanges, deposits, withdrawals, transfers, every `CommandExecutor` transaction; FR-4, FR-6, FR-11, FR-15, FR-16, FR-19, FR-20, FR-21, FR-23, FR-24

## Context

Many requests can race for the same thing: two users take the last part of one offer (FR-19, FR-20), a maker cancels while someone takes (FR-23), two withdrawals both try to fit under one limit (FR-11). Three classic bugs follow:

- **Check-then-act race**: code reads "offer has 100 left", decides, then writes, while another request did the same in between.
- **Deadlock**: transaction A locks account 1 then waits for account 2, while B holds 2 and waits for 1. Postgres kills one of them.
- **Write skew** on limits: two transactions each read the sum of recent withdrawals, each sees room, both commit, and together they exceed the limit.

A **guarded transition** is a single conditional `UPDATE ... WHERE state = expected AND conditions`; the database itself decides who wins. A **lock order** is a fixed sequence in which every transaction acquires locks, so no two can wait on each other in a circle.

## Options considered

| Option | Pros | Cons |
| --- | --- | --- |
| **Guarded conditional updates in Postgres** (chosen, user) | DB is the single arbiter; no extra infrastructure; winner = whoever Postgres grants the row lock first | Every state change must be written as a conditional update |
| In-memory matching engine | Very fast matching | A stateful single point of failure; the DB stops being the truth. **Rejected** |
| Optimistic version retries (read version, write if unchanged, retry on conflict) | No waiting on locks | Retry loops in every use case; noisy under contention. **Rejected** |
| SERIALIZABLE isolation with retries | DB detects all anomalies | Retry loops everywhere; mixed isolation levels. **Deferred** (AD-15 keeps READ COMMITTED) |
| Lock order: business row, then accounts by id (first version) | Simple | Superseded: board/rate reads must come first, and accounts must be locked in one call before any aggregate check |

## Decision

**Guarded transitions (AD-13).** State changes are conditional updates:
`UPDATE ... SET ..., version = version + 1 WHERE id = ? AND state IN (<expected>) AND <conditions> RETURNING ...`.
Zero rows means **refused**, and nothing else in the transaction is touched. On zero rows the code re-reads the row in the same transaction to choose the returnCode (so every refusal has a reason). FR-19 "arrival order" is the order Postgres grants the row lock. TypeORM `save()` is **forbidden** on money or state rows. No in-memory matching engine, no optimistic-version retries. Example: deposit credit accepts `open` or `awaiting_confirmation`; receipt attach accepts `open` only.

**Lock order (AD-14).** Every transaction acquires locks in this fixed order:
1. `board_state` and the pair's market rate row `FOR SHARE`, when the command is gated by them;
2. the single business row, via its guarded update;
3. the complete set of ledger accounts the command will check or post to, in **one** `LedgerService.lockAccounts(tx, ids)` call ordered by id, **before any aggregate check**.

A limit or rate-limit check includes the user's `available` account in that currency in the lock set, even when no money moves. `post()` asserts its accounts are already locked and never acquires a new lock. No code issues `FOR UPDATE` on an account outside `lockAccounts`. `CommandExecutor` retries the whole command once on a Postgres deadlock (`40P01`) (AD-12).

## Consequences

**Positive**
- Races resolve deterministically in the database; the loser gets a clear refusal code (supports the FR-20 "lost race, try next best" flow).
- Independently written use cases cannot deadlock each other if they follow the order.
- Locking the user's `available` account serialises limit checks and prevents write skew.

**Negative**
- House takes all lock the house treasury rows, so they run one at a time. **Accepted for the pilot.**
- Builders must think in conditional updates rather than load-modify-save.
- Correctness depends on discipline; mocked-DB tests cannot catch violations, so concurrency tests run against real Postgres (AD-27).

**Follow-ups and revisit triggers**
- **SERIALIZABLE** (Deferred): revisit when a check row locks cannot cover appears, for example the linked-wallet graph check.
- Unhappy-path states (timeouts, reversals, cash-code redeem vs cancel races) are designed in a later round; AD-13 and AD-17 keep room for added states.
