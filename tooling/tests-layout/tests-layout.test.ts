// Guards the test layout convention: every workspace test is named
// *.test.ts(x), lives in <workspace>/test/, and is selected by the vitest
// config that the workspace's `test` script runs (the one `turbo test` uses).
// It checks runner selection rather than paths, so a test in the wrong
// folder, a Nest-default *.spec.ts, an unusual extension or a narrowed
// include (e.g. one that drops *.e2e.test.ts) all fail here instead of
// silently never running. Lists tracked and untracked-but-not-ignored files
// through git.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const workspaceFile = /^((?:apps|simulators|packages)\/[^/]+)\/(.+)$/;
const testLike = /\.(test|spec)\.[cm]?[jt]sx?$/;
const defaultConfigs = ["vitest.config.ts", "vitest.config.mts"];

// -z keeps non-ASCII paths unquoted; existsSync drops paths moved on disk
// but not yet staged, which --cached still lists.
const files = execFileSync(
  "git",
  ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
  { cwd: repoRoot, encoding: "utf8" },
)
  .split("\0")
  .filter((file) => file && existsSync(path.join(repoRoot, file)));

const workspaces = [
  ...new Set(files.map((file) => workspaceFile.exec(file)?.[1])),
].filter(
  (ws): ws is string =>
    ws !== undefined && existsSync(path.join(repoRoot, ws, "package.json")),
);

type Selector = { root: string; include: string[] };

/** The include globs of the vitest config the workspace's `test` script runs. */
async function selectorOf(ws: string): Promise<Selector> {
  const dir = path.join(repoRoot, ws);
  const pkg = JSON.parse(
    readFileSync(path.join(dir, "package.json"), "utf8"),
  ) as {
    scripts?: Record<string, string>;
  };
  const script = pkg.scripts?.test ?? "";
  if (!/^vitest run\b/.test(script)) {
    throw new Error(
      `${ws}: the test script must be \`vitest run …\`, got "${script}"`,
    );
  }
  const configArg = /(?:--config|-c)[=\s]+(\S+)/.exec(script)?.[1];
  const name =
    configArg ?? defaultConfigs.find((n) => existsSync(path.join(dir, n)));
  if (!name) throw new Error(`${ws}: no vitest config for the test script`);
  const mod = (await import(pathToFileURL(path.join(dir, name)).href)) as {
    default: unknown;
  };
  const config = (
    typeof mod.default === "function"
      ? await (mod.default as (env: object) => unknown)({
          command: "serve",
          mode: "test",
        })
      : mod.default
  ) as { test?: { root?: string; include?: unknown } };
  const include = config.test?.include;
  if (!Array.isArray(include) || include.length === 0) {
    throw new Error(`${ws}/${name} must declare test.include explicitly`);
  }
  return {
    root: path.resolve(dir, config.test?.root ?? "."),
    include: include as string[],
  };
}

const selectorByWorkspace = new Map(
  await Promise.all(
    workspaces.map(async (ws) => [ws, await selectorOf(ws)] as const),
  ),
);

function isSelected(file: string, ws: string): boolean {
  const abs = path.join(repoRoot, file);
  const selector = selectorByWorkspace.get(ws);
  if (!selector) return false;
  const rel = path.relative(selector.root, abs).split(path.sep).join("/");
  return selector.include.some((glob) => path.matchesGlob(rel, glob));
}

const testFiles = files.flatMap((file) => {
  const match = workspaceFile.exec(file);
  return match && testLike.test(match[2]) ? [{ file, ws: match[1] }] : [];
});

test("every test-like file is selected by its workspace's test script", () => {
  const unselected = testFiles
    .filter(({ file, ws }) => !isSelected(file, ws))
    .map(({ file }) => file);
  expect(
    unselected,
    "not run by `turbo test`; name it *.test.ts(x) under <workspace>/test/",
  ).toEqual([]);
});

test("every workspace has at least one selected test", () => {
  expect(workspaces.length, "no workspaces found").toBeGreaterThan(0);
  const empty = workspaces.filter(
    (ws) => !testFiles.some((t) => t.ws === ws && isSelected(t.file, ws)),
  );
  expect(empty, "workspaces without a test their runner selects").toEqual([]);
});
