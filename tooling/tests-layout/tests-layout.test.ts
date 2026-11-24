// Guards the test layout convention: every workspace keeps its tests in
// <workspace>/test/ named *.test.ts(x). Each runner's include is anchored at
// test/, so a test anywhere else (or a Nest-default *.spec.ts) would silently
// never run. Lists tracked and untracked-but-not-ignored files through git.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { expect, test } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const workspaceFile = /^(apps|simulators|packages)\/[^/]+\/(.+)$/;

const workspaceFiles = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  { cwd: repoRoot, encoding: "utf8" },
)
  .split("\n")
  .filter((file) => workspaceFile.test(file));

test("no workspace uses *.spec.ts naming", () => {
  const specs = workspaceFiles.filter((file) => /[.-]spec\.tsx?$/.test(file));
  expect(specs, "rename to *.test.ts and move under <workspace>/test/").toEqual(
    [],
  );
});

test("every *.test.ts(x) lives under its workspace test/ folder", () => {
  const misplaced = workspaceFiles.filter((file) => {
    const inWorkspace = workspaceFile.exec(file)?.[2] ?? "";
    return (
      /\.test\.tsx?$/.test(inWorkspace) && !inWorkspace.startsWith("test/")
    );
  });
  expect(misplaced, "move these under <workspace>/test/").toEqual([]);
});
