import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { SubmissionsService } from '../src/services/submissions.service.js';
import { withServer, post } from './http.js';

const appWith = (opts = { simulateFailures: false }) =>
  createApp({ service: new SubmissionsService(opts) });

const body = { email: 'a@example.com', amount: 25.5, idempotencyKey: 'k-1' };

test('POST /api/submissions returns 200 then replays with header', () =>
  withServer(appWith(), async (base) => {
    const first = await post(base, '/api/submissions', body);
    const second = await post(base, '/api/submissions', body);
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal((await second.json()).id, (await first.json()).id);
    assert.equal(second.headers.get('idempotent-replayed'), 'true');
  }));

test('Idempotency-Key header is accepted', () =>
  withServer(appWith(), async (base) => {
    const { email, amount } = body;
    const res = await post(base, '/api/submissions', { email, amount }, { 'Idempotency-Key': 'hdr-1' });
    assert.equal(res.status, 200);
  }));

test('same key with different body returns 422', () =>
  withServer(appWith(), async (base) => {
    await post(base, '/api/submissions', body);
    const res = await post(base, '/api/submissions', { ...body, amount: 1 });
    assert.equal(res.status, 422);
  }));

for (const [name, payload, expected] of [
  ['missing fields', {}, 'Missing required fields'],
  ['bad email', { ...body, email: 'nope' }, 'Invalid email format'],
  ['negative amount', { ...body, amount: -1 }, 'Amount must be a positive number'],
  ['string amount', { ...body, amount: '10' }, 'Amount must be a positive number'],
  ['zero amount', { ...body, amount: 0 }, 'Amount must be a positive number'],
]) {
  test(`400 on ${name}`, () =>
    withServer(appWith(), async (base) => {
      const res = await post(base, '/api/submissions', payload);
      assert.equal(res.status, 400);
      assert.equal((await res.json()).error, expected);
    }));
}

test('503 includes Retry-After and does not leak internals', () =>
  withServer(appWith({ random: () => 0.1 }), async (base) => {
    const res = await post(base, '/api/submissions', body);
    assert.equal(res.status, 503);
    assert.equal(res.headers.get('retry-after'), '1');
    assert.deepEqual(await res.json(), { error: 'Service temporarily unavailable' });
  }));

test('malformed JSON returns 400', () =>
  withServer(appWith(), async (base) => {
    const res = await post(base, '/api/submissions', '{"email":');
    assert.equal(res.status, 400);
  }));

test('GET /health and /api-docs.json respond', () =>
  withServer(appWith(), async (base) => {
    assert.equal((await fetch(`${base}/health`)).status, 200);
    const spec = await (await fetch(`${base}/api-docs.json`)).json();
    assert.ok(spec.paths['/api/submissions'], 'swagger spec should document submissions');
  }));
