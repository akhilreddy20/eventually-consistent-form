// Runs with Node's built-in test runner: `npm test`
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { submitForm, getBackoffDelay, RETRY_CONFIG } from '../src/services/api.js';

const jsonResponse = (status, body, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (h) => headers[h] ?? null },
  json: async () => body,
});

const sequence = (...outcomes) => {
  const fn = mock.fn(async () => {
    const next = outcomes.length > 1 ? outcomes.shift() : outcomes[0];
    if (next instanceof Error) throw next;
    return next;
  });
  return fn;
};

const deps = (fetchImpl) => ({ fetchImpl, sleepImpl: mock.fn(async () => {}), random: () => 0.5 });

describe('submitForm', () => {
  it('returns the submission on first success', async () => {
    const fetchImpl = sequence(jsonResponse(200, { id: '1' }));
    assert.deepEqual(await submitForm({ email: 'a@b.co', amount: 1 }, 'k', undefined, deps(fetchImpl)), { id: '1' });
    assert.equal(fetchImpl.mock.callCount(), 1);
  });

  it('retries 503 with the SAME idempotency key, then succeeds', async () => {
    const fetchImpl = sequence(jsonResponse(503, {}), jsonResponse(200, { id: '1' }));
    const onRetry = mock.fn();
    await submitForm({ email: 'a@b.co', amount: 1 }, 'key-123', onRetry, deps(fetchImpl));

    const keys = fetchImpl.mock.calls.map((c) => c.arguments[1].headers['Idempotency-Key']);
    assert.deepEqual(keys, ['key-123', 'key-123']);
    assert.deepEqual(onRetry.mock.calls[0].arguments, [1, RETRY_CONFIG.maxAttempts]);
  });

  it('does not retry 4xx errors and surfaces the server message', async () => {
    const fetchImpl = sequence(jsonResponse(400, { error: 'Invalid email format' }));
    await assert.rejects(submitForm({}, 'k', undefined, deps(fetchImpl)), /Invalid email format/);
    assert.equal(fetchImpl.mock.callCount(), 1);
  });

  it('retries network errors and gives up after maxAttempts', async () => {
    const fetchImpl = sequence(new TypeError('Failed to fetch'));
    await assert.rejects(submitForm({}, 'k', undefined, deps(fetchImpl)), /Network error/);
    assert.equal(fetchImpl.mock.callCount(), RETRY_CONFIG.maxAttempts);
  });

  it('treats an aborted (timed-out) request as retryable', async () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const fetchImpl = sequence(abort, jsonResponse(200, { id: '1' }));
    assert.deepEqual(await submitForm({}, 'k', undefined, deps(fetchImpl)), { id: '1' });
  });

  it('honours Retry-After when it is longer than the backoff', async () => {
    const fetchImpl = sequence(jsonResponse(503, {}, { 'Retry-After': '5' }), jsonResponse(200, { id: '1' }));
    const d = deps(fetchImpl);
    await submitForm({}, 'k', undefined, d);
    assert.equal(d.sleepImpl.mock.calls[0].arguments[0], 5000);
  });
});

describe('getBackoffDelay', () => {
  it('grows exponentially, is capped, and is jittered', () => {
    const max = () => 0.9999;
    assert.ok(getBackoffDelay(1, RETRY_CONFIG, max) < 1000);
    assert.ok(getBackoffDelay(3, RETRY_CONFIG, max) < 4000);
    assert.ok(getBackoffDelay(3, RETRY_CONFIG, max) > 2000);
    assert.ok(getBackoffDelay(10, RETRY_CONFIG, max) < RETRY_CONFIG.maxDelayMs);
    assert.equal(getBackoffDelay(2, RETRY_CONFIG, () => 0), 0);
  });
});
