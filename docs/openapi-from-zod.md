# OpenAPI from zod v4 on NestJS 12

Story 1.1 spike (CAP-6). Status: decided.

## Decision

Use **`@nestjs/swagger` 12 reading the Standard Schema `schema` route option directly**. No `z.toJSONSchema` glue, no `nestjs-zod`, no class-validator.

A route declares its zod schema once:

```ts
@Post('echo')
echo(@Body({ schema: spikeEchoRequestSchema }) body: SpikeEchoRequest) { … }
```

That one schema both validates the body (`StandardSchemaValidationPipe`, registered as `APP_PIPE` in `AppModule`) and appears in the OpenAPI document.

## How it works

- `@nestjs/common` 12 stores `schema` in the route-argument metadata.
- `@nestjs/swagger` 12 reads that metadata (`ParameterMetadataAccessor` → `standardSchema`). It converts it with the schema's own `~standard.jsonSchema.input({ target: 'openapi-3.0' })`, which is the StandardJSONSchemaV1 interface that zod 4 implements.
- A schema with `.meta({ id: 'SpikeEchoRequest' })` becomes `#/components/schemas/SpikeEchoRequest`, and the request body is a `$ref` to it. A schema without an `id` is inlined.
- zod's `.describe()`, `min`/`max`, `int()` and `.default()` carry over as `description`, `minLength`/`maxLength`, `type: integer` + `minimum`/`maximum`, and `default`. `required` reflects the input type, so a field with a default is optional.

## What was tried

| Approach | Result |
|---|---|
| Built-in: `@Body({ schema })` + `SwaggerModule.createDocument(app, config)` with no options | Works. Clean `$ref` plus a named component. **Chosen.** |
| `standardSchemaConverter` document option wrapping `z.toJSONSchema(schema, { target: 'openapi-3.0', io })` | Works, but the raw output nests `definitions` with synthetic `__schemaN` ids and needs extra normalisation to land in `components.schemas`. Only worth it if we need a custom conversion later. |
| `nestjs-zod`, class-validator DTOs | Ruled out by AD-22. |

## Where it lives

- Sample schema: `packages/contracts/src/spike.schema.ts` (`spikeEchoRequestSchema`).
- Sample route: `apps/wallet-api/src/platform/spike.controller.ts` (`POST /spike/echo`).
- Document setup: `apps/wallet-api/src/openapi.setup.ts`. It serves Swagger UI at `/docs` and the JSON at `/docs-json`.
- Test: `apps/wallet-api/test/openapi.setup.test.ts` asserts that the `$ref` and the component's constraints are in `/docs-json` and that invalid bodies get a 400.

Try it locally:

```sh
pnpm --filter wallet-api build && pnpm --filter wallet-api start
curl -s localhost:3000/docs-json | grep spike
```

## Follow-ups for Story 1.2

- **Response schemas:** `@ApiResponse({ status, standardSchema })` takes a zod schema for responses. Wire it to the envelope schemas (`{ returnCode, body }`) and decide whether a helper decorator wraps each body schema in the envelope.
- **Component ids:** give every contract schema a `.meta({ id })` so the components get stable names. Add a lint or unit check that ids are unique.
- **Error shape:** the default `StandardSchemaValidationPipe` throws Nest's `BadRequestException` (`{ message: string[], error, statusCode }`). Story 1.2 replaces it with an `exceptionFactory` that maps issues to the envelope and a returnCode.
- **Query and params:** `@Query({ schema })` and `@Param({ schema })` are expanded into individual parameters by the same mechanism. Check this once the first GET with a query lands.
- **Spike removal:** delete `SpikeController` and `spike.schema.ts` when the first real route exists.
- **Output vs input:** the converter uses the `input` view for request bodies, so `.default()` fields are optional. Response schemas use `output`. Keep transforms out of contract schemas so both views stay meaningful.
