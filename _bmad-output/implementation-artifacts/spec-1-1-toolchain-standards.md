---
title: 'Story 1.1 addendum: toolchain standards'
type: 'chore'
created: '2026-11-24'
status: 'done'
baseline_commit: '109e292977b1a3fbc5c1824797ecf51f0e456205'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-1-monorepo-scaffold.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 1.1 (unmerged) leaves the toolchain split: `packages/*` and `tooling/` test with `node --test` while apps use Vitest; Prettier exists only as five per-app starter copies with nothing checking it; lint is not type-aware, so a forgotten `await` passes; `tooling/` is never type-checked; nothing runs before a commit.

**Approach:** Within Story 1.1's goal ("every later story builds, lints and tests the same way from day one"): Vitest in every workspace and `tooling/`, one root Prettier config checked by `turbo lint`, type-aware `typescript-eslint`, `tooling/` type-checked and linted, and husky + lint-staged on pre-commit. Recorded as an addendum in the Story 1.1 spec's Spec Change Log.

## Boundaries & Constraints

**Always:** `pnpm install && pnpm turbo build lint test` stays the one command and exits 0. Every new check runs inside that command (as a turbo task), not only in the hook. Root turbo tasks declare `inputs` so a cached pass cannot hide a new violation (same pattern as `//#test:tooling`). Existing boundaries and tests-layout checks keep passing unchanged in intent. One commit per standard (user commits; agent never commits).

**Never:** Touch `_bmad/`, `.claude/`, `_bmad-output/` content beyond the two spec files. CI pipelines (Epic 2), coverage thresholds, commit-message linting, money lint rules (Stories 1.4 / 1.5). Disabling a type-aware rule repo-wide to make lint pass.

**Decisions (2026-11-24):**
- Prettier style: Nest style, `{ "singleQuote": true, "trailingComma": "all" }` with semicolons; `apps/web` is reformatted to it.
- Markdown: `*.md` is excluded from Prettier.
- Pre-commit: staged files only (lint-staged: `eslint --fix` + `prettier --write`); the full suite stays in `pnpm turbo build lint test`.
- Spec size: kept whole (~1,850 tokens) at the user's choice.

</frozen-after-approval>

## Code Map

- `packages/{contracts,money}/package.json` -- `test: node --test …`; add `vitest` devDep, `test: vitest run`.
- `packages/*/test/*.test.ts` -- import from `node:test`/`node:assert`; rewrite to `vitest` imports (explicit, no globals, like `apps/web`).
- `packages/*/tsconfig.json` -- `include: ["src","test"]`; add `vitest.config.ts` so type-aware lint finds it. `tsconfig.build.json` stays `src` only.
- `apps/wallet-api/vitest.config.ts` -- reference config shape (`include: ['test/**/*.test.ts']`). Nest workspaces keep `globals: true`.
- `package.json` (root) -- `test:tooling: node --test 'tooling/**/*.test.ts'`; becomes `vitest run --config tooling/vitest.config.ts`. Add `prepare: husky`, `format`, devDeps `vitest`, `prettier`, `husky`, `lint-staged`.
- `tooling/boundaries/boundaries.test.ts` -- top-level `await eslint.lintFiles` then `node:test` `test()` per case; port to Vitest (`test.each` or same loop). Asserts fixtures have **no non-boundaries errors**, so typed rules must be disabled for `tooling/boundaries/fixtures/**`.
- `tooling/tsconfig.json` -- exists (types node, noEmit, excludes fixtures); add `vitest.config.ts` to include.
- `turbo.json` -- `test` dependsOn `//#test:tooling` with explicit inputs (keep); add `//#lint:tooling` and `//#format:check` as `lint` dependencies, each with `inputs`.
- `eslint.config.js` -- `tseslint.configs.recommended` → `recommendedTypeChecked` with `parserOptions.projectService` + `tsconfigRootDir`; add `disableTypeChecked` for `**/*.js` and the fixtures path. Per-workspace `lint` scripts already run `eslint .` and stay.
- `apps/web/tsconfig.json` -- solution file (`files: []`, references app/node); `tsconfig.node.json` covers `vite.config.ts`, `vitest.config.ts`. Verify projectService resolves through references.
- `apps/wallet-api/.prettierrc`, `simulators/*/.prettierrc` -- identical; delete in favour of root `.prettierrc`. Their `format` scripts and `prettier` devDeps go.
- `.prettierignore` (new) -- `pnpm-lock.yaml`, `*.md`, `_bmad/`, `_bmad-output/`, `.claude/`. Prettier 3 also reads `.gitignore`.
- `.husky/pre-commit` (new) -- loads nvm when present (default shell Node 24 lacks pnpm), then `pnpm exec lint-staged`.

## Tasks & Acceptance

