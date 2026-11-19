// Guards the "wrong Node" row of the Story 1.1 matrix: installs on Node < 26
// must be refused, and the repo pins Node 26 for nvm users.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const read = (file: string) => readFileSync(path.join(repoRoot, file), 'utf8');

test('package.json requires Node >= 26', () => {
  assert.equal(JSON.parse(read('package.json')).engines?.node, '>=26');
});

test('.npmrc makes the engines check fail the install', () => {
  assert.match(read('.npmrc'), /^engine-strict=true$/m);
});

test('.nvmrc pins Node 26', () => {
  assert.equal(read('.nvmrc').trim(), '26');
});

test('the current runtime satisfies the pin', () => {
  assert.ok(Number(process.versions.node.split('.')[0]) >= 26, `running on Node ${process.version}`);
});

test('package.json pins pnpm 10 through packageManager', () => {
  assert.match(JSON.parse(read('package.json')).packageManager ?? '', /^pnpm@10\./);
});
