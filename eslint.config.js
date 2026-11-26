// Root ESLint flat config, shared by every workspace (`eslint .` in each one
// resolves up to this file). Module boundaries follow
// _bmad-output/specs/spec-story-1-1-monorepo-scaffold/module-boundaries.md.
import js from "@eslint/js";
import boundaries from "eslint-plugin-boundaries";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * C4 L3 dependency graph (AD-2): module -> modules it may import.
 * Any edge not listed is forbidden.
 */
export const MODULE_DEPENDENCIES = {
  platform: [],
  ledger: ["platform"],
  history: ["platform"],
  partners: ["platform"],
  identity: ["ledger", "platform"],
  exchange: ["partners", "ledger", "identity", "history", "platform"],
  deposits: ["partners", "ledger", "history", "platform"],
  withdrawals: ["partners", "ledger", "history", "platform"],
  transfers: ["ledger", "identity", "history", "platform"],
  notifications: ["exchange", "platform"],
};

/** Entry points (controllers, WS gateway, worker jobs) may also reach these modules. */
const ENTRY_POINT_DEPENDENCIES = Object.keys(MODULE_DEPENDENCIES).filter(
  (m) => m !== "platform",
);

/** File roles another module may import across an allowed edge (AD-2, AD-3). */
const PUBLIC_FILES = ["**/*.service.ts", "**/*.module.ts", "**/*.types.ts"];

const SIMULATORS = ["bank-sim", "cash-sim", "fx-sim", "mock-jwt-issuer"];

const moduleOf = (name) => ["wallet-module", { module: name }];

// Patterns match on the path suffix, so the committed fixtures under
// tooling/boundaries/fixtures/ are classified exactly like real code.
const elements = [
  // Composition roots: app.module.ts, worker.module.ts, main.ts, worker.ts, ...
  { type: "wallet-root", mode: "file", pattern: "apps/wallet-api/src/*.ts" },
  // Entry points belong to their module but get the extra C4 "entry points" edge.
  {
    type: "wallet-entry",
    mode: "file",
    pattern: [
      "apps/wallet-api/src/*/**/*.controller.ts",
      "apps/wallet-api/src/*/**/*.gateway.ts",
      "apps/wallet-api/src/*/**/*.job.ts",
    ],
    capture: ["module"],
  },
  {
    type: "wallet-module",
    mode: "folder",
    pattern: "apps/wallet-api/src/*",
    capture: ["module"],
  },
  { type: "wallet-test", mode: "folder", pattern: "apps/wallet-api/test" },
  {
    type: "simulator",
    mode: "folder",
    pattern: "simulators/*",
    capture: ["name"],
  },
  { type: "package", mode: "folder", pattern: "packages/*", capture: ["name"] },
  { type: "web", mode: "folder", pattern: "apps/web" },
];

const elementTypeRules = [
  ...Object.entries(MODULE_DEPENDENCIES).map(([module, deps]) => ({
    from: [moduleOf(module), ["wallet-entry", { module }]],
    allow: [
      moduleOf(module),
      ["wallet-entry", { module }],
      ...deps.map(moduleOf),
      "package",
    ],
  })),
  { from: ["wallet-entry"], allow: ENTRY_POINT_DEPENDENCIES.map(moduleOf) },
  { from: ["wallet-root"], allow: ["wallet-root", "wallet-module", "package"] },
  {
    from: ["wallet-test"],
    allow: [
      "wallet-test",
      "wallet-root",
      "wallet-module",
      "wallet-entry",
      "package",
    ],
  },
  // Simulators: only their own folder (CAP-7). No packages, apps or siblings.
  { from: ["simulator"], allow: [["simulator", { name: "${from.name}" }]] },
  { from: ["package"], allow: ["package"] },
  { from: ["web"], allow: ["web", "package"] },
];

const entryPointRules = [
  // Across modules, only public file roles.
  { target: ["wallet-module"], allow: PUBLIC_FILES },
  // Entry points may use their own module's private files, and their module may wire them.
  { target: [["wallet-module", { module: "${from.module}" }]], allow: "**" },
  { target: [["wallet-entry", { module: "${from.module}" }]], allow: "**" },
  {
    target: ["wallet-root", "wallet-test", "simulator", "package", "web"],
    allow: "**",
  },
];

export default defineConfig([
  globalIgnores([
    "**/dist/**",
    "**/node_modules/**",
    "**/coverage/**",
    "**/.turbo/**",
    "_bmad/**",
    "_bmad-output/**",
    ".claude/**",
    // Probe files for the boundaries check; linted only by tooling/boundaries/boundaries.test.ts.
    "tooling/boundaries/fixtures/**",
    // Floating-promise probe; linted only by tooling/typed-lint/typed-lint.test.ts.
    "tooling/typed-lint/fixtures/**",
  ]),

  js.configs.recommended,
  // Type-aware rules (no-floating-promises, no-misused-promises, no-unsafe-*).
  // projectService picks each file's nearest tsconfig.json, so every linted
  // .ts file must be included by one (vitest configs included).
  tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Plain JS (this file) is in no tsconfig.
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  // Boundaries probes are in no tsconfig and import stubs on purpose; the
  // boundaries test asserts they have no non-boundaries errors.
  {
    files: ["tooling/boundaries/fixtures/**"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": elements,
      // Paths are relative to the repo root whichever workspace runs `eslint .`.
      "boundaries/root-path": import.meta.dirname,
      // Workspace packages are always classified as external by name, so a
      // simulator importing `@astoren/*` hits `boundaries/external` no matter
      // whether the import resolver happens to find the package.
      "boundaries/flag-as-external": { customSourcePatterns: ["@astoren/*"] },
      "import/resolver": {
        typescript: { alwaysTryTypes: true },
        node: true,
      },
    },
    rules: {
      "boundaries/element-types": [
        "error",
        { default: "disallow", rules: elementTypeRules },
      ],
      "boundaries/entry-point": [
        "error",
        { default: "disallow", rules: entryPointRules },
      ],
      "boundaries/external": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: ["simulator"],
              disallow: ["@astoren/*", "wallet-api", "web", ...SIMULATORS],
            },
          ],
        },
      ],
      "boundaries/no-unknown": "error",
    },
  },

  // wallet-api tests may import any file of the elements they can reach,
  // private roles and entry points included (module-boundaries.md). Element
  // edges still apply: no simulators, no web. Matches the boundaries fixtures too.
  {
    files: ["**/apps/wallet-api/test/**/*.{ts,tsx}"],
    rules: { "boundaries/entry-point": ["error", { default: "allow" }] },
  },

  {
    files: ["apps/web/**/*.{ts,tsx}"],
    extends: [
      reactHooks.configs.flat["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      // Same severity as the Vite starter's lint config; shadcn/ui files export variants.
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
]);
