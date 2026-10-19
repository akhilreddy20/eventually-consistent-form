import { createApp } from './app.js';

const PORT = process.env.PORT || 3001;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(JSON.stringify({
    msg: 'server started',
    port: Number(PORT),
    env: process.env.NODE_ENV || 'development',
    docs: `http://localhost:${PORT}/api-docs`,
  }));
});

// Graceful shutdown: stop accepting connections, let in-flight requests finish.
const shutdown = (signal) => {
  console.log(JSON.stringify({ msg: 'shutting down', signal }));
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
