// Proves the root config runs type-aware rules: reverting to
// `tseslint.configs.recommended`, or widening `disableTypeChecked`, fails here.
// The probe sits in its own tsconfig-covered folder so projectService finds it;
// like the boundaries fixtures, it is excluded from `pnpm lint:tooling`.
import path from "node:path";
import { ESLint } from "eslint";
import { assert, expect, test } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const probe = path.join(
  import.meta.dirname,
  "fixtures/floating-promise.probe.ts",
);

test("an un-awaited promise fails @typescript-eslint/no-floating-promises", async () => {
  // `ignore: false` lifts the global ignore that keeps the probe out of lint.
  const eslint = new ESLint({ cwd: repoRoot, ignore: false });
  const [result] = await eslint.lintFiles([probe]);
  assert(result, `no lint result for ${probe}`);
  expect(
    result.messages.map((m) => ({ ruleId: m.ruleId, severity: m.severity })),
  ).toContainEqual({
    ruleId: "@typescript-eslint/no-floating-promises",
    severity: 2,
  });
});
