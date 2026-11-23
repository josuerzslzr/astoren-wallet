import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spikeEchoRequestSchema } from '../src/spike.schema.ts';

test('spikeEchoRequestSchema accepts a valid body and applies defaults', () => {
  assert.deepEqual(spikeEchoRequestSchema.parse({ message: 'hi' }), { message: 'hi', count: 1 });
});

test('spikeEchoRequestSchema rejects an empty message', () => {
  assert.equal(spikeEchoRequestSchema.safeParse({ message: '' }).success, false);
});
