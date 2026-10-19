import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SubmissionsService, IdempotencyConflictError } from '../src/services/submissions.service.js';

const payload = { email: 'a@example.com', amount: 10, idempotencyKey: 'key-1' };

// Deterministic "random" sequence: each call returns the next value.
const seq = (...values) => () => values.shift() ?? 0.99;

test('creates a submission and replays it for the same key', async () => {
  const svc = new SubmissionsService({ simulateFailures: false });
  const first = await svc.create(payload);
  const second = await svc.create(payload);

  assert.equal(first.replayed, false);
  assert.equal(second.replayed, true);
  assert.equal(second.submission.id, first.submission.id);
  assert.equal(svc.findAll().length, 1);
});

test('concurrent requests with the same key create exactly one record', async () => {
  let release;
  const gate = new Promise((r) => { release = r; });
  // First roll 0.5 => "delayed success" path; sleep waits until we release it.
  const svc = new SubmissionsService({ random: seq(0.5, 0), sleep: () => gate });

  const inflight = Array.from({ length: 50 }, () => svc.create(payload));
  release();
  const results = await Promise.all(inflight);

  const ids = new Set(results.map((r) => r.submission.id));
  assert.equal(ids.size, 1, 'all callers must receive the same submission');
  assert.equal(svc.findAll().length, 1, 'only one record may be stored');
  assert.equal(results.filter((r) => !r.replayed).length, 1);
});

test('reusing a key with a different body is rejected', async () => {
  const svc = new SubmissionsService({ simulateFailures: false });
  await svc.create(payload);
  await assert.rejects(svc.create({ ...payload, amount: 999 }), IdempotencyConflictError);
});

test('reusing an in-flight key with a different body is rejected', async () => {
  let release;
  const gate = new Promise((r) => { release = r; });
  const svc = new SubmissionsService({ random: seq(0.5, 0), sleep: () => gate });
  const first = svc.create(payload);
  await assert.rejects(svc.create({ ...payload, email: 'b@example.com' }), IdempotencyConflictError);
  release();
  await first;
});

test('a transient failure does not poison the key; a retry succeeds', async () => {
  const svc = new SubmissionsService({ random: seq(0.1, 0.9) }); // fail, then succeed
  await assert.rejects(svc.create(payload), { status: 503 });
  const retry = await svc.create(payload);
  assert.equal(retry.replayed, false);
  assert.equal(svc.findAll().length, 1);
});

test('clear() removes submissions and keys', async () => {
  const svc = new SubmissionsService({ simulateFailures: false });
  await svc.create(payload);
  svc.clear();
  assert.equal(svc.findAll().length, 0);
  const again = await svc.create(payload);
  assert.equal(again.replayed, false);
});
