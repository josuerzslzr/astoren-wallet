---
title: 'Story 1.1: Monorepo scaffold and toolchain'
type: 'chore'
created: '2026-11-19'
status: 'done'
baseline_commit: '7416089048aff1adb3e2402b560c05a995664780'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/specs/spec-story-1-1-monorepo-scaffold/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-1-monorepo-scaffold/stack.md'
  - '{project-root}/_bmad-output/specs/spec-story-1-1-monorepo-scaffold/module-boundaries.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The repo has no code. Every later story needs one install/build/lint/test path, a fixed layout matching the architecture spine, module boundaries enforced from day one, and a settled way to produce OpenAPI from zod.

**Approach:** Scaffold a pnpm + Turborepo monorepo from the NestJS 12 and Vite 8 starters (no third-party templates). Add ten empty wallet-api modules, api and worker entry points, four simulator stubs and two package skeletons. Encode the C4 L3 dependency graph and simulator isolation in eslint-plugin-boundaries, prove both with a committed fixture check, and run the OpenAPI spike on one sample route. Full contract: SPEC.md, stack.md and module-boundaries.md (listed in `context`).

## Boundaries & Constraints

**Always:** Versions from stack.md, resolved and locked: Node 26 LTS (`.nvmrc` = 26, `engines`), TypeScript 6.0.x (7.x is out, but the NestJS CLI and typescript-eslint need `<6.1`), Turborepo 2.11.x, eslint-plugin-boundaries 5.x (latest is 7.x; the spine pins 5). ESM everywhere. Workspace packages are scoped `@astoren/*` (e.g. `@astoren/contracts`, `@astoren/money`) — human decision. Validation only through the NestJS Standard Schema `schema` route option. Files are named `<name>.<role>.ts`. Every workspace has `build`, `lint` and `test` scripts and at least one passing test. Composition roots (`app.module.ts`, `worker.module.ts`, `main.ts`, `worker.ts`) may import any module's `*.module.ts`.

**Never:** class-validator, class-transformer, nestjs-zod. A separate worker app. Simulators importing anything outside their own folder (workspace packages included). Anything listed under SPEC.md Non-goals (config validation, envelope, DB, Docker, Helm content, money helpers, simulator behaviour, web screens and tokens, CI).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Fresh clone | `pnpm install && pnpm turbo build lint test` on Node 26 | exits 0 across 2 apps, 4 simulators, 2 packages | N/A |
| Forbidden edge | `ledger` imports `exchange/exchange.service.ts`; `partners` imports `deposits/deposits.service.ts` | boundaries error | lint fails |
| Private file over allowed edge | `exchange` imports `ledger/account.entity.ts` | boundaries error | lint fails |
| Public file over allowed edge | `exchange` imports `ledger/ledger.service.ts` | no error | N/A |
| Simulator escape | `bank-sim` imports `@astoren/contracts`, a relative path into `packages/` or `apps/`, or `../fx-sim/...` | boundaries error | lint fails |
| Wrong Node | Node < 26 | `engines` warns or fails at install | documented in README |

</frozen-after-approval>

## Code Map

- `_bmad-output/specs/spec-story-1-1-monorepo-scaffold/` -- canonical contract (CAPs, tree, boundary table and fixture cases). Do not edit.
- `_bmad-output/implementation-artifacts/epic-1-context.md` -- epic constraints.
- Repo root today: only `_bmad/`, `_bmad-output/`, `.claude/`, `.gitignore`. No code to reuse or keep.
- `@nestjs/common` 12.5: `@Body({ schema })`, `@Query({ schema })` and `StandardSchemaValidationPipe` take a StandardSchemaV1, so zod v4 fits directly.
- `@nestjs/swagger` 12.1: depends on `@standard-schema/spec`, accepts `StandardJSONSchemaV1` objects and has a `standardSchemaConverter` document option. This is the main candidate for the spike; `z.toJSONSchema` is the fallback.
- eslint-plugin-boundaries 5.4.0 uses `context.filename` (ESLint 9/10 flat config OK). Rules used: `element-types` (graph), `entry-point` (public file roles), `external` / `no-unknown` (simulator isolation).

