// Root checks under tooling/ (boundaries fixtures, tests layout, Node pin).
// Run from the repo root: `pnpm test:tooling`.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: import.meta.dirname,
    include: ["**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      "boundaries/fixtures/**",
      "typed-lint/fixtures/**",
    ],
  },
});
