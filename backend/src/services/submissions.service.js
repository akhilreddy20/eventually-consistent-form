import { randomUUID, createHash } from 'node:crypto';

/**
 * Thrown when a client reuses an idempotency key with a different payload.
 * Mirrors Stripe's behaviour: a key identifies one logical operation.
 */
export class IdempotencyConflictError extends Error {
  constructor() {
    super('Idempotency key was already used with a different request body');
    this.status = 422;
  }
}

export class TransientError extends Error {
  constructor(message = 'Service temporarily unavailable') {
    super(message);
    this.status = 503;
  }
}

const fingerprint = ({ email, amount }) =>
  createHash('sha256').update(JSON.stringify({ email, amount })).digest('hex');

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * In-memory submissions store with idempotent create().
 *
 * Guarantees (single process):
 *  - A completed key always returns the same stored submission.
 *  - Concurrent requests with the same key share ONE in-flight operation,
 *    so a retry that arrives while the first attempt is still running
 *    cannot create a duplicate.
 *  - A failed attempt does not poison the key; the client may retry it.
 *
 * Not guaranteed: durability or multi-instance safety. For that, the key
 * table needs to live in a shared store with a unique constraint
 * (see README → "Limitations").
 */
export class SubmissionsService {
  constructor({ random = Math.random, sleep = defaultSleep, simulateFailures = true } = {}) {
    this.random = random;
    this.sleep = sleep;
    this.simulateFailures = simulateFailures;
    this.completed = new Map(); // key -> { hash, submission }
    this.inFlight = new Map(); // key -> { hash, promise }
    this.submissionsList = [];
  }

  async create({ email, amount, idempotencyKey }) {
    const hash = fingerprint({ email, amount });

    const done = this.completed.get(idempotencyKey);
    if (done) {
      if (done.hash !== hash) throw new IdempotencyConflictError();
      return { submission: done.submission, replayed: true };
    }

    const pending = this.inFlight.get(idempotencyKey);
    if (pending) {
      if (pending.hash !== hash) throw new IdempotencyConflictError();
      const submission = await pending.promise;
      return { submission, replayed: true };
    }

    // Register the in-flight operation synchronously, before any await,
    // so a concurrent request with the same key observes it.
    const promise = this.#process({ email, amount, idempotencyKey });
    this.inFlight.set(idempotencyKey, { hash, promise });

    try {
      const submission = await promise;
      this.completed.set(idempotencyKey, { hash, submission });
      return { submission, replayed: false };
    } finally {
      this.inFlight.delete(idempotencyKey);
    }
  }

  async #process({ email, amount, idempotencyKey }) {
    if (this.simulateFailures) {
      const roll = this.random();
      if (roll < 0.3) throw new TransientError();
      if (roll < 0.6) await this.sleep(5000 + Math.floor(this.random() * 5000));
    }

    const submission = {
      id: randomUUID(),
      email,
      amount,
      idempotencyKey,
      createdAt: new Date().toISOString(),
      status: 'success',
    };
    this.submissionsList.push(submission);
    return submission;
  }

  findAll() {
    return [...this.submissionsList].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  clear() {
    this.completed.clear();
    this.inFlight.clear();
    this.submissionsList = [];
  }
}

export default new SubmissionsService({
  simulateFailures: process.env.SIMULATE_FAILURES !== 'false',
});