## Tasks & Acceptance

**Execution:**
- [x] root: `package.json` (`packageManager` pnpm 10.x, `engines.node >=26`, scripts `build|lint|test` → turbo), `pnpm-workspace.yaml` (`apps/*`, `simulators/*`, `packages/*`), `turbo.json` (build → `^build`; lint and test depend on `^build`), `tsconfig.base.json`, `.nvmrc`, `.gitignore` additions (`node_modules`, `dist`, `.turbo`), short `README.md` -- one-command toolchain (CAP-1)
- [x] `eslint.config.js` (root, flat, typescript-eslint + boundaries) -- single config shared by every workspace. Elements: the 10 wallet-api modules, `wallet-root` (composition roots), each simulator, each package, web. Rules per module-boundaries.md and simulator isolation (CAP-5, CAP-7)
- [x] `packages/contracts`, `packages/money` -- tsc ESM build, zod 4 / decimal.js deps, one trivial export and test each (CAP-2)
- [x] `apps/wallet-api` -- from `nest new` (NestJS 12, ESM). `src/<module>/<module>.module.ts` ×10, `app.module.ts` + `main.ts` (api), `worker.module.ts` + `worker.ts` (`createApplicationContext`). Tests boot both contexts and close them (CAP-3, CAP-4)
- [x] `apps/wallet-api` spike -- one sample route (e.g. `POST /spike/echo` in `platform`) whose zod schema lives in `packages/contracts`, an OpenAPI document served locally (e.g. `/docs-json`), and a test asserting the schema appears in the document (CAP-6)
- [x] `docs/openapi-from-zod.md` -- decision note: what was tried, what works, the chosen approach and the follow-ups for Story 1.2 (CAP-6)
- [x] `simulators/{bank-sim,cash-sim,fx-sim,mock-jwt-issuer}` -- `nest new` stubs, one `GET /` placeholder returning static JSON, one test each (CAP-2)
- [x] `apps/web` -- `create-vite` react-ts on Vite 8 with React 19.3, React Router 8, TanStack Query 5, Tailwind 4 + `shadcn init` + lucide-react, a single placeholder route, a Vitest smoke test (CAP-2)
- [x] placeholders: `docs/partner-specs/.gitkeep`, `infra/terraform/{persistent,session}/.gitkeep`, `infra/helm/.gitkeep`, `infra/scripts/.gitkeep` (CAP-2)
- [x] `tooling/boundaries/` -- committed fixture files (see Design Notes) and `boundaries.test.ts` (`node --test`) asserting the matrix rows, wired as a turbo root task so `pnpm turbo test` runs it (CAP-5, CAP-7)

**Acceptance Criteria:**
- Given a fresh clone on Node 26, when `pnpm install && pnpm turbo build lint test` runs, then it exits 0 and every path in stack.md § Source tree exists.
- Given `apps/wallet-api`, when the build and tests run, then the api app and the worker application context both start and close cleanly, and all 10 modules are registered.
- Given the spike route, when wallet-api runs locally, then the OpenAPI JSON contains the sample route with the zod-derived request schema, and `docs/openapi-from-zod.md` names the approach.
- Given a temporary `import` of `../exchange/exchange.service.js` inside `src/ledger/ledger.module.ts`, when `pnpm lint` runs, then it fails.

### Review Findings

Code review 2026-11-24 of the commits neither earlier review covered: `8266aa2..109e292` (`5641468` test relocation, `109e292` agent context + tests-layout guard). Checked against HEAD (`1e63861`).

