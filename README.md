# astoren-wallet

pnpm + Turborepo monorepo. Layout and versions follow the architecture spine (see `_bmad-output/`).

## Requirements

- **Node 26 LTS** (`.nvmrc`). `engines.node` is `>=26` and `.npmrc` sets `engine-strict=true`, so `pnpm install` fails on an older Node. Run `nvm use` first.
- **pnpm 10**, pinned through `packageManager`. Node 25+ no longer bundles corepack, so install it once per Node version: `npm install -g corepack && corepack enable` (or `npm install -g pnpm@10.33.0`).

## One command

```sh
pnpm install && pnpm turbo build lint test
```

The root scripts `pnpm build`, `pnpm lint` and `pnpm test` run the same Turborepo tasks.

## Layout

| Path | What |
|---|---|
| `apps/wallet-api` | NestJS 12. `src/main.ts` (api) and `src/worker.ts` (worker) share one codebase; `src/<module>/` holds the ten AD-3 modules. |
| `apps/web` | Vite 8 + React 19 + React Router 8 + TanStack Query 5 + Tailwind 4 + shadcn/ui + lucide-react. |
| `simulators/*` | `bank-sim`, `cash-sim`, `fx-sim`, `mock-jwt-issuer`. Isolated NestJS stubs: they import nothing outside their own folder. |
| `packages/contracts` | `@astoren/contracts`: zod v4 schemas. |
| `packages/money` | `@astoren/money`: decimal.js based money helpers. |
| `docs/` | Decision notes (`openapi-from-zod.md`) and `partner-specs/`. |
| `infra/` | Terraform, Helm and deploy scripts (placeholders for now). |
| `tooling/` | Root checks: `boundaries/` (lint boundary fixtures) and `toolchain/` (Node 26 pin). |

## Module boundaries

`eslint.config.js` (root, shared by every workspace) encodes the wallet-api module graph and simulator isolation with eslint-plugin-boundaries. Cross-module imports may only target `*.service.ts`, `*.module.ts` and `*.types.ts`. `tooling/boundaries/boundaries.test.ts` lints committed probe files and asserts which imports are rejected. It runs as part of `pnpm turbo test` (`pnpm test:tooling` on its own).

## Default ports

| Runnable | Port |
|---|---|
| wallet-api (api) | 3000 |
| bank-sim | 3101 |
| cash-sim | 3102 |
| fx-sim | 3103 |
| mock-jwt-issuer | 3104 |

Override any of them with `PORT`.

## Running locally

```sh
pnpm --filter wallet-api start           # api on :3000, OpenAPI JSON at /docs-json
node apps/wallet-api/dist/worker.js      # worker application context (runs until SIGTERM)
pnpm --filter web dev
```
