import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { App } from "supertest/types.js";
import { AppModule } from "../src/app.module.js";
import { setupOpenApi } from "../src/openapi.setup.js";

/** The parts of the served OpenAPI JSON this test reads. */
interface OpenApiJson {
  paths: Record<
    string,
    { post: { requestBody: { content: Record<string, { schema: unknown }> } } }
  >;
  components: {
    schemas: Record<
      string,
      {
        type?: string;
        required?: string[];
        properties: Record<string, unknown>;
      }
    >;
  };
}

describe("OpenAPI spike (POST /spike/echo)", () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    setupOpenApi(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("serves the zod-derived request schema in /docs-json", async () => {
    const res = await request(app.getHttpServer())
      .get("/docs-json")
      .expect(200);
    const doc = res.body as OpenApiJson;

    const body =
      doc.paths["/spike/echo"].post.requestBody.content["application/json"]
        .schema;
    expect(body).toEqual({ $ref: "#/components/schemas/SpikeEchoRequest" });

    const schema = doc.components.schemas.SpikeEchoRequest;
    expect(schema.type).toBe("object");
    expect(schema.required).toEqual(["message"]);
    expect(schema.properties.message).toMatchObject({
      type: "string",
      minLength: 1,
      maxLength: 200,
    });
    expect(schema.properties.count).toMatchObject({
      type: "integer",
      minimum: 1,
      maximum: 10,
      default: 1,
    });
  });

  it("validates the body through the Standard Schema route option", async () => {
    await request(app.getHttpServer())
      .post("/spike/echo")
      .send({ message: "hi", count: 2 })
      .expect(200, { echoed: ["hi", "hi"] });

    await request(app.getHttpServer())
      .post("/spike/echo")
      .send({ message: "" })
      .expect(400);
  });

  it("applies the zod default when count is omitted", async () => {
    await request(app.getHttpServer())
      .post("/spike/echo")
      .send({ message: "hi" })
      .expect(200, { echoed: ["hi"] });
  });
});
