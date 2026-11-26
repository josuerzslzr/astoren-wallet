<!-- bmad:context -->
<!-- Verified 2026-11-24 against 5641468. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## astoren-wallet

Practice multi-currency wallet: NestJS 12 `apps/wallet-api` (api + worker), React `apps/web`, four isolated NestJS partner simulators, shared `packages/contracts` (zod) and `packages/money`. pnpm + Turborepo, ESM throughout. Architecture decisions (AD-n) live in `_bmad-output/planning-artifacts/architecture/architecture-astoren-wallet-2026-11-08/ARCHITECTURE-SPINE.md`, ADRs in its `companions/adr/`. PRD, UX and `epics.md` are in `_bmad-output/planning-artifacts/`; story specs in `_bmad-output/implementation-artifacts/` and `_bmad-output/specs/`.

## Policy

- Never edit `.py` or `.md` files under `_bmad/` or `.claude/skills/bmad-*/`; they are installer-managed. BMad overrides go in `_bmad/custom/config.toml`, only when asked.
- Branch per story as `dev/<epic>-<story>-<slug>` off `main`. Commits are conventional commits with the story in the subject: `feat: … (story 1.2)`.
- Never log tokens, HMAC secrets, payout details or withdrawal codes (AD-24).
- Infrastructure config comes only from env vars / mounted K8s Secrets, zod-validated at boot; no hardcoded config or console-only setup (AD-25).
- No auth bypass flag in any environment, local included; tokens are always verified against JWKS (AD-20).
- The repo is public. Never commit Terraform state or `*.tfvars` (only `*.tfvars.example`), kubeconfigs, AWS account IDs or ARNs, or signing keys; the mock JWT issuer generates its keys at runtime.
- GitHub Actions: trigger on `pull_request`, never `pull_request_target`; set top-level `permissions: contents: read` and widen per job only as needed; reach AWS through GitHub OIDC, never long-lived access keys.

## Running and verifying

- Shells default to Node 24 and `engine-strict` refuses it: prefix pnpm/turbo/node commands with `source ~/.nvm/nvm.sh && nvm use &&` in the same command.
- In `apps/web`, `lint` does not type-check; run `pnpm --filter web build` (`tsc -b`) to catch type errors.
- In Nest workspaces, `test` deliberately runs `*.e2e.test.ts` too, so e2e runs under `turbo test` (story 1.1 review fix). Do not exclude them from the unit config; `test:e2e` runs e2e alone.

## Conventions that differ from defaults

- Relative imports end in `.js` in Nest apps and simulators, `.ts` in `packages/*`, `.ts`/`.tsx` in `apps/web`.
- ESM: `__dirname` does not exist; use `import.meta.dirname`.
- NestJS is 12.x, newer than you know: check the chapter pages indexed at https://docs.nestjs.com/llms.txt before using a Nest API from memory.
- The HTTP adapter is the implicit Express default until an AD decides; do not switch adapters in a story, and keep controllers off `@Req()`/`@Res()` platform objects.
- Validate inbound payloads with zod schemas from `@astoren/contracts` through the global `StandardSchemaValidationPipe`; never `class-validator` DTOs or nestjs-zod. Schemas, returnCodes and event payloads live only in `packages/contracts` (AD-22).
- Built in-house, so do not add a package for: idempotency (AD-16), outbox and cross-module events (AD-33, AD-17), partner webhooks and HMAC (AD-4), locking (AD-13/14), rate limits (DB-counted in the transaction), background jobs (singleton `wallet-worker`, no Redis or bullmq, AD-19). Otherwise prefer a Nest first-party package (`@nestjs/typeorm` per AD-23) over a third-party library.
- Money: amounts are `bigint` minor units and rates are `decimal.js`; never JS `number` arithmetic on money; only `convert()` in `@astoren/money` rounds (AD-7, AD-8).
- Money: ledger tables are written only through `LedgerService`, one journal per operation, lines per currency summing to zero (AD-5).
- Money: money and status writes go only through `CommandExecutor`, never a hand-opened transaction; accounts are locked in one `LedgerService.lockAccounts(tx, ids)` call in AD-14 order (AD-12, AD-14).
- Money: state changes are guarded `UPDATE … WHERE state IN (…) RETURNING`; never TypeORM `save()` on money or state rows (AD-13).

<!-- /bmad:context -->

## Tests

- Vitest in every workspace and `tooling/`: mocks are `vi.fn()` / `vi.mock()`, never `jest.*`.
- Tests live in `<workspace>/test/` as `*.test.ts(x)`, never `*.spec.ts` or next to the source. `tooling/tests-layout` fails `turbo test` on any test file the workspace's `test` script (its vitest `include`) does not select. Nest CLI spec generation is off.
- wallet-api tests may import any file of any module, entry points and private roles included; they still cannot import simulators or web (module-boundaries.md).
