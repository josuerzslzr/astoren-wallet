import { expect, test } from 'vitest';
import { Decimal } from '../src/index.ts';

test('re-exports decimal.js with exact decimal arithmetic', () => {
  expect(new Decimal('0.1').plus('0.2').toString()).toBe('0.3');
});
