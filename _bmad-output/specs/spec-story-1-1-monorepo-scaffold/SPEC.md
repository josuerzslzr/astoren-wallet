---
id: SPEC-story-1-1-monorepo-scaffold
companions:
  - stack.md
  - module-boundaries.md
  - ../../planning-artifacts/architecture/architecture-astoren-wallet-2026-11-08/ARCHITECTURE-SPINE.md
sources:
  - ../../planning-artifacts/epics.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Story 1.1: Monorepo scaffold and toolchain

## Why

The repo is empty. Every later astoren-wallet story assumes one way to install, build, lint and test, along with a fixed layout of apps, packages and modules. If the scaffold drifts from the architecture spine, each story pays for it again. Writing the module dependency graph into lint from day one stops boundary violations from creeping in before a later hexagonal comparison exercise needs clean edges. The open OpenAPI-from-zod question is settled here, before Story 1.2 builds the API conventions on top of it.

## Capabilities

- **CAP-1**
  - **intent:** A developer can install, build, lint and test the whole repo from a fresh clone with one command.
  - **success:** `pnpm install && pnpm turbo build lint test` exits 0 from a fresh clone on Node 26 LTS, TypeScript 6.x and ESM.
- **CAP-2**
  - **intent:** The repo layout matches the spine source tree, so later stories have a fixed place for every runnable, package, doc and infra file.
  - **success:** Every path in [stack.md](stack.md) § Source tree exists. Each of the two apps, four simulators and two packages builds and has at least one passing test.
- **CAP-3**
  - **intent:** wallet-api is one codebase with two runnables: the api and the worker.
  - **success:** `apps/wallet-api/src/main.ts` (api) and `apps/wallet-api/src/worker.ts` (worker) both build and start a NestJS application context.
- **CAP-4**
  - **intent:** wallet-api holds one empty Nest module for each AD-3 module.
  - **success:** `apps/wallet-api/src` has modules for identity, ledger, exchange, deposits, withdrawals, transfers, notifications, history, partners and platform, and the build succeeds.
- **CAP-5**
  - **intent:** The build rejects any import between wallet-api modules that the architecture's dependency graph does not allow, and any import of another module's private files.
  - **success:** eslint-plugin-boundaries encodes exactly the edges and public file roles in [module-boundaries.md](module-boundaries.md). A committed, repeatable check shows that a forbidden edge (e.g. `ledger` → `exchange`, `partners` → `deposits`) and a private-file import (e.g. `exchange` → `ledger/account.entity.ts`) each fail `pnpm lint`, and an allowed service import passes.
- **CAP-6**
  - **intent:** The team knows how wallet-api will produce OpenAPI docs from zod v4 schemas on NestJS 12.
  - **success:** A short decision note in `docs/` records whether `@nestjs/swagger` reads the Standard Schema route option or the docs are assembled via `z.toJSONSchema`. The chosen approach serves an OpenAPI document locally for one sample route.
- **CAP-7**
  - **intent:** The build keeps every simulator fully isolated from wallet code and from the other simulators.
  - **success:** A committed, repeatable check shows that an import from any app under `simulators/` into `apps/`, `packages/` or a sibling simulator (e.g. `simulators/bank-sim` → `packages/contracts`) fails `pnpm lint`.

## Constraints

- No third-party starter template. wallet-api and every NestJS stub come from the NestJS 12 starter, and web from Vite 8.
- Versions follow [stack.md](stack.md). ESM throughout.
- Validation uses zod v4 through NestJS Standard Schema only. No class-validator and no nestjs-zod (AD-22). This limits what the spike can pick.
- The worker is a second entry point inside `apps/wallet-api`, not a separate app (AD-1).
- Simulators (`bank-sim`, `cash-sim`, `fx-sim`, `mock-jwt-issuer`) live in top-level `simulators/`, outside `apps/`, and never import wallet code, workspace packages or each other. Shared formats are duplicated as specs in `docs/partner-specs/` (AD-1).
- Naming: files are `<name>.<role>.ts`, TS fields `camelCase`, types `PascalCase` (spine Consistency Conventions).

## Non-goals

- Config validation, response envelope, returnCodes, exception filter, logging, correlation id, health endpoints and graceful shutdown (Story 1.2).
- Database, TypeORM, migrations, Testcontainers harness, Docker images, Helm charts content and `deploy.sh` behaviour (Story 1.3). Infra folders are created empty or as placeholders only.
- Money types and helpers in `packages/money` beyond the package skeleton and its decimal.js dependency (Story 1.4).
- Any business logic, endpoints (other than the spike's sample route), entities or services inside the ten modules.
- Simulator and mock-jwt-issuer behaviour. Each is a stub: the NestJS starter shell with one placeholder route that returns a static dummy payload, plus one test. No partner wire format, in-memory state, HMAC or operator controls (mock-jwt-issuer gets its behaviour in Story 1.6, fx-sim in Epic 3, bank-sim and cash-sim in Epic 5).
- Web screens, design tokens and navigation (Story 1.7). Terraform content and CI pipelines (Epic 2).

## Success signal

- On a fresh clone, `pnpm install && pnpm turbo build lint test` goes green across both apps, all four simulators and both packages. Adding `import … from '../exchange/…'` inside `ledger` makes `pnpm lint` fail, and `docs/` names the chosen OpenAPI approach with a working local document.

## Assumptions

- Each app uses its starter's default test runner. Story 1.1 makes no repo-wide runner choice. *Superseded 2026-11-24 by the toolchain addendum (`spec-1-1-toolchain-standards.md`): Vitest in every workspace and `tooling/`, tests in `<workspace>/test/` as `*.test.ts(x)`.*
- CAP-3's "starts a NestJS application context" is stricter than the source AC, which only requires that the entry points exist. It was added so CAP-3 can be tested.
- Each stub app ships one trivial passing test, so `turbo test` exercises every workspace.
- Composition roots (root modules, `main.ts`, `worker.ts`) may register every module, platform included. The C4 L3 "entry points" edge applies to controllers, the gateway and worker jobs (see [module-boundaries.md](module-boundaries.md)).
