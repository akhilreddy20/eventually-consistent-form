import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Eventually Consistent Form API',
      version: '1.0.0',
      description: `
        A resilient REST API demonstrating production-ready patterns for handling unreliable network requests.
        
        ## Features
        - **Automatic Retry Logic**: Exponential backoff (1s → 2s → 4s)
        - **Idempotency**: Prevents duplicate submissions
        - **Mock Behavior**: Random responses for testing (40% success, 30% failure, 30% delayed)
        - **Clear Error Messages**: Helpful validation and error responses
        
        ## Key Concepts
        
        ### Idempotency Keys
        Each submission requires a unique \`idempotencyKey\`. The server caches responses by this key, ensuring that retries don't create duplicate records.
        
        Example: \`1709123456789-x7k9m2p4q\`
        
        ### Mock API Behavior
        The API randomly responds with:
        - **40%** - Immediate success (HTTP 200)
        - **30%** - Temporary failure (HTTP 503) - triggers retry
        - **30%** - Delayed success (5-10 second wait, then HTTP 200)
        
        ### Retry Strategy
        - Maximum 3 attempts
        - Exponential backoff: 1s, 2s, 4s
        - Only retries on 503 errors
        - Total max wait: 7 seconds
      `,
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://your-production-url.com',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Submissions',
        description: 'Form submission endpoints'
      },
      {
        name: 'Health',
        description: 'Server health check'
      }
    ]
  },
  apis: ['./src/controllers/*.js', './src/server.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;