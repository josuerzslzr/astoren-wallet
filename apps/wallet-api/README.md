# wallet-api

The wallet backend: one NestJS 12 codebase with two runnables.

- **api** (`src/main.ts`): HTTP on port **3000** (override with `PORT`). OpenAPI JSON at `/docs-json`, Swagger UI at `/docs`.
- **worker** (`src/worker.ts`): an application context with no HTTP listener. It runs until SIGTERM or SIGINT.

`src/<module>/` holds the ten AD-3 modules. The root `eslint.config.js` enforces which modules may import which (see the root README).

## Scripts

- `pnpm build`: `nest build` to `dist/`
- `pnpm start`: run the api (`node dist/worker.js` runs the worker)
- `pnpm test`: Vitest unit specs (`src/**/*.spec.ts`) and e2e specs (`test/**/*.e2e-spec.ts`)
- `pnpm lint`: `tsc --noEmit`, then ESLint with the root config

## Status

Story 1.1 ships empty modules and the OpenAPI spike route (`POST /spike/echo`, see `docs/openapi-from-zod.md`). Story 1.2 adds the API conventions (config, envelope, errors, logging, health). Business behaviour arrives with each module's own story.
