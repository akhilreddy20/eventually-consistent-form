import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { createSubmissionsRouter } from './controllers/submissions.controller.js';
import defaultService from './services/submissions.service.js';

export const createApp = ({ service = defaultService } = {}) => {
  const app = express();

  const allowedOrigins = (process.env.CORS_ORIGINS ||
    'http://localhost:5173,https://eventually-consistent-form-mocha.vercel.app')
    .split(',')
    .map((o) => o.trim());

  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    exposedHeaders: ['Idempotent-Replayed', 'Retry-After']
  }));

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      if (process.env.NODE_ENV === 'test') return;
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Math.round(durationMs),
      }));
    });
    next();
  });

  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check
   *     description: Check if the server is running and responsive
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Server is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: OK
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: 2024-02-11T10:30:00.000Z
   *                 uptime:
   *                   type: number
   *                   description: Server uptime in seconds
   *                   example: 123.456
   */

  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });


  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Eventually Consistent Form API'
  }));


  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });


  app.use('/api', createSubmissionsRouter(service));


  app.get('/', (req, res) => {
    res.status(200).json({
      name: 'Eventually Consistent Form API',
      version: '1.0.0',
      description: 'Backend API for form submissions with retry logic',
      endpoints: {
        health: 'GET /health',
        submissions: {
          create: 'POST /api/submissions',
          list: 'GET /api/submissions',
          clear: 'POST /api/submissions/clear'
        }
      }
    });
  });


  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
      availableEndpoints: [
        'GET /',
        'GET /health',
        'POST /api/submissions',
        'GET /api/submissions',
        'POST /api/submissions/clear'
      ]
    });
  });


  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // Malformed JSON from express.json()
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Malformed JSON body' });
    }
    console.error('Unhandled error:', err);
    // Never leak internal error messages to clients outside development.
    return res.status(500).json({
      error: 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { message: err.message, stack: err.stack }),
    });
  });

  return app;
};

export default createApp;
