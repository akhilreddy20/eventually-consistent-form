import express from 'express';
import submissionsService from '../services/submissions.service.js';

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
 *                 description: Unique key to prevent duplicate submissions (format timestamp-random)
 *                 example: 1709123456789-x7k9m2p4q
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
 *                   example: 1709123456789-x7k9m2p4q
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
router.post('/submissions', async (req, res) => {
  try {
    const { email, amount, idempotencyKey } = req.body;

    if (!email || !amount || !idempotencyKey) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'amount', 'idempotencyKey']
      });
    }


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }


    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be a positive number'
      });
    }


    const submission = await submissionsService.create({
      email,
      amount,
      idempotencyKey
    });


    res.status(200).json(submission);

  } catch (error) {

    if (error.status === 503) {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: error.message
      });
    }

    console.error('Error creating submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
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
 *                 idempotencyKey: 1709123456789-x7k9m2p4q
 *                 createdAt: 2024-02-11T10:30:00.000Z
 *                 status: success
 *               - id: 660e8400-e29b-41d4-a716-446655440001
 *                 email: another@example.com
 *                 amount: 50.25
 *                 idempotencyKey: 1709123456790-y8l0n3q5r
 *                 createdAt: 2024-02-11T10:25:00.000Z
 *                 status: success
 */
router.get('/submissions', (req, res) => {
  try {
    const submissions = submissionsService.findAll();
    res.status(200).json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
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
  try {
    submissionsService.clear();
    res.status(200).json({
      message: 'All submissions cleared'
    });
  } catch (error) {
    console.error('Error clearing submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;