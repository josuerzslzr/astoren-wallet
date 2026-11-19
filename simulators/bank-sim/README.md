# bank-sim

Simulated bank partner for deposits and withdrawals. An isolated NestJS 12 app: it imports nothing outside this folder. That means no wallet code, no `@astoren/*` packages and no other simulator. Shared wire formats are documented in `docs/partner-specs/`.

Default port: **3101** (override with `PORT`).

## Scripts

- `pnpm build`: `nest build` to `dist/`
- `pnpm start`: run it
- `pnpm test`: Vitest unit and e2e specs
- `pnpm lint`: `tsc --noEmit`, then ESLint with the root config

## Status

A stub for now: `GET /` returns `{ "service": "bank-sim", "status": "stub" }`. Real behaviour lands in Epic 5.
