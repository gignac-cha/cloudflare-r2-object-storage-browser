/**
 * Request Logger Middleware
 *
 * Adds request IDs, logs incoming requests, and tracks response times.
 * Ensures sensitive data (credentials, tokens) is never logged.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';

/**
 * Register request logger middleware
 *
 * Features:
 * - Generate unique request ID (UUID v4) for each request
 * - Log incoming requests with sanitized data
 * - Log responses with status code and duration
 * - Sanitize sensitive headers and query parameters
 * - Track request processing time
 *
 * @param server - Fastify instance
 */
export function registerRequestLogger(server: FastifyInstance): void {
  // Add request ID to each request
  server.addHook('onRequest', async (request: FastifyRequest) => {
    // Generate UUID v4 for request tracking
    const requestId = randomUUID();
    (request as any).requestId = requestId;

    // Log incoming request with sanitized data
    const logData = {
      requestId,
      method: request.method,
      url: sanitizeUrl(request.url),
      params: request.params,
      query: sanitizeQuery(request.query as Record<string, unknown>),
      headers: sanitizeHeaders(request.headers),
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    };

    request.log.info(logData, 'Incoming request');
  });

  // Add response time tracking
  server.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = (request as any).requestId ?? 'unknown';
    const responseTime = reply.elapsedTime ?? 0;

    // Log response with status and duration
    const logData = {
      requestId,
      method: request.method,
      url: sanitizeUrl(request.url),
      statusCode: reply.statusCode,
      responseTime: `${responseTime.toFixed(2)}ms`,
      contentLength: reply.getHeader('content-length'),
    };

    // Log level based on status code
    if (reply.statusCode >= 500) {
      request.log.error(logData, 'Response error');
    } else if (reply.statusCode >= 400) {
      request.log.warn(logData, 'Response client error');
    } else {
      request.log.info(logData, 'Response success');
    }
  });

  // Log errors with request context
  server.addHook('onError', async (request: FastifyRequest, _reply: FastifyReply, error: Error) => {
    const requestId = (request as any).requestId ?? 'unknown';

    request.log.error({
      requestId,
      method: request.method,
      url: sanitizeUrl(request.url),
      errorName: error.name,
      errorMessage: error.message,
      // Stack trace is logged by error handler, not here
    }, 'Request processing error');
  });
}

// ============================================================================
// Sanitization Functions
// ============================================================================

/**
 * Sanitize URL by removing sensitive query parameters
 * Never log credentials, tokens, or API keys in URLs
 */
function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url, 'http://localhost');

    // Remove sensitive query parameters
    const sensitiveParams = [
      'token',
      'apiKey',
      'api_key',
      'accessKey',
      'access_key',
      'secretKey',
      'secret_key',
      'password',
      'pwd',
      'credentials',
    ];

    sensitiveParams.forEach(param => {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, '[REDACTED]');
      }
    });

    return urlObj.pathname + urlObj.search;
  } catch {
    // If URL parsing fails, return as-is
    return url;
  }
}

/**
 * Sanitize query parameters by redacting sensitive values
 */
function sanitizeQuery(query: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  // List of sensitive parameter names
  const sensitiveKeys = [
    'token',
    'apiKey',
    'api_key',
    'accessKey',
    'access_key',
    'secretKey',
    'secret_key',
    'password',
    'pwd',
    'credentials',
  ];

  for (const [key, value] of Object.entries(query)) {
    // Check if key is sensitive (case-insensitive)
    const isSensitive = sensitiveKeys.some(
      sensitive => key.toLowerCase().includes(sensitive.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize HTTP headers by redacting sensitive values
 * Never log authorization tokens, API keys, or cookies
 */
function sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  // List of sensitive headers (case-insensitive)
  const sensitiveHeaders = [
    'authorization',
    'x-api-key',
    'x-auth-token',
    'cookie',
    'set-cookie',
    'x-csrf-token',
    'x-access-token',
    'x-refresh-token',
  ];

  for (const [key, value] of Object.entries(headers)) {
    // Check if header is sensitive (case-insensitive)
    const isSensitive = sensitiveHeaders.some(
      sensitive => key.toLowerCase() === sensitive.toLowerCase()
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else {
      // Keep safe headers
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}μs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

/**
 * Extract request ID from request object
 * Useful for correlating logs across services
 */
export function getRequestId(request: FastifyRequest): string {
  return (request as any).requestId ?? 'unknown';
}
