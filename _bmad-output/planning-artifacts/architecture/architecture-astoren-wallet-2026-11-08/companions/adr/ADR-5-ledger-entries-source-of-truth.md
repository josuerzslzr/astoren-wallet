# ADR-5: Ledger entries are the source of truth

- **Status:** Accepted, 2026-11-19
- **Spine rule:** [AD-5](../../ARCHITECTURE-SPINE.md#ad-5--ledger-entries-are-the-source-of-truth-adopted); related AD-6, AD-8, AD-30
- **Binds:** ledger and every money-moving flow; NFR-1, NFR-5, SM-1, SM-2, FR-2

## Context

A wallet must always be able to answer "where did this money come from and where did it go?" NFR-1 demands **double-entry** accounting with exact amounts: every movement is recorded as lines that debit one account and credit another, so the totals per currency always balance to zero. SM-2 requires a reconciliation check that balances match the records.

Terms used below:
- **Journal**: one accounting entry for one business operation (for example "this exchange").
- **Journal line**: one leg of that entry: an account, a signed amount, and the account's balance after the line.
- **Balance projection**: a stored, ready-to-read current balance per account, derived from the lines. It exists for speed; it is not the truth.

## Options considered

| Option | Pros | Cons |
| --- | --- | --- |
| Mutable balance columns as the truth, with a log on the side | Simple reads and writes | A balance can change without a matching record (or the reverse); no way to prove correctness |
| **Ledger entries as truth, balances as a projection updated in the same transaction** (chosen, user) | Every balance change has a record; drift is detectable (SM-2) | More rows and a stricter write path |
| Journal lines store both `balance_before` and `balance_after` | Easy to read | Redundant fields that can contradict each other. **Rejected**: store `balance_after` only |
| Journal identified by `(type, idempotency key)` | Ties to the client request | Superseded: journals are unique on `(type, business_ref)`, since partner and worker flows have no client key |
| User history read from journal lines | No extra table | Journal lines are accounting legs and many status changes move no money. **Rejected** in favour of the `history` projection (AD-30) |

## Decision

Every money move writes **three tiers in one database transaction**:

1. **Business record + status history** (the deposit, withdrawal, offer, exchange or transfer, with its append-only `<entity>_status_history`).
2. **Exactly one `journal` per `(type, business_ref)`** (unique constraint) with `journal_line`s holding account, signed amount and `balance_after`. Lines **per currency sum to zero**. Journals and lines are **append-only**.
3. **Balance projection** update.

`JournalType` is a **closed enum** in `ledger` that declares each type's account roles: `seed`, `deposit_credit` (house cash at partner bank -> user available), `withdrawal_hold` (available -> pending), `withdrawal_settle` (pending -> house cash at partner bank), `offer_hold`, `offer_release`, `exchange`, `transfer`. Multi-stage flows use one type per stage. **Adding a type is a ledger change.** The `pending` bucket is used only by withdrawals. User-facing history reads `history` (AD-30), never journal lines. Projection vs journal drift is a **reconciliation failure** (SM-2).

Only `LedgerService` writes ledger tables (AD-3). One multi-currency journal per exchange makes FR-19 settlement atomic by construction.

## Consequences

**Positive**
- A balance can never change without a matching, balanced record.
- The reconciliation job (AD-19) can prove correctness by comparing projection to lines.
- Builders cannot invent ad hoc journal types or account pairs; the enum fixes them.

**Negative**
- Every money flow pays the cost of three writes and account locking (AD-14).
- New flows need a ledger change first (new `JournalType`), which serialises some design work through one module.
- A second read model (`history`) must be kept consistent by the owning modules (AD-30).

**Follow-ups and revisit triggers**
- Unhappy paths (reversals, returned payouts, compensation) will add journal types; designed in the dedicated unhappy-path round (Deferred).
- Metrics and alerting, including an SM-2 imbalance alert, are deferred to their own epic; until then the reconciliation job writes a structured log line.
