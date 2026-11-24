import { expect, test } from "vitest";
import { spikeEchoRequestSchema } from "../src/spike.schema.ts";

test("spikeEchoRequestSchema accepts a valid body and applies defaults", () => {
  expect(spikeEchoRequestSchema.parse({ message: "hi" })).toEqual({
    message: "hi",
    count: 1,
  });
});

test("spikeEchoRequestSchema rejects an empty message", () => {
  expect(spikeEchoRequestSchema.safeParse({ message: "" }).success).toBe(false);
});