**Execution:**
- [x] `packages/*`, `tooling/`, root `package.json`, `turbo.json` -- Vitest everywhere: configs, scripts, test rewrites, `tooling/vitest.config.ts` -- one runner.
- [x] `.prettierrc`, `.prettierignore`, root `package.json`, `turbo.json`, per-app files -- root Prettier, `//#format:check` (`prettier --check .`), then one `pnpm format` pass as its own commit -- one style, enforced.
- [x] `eslint.config.js`, `tooling/tsconfig.json`, `turbo.json` -- type-aware lint; `//#lint:tooling` = `tsc -p tooling/tsconfig.json && eslint tooling`; fix every finding in code (scoped `eslint-disable` only with a reason) -- catches floating promises.
- [x] `.husky/pre-commit`, root `package.json` -- husky + lint-staged on staged files.
- [x] `_bmad-output/implementation-artifacts/spec-1-1-monorepo-scaffold.md` -- append a Spec Change Log entry pointing to this spec.

**Acceptance Criteria:**
- Given a fresh clone on Node 26, when `pnpm install && pnpm turbo build lint test` runs, then it exits 0 and every workspace plus `tooling/` reports Vitest results.
- Given an unformatted line in any `.ts` file, when `pnpm turbo lint` runs, then `//#format:check` fails (not a cache hit).
- Given an un-awaited promise in `apps/wallet-api/src`, when `pnpm lint` runs, then `@typescript-eslint/no-floating-promises` fails it.
- Given a type error in `tooling/`, when `pnpm turbo lint` runs, then `//#lint:tooling` fails.
- Given a staged badly formatted `.ts` file, when `git commit` runs, then the hook formats it (or blocks on a lint error).
- Given `tooling/boundaries`, when tests run, then every matrix row still passes.

## Implementation Notes

- **Vitest:** `vitest ^4.1.12` (the version the apps already lock; 5.x exists but is out of scope). `packages/*` and `tooling/` use explicit `vitest` imports, no globals; Nest workspaces keep `globals: true`. `tooling/vitest.config.ts` sets `root` to `tooling/` and excludes `boundaries/fixtures/**`. The boundaries test keeps its top-level `await eslint.lintFiles` and the same per-case `test()` loop and names; 22/22 tooling tests pass (14 boundaries, 2 tests-layout, 5 toolchain, 1 typed-lint). `tooling/tsconfig.json` already includes `**/*.ts`, so `vitest.config.ts` is covered without a change.
- **Prettier:** root `.prettierrc` + `.prettierignore`; the five per-app `.prettierrc`, `format` scripts and `prettier` devDeps are gone. `pnpm format` reformatted 24 files (mostly `apps/web` to semicolons/single quotes, plus print-width wraps and `pnpm-workspace.yaml` quotes). `//#format:check` inputs are `**` with `*.md`, `node_modules`, `dist`, `.turbo`, `_bmad*` and `.claude` negated. `prettier` is pinned exactly (`3.10.1`). `.prettierignore` also lists `**/.vscode/`, `**/dist-ssr/`, `**/logs/` (from `apps/web/.gitignore`, which Prettier does not read). A root `.gitattributes` (`* text=auto eol=lf`) keeps Windows checkouts passing the check.
- **Type-aware lint:** `recommendedTypeChecked` + `parserOptions.projectService`; `disableTypeChecked` for `**/*.{js,mjs,cjs}` and `tooling/boundaries/fixtures/**`. `.claude/**` added to the global ignores so lint-staged never lints it. projectService resolves `apps/web` through its solution `tsconfig.json` references (verified with a floating-promise probe in `apps/web/src`). The only findings were `no-unsafe-*` in `apps/wallet-api/test/openapi.setup.test.ts` (untyped `getHttpServer()` and `res.body`), fixed in code with `INestApplication<App>` and a local `OpenApiJson` type. No rule disabled. `tooling/typed-lint/typed-lint.test.ts` lints `tooling/typed-lint/fixtures/floating-promise.probe.ts` (own `tsconfig.json`, excluded from `lint:tooling`, the tooling tsc run and the Vitest include) with the real root config and asserts `@typescript-eslint/no-floating-promises` at severity 2; it fails if the config is reverted to `recommended`. Package Vitest includes are `test/**/*.test.{ts,tsx}`.
- **Hook:** husky 9 (`prepare: husky`, sets `core.hooksPath=.husky/_`), lint-staged 17. `prepare` is `husky || true` so installs without devDeps do not fail. Config in root `package.json`: script files (`ts,tsx,mts,cts,js,jsx,mjs,cjs`) → `eslint --fix --no-warn-ignored` then `prettier --write`; every other extension Prettier checks (`json,jsonc,json5,css,scss,less,html,vue,yaml,yml,graphql,gql,hbs,handlebars`) → `prettier --write`. `--no-warn-ignored` silences the warning for staged files under ESLint's global ignores (fixtures).
- **Verification run:** clean install (`node_modules`, `dist` removed) then `pnpm turbo build lint test --force` → 27/27 tasks, exit 0 (one pre-existing web `react-refresh` warning). Probes, each removed afterwards: badly spaced line in `simulators/fx-sim/src/app.service.ts` → `//#format:check` cache miss and failure, then cache hit and pass on restore; un-awaited call in `apps/wallet-api/src/platform/` → `no-floating-promises` fails `pnpm lint`; same in `tooling/` → `//#lint:tooling` fails; `string` assigned to `number` in `tooling/` → `//#lint:tooling` fails on TS2322; staged badly formatted `.ts` run through `.husky/_/pre-commit` in a Node 24 shell → nvm loaded, file reformatted and re-staged; staged floating promise → hook exits 1.
- **Commits (for the user):** suggested split, one per standard: (1) Vitest: `packages/*`, `tooling/*.test.ts`, `tooling/vitest.config.ts`, root `test:tooling`; (2) Prettier config + `//#format:check` + per-app removals; (3) `pnpm format` pass alone (re-run `pnpm format` after (2) on a clean tree to isolate it); (4) type-aware lint + `//#lint:tooling` + `openapi.setup.test.ts` fix; (5) husky + lint-staged; (6) README + spec change log. Changes are currently mixed in the working tree (e.g. root `package.json`, `turbo.json`), so splitting needs `git add -p`.

