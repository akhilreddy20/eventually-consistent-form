// Optional chaining lets this module load under plain Node (unit tests), where
// import.meta.env does not exist; Vite still replaces it at build time.
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001';

export const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 8000,
  // Must exceed the server's slowest legitimate response (simulated 5–10 s).
  requestTimeoutMs: 15000,
};

// 408/429 and 5xx gateway-style errors are safe to retry because every
// attempt carries the same idempotency key.
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Exponential backoff with "full jitter" (AWS Architecture Blog):
 * spreads retries out so many clients don't hammer a recovering server
 * at the same instant.
 */
export const getBackoffDelay = (attempt, config = RETRY_CONFIG, random = Math.random) => {
  const cap = Math.min(
    config.maxDelayMs,
    config.initialDelayMs * config.backoffMultiplier ** (attempt - 1)
  );
  return Math.floor(random() * cap);
};

class RetryableError extends Error {}

const parseRetryAfter = (response) => {
  const seconds = Number(response.headers.get('Retry-After'));
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null;
};

/**
 * POST a submission, retrying transient failures with the SAME idempotency
 * key so the server can de-duplicate.
 */
export const submitForm = async (data, idempotencyKey, onRetry, deps = {}) => {
  const {
    fetchImpl = fetch,
    sleepImpl = sleep,
    random = Math.random,
    config = RETRY_CONFIG,
  } = deps;

  let lastError = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    let serverDelayMs = null;

    try {
      const response = await fetchImpl(`${API_BASE_URL}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({ ...data, idempotencyKey }),
        signal: controller.signal,
      });

      if (response.ok) return await response.json();

      if (!RETRYABLE_STATUS.has(response.status)) {
        // 4xx: retrying will not help — surface the server's message.
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Request failed with status ${response.status}`);
      }

      serverDelayMs = parseRetryAfter(response);
      throw new RetryableError(`Service temporarily unavailable (HTTP ${response.status})`);
    } catch (error) {
      const isTimeout = error.name === 'AbortError';
      const isNetwork = error instanceof TypeError;
      if (!(error instanceof RetryableError) && !isTimeout && !isNetwork) throw error;

      lastError = isTimeout
        ? new Error('Request timed out')
        : isNetwork
          ? new Error('Network error - please check your connection')
          : error;

      if (attempt < config.maxAttempts) {
        onRetry?.(attempt, config.maxAttempts);
        const backoff = getBackoffDelay(attempt, config, random);
        await sleepImpl(Math.max(backoff, serverDelayMs ?? 0));
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new Error('Request failed after maximum retries');
};

export const fetchSubmissions = async () => {
  const response = await fetch(`${API_BASE_URL}/api/submissions`);
  if (!response.ok) throw new Error('Failed to fetch submissions');
  return response.json();
};

export const clearSubmissions = async () => {
  const response = await fetch(`${API_BASE_URL}/api/submissions/clear`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to clear submissions');
};
