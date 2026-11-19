# Epic 1 Context: Wallet foundation: sign up, sign in, see my balances

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A person can create a wallet (email, password, display name, email verification), sign in, and see USD and EUR balance cards split into available, held and pending under a "test money" banner, edit their display name, and seeded test users start with balances. Behind it, this epic lays every foundation later epics stand on: the pnpm + Turborepo monorepo, shared `contracts` and `money` packages, wallet-api's platform conventions, the ledger, identity with a local mock JWT issuer, lint-enforced module boundaries, the Testcontainers harness, the worker skeleton with reconciliation, the web shell and design system, and a single deploy script onto local minikube with Helm.

## Stories

- Story 1.1: Monorepo scaffold and toolchain
- Story 1.2: API conventions: config, envelope, errors, logging and health
- Story 1.3: Database, migrations and local cluster deploy
- Story 1.4: Money basics in `packages/money`
- Story 1.5: Ledger core: accounts, journals and balance projection
- Story 1.6: Sign-in tokens, the JWT guard and user provisioning
- Story 1.7: Web app shell and design system
- Story 1.8: Sign up, verify email, sign in and sign out
- Story 1.9: See my balances on Home
- Story 1.10: Account and profile
- Story 1.11: Seeded test users and the reconciliation job

## Requirements & Constraints

- Money is exact and double-entry; the books always balance; rounding favours the house. Amounts never use JS `number` arithmetic.
- Every money move and partner confirmation is idempotent (keys enforced later, but conventions start here).
- Single responsive web app usable at phone width; the "Test money — no real value" banner is always visible.
- Reconciliation proves zero ledger imbalance and logs one structured result line.
- Seeded money enters only through ledger journals of type `seed` against opening equity; seed data is local/dev only.

## Technical Decisions

- **Stack:** Node 26 LTS, TypeScript 6.x, ESM, pnpm workspaces + Turborepo 2.11.x, NestJS 12, zod 4, decimal.js 10, eslint-plugin-boundaries 5, Vite 8 + React 19.3 + React Router 8 + TanStack Query 5 + Tailwind + shadcn/ui + lucide-react, TypeORM ≥ 1.1.3, PostgreSQL 18, Kubernetes 1.36 (minikube), Helm 4. No third-party starter templates.
- **Layout:** `apps/{wallet-api, web}`, `simulators/{bank-sim, cash-sim, fx-sim, mock-jwt-issuer}`, `packages/{contracts, money}`, `docs/partner-specs/`, `infra/{terraform/{persistent,session}, helm, scripts}`.
- **System shape:** wallet-api is one NestJS codebase with two runnables, `main.ts` (api, N instances) and `worker.ts` (singleton, `replicas: 1`, `Recreate`). Simulators are separate NestJS apps with in-memory state that never import wallet code, workspace packages or each other; shared wire formats are duplicated as specs.
- **Modules (layered controller → service → repository, one Postgres schema each):** identity, ledger, exchange, deposits, withdrawals, transfers, notifications, history, partners, platform. Business rules live only in services; cross-module calls go only through exported services along the allowed graph: ledger/history/partners → platform; identity → ledger; exchange → partners, ledger, identity, history; deposits/withdrawals → partners, ledger, history; transfers → ledger, identity, history; notifications → exchange; everything → platform. Entities and repositories never leave their module. eslint-plugin-boundaries fails the build on violations. Hexagonal ports/adapters only inside `partners`.
- **Contracts and validation:** `packages/contracts` holds zod v4 schemas for every request/response, the envelope, error bodies, returnCodes and WS events. Validation uses NestJS built-in Standard Schema — no class-validator, no nestjs-zod. OpenAPI docs are generated from the zod schemas (wiring decided by a spike in the first story).
- **Envelope:** `{returnCode: 0, body}` / `{returnCode: <3-digit>, errorMessage, body?}`; HTTP status independent of returnCode; ranges 1xx platform, 2xx identity, 3xx ledger … 9xx notifications/history, defined only in contracts. One exception filter; typed domain errors.
- **Cross-cutting:** zod-validated env config at boot (fail fast); W3C traceparent-compatible correlation id everywhere; structured JSON logs (`level`, `msg`, `correlationId`, `module`) to stdout, never logging tokens or secrets; `/healthz`, `/readyz`; graceful SIGTERM within 30 s.
- **Ledger:** three tiers per money move in one tx (business record, one journal per `(type, business_ref)` with lines summing to zero per currency, balance projection). Closed `JournalType` enum (starts with `seed`). One `account` row per `(owner_type, owner_id, currency, bucket)`; user buckets available/held/pending with `balance >= 0`. `lockAccounts(tx, ids)` locks in id order; `post()` refuses unlocked accounts. Currencies as data (USD, EUR, exponent 2). Amounts are `bigint` minor units / JSON `{amountMinor, currency}`; rates `numeric(18,8)` / decimal.js.
- **Data:** TypeORM `synchronize: false`; CLI-generated, reviewed migrations run by a Kubernetes Job, never at app startup. Reference data in migrations; test users in an idempotent seed Job. DB naming `snake_case`, UUID PKs, `timestamptz`, `version bigint` on every mutable row. Reconciliation runs `REPEATABLE READ READ ONLY`.
- **Auth:** one JWT guard (JWKS signature, `iss`, `token_use=access`, `client_id`) in every environment, no bypass. Locally a mock issuer emits Cognito-shaped access tokens. `POST /me` provisions the user with `ON CONFLICT (cognito_sub) DO NOTHING` and creates ledger accounts in the same tx only when the insert won. Only identity reads `sub`.
- **Testing:** anything touching ledger, locks, idempotency or outbox runs against real PostgreSQL via Testcontainers, never a mocked DB.
- **Naming:** files `<name>.<role>.ts`; TS fields `camelCase`, types `PascalCase`; JSON `camelCase`.

## UX & Interaction Patterns

- Phone-first shell: bottom tab bar (Home · Exchange · Activity · Account) under 1024 px, left sidebar at ≥ 1024 px, content centred at 560 px between 768 and 1023 px; 44 px minimum touch targets.
- Colour, radius and spacing tokens as shadcn/Tailwind CSS variables for light and dark; Inter and JetBrains Mono; tabular numerals for amounts. Theme stored device-locally with a safe default.
- Amounts formatted only through `packages/money` helpers, read with currency by screen readers, never coloured green/red. Error copy comes only from one returnCode → copy table in `apps/web`.
- TanStack Query for server state; money never updates optimistically.

## Cross-Story Dependencies

- 1.1 fixes the layout, toolchain, module boundaries and OpenAPI approach that every later story uses. 1.2 builds API conventions on the spike's choice.
- 1.3 (DB, migrations, Testcontainers, deploy script) precedes 1.5, 1.6 and 1.11. 1.4 precedes 1.5 and 1.9.
- 1.5 (ledger) precedes 1.6 (provisioning creates accounts) and 1.11 (seed journals, reconciliation).
- 1.6 behaviour lives in `simulators/mock-jwt-issuer`, stubbed in 1.1. 1.7 precedes 1.8–1.10.
- Epic 2 reuses the deploy script and charts for AWS dev. fx-sim gets behaviour in Epic 3, bank-sim and cash-sim in Epic 5.
