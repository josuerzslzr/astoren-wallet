# Stack and source tree (Story 1.1 scope)

## Versions

Pinned from the spine Stack table. "Latest at scaffold" means: resolve once, then lock.

| Tool | Version |
|---|---|
| Node.js | 26 LTS |
| TypeScript | 6.x (NestJS 12 default) |
| Module system | ESM |
| pnpm workspaces + Turborepo | Turborepo 2.11.x |
| NestJS (wallet-api, bank-sim, cash-sim, fx-sim, mock-jwt-issuer) | 12.x |
| eslint-plugin-boundaries | 5.x |
| zod (`packages/contracts`) | 4.x |
| decimal.js (`packages/money`) | 10.x |
| Vite (web) | 8.x |
| React | 19.3 |
| React Router | 8.x |
| TanStack Query | 5.x |
| shadcn/ui + Tailwind CSS + lucide-react | latest at scaffold |

## Source tree

`pnpm-workspace.yaml` globs: `apps/*`, `simulators/*`, `packages/*`.

```text
astoren-wallet/
  apps/
    wallet-api/        # NestJS 12; src/main.ts (api), src/worker.ts (worker); src/<module>/ x10 per AD-3
    web/               # Vite 8 + React 19.3 + React Router 8 + TanStack Query 5 + Tailwind + shadcn/ui + lucide-react
  simulators/          # isolated: import nothing outside their own app (CAP-7)
    bank-sim/          # NestJS 12 stub
    cash-sim/          # NestJS 12 stub
    fx-sim/            # NestJS 12 stub
    mock-jwt-issuer/   # NestJS 12 stub (local JWT issuer, behaviour in Story 1.6)
  packages/
    contracts/         # zod v4
    money/             # decimal.js
  docs/
    partner-specs/     # bank.md, cash.md, fx.md land in later epics
    <openapi decision note>   # CAP-6
  infra/
    terraform/
      persistent/
      session/
    helm/
    scripts/           # deploy.sh lands in Story 1.3
```
