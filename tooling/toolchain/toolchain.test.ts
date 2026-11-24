// Guards the "wrong Node" row of the Story 1.1 matrix: installs on Node < 26
// must be refused, and the repo pins Node 26 for nvm users.
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const read = (file: string) => readFileSync(path.join(repoRoot, file), "utf8");

interface RootPackageJson {
  engines?: { node?: string };
  packageManager?: string;
}
const rootPackage = () => JSON.parse(read("package.json")) as RootPackageJson;

test("package.json requires Node >= 26", () => {
  expect(rootPackage().engines?.node).toBe(">=26");
});

test(".npmrc makes the engines check fail the install", () => {
  expect(read(".npmrc")).toMatch(/^engine-strict=true$/m);
});

test(".nvmrc pins Node 26", () => {
  expect(read(".nvmrc").trim()).toBe("26");
});

test("the current runtime satisfies the pin", () => {
  expect(
    Number(process.versions.node.split(".")[0]),
    `running on Node ${process.version}`,
  ).toBeGreaterThanOrEqual(26);
});

test("package.json pins pnpm 10 through packageManager", () => {
  expect(rootPackage().packageManager ?? "").toMatch(/^pnpm@10\./);
});
