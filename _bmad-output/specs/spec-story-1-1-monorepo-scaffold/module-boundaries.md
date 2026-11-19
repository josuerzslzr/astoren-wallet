# Module boundaries (wallet-api)

The allowed compile-time dependencies between wallet-api modules, copied from the C4 Level 3 diagram (`../../planning-artifacts/architecture/architecture-astoren-wallet-2026-11-08/companions/c4.md`). `A → B` means A may import and call B's exported service. Any edge not listed here is forbidden, and eslint-plugin-boundaries must fail `pnpm lint` on it (AD-2).

| Module | May depend on |
|---|---|
| platform | — (nothing) |
| ledger | platform |
| history | platform |
| partners | platform |
| identity | ledger, platform |
| exchange | partners, ledger, identity, history, platform |
| deposits | partners, ledger, history, platform |
| withdrawals | partners, ledger, history, platform |
| transfers | ledger, identity, history, platform |
| notifications | exchange, platform |
| Entry points (REST controllers, WS gateway, worker jobs) | identity, exchange, deposits, withdrawals, transfers, notifications, history, ledger, partners |

## Public surface per module (file roles)

Even across an allowed edge, another module may import only these file roles:

| Role | Visibility | Why |
|---|---|---|
| `*.service.ts` | public | The only way to call another module (AD-2) |
| `*.module.ts` | public | Needed so NestJS can import the module for DI |
| `*.types.ts` | public | Types a service takes or returns (never entities) |
| `*.entity.ts`, `*.repository.ts`, `*.controller.ts`, any other role | private to its module | Stops other modules from writing another module's tables and skipping its rules (AD-3: only `LedgerService` writes ledger tables) |

Files inside a module may import each other freely. This is a trial: if a needed role doesn't fit, change this table rather than working around the rule.

## Notes that bear on the lint config

- `partners` never imports `deposits` or `withdrawals`. They register with its `PartnerEventHandler` instead, which avoids a cycle.
- No money flow imports `notifications`. It reacts to outbox events through `platform`.
- Composition roots (root modules, `main.ts`, `worker.ts`) are assumed exempt so they can register every module (see SPEC Assumptions).

Required fixture cases (CAP-5):

- `ledger → exchange` fails (forbidden edge)
- `partners → deposits` fails (forbidden edge)
- `exchange → ledger/account.entity.ts` fails (private file over an allowed edge)
- `exchange → ledger/ledger.service.ts` passes (public file over an allowed edge)
