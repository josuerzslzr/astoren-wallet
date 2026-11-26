- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-monorepo-scaffold.md`
  summary: Replace the per-workspace NestJS starter AGENTS.md files with one project-level agent instructions file that matches AD-22 (no class-validator) and the express adapter in use.
  evidence: The generated AGENTS.md in wallet-api and each simulator says class-validator "still works" through ValidationPipe and recommends NodeAdapter from @nestjs/platform-node, which contradicts AD-22 and the apps' @nestjs/platform-express; agent-context file edits are out of patch scope (suggest bmad-project-context).
  status: resolved 2026-11-24 (bmad-project-context adoption). Deleted the five starter AGENTS.md files; their surviving rules moved to a root CLAUDE.md block. The class-validator line was dropped as contradicting AD-22 and replaced by a Standard Schema + @astoren/contracts rule. The NodeAdapter line was replaced by a guard: keep the implicit Express default until an AD decides the adapter. No action left.

## Deferred from: code review of spec-1-1-monorepo-scaffold.md (2026-11-24)

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-monorepo-scaffold.md`
  summary: Carry over the starter AGENTS.md rules that the CLAUDE.md adoption dropped.
  evidence: The deleted starter AGENTS.md said "tests run on Vitest, so mocks are `vi.fn()`, not `jest.fn()`" and listed Nest first-party packages. Neither appears in CLAUDE.md. Without the list, "prefer a Nest first-party package" leaves open whether `@nestjs/schedule`, `@nestjs/event-emitter` and `@nestjs/config` conflict with AD-19, AD-17 and AD-25. The resolved entry above says "No action left", which overstates the carry-over.
  status: resolved 2026-11-26. The `vi.fn()` rule was added to CLAUDE.md `## Tests`. Nest first-party packages stay unrestricted for now (user decision: revisit per story when one is needed).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-monorepo-scaffold.md`
  summary: State the test layout rule in CLAUDE.md under "Conventions that differ from defaults".
  evidence: `tooling/tests-layout` enforces `<workspace>/test/*.test.ts(x)` and bans `*.spec.ts`, against the Nest default of a co-located spec. CLAUDE.md only hints at it in the `*.e2e.test.ts` line.
  status: resolved 2026-11-26. CLAUDE.md `## Tests` (outside the bmad-project-context markers).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-monorepo-scaffold.md`
  summary: Decide whether a root AGENTS.md should point to CLAUDE.md for non-Claude agent tools.
  evidence: All five AGENTS.md files were deleted in `109e292`; only CLAUDE.md remains. This matters only if Codex, Cursor or similar tools are used on the repo.
  status: dropped 2026-11-26. Claude only for now (user).
