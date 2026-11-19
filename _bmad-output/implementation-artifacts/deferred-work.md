- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-monorepo-scaffold.md`
  summary: Replace the per-workspace NestJS starter AGENTS.md files with one project-level agent instructions file that matches AD-22 (no class-validator) and the express adapter in use.
  evidence: The generated AGENTS.md in wallet-api and each simulator says class-validator "still works" through ValidationPipe and recommends NodeAdapter from @nestjs/platform-node, which contradicts AD-22 and the apps' @nestjs/platform-express; agent-context file edits are out of patch scope (suggest bmad-project-context).
