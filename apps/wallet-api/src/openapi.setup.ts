import type { INestApplication } from "@nestjs/common";
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from "@nestjs/swagger";

/**
 * Builds the OpenAPI document. `@nestjs/swagger` 12 reads the zod schema from
 * the Standard Schema `schema` route option on its own (see docs/openapi-from-zod.md).
 */
export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle("wallet-api")
    .setVersion("0.0.1")
    .build();
  return SwaggerModule.createDocument(app, config);
}

/** Serves Swagger UI at `/docs` and the JSON document at `/docs-json`. */
export function setupOpenApi(app: INestApplication): void {
  SwaggerModule.setup("docs", app, () => createOpenApiDocument(app));
}
