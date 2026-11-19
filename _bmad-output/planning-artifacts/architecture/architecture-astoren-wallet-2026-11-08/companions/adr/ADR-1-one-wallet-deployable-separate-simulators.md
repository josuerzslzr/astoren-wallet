# ADR-1: One wallet deployable, separate simulators, one monorepo

- **Status:** Accepted, 2026-11-19
- **Spine rule:** [AD-1](../../ARCHITECTURE-SPINE.md#ad-1--system-shape-one-wallet-deployable-separate-simulators-one-monorepo-adopted)
- **Binds:** all; NFR-1, NFR-7, FR-19

## Context

Astoren Wallet is a pilot USD/EUR exchange wallet. Every outside party (partner bank, cash partner, FX quote service) is simulated, and all money is test money. Two requirements shape the system's outer form:

- **FR-19 (take an offer) and NFR-1 (exact double-entry money)**: when a user takes an offer, the offer's remaining amount, the taker's balances and the maker's balances must all change together or not at all. The simplest way to guarantee that is **one database transaction**.
- **NFR-7 (replaceable partners)**: the simulators must be swappable for real partners at go-live. That only holds if the wallet cannot "cheat" by calling simulator internals, and the simulators cannot reach into the wallet.

A *modular monolith* is one deployable application split internally into modules with strict boundaries. *Microservices* split the same responsibilities into separately deployed services, each with its own database.

## Options considered

| Option | Pros | Cons |
| --- | --- | --- |
| **Microservices** (exchange, ledger, deposits... as separate services) | Independent scaling and deploys; popular learning target | A take spans several services, so atomic settlement needs a distributed saga; much more infrastructure for a pilot. **Rejected** because FR-19 + NFR-1 need one DB transaction. |
| **Modular monolith for the wallet** (chosen) | One transaction for settlement; one codebase to learn; module boundaries still enforced | Scales as one unit; boundaries need tooling to stay honest (see ADR-2) |
| Simulators inside the wallet deployable | Fewer things to deploy | Product logic and partner logic blur; a "backdoor" becomes tempting; NFR-7 holds only on paper |
| **One simulator service** for all partners | One extra deployable | Bank, cash and FX concerns tangle; less like real partners |
| **Three simulators, separate runnables in the monorepo** (chosen) | Each mimics one real partner; independent lifecycles | Three small apps and charts to maintain |
| Separate repositories per piece | Hard isolation | Shared tooling and versions drift; more ceremony. **Rejected** in favour of one monorepo |
| Monorepo tool: Nx | Rich features | Heavier; its boundary rules work between libraries, not inside `wallet-api`. **Rejected** for pnpm workspaces + Turborepo |

## Decision

- The wallet is **one codebase with two runnables**: `wallet-api` (N stateless instances, REST + WebSocket) and `wallet-worker` (exactly-one jobs).
- `bank-sim`, `cash-sim` and `fx-sim` are **separate single-instance NestJS runnables**, each with its own Helm chart and pod, keeping state in memory (lost on restart).
- Simulators are reached **only through partner-facing interfaces** and never import wallet code or types. Shared formats are **duplicated as specs** (`docs/partner-specs/`), not shared as code.
- The wallet exposes **no credit or backdoor endpoint**. Balances arrive through deposits.
- Everything lives in **one pnpm + Turborepo monorepo**.

## Consequences

**Positive**
- Settlement of a take (and every other money move) is one ACID transaction, so "half a trade" cannot happen.
- Replacing a simulator with a real partner touches only the wallet's `partners` adapters and config (AD-4).
- One repo, one toolchain, one place to learn.

**Negative**
- The wallet scales as a whole; there is no way to scale only "exchange".
- Duplicating wire formats as specs means a format change must be edited in two places (spec + adapter) and kept in sync by review.
- Simulator state disappears on restart, so tests and demos must re-drive partner events.

**Follow-ups and revisit triggers**
- Worker high availability (leader election) is deferred; revisit when worker downtime becomes unacceptable (spine Deferred table).
- Production and staging environments are out of scope until a real launch is planned.
