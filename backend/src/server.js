import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import submissionsController from './controllers/submissions.controller.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
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


app.use('/api', submissionsController);


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


app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('🚀 Eventually Consistent Form - Backend Server');
  console.log('='.repeat(60));
  console.log('');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check:      http://localhost:${PORT}/health`);
  console.log(`📝 API endpoint:      http://localhost:${PORT}/api/submissions`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log('');
  console.log('📊 API Behavior (Random):');
  console.log('   - 40% Immediate success');
  console.log('   - 30% Temporary failure (503)');
  console.log('   - 30% Delayed success (5-10s)');
  console.log('');
  console.log('🔧 Environment:       ' + (process.env.NODE_ENV || 'development'));
  console.log('📅 Started at:        ' + new Date().toISOString());
  console.log('');
  console.log('='.repeat(60));
  console.log('');
  console.log('✅ Server is ready! Press Ctrl+C to stop.');
  console.log('');
});


process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;