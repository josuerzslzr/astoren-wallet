# Architecture Companions — Astoren Wallet

Public-reading companions to [`ARCHITECTURE-SPINE.md`](../ARCHITECTURE-SPINE.md). The spine is authoritative; these pages explain it for engineers and reviewers new to the project. ADR numbers reuse the spine's AD-n ids.

## Diagrams

- [C4 model](c4.md) — system context, containers and wallet-api components, plus a local vs dev deployment note.

## Architecture Decision Records

- [ADR-1: One wallet deployable, separate simulators, one monorepo](adr/ADR-1-one-wallet-deployable-separate-simulators.md) — why a modular monolith instead of microservices, and why simulators live outside it.
- [ADR-2: Layered modular monolith, hexagonal only at the partner edge](adr/ADR-2-layered-modular-monolith-hex-at-partner-edge.md) — internal code style, module boundary rules, and the planned hex/DDD comparison.
- [ADR-5: Ledger entries are the source of truth](adr/ADR-5-ledger-entries-source-of-truth.md) — double-entry journals, three tiers written in one transaction, balances as a projection.
- [ADR-9: Currency pairs and the single price convention](adr/ADR-9-currency-pairs-single-price-convention.md) — one canonical price per pair (quote per 1 base), no inverted rates stored.
- [ADR-13: Guarded transitions and lock order](adr/ADR-13-guarded-transitions-and-lock-order.md) — how races are settled in Postgres and how deadlocks are avoided (covers AD-13 and AD-14).
- [ADR-16: Idempotency key lifecycle](adr/ADR-16-idempotency-key-lifecycle.md) — one key per user intent, deduplicated inside the business transaction.
- [ADR-18: Real-time delivery via LISTEN/NOTIFY and the outbox](adr/ADR-18-realtime-delivery-listen-notify-outbox.md) — FX ingestion, socket.io fan-out across instances, Redis deferred (covers AD-18 and AD-33).
- [ADR-26: Ephemeral dev infrastructure](adr/ADR-26-ephemeral-dev-infrastructure.md) — EKS on the AWS Free plan, persistent vs session Terraform roots, one deploy path.
