import fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import { registerHealthRoutes } from './routes/health.ts';
import { registerBucketRoutes } from './routes/buckets.ts';
import { registerObjectRoutes } from './routes/objects.ts';
import { registerRequestLogger } from './middleware/request-logger.ts';
import { registerErrorHandler } from './middleware/error-handler.ts';
import { registerCors } from './middleware/cors.ts';

export async function createApp() {
  const server = fastify({
    logger: true,
    genReqId: () => randomUUID(),
    bodyLimit: 5 * 1024 * 1024 * 1024, // 5GB for file uploads
  });

  // Register middleware (order matters!)
  // 1. CORS - must be first to handle preflight requests
  await registerCors(server);

  // 2. Request logger - track all requests after CORS
  registerRequestLogger(server);

  // 3. Register routes
  await registerHealthRoutes(server);
  await registerBucketRoutes(server);
  await registerObjectRoutes(server);

  // 4. Error handler - must be last to catch all errors
  registerErrorHandler(server);

  return server;
}
