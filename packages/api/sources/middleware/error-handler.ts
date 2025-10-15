/**
 * Error Handler Middleware
 *
 * Global error handler for catching all unhandled errors in Fastify routes.
 * Provides consistent error responses and proper logging.
 */

import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { createErrorFromException, createSafeErrorLog } from '../utils/response.ts';
import { isAppError, mapS3Error } from '../utils/errors.ts';

/**
 * Register global error handler middleware
 *
 * This handler catches:
 * - AppError instances (our custom errors)
 * - S3/R2 errors from AWS SDK
 * - Fastify validation errors
 * - Generic JavaScript errors
 * - Non-error objects thrown
 *
 * @param server - Fastify instance
 */
export function registerErrorHandler(server: FastifyInstance): void {
  server.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    // Extract request context for logging
    const requestContext = {
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query,
      requestId: (request as any).requestId ?? 'unknown',
      userAgent: request.headers['user-agent'],
    };

    // Log error with context (sanitized)
    const safeErrorLog = createSafeErrorLog(error);
    server.log.error({
      error: safeErrorLog,
      context: requestContext,
      stack: error.stack,
    }, 'Request error');

    // Handle Fastify-specific errors
    if (isFastifyError(error)) {
      return handleFastifyError(error, reply);
    }

    // Handle our AppError instances
    if (isAppError(error)) {
      return createErrorFromException(reply, error);
    }

    // Try to map S3 errors
    try {
      const mappedError = mapS3Error(error);
      return createErrorFromException(reply, mappedError);
    } catch (mappingError) {
      // If mapping fails, fall through to generic handler
      server.log.warn({
        originalError: error.message,
        mappingError: mappingError instanceof Error ? mappingError.message : String(mappingError),
      }, 'Failed to map error, using generic handler');
    }

    // Generic error handler (fallback)
    return createErrorFromException(
      reply,
      error,
      'An unexpected error occurred while processing your request'
    );
  });
}

/**
 * Type guard to check if error is a Fastify error
 */
function isFastifyError(error: Error): error is FastifyError {
  return 'statusCode' in error && typeof (error as FastifyError).statusCode === 'number';
}

/**
 * Handle Fastify-specific errors (validation, not found, etc.)
 *
 * Common Fastify errors:
 * - FST_ERR_VALIDATION: Request validation failed
 * - FST_ERR_NOT_FOUND: Route not found (404)
 * - FST_ERR_BAD_REQUEST: Malformed request
 * - FST_ERR_PAYLOAD_TOO_LARGE: Request body too large
 */
function handleFastifyError(error: FastifyError, reply: FastifyReply) {
  const statusCode = error.statusCode ?? 500;

  // Validation errors
  if (error.code === 'FST_ERR_VALIDATION') {
    return reply.status(400).send({
      status: 'error',
      error: {
        code: 'VALIDATION_INVALID_PARAM',
        message: 'Request validation failed',
        details: {
          validation: error.validation ?? [],
          validationContext: error.validationContext,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (reply.request as any).requestId ?? 'unknown',
      },
    });
  }

  // Not found errors
  if (error.code === 'FST_ERR_NOT_FOUND') {
    return reply.status(404).send({
      status: 'error',
      error: {
        code: 'VALIDATION_INVALID_PARAM',
        message: `Route ${reply.request.method} ${reply.request.url} not found`,
        details: {
          method: reply.request.method,
          url: reply.request.url,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (reply.request as any).requestId ?? 'unknown',
      },
    });
  }

  // Payload too large
  if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
    return reply.status(413).send({
      status: 'error',
      error: {
        code: 'VALIDATION_FILE_TOO_LARGE',
        message: 'Request payload exceeds maximum allowed size',
        details: {
          maxSize: error.message,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (reply.request as any).requestId ?? 'unknown',
      },
    });
  }

  // Generic Fastify error
  return reply.status(statusCode).send({
    status: 'error',
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message ?? 'An unexpected error occurred',
      details: {
        errorCode: error.code,
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: (reply.request as any).requestId ?? 'unknown',
    },
  });
}
