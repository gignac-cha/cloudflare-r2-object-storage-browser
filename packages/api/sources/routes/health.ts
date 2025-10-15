import type { FastifyInstance } from 'fastify';
import { options } from '../options.ts';

export async function registerHealthRoutes(server: FastifyInstance) {
  // Basic health check endpoint
  server.get('/', async () => {
    return {
      status: 'ok',
      message: options.app.name,
      version: options.app.version,
      timestamp: new Date().toISOString(),
    };
  });

  // Detailed health check with uptime
  server.get('/health', async () => {
    return {
      status: 'ok',
      service: options.app.name,
      version: options.app.version,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        unit: 'MB',
      },
    };
  });

  // Graceful shutdown endpoint (POST for safety)
  server.post('/shutdown', async (request, reply) => {
    server.log.info('Shutdown request received');

    reply.send({
      status: 'ok',
      message: 'Server is shutting down gracefully',
      timestamp: new Date().toISOString(),
    });

    // Allow response to be sent before closing
    setImmediate(async () => {
      try {
        await server.close();
        server.log.info('Server closed successfully');
        process.exit(0);
      } catch (err) {
        server.log.error(err, 'Error during shutdown');
        process.exit(1);
      }
    });
  });
}
