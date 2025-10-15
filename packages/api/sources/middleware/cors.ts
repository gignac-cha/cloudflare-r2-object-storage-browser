import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { options } from '../options.ts';

/**
 * Register CORS middleware for the Fastify server.
 *
 * Security Configuration:
 * - Restricted to localhost origins only (development mode)
 * - Supports all localhost ports for flexibility
 * - Allows credentials for authenticated requests
 * - Exposes essential response headers for R2 operations
 *
 * CORS Policy:
 * - Allowed Origins: Configurable via CORS_ALLOWED_ORIGINS environment variable
 *   Default: http://localhost:3000, http://localhost:3001, http://localhost:8080
 * - Allowed Methods: GET, HEAD, PUT, POST, DELETE, OPTIONS
 * - Allowed Headers: Content-Type, Authorization, Range
 * - Exposed Headers: Content-Length, Content-Type, ETag, Last-Modified
 * - Credentials: true (allows cookies and authorization headers)
 * - Preflight Cache: 86400 seconds (24 hours)
 *
 * @param server - Fastify instance
 *
 * @example
 * ```typescript
 * const server = fastify();
 * await registerCors(server);
 * ```
 */
export async function registerCors(server: FastifyInstance): Promise<void> {
  const allowedOrigins = options.cors.allowedOrigins;

  server.log.info({
    allowedOrigins,
  }, 'Registering CORS middleware');

  await server.register(cors, {
    // Origin validation: Only allow localhost origins
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl)
      if (!origin) {
        callback(null, true);
        return;
      }

      try {
        const url = new URL(origin);
        const hostname = url.hostname;

        // Check if origin matches any allowed origin pattern
        const isAllowed = allowedOrigins.some((allowedOrigin) => {
          const allowedUrl = new URL(allowedOrigin);

          // Match hostname (must be localhost or 127.0.0.1)
          if (hostname !== allowedUrl.hostname) {
            return false;
          }

          // If allowed origin specifies a port, match it exactly
          // Otherwise allow any port on the same hostname
          if (allowedUrl.port && url.port !== allowedUrl.port) {
            return false;
          }

          return true;
        });

        if (isAllowed) {
          server.log.debug({ origin }, 'CORS: Allowing origin');
          callback(null, true);
        } else {
          server.log.warn({ origin, allowedOrigins }, 'CORS: Rejecting origin');
          callback(new Error('Not allowed by CORS'), false);
        }
      } catch (error) {
        server.log.error({ origin, error }, 'CORS: Invalid origin URL');
        callback(new Error('Invalid origin'), false);
      }
    },

    // HTTP methods allowed for CORS requests
    methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'OPTIONS'],

    // Request headers that can be used when making the actual request
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Range', // Required for partial downloads
    ],

    // Response headers that can be accessed by the client
    exposedHeaders: [
      'Content-Length',
      'Content-Type',
      'ETag',
      'Last-Modified',
    ],

    // Allow credentials (cookies, authorization headers)
    credentials: true,

    // Cache preflight response for 24 hours
    maxAge: 86400,

    // Use 204 No Content for successful OPTIONS requests
    optionsSuccessStatus: 204,

    // Strict preflight validation (reject invalid preflight requests)
    strictPreflight: true,

    // Hide OPTIONS route from documentation
    hideOptionsRoute: true,
  });

  server.log.info({}, 'CORS middleware registered successfully');
}
