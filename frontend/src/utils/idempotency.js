/**
 * One key per logical submission. Retries of that submission reuse it;
 * a new submission gets a new key.
 * crypto.randomUUID() is cryptographically random (unlike Math.random),
 * so keys cannot collide or be guessed.
 */
export const generateIdempotencyKey = () => crypto.randomUUID();

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidAmount = (amount) => Number.isFinite(amount) && amount > 0;
