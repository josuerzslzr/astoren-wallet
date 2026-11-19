# ADR-2: Layered modular monolith, hexagonal only at the partner edge

- **Status:** Accepted, 2026-11-19
- **Spine rules:** [AD-2](../../ARCHITECTURE-SPINE.md#ad-2--module-boundaries-inside-wallet-api-adopted), Design Paradigm section; related AD-3, AD-4
- **Binds:** all wallet-api modules

## Context

ADR-1 made the wallet one deployable. The next question is how code is organised *inside* it. Two well-known styles were on the table:

- **Layered**: each module is `controller -> service -> repository`. Controllers map HTTP, services hold business rules, repositories run database queries. Simple and conventional in NestJS.
- **Hexagonal (ports and adapters)**: the business core defines interfaces ("ports") for everything outside it (database, partners, clock), and "adapters" implement them. The core has no framework or database code. Often paired with **tactical DDD** (Domain-Driven Design building blocks: aggregates, entities, value objects, domain events).

The project owner is learning and explicitly wants to **compare** these styles by building both, rather than take one on faith. Several builders (human or AI) will write modules in parallel, so the rules must also stop drift.

Some DDD is already present regardless: the PRD glossary is the shared vocabulary ("ubiquitous language"), modules are candidate bounded contexts, and the partner edge is an anti-corruption layer.

## Options considered

| Option | Pros | Cons |
| --- | --- | --- |
| **(a) Layered modular monolith, hexagonal + ACL only at partner integrations** (chosen, user's pick) | Conventional NestJS; fast to build; the one place that must be swappable (partners) gets ports | Business rules sit next to TypeORM in services; less isolation from the framework |
| (b) Hexagonal + tactical DDD in the money modules (ledger, deposits, withdrawals, exchange, FX) | Pure, framework-free domain; easier unit tests of rules | More code and concepts; the take (FR-19) spans Offer + taker + maker balances, so it needs a multi-aggregate transaction exception. **Not chosen for now** |
| Hybrid: hex for money modules, thin layered for CRUD | Effort spent where the risk is | Two styles in one codebase from day one; harder for new builders |

## Decision

- `wallet-api` is a **layered NestJS modular monolith**. Each module is `controller -> service -> repository` and owns one Postgres schema (AD-3).
- **Business rules live only in services**, never in controllers or repositories.
- **Cross-module access only through the owning module's exported service**, following the dependency diagram in the spine (see [C4 Level 3](../c4.md#level-3--components-of-wallet-api)).
- **TypeORM entities and repositories never leave their module.**
- **Hexagonal ports/adapters + anti-corruption layer only in `partners`** (`PartnerBankPort`, `CashPartnerPort`, `FxFeedPort`).
- `eslint-plugin-boundaries` **fails the build** on any violation.

These guardrails are deliberately the ones that keep a later move to hexagonal cheap: if rules are already only in services and modules only talk through services, a service can later be split into a domain core plus adapters without touching other modules.

## Consequences

**Positive**
- Familiar structure; quick start for every builder.
- Boundaries are machine-checked, not just documented.
- Partner swap at go-live is isolated to one module (AD-4).

**Negative**
- Services mix business rules with TypeORM calls, so unit-testing rules alone is harder (money logic is tested against real Postgres anyway, AD-27).
- The dependency graph must be kept current in both the spine and the lint config.

**Follow-ups and revisit triggers**
- **Planned comparison (Deferred):** at build time, one story re-implements one money flow in hexagonal + tactical DDD, on a branch or in a parallel module, against the same tests. FR-19 (take) is preferred; FR-6 (deposit confirm) is the simpler alternative. Tactical DDD is deferred into this exercise.
- Revisit trigger from the spine: *build time; settlement needs a multi-aggregate transaction exception* if (b) is adopted.