- [x] [Review][Decision] Module-private files cannot be unit-tested — the `test/` layout guard forbids tests inside `src/<module>/`, and `wallet-test` (`eslint.config.js:87-88`) may reach only the `*.service|module|types.ts` roles, so no test can import a controller, entity, repository or job (acceptance-auditor). Resolved 2026-11-26 (user): open everything to tests. Option chosen over mirroring modules under `test/<module>/`.
- [x] [Review][Decision] The tests-layout guard checks where files sit, not whether a runner selects them — a narrowed include (e.g. one that drops `*.e2e.test.ts`) passes silently (verification-gap). `.mts`/`.js` tests and a `test/*.test.tsx` in a Nest workspace also slip through (blind-hunter, edge-case-hunter). Resolved 2026-11-26 (user): one runner-selection rule replaces both layout checks.
- [x] [Review][Patch] Let wallet-api tests import any wallet-api file — add an ESLint block for `apps/wallet-api/test/**` that allows `wallet-entry` in element-types, and every file of `wallet-module` / `wallet-entry` in entry-point. Add one boundaries fixture probe (a test importing another module's entity passes) and one line in module-boundaries.md ("tests in `apps/wallet-api/test/` are exempt from module edges and file roles") [eslint.config.js:86, tooling/boundaries/boundaries.test.ts]
- [x] [Review][Patch] Replace the two layout checks with one runner-selection rule — every workspace file matching `\.(test|spec)\.[cm]?[jt]sx?$` must be selected by the `test.include` of the vitest config its workspace's `test` script runs (the one `turbo test` uses; a first draft that merged every `vitest.config*.ts` missed a unit include narrowed to drop e2e). Configs without an explicit `include`, and `test` scripts other than `vitest run`, fail. `//#test:tooling` inputs gain `**/vitest.config*.ts` and `**/package.json` [tooling/tests-layout/tests-layout.test.ts, turbo.json:40]
- [x] [Review][Patch] Nest CLI still generates `*.spec.ts`, which the guard rejects — set `"generateOptions": { "spec": false }` [apps/wallet-api/nest-cli.json:1 and the four simulators]
- [x] [Review][Patch] Guard reports moved-but-unstaged files — `git ls-files --cached` still lists a path deleted from the working tree. Drop paths that no longer exist on disk [tooling/tests-layout/tests-layout.test.ts:12]
- [x] [Review][Patch] Guard reads `git ls-files` without `-z` — `core.quotePath` C-quotes non-ASCII paths, so the workspace regex skips them [tooling/tests-layout/tests-layout.test.ts:14]
- [x] [Review][Patch] Guard passes vacuously if the workspace regex stops matching — the guard now asserts at least one workspace and at least one selected test per workspace (verification-gap) [tooling/tests-layout/tests-layout.test.ts]
- [x] [Review][Patch] `//#test:tooling` cache inputs omit `.gitignore`, which `--exclude-standard` reads — an ignore-rule change can replay a stale pass [turbo.json:40]
- [x] [Review][Patch] Package `tsconfig.json` now has `rootDir: "."` and `outDir: "dist"` without `noEmit` — a manual `tsc -p tsconfig.json` writes `dist/src/**` and `dist/test/**` beside the `./dist/index.js` export. Set `noEmit: true` there and `noEmit: false` in `tsconfig.build.json` [packages/contracts/tsconfig.json:4, packages/money/tsconfig.json:4]
- [x] [Review][Patch] README repeats the pnpm version (`pnpm@10.33.0`), which will drift from `packageManager` [README.md:8]
- [x] [Review][Closed] Starter AGENTS.md rules dropped without carry-over [CLAUDE.md] — resolved 2026-11-26: `vi.fn()` rule added to CLAUDE.md `## Tests`; first-party packages left unrestricted for now (user: revisit per story). Originally: `vi.fn()` not `jest.fn()` and the first-party package list (e.g. whether `@nestjs/schedule`, `@nestjs/event-emitter`, `@nestjs/config` conflict with AD-19/AD-17/AD-25) are absent. The deferred-work status for this item says "surviving rules moved… No action left".
- [x] [Review][Closed] CLAUDE.md does not state the test layout rule (`<workspace>/test/*.test.ts(x)`, no `*.spec.ts`), which goes against the Nest default agents write by habit [CLAUDE.md] — resolved 2026-11-26: CLAUDE.md `## Tests`, outside the bmad-project-context block so a refresh keeps it
- [x] [Review][Closed] No `AGENTS.md` entry point for non-Claude agents after the five were deleted [CLAUDE.md] — dropped 2026-11-26: Claude only (user)

Applied 2026-11-26. Verified with `pnpm turbo build lint test --force`: 27/27 tasks, exit 0. Probes, each removed afterwards: `src/x.spec.ts`, `test/x.test.mts`, `test/x.test.tsx` in fx-sim, a wallet-api unit include narrowed to drop e2e, a removed `include`, a non-vitest `test` script, and a workspace's only test moved away unstaged. Each failed tests-layout with a named file or message. A real wallet-api test importing `SpikeController` passes lint. `nest g service --dry-run` writes no spec. `.gitignore`, `vitest.config.ts` and `*.spec.mts` changes each change the `//#test:tooling` hash. Also fixed: `typed-lint.test.ts` timed out at Vitest's 5 s default in the full parallel run, failing even with the old guard; it now has a 30 s timeout.

**Rejected**

- `false` Guard crashes outside a git checkout — the failure is loud. Tooling tests run only from a git clone through turbo, and no Docker image runs them.
- `false` Nest `tsconfig.build.json` dropped `**/*spec.ts` and the package builds dropped `src/**/*.test.ts` excludes, so stray tests could ship — the guard fails `turbo test` on any test under `src/` or named `*.spec.ts` before it reaches a build.
- `false` `apps/web/tsconfig.app.json` including `test` makes test type errors fail the build — intended; review triage #7 asked for tests to be type-checked.
- `false` `tooling/tsconfig.json` is not wired to any task — true at `109e292`, fixed at HEAD by `56c8bb3` (`//#lint:tooling`).
- `false` README does not mention `tests-layout/` — fixed at HEAD (README `tooling/` row).
- `low` `//#test:tooling` inputs too broad (any test edit reruns the slow ESLint tooling tests) — the fix is a separate turbo task, not a direct correction, and the cost is a few seconds.
- `low` Unanchored `*personal-notes*` in `.gitignore` is out of story scope — harmless; no tracked path matches.
- `low` Implementation Notes still cite `src/openapi.setup.spec.ts` and `test/app.e2e-spec.ts`; the Spec Change Log has no entry for the test layout — the fix edits this spec.
- `low` Starter AGENTS.md files deleted rather than trimmed to their NestJS section — justified by the triage #12 resolution in deferred-work.md.
- `low` Spec-name regex flags any `*-spec.ts` source file — no longer applies: the runner-selection rule (D2) replaces that regex.

## Implementation Notes

**Environment:** Node 26.13.1 is installed through nvm, but the default shell resolves Node 24. Prefix commands with `export PATH=$HOME/.nvm/versions/node/v26.13.1/bin:$PATH`. pnpm 10.33.0 is on that PATH. Nothing has been installed yet (`pnpm install` has not run).

**Done so far (partial, uncommitted, not yet built):**
- Root: `package.json` (pnpm 10.33.0, engines node >=26, turbo scripts, `test:boundaries`; devDeps eslint 10, typescript-eslint 8.73, eslint-plugin-boundaries 5.4.0, eslint-import-resolver-typescript 4.4, globals, @eslint/js, typescript ~6.0.3, turbo 2.11.13), `pnpm-workspace.yaml`, `.npmrc` (`engine-strict`), `.nvmrc`, `turbo.json` (test depends on `//#test:boundaries`), `tsconfig.base.json`, `.gitignore` additions. `eslint.config.js`, `README.md` and `tooling/boundaries/` are NOT written yet.
- `packages/contracts` (zod schema `spikeEchoRequestSchema`, with `.meta({ id })`, plus a `node --test` test) and `packages/money` (re-exports `Decimal`, plus a test). They use `tsconfig.build.json` to exclude tests and `rewriteRelativeImportExtensions`, so tests import `.ts`.
- `apps/wallet-api` and `simulators/{bank-sim,cash-sim,fx-sim,mock-jwt-issuer}` were generated raw by `nest new` (CLI 12.0.13) and are unmodified. `apps/web` was generated raw by `create-vite` 9.3.4 (react-ts) and is unmodified.

**Starter facts and decisions:**
- The NestJS 12 starter uses **Vitest** (keep it; it is the starter default) and **oxlint** for lint. Replace oxlint with `eslint .` (root flat config) in every Nest workspace and in web, since boundaries needs ESLint. Delete `.oxlintrc.json` and the oxlint devDeps.
- The Nest starter's `@types/node` is ^24. Bump it to ^26. Drop the `deploy` script and the `@nestjs/mau` devDep.
- The Nest starter writes an `AGENTS.md` per app that includes a NestJS Observe/MCP advertisement section. Keep only its "NestJS" section.
- The Vite template pins `typescript ~7.0.2`. Pin `~6.0.3` instead (typescript-eslint needs <6.1). Web has no tests, so add a Vitest smoke test.
- Package names: rename the Nest/Vite `name` fields to plain workspace names (`wallet-api`, `web`, `bank-sim`, …). Only shared packages use `@astoren/*`.
- Each Nest starter ships `src/app.controller*` + `app.service.ts` + `test/app.e2e-spec.ts`. For simulators, keep the controller as the placeholder `GET /` returning static JSON. For wallet-api, drop the sample controller and service and put the spike route under `src/platform/`.

**Implementation outcome (Story 1.1 dev pass):**
- ESLint version: **ESLint 10.15** with typescript-eslint 8.73 and eslint-plugin-boundaries 5.4.0. The fixture check passes on it, so no downgrade to 9 was needed. Workspaces run `eslint .`; ESLint 10 looks up the root `eslint.config.js` from each file. The config sets `boundaries/root-path` to the repo root so element patterns match the same way from every workspace and from the fixtures.
- Boundaries encoding: element types `wallet-root` (src/*.ts), `wallet-entry` (`*.controller|gateway|job.ts`, captured by module), `wallet-module` (folder per module), `wallet-test`, `simulator`, `package`, `web`. `element-types` is generated from a `MODULE_DEPENDENCIES` table (default disallow). `entry-point` allows only `*.service|module|types.ts` across modules. Simulators get `external` rules banning `@astoren/*` and the other workspace names, and `no-unknown` is on.
- Suffix matching worked; the try/finally fallback was not needed. `tooling/boundaries/boundaries.test.ts` checks 14 cases (the 4 required ones, 5 more graph and entry-point cases, and 5 simulator cases). It runs as root task `//#test:boundaries`, which every workspace `test` depends on.
- OpenAPI spike: `@nestjs/swagger` 12.1 reads `@Body({ schema })` directly through zod's `~standard.jsonSchema`. Chosen; see `docs/openapi-from-zod.md`. `StandardSchemaValidationPipe` is registered as `APP_PIPE` in `AppModule`. The spike test lives at `src/openapi.setup.spec.ts` (composition root), because a spec in `platform/` importing `app.module` breaks the boundaries.
- `WALLET_MODULES` is exported from `app.module.ts` and reused by `worker.module.ts`.
- Web: `shadcn init -t vite -b radix -p nova`. TS 6 deprecates `baseUrl`, so the `@/*` alias uses `paths` only. `react-refresh/only-export-components` is a warning, the same as the starter's oxlint severity, because shadcn's `button.tsx` exports variants. Vitest 4 is used in web as well, to match the Nest workspaces.
- `pnpm-workspace.yaml` ignores the `@scarf/scarf` build script (swagger-ui-dist telemetry).

**Verification pass (orchestrator):**
- Matrix audit found that the "Wrong Node" row had only manual coverage. I added `tooling/toolchain/toolchain.test.ts` (engines `>=26`, `engine-strict`, `.nvmrc`, runtime ≥ 26). The root task is renamed `//#test:boundaries` → `//#test:tooling` (script `test:tooling`, globbing `tooling/**/*.test.ts`), and the README is updated. 18/18 tooling tests pass.
- `pnpm turbo build lint test --force` gives 25/25 tasks (1 web lint warning, no errors). A temporary `ledger → exchange.module` import fails `pnpm lint` with `boundaries/element-types`, and the file was restored afterwards.
- web depends on `cn` (shadcn's own `shadcn-ui/cn`, the clsx + tailwind-merge replacement emitted by `shadcn init`). Verified legitimate.

## Spec Change Log

- **2026-11-24 — Addendum: toolchain standards** (`spec-1-1-toolchain-standards.md`). Within this story's goal ("every later story builds, lints and tests the same way from day one"): Vitest replaces `node --test` in `packages/*` and `tooling/`; one root Prettier config (`.prettierrc`, `*.md` excluded) replaces the five per-app copies and is checked by `//#format:check` under `turbo lint`; lint becomes type-aware (`recommendedTypeChecked` + `projectService`); `tooling/` is type-checked and linted by `//#lint:tooling`; husky + lint-staged run on pre-commit. The "`node --test`" mentions above (Tasks, Verification) are superseded by `pnpm test:tooling`.

## Review Triage Log

| # | Source | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | verification-gap + blind | e2e specs (`test/*.e2e-spec.ts`) never run in `turbo test`; the default-`count` path through the route and the simulators' `AppModule` HTTP wiring are unverified | medium | `vitest.config.ts` includes only `**/*.spec.ts`; `vitest list` in bank-sim collects only the unit spec; turbo has no e2e task | patch |
| 2 | verification-gap | `main.ts` call to `setupOpenApi` not exercised by any test | low | true, but the fix needs a `createApp()` refactor and the regression is unlikely before Story 1.2 reworks bootstrap | reject |
| 3 | verification-gap | toolchain test checks config text, not real install refusal | low | true; proving it needs pnpm under Node 24 in the test, which is too heavy; the subagent verified it manually | reject |
| 4 | blind + edge | worker exits right after start (no live handle) | medium | edge hunter ran `dist/worker.js` and saw exit 0 in about 0.3 s; a deployed worker would crash-loop | patch |
| 5 | blind + edge | all five HTTP runnables default to port 3000 | low | true; running two locally gives EADDRINUSE; fix is a direct constant change | patch |
| 6 | blind | turbo caches lint and test without hashing root `eslint.config.js` / `tsconfig.base.json` | medium | `turbo.json` has no `globalDependencies`; an edit to the boundary graph replays cached green lint | patch |
| 7 | blind | spec/test files are never type-checked | medium | Nest builds exclude specs, Vitest and `node --test` strip types; `tsc --noEmit -p tsconfig.json` passes today, so the gap is latent | patch |
| 8 | blind | boundaries test accepts any `boundaries/*` error, so a "fail" case can pass through `no-unknown` from a broken pattern | medium | `boundaries.test.ts` filters on the `boundaries/` prefix only | patch |
| 9 | blind | missing probes (module/types files across edges, other allowed edges, web→api, package→apps, bare `wallet-api` name, module→root) | low | true, but the required cases are covered; adding many fixtures is more than a direct correction | reject |
| 10 | blind | web uses npm `cn` instead of clsx + tailwind-merge | false | `cn` is shadcn's own package (`shadcn-ui/cn`, maintained by shadcn), emitted by `shadcn init` | reject |
| 11 | blind | starter README boilerplate (Observe/Mau adverts, CI token badge) in five workspaces | low | true; replacing it with short READMEs is a direct correction | patch |
| 12 | blind | per-app `AGENTS.md` contradicts AD-22 (class-validator) and the platform adapter | medium | the text says class-validator "still works" through `ValidationPipe` | defer (agent-context file) |
| 13 | blind | Nest apps don't extend `tsconfig.base.json` | low | duplicated compiler options; the harm is speculative until a shared flag is needed | reject |
| 14 | blind | `worker.module.spec.ts` claims ten modules, checks three by name and excludes `InternalCoreModule` by hard-coded name | low | true; asserting against `WALLET_MODULES` is a direct correction | patch |
| 15 | blind | api lacks shutdown hooks; spike route and Swagger UI not env-gated | low | graceful shutdown is a SPEC non-goal (Story 1.2); the spike is intentionally throwaway | reject (out of scope by intent) |
| 16 | blind | root `.gitignore` misses `.env` and `*.log` | medium | the starter docs push `npx @nestjs/observe link`, which writes secrets to `.env` | patch |
| 17 | blind | lockfile and favicon missing from the diff | false | both exist; the review diff excluded them on purpose | reject |
| 18 | blind + edge | packages export only `dist`, so a filtered test or start on a fresh clone fails without a build | low | true, but turbo's `^build` covers the documented command; a source export condition adds complexity | reject |
| 19 | blind | web lists `shadcn` / `@tailwindcss/vite` under `dependencies` | false | a bundled SPA has no runtime dependency install, so there is no bad outcome | reject |
| 20 | blind | toolchain test doesn't assert the pnpm `packageManager` pin | low | true; one assertion | patch |
| 21 | edge | `PORT` set but empty or non-numeric | low | config validation is a SPEC non-goal (Story 1.2) | reject (out of scope by intent) |
| 22 | edge | web shows the default React Router error on unknown paths | low | navigation and screens are a SPEC non-goal (Story 1.7) | reject (out of scope by intent) |
| 23 | edge | `initialEntries=[]` gives a router with no location | false | the prop is test-only and the only caller passes `['/']` | reject |
| 24 | edge | boundaries test breaks on Windows path separators | low | `path.relative` gives backslashes; normalising is a direct correction | patch |

## Design Notes

**Boundary check without polluting src:** fixtures mirror the real layout under `tooling/boundaries/fixtures/apps/wallet-api/src/{ledger,exchange,partners,deposits}/…` and `…/simulators/bank-sim/src/…`. They include stub targets such as `ledger/account.entity.ts` and `ledger/ledger.service.ts`. Element patterns match on path suffix (`**/apps/wallet-api/src/<module>/**`, `**/simulators/<name>/**`), so fixtures are classified like real code. The root config's global ignores exclude `tooling/boundaries/fixtures/**` from normal `pnpm lint`. The check runs `new ESLint({ ignore: false })` over the fixtures and asserts which files have `boundaries/*` errors. If suffix matching proves unreliable, fall back to writing the probe files into the real `src/` inside a try/finally.

**Entry points:** controllers, gateways and `*.job.ts` belong to their module's element. An extra rule lets those roles also import the public files of the nine non-platform modules (the module-boundaries.md "Entry points" row).

**ESLint version:** use the newest ESLint major that boundaries 5.4 and typescript-eslint both pass the fixture check with. Record the choice in Implementation Notes.

## Verification

**Commands:**
- `rm -rf node_modules **/node_modules **/dist && pnpm install && pnpm turbo build lint test --force` -- expected: exit 0
- `node --test tooling/boundaries/boundaries.test.ts` -- expected: all matrix rows pass
- `pnpm --filter wallet-api start` then `curl -s localhost:3000/docs-json | grep spike` -- expected: sample route present

**Manual checks (if no CLI):**
- Tree matches stack.md; `pnpm why -r class-validator` is empty (it is only an optional peer of `@nestjs/swagger`).
