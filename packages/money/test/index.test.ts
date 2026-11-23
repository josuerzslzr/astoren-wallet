import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Decimal } from '../src/index.ts';

test('re-exports decimal.js with exact decimal arithmetic', () => {
  assert.equal(new Decimal('0.1').plus('0.2').toString(), '0.3');
});