## Spec Change Log

## Review Triage Log

| # | Source | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | verification-gap + blind | no automated check that typed rules fire; reverting to `recommended` or widening `disableTypeChecked` passes every test | medium | pre-verified: no test lints a typed probe; boundaries fixtures have typed rules off | patch |
| 2 | blind + edge | `prepare: husky` fails installs without devDeps (`pnpm install --prod`, future Epic 2 images) | low | husky binary absent → exit 127 fails the install; direct fix `husky \|\| true` | patch |
| 3 | blind + edge | lint-staged globs narrower than `//#format:check` (`.mts`, `.jsx`, `.json5`, `.scss`, …) | low | such a staged file skips the hook then fails `turbo lint`; none exist today, fix is a glob edit | patch |
| 4 | blind | `lint` dependsOn the root tasks, so one format slip stops all workspace lint | low | true, but intent requires every check inside the one turbo command; restructuring is not a direct fix | reject |
| 5 | blind + edge + verification-gap | `//#format:check` inputs list extensions by hand; nested `.prettierrc`, `.editorconfig`, `.mdx` would not bust the cache | low | verification-gap confirmed no hole today; `**` with negations is a direct correction | patch |
| 6 | blind | no `.git-blame-ignore-revs` for the format commit | low | needs the format commit's SHA, which exists only after the user commits | reject |
| 7 | blind | hook handles nvm only; other version managers get a bare error | low | husky 9's `~/.config/husky/init.sh` covers other managers per user; not a repo defect | reject |
| 8 | edge | sourcing `nvm.sh` under husky's `sh -e` may abort the hook | maybe-false | sources cleanly under `sh -ec` here; would need a machine without a default alias to settle; if true, low | reject |
| 9 | edge | missing pnpm gives only a generic error | false | husky's runner prints `command not found in PATH=…` on exit 127 (`.husky/_/h`) | reject |
| 10 | blind | Windows checkout with `core.autocrlf` fails `//#format:check` outside the Nest apps (no root `.gitattributes`) | low | only the five Nest apps carry `.gitattributes`; adding a root one is direct | patch |
| 11 | blind | Prettier on a caret range; a minor bump can fail the format check with no code change | low | `^3.10.1` in root `package.json`; exact pin is direct | patch |
| 12 | blind | boundaries test keeps a dead `result?.messages ?? []` fallback after `toBeDefined()` | low | `toBeDefined` does not narrow; Vitest `assert` does; direct | patch |
| 13 | blind | `openapi.setup.test.ts` casts `res.body` instead of checking its shape | false | a shape change still fails the test loudly (TypeError); readability only | reject |
| 14 | blind | spec Code Map contradicts Implementation Notes on `tooling/tsconfig.json` | low | fix edits this spec | reject |
| 15 | blind | README omits how the hook installs, re-stages and is skipped | low | direct doc addition | patch |
| 16 | blind | "clean install" verification used `**` without `globstar`, so workspace `node_modules`/`dist` survived | medium | bash expands `**/x` as `*/x`; fix edits this spec — re-verified with `find`-based clean instead | reject |
| 17 | edge | `prettier --check .` reads only the root `.gitignore`; `apps/web/.gitignore` ignores `.vscode/*`, `dist-ssr`, `logs` | low | a local `apps/web/.vscode/settings.json` fails the check; add to `.prettierignore` | patch |
| 18 | edge | `projectService` has no default project; a `.ts` outside every tsconfig errors | low | fails loudly with a clear parser message on a file nobody has added | reject |
| 19 | edge | packages' Vitest include is `.ts` only; a `test/*.test.tsx` passes the layout check but never runs | low | `packages/*/vitest.config.ts` include; widening is direct | patch |
| 20 | edge | type errors in `tooling/boundaries/fixtures` are never reported | false | fixtures are intentional invalid probes, excluded by design (Code Map) | reject |

## Verification

**Commands:**
- `rm -rf node_modules **/node_modules **/dist && pnpm install && pnpm turbo build lint test --force` -- expected: exit 0
- probe each AC with a temporary file, then remove it -- expected: the named task fails, then passes again
- `git commit` of a staged probe in a scratch branch or with `--dry-run`-equivalent (`pnpm exec lint-staged` on a staged file) -- expected: file reformatted
