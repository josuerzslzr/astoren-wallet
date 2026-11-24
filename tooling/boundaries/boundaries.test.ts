// Committed, repeatable check for CAP-5 (module boundaries) and CAP-7
// (simulator isolation). It lints the probe files under ./fixtures with the
// real root eslint.config.js and asserts which ones get boundaries errors.
// The fixtures mirror the real layout, so the suffix-matched element patterns
// classify them exactly like apps/wallet-api/src and simulators/*.
import path from "node:path";
import { ESLint } from "eslint";
import { assert, expect, test } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const fixtures = path.join(import.meta.dirname, "fixtures");
const api = "apps/wallet-api/src";
const bankSim = "simulators/bank-sim/src";

/** 'pass', or the exact boundaries rule that must reject the import. */
type Expectation = "pass" | "element-types" | "entry-point" | "external";

const cases: Array<[file: string, expected: Expectation, label: string]> = [
  // module-boundaries.md required cases (CAP-5)
  [
    `${api}/ledger/imports-exchange-service.probe.ts`,
    "element-types",
    "forbidden edge ledger -> exchange",
  ],
  [
    `${api}/partners/imports-deposits-service.probe.ts`,
    "element-types",
    "forbidden edge partners -> deposits",
  ],
  [
    `${api}/exchange/imports-ledger-entity.probe.ts`,
    "entry-point",
    "private file exchange -> ledger/account.entity.ts",
  ],
  [
    `${api}/exchange/imports-ledger-service.probe.ts`,
    "pass",
    "public file exchange -> ledger/ledger.service.ts",
  ],
  // extra graph and entry-point cases
  [
    `${api}/ledger/imports-platform-service.probe.ts`,
    "pass",
    "allowed edge ledger -> platform",
  ],
  [
    `${api}/platform/imports-ledger-service.probe.ts`,
    "element-types",
    "platform depends on nothing",
  ],
  [
    `${api}/ledger/ledger.controller.ts`,
    "pass",
    "entry point ledger controller -> exchange service",
  ],
  [
    `${api}/exchange/exchange.controller.ts`,
    "entry-point",
    "entry point cannot reach another module private file",
  ],
  [
    `${api}/ledger/ledger.job.ts`,
    "pass",
    "entry point uses its own module private file",
  ],
  // simulator isolation (CAP-7)
  [
    `${bankSim}/imports-contracts-package.probe.ts`,
    "external",
    "bank-sim -> @astoren/contracts",
  ],
  [
    `${bankSim}/imports-packages-relative.probe.ts`,
    "element-types",
    "bank-sim -> packages/ by relative path",
  ],
  [
    `${bankSim}/imports-apps-relative.probe.ts`,
    "element-types",
    "bank-sim -> apps/ by relative path",
  ],
  [
    `${bankSim}/imports-sibling-simulator.probe.ts`,
    "element-types",
    "bank-sim -> fx-sim",
  ],
  [
    `${bankSim}/imports-own-file.probe.ts`,
    "pass",
    "bank-sim -> its own folder",
  ],
];

// `ignore: false` lifts the global ignore that keeps fixtures out of `pnpm lint`.
const eslint = new ESLint({ cwd: repoRoot, ignore: false });
const results = await eslint.lintFiles(
  cases.map(([file]) => path.join(fixtures, file)),
);
const byFile = new Map(
  results.map((r) => [
    path.relative(fixtures, r.filePath).split(path.sep).join("/"),
    r,
  ]),
);

for (const [file, expected, label] of cases) {
  test(`${expected === "pass" ? "allows" : `rejects (${expected})`}: ${label}`, () => {
    const result = byFile.get(file);
    assert(result, `no lint result for ${file}`);
    const errors = result.messages.filter((m) => m.severity === 2);
    const boundaryErrors = errors.filter((m) =>
      m.ruleId?.startsWith("boundaries/"),
    );
    const otherErrors = errors.filter(
      (m) => !m.ruleId?.startsWith("boundaries/"),
    );
    expect(otherErrors, `${file} has non-boundaries errors`).toEqual([]);
    if (expected === "pass") {
      expect(boundaryErrors, `${file} should have no boundaries error`).toEqual(
        [],
      );
    } else {
      // The exact rule, so a broken element pattern cannot pass via another rule (e.g. no-unknown).
      expect(
        boundaryErrors.length,
        `${file} should have a boundaries error`,
      ).toBeGreaterThan(0);
      expect(
        [...new Set(boundaryErrors.map((m) => m.ruleId))],
        `${file} should be rejected by boundaries/${expected}`,
      ).toEqual([`boundaries/${expected}`]);
    }
  });
}
