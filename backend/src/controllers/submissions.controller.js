import express from 'express';
import defaultService from '../services/submissions.service.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_KEY_LENGTH = 255;

export const validateSubmission = ({ email, amount, idempotencyKey }) => {
  const missing = [];
  if (email === undefined || email === '') missing.push('email');
  if (amount === undefined || amount === null) missing.push('amount');
  if (!idempotencyKey) missing.push('idempotencyKey');
  if (missing.length) return { error: 'Missing required fields', required: missing };
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) return { error: 'Invalid email format' };
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return { error: 'Amount must be a positive number' };
  }
  if (typeof idempotencyKey !== 'string' || idempotencyKey.length > MAX_KEY_LENGTH) {
    return { error: `idempotencyKey must be a string of at most ${MAX_KEY_LENGTH} characters` };
  }
  return null;
};

export const createSubmissionsRouter = (service = defaultService) => {
  const router = express.Router();

  /**
   * @swagger
   * /api/submissions:
   *   post:
   *     summary: Create a new submission
   *     description: |
   *       Submits a new form with random API behavior for testing resilience.
   *       
   *       **Behavior:**
   *       - 40% chance of immediate success (200)
   *       - 30% chance of temporary failure (503) - client should retry
   *       - 30% chance of delayed success (5-10 second wait, then 200)
   *       
   *       **Idempotency:**
   *       Uses the `idempotencyKey` to prevent duplicate submissions. If the same key is sent multiple times (e.g., due to retries), the server returns the cached response without creating duplicates.
   *     tags: [Submissions]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - amount
   *               - idempotencyKey
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: User's email address
   *                 example: user@example.com
   *               amount:
   *                 type: number
   *                 format: double
   *                 minimum: 0.01
   *                 description: Amount value (must be positive)
   *                 example: 100.50
   *               idempotencyKey:
   *                 type: string
   *                 description: Unique key to prevent duplicate submissions (a UUID is recommended)
   *                 example: 3b241101-e2bb-4255-8caf-4136c566a962
   *     parameters:
   *       - in: header
   *         name: Idempotency-Key
   *         schema: { type: string }
   *         description: Preferred way to send the key (body field is still accepted)
   *     responses:
   *       200:
   *         description: Submission created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   format: uuid
   *                   example: 550e8400-e29b-41d4-a716-446655440000
   *                 email:
   *                   type: string
   *                   example: user@example.com
   *                 amount:
   *                   type: number
   *                   example: 100.50
   *                 idempotencyKey:
   *                   type: string
   *                   example: 3b241101-e2bb-4255-8caf-4136c566a962
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *                   example: 2024-02-11T10:30:00.000Z
   *                 status:
   *                   type: string
   *                   enum: [success]
   *                   example: success
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: Invalid email format
   *       422:
   *         description: Idempotency key reused with a different request body
   *       503:
   *         description: Service temporarily unavailable (client should retry with exponential backoff)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: Service temporarily unavailable
   *                 message:
   *                   type: string
   *                   example: Service temporarily unavailable
   */
  router.post('/submissions', async (req, res, next) => {
    const idempotencyKey = req.get('Idempotency-Key') ?? req.body?.idempotencyKey;
    const { email, amount } = req.body ?? {};

    const invalid = validateSubmission({ email, amount, idempotencyKey });
    if (invalid) return res.status(400).json(invalid);

    try {
      const { submission, replayed } = await service.create({ email, amount, idempotencyKey });
      if (replayed) res.set('Idempotent-Replayed', 'true');
      return res.status(200).json(submission);
    } catch (error) {
      if (error.status === 503) {
        res.set('Retry-After', '1');
        return res.status(503).json({ error: 'Service temporarily unavailable' });
      }
      if (error.status === 422) return res.status(422).json({ error: error.message });
      return next(error);
    }
  });

  /**
   * @swagger
   * /api/submissions:
   *   get:
   *     summary: Get all submissions
   *     description: Retrieves all form submissions sorted by creation date (newest first)
   *     tags: [Submissions]
   *     responses:
   *       200:
   *         description: List of submissions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                     format: uuid
   *                   email:
   *                     type: string
   *                   amount:
   *                     type: number
   *                   idempotencyKey:
   *                     type: string
   *                   createdAt:
   *                     type: string
   *                     format: date-time
   *                   status:
   *                     type: string
   *                     enum: [success]
   *             example:
   *               - id: 550e8400-e29b-41d4-a716-446655440000
   *                 email: user@example.com
   *                 amount: 100.50
   *                 idempotencyKey: 3b241101-e2bb-4255-8caf-4136c566a962
   *                 createdAt: 2024-02-11T10:30:00.000Z
   *                 status: success
   *               - id: 660e8400-e29b-41d4-a716-446655440001
   *                 email: another@example.com
   *                 amount: 50.25
   *                 idempotencyKey: 9f8c0d3e-1c2b-4a5d-8e7f-6a5b4c3d2e1f
   *                 createdAt: 2024-02-11T10:25:00.000Z
   *                 status: success
   */
  router.get('/submissions', (req, res) => {
    res.status(200).json(service.findAll());
  });

  /**
   * @swagger
   * /api/submissions/clear:
   *   post:
   *     summary: Clear all submissions
   *     description: Deletes all submissions from the in-memory store. **Use for testing only.**
   *     tags: [Submissions]
   *     responses:
   *       200:
   *         description: All submissions cleared successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: All submissions cleared
   */
  router.post('/submissions/clear', (req, res) => {
    service.clear();
    res.status(200).json({ message: 'All submissions cleared' });
  });

  return router;
};

export default createSubmissionsRouter();
