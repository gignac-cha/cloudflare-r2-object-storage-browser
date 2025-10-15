/**
 * Response Formatting Utilities
 *
 * Provides helper functions for creating consistent API responses
 * following the standard envelope structure.
 */

import type { FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';
import type {
  ApiResponse,
  ResponseMeta,
  ErrorResponse,
  ErrorCode,
  ApiError,
} from '../types/api.ts';
import {
  AppError,
  isAppError,
  getStatusCode,
  getErrorCode,
  getSafeErrorMessage,
} from './errors.ts';

// ============================================================================
// Response Metadata
// ============================================================================

/**
 * Generate response metadata with timestamp and unique request ID
 *
 * @param requestId - Optional request ID from Fastify request object
 * @returns Response metadata with timestamp and request ID
 */
export function createResponseMeta(requestId?: string): ResponseMeta {
  return {
    timestamp: new Date().toISOString(),
    requestId: requestId ?? randomUUID(),
  };
}

// ============================================================================
// Success Response Helpers
// ============================================================================

/**
 * Create a successful API response with consistent envelope structure
 *
 * @param reply - Fastify reply object
 * @param statusCode - HTTP status code (typically 200 or 201)
 * @param data - Response data payload
 * @returns Formatted success response
 *
 * @example
 * ```typescript
 * return createSuccessResponse(reply, 200, {
 *   buckets: [{ name: 'my-bucket', creationDate: '2025-10-14' }]
 * });
 * ```
 */
export function createSuccessResponse<T>(
  reply: FastifyReply,
  statusCode: number,
  data: T
): ApiResponse<T> {
  reply.status(statusCode);
  return {
    status: 'ok',
    data,
    meta: createResponseMeta(reply.request.id),
  };
}

/**
 * Create a success response with pagination information
 *
 * @param reply - Fastify reply object
 * @param statusCode - HTTP status code
 * @param data - Array of items
 * @param pagination - Pagination metadata
 * @returns Formatted paginated response
 */
export function createPaginatedResponse<T>(
  reply: FastifyReply,
  statusCode: number,
  data: T[],
  pagination: {
    isTruncated: boolean;
    maxKeys: number;
    keyCount: number;
    prefix?: string;
    delimiter?: string;
    continuationToken?: string;
    nextContinuationToken?: string;
    commonPrefixes?: string[];
  }
): ApiResponse<T[]> & { pagination: typeof pagination } {
  reply.status(statusCode);
  return {
    status: 'ok',
    data,
    pagination,
    meta: createResponseMeta(reply.request.id),
  };
}

// ============================================================================
// Error Response Helpers
// ============================================================================

/**
 * Create an error API response with consistent envelope structure
 *
 * @param reply - Fastify reply object
 * @param statusCode - HTTP status code (4xx or 5xx)
 * @param code - Machine-readable error code
 * @param message - Human-readable error message
 * @param details - Optional additional error context
 * @returns Formatted error response
 *
 * @example
 * ```typescript
 * return createErrorResponse(
 *   reply,
 *   404,
 *   'BUCKET_NOT_FOUND',
 *   'Bucket does not exist',
 *   { bucketName: 'my-bucket' }
 * );
 * ```
 */
export function createErrorResponse(
  reply: FastifyReply,
  statusCode: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): ErrorResponse {
  reply.status(statusCode);
  return {
    status: 'error',
    error: {
      code,
      message,
      details,
    },
    meta: createResponseMeta(reply.request.id),
  };
}

/**
 * Create error response from AppError instance
 *
 * @param reply - Fastify reply object
 * @param error - AppError instance
 * @returns Formatted error response
 *
 * @example
 * ```typescript
 * const error = new AppError('BUCKET_NOT_FOUND', 'Bucket not found', 404);
 * return createErrorFromAppError(reply, error);
 * ```
 */
export function createErrorFromAppError(
  reply: FastifyReply,
  error: AppError
): ErrorResponse {
  return createErrorResponse(
    reply,
    error.statusCode,
    error.code,
    error.message,
    error.details
  );
}

/**
 * Create error response from any error type
 * Automatically maps AppError, S3Error, or generic Error to API error response
 *
 * @param reply - Fastify reply object
 * @param error - Any error object
 * @param fallbackMessage - Optional fallback message for unknown errors
 * @returns Formatted error response
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   return createErrorFromException(reply, error);
 * }
 * ```
 */
export function createErrorFromException(
  reply: FastifyReply,
  error: unknown,
  fallbackMessage?: string
): ErrorResponse {
  if (isAppError(error)) {
    return createErrorFromAppError(reply, error);
  }

  const statusCode = getStatusCode(error);
  const errorCode = getErrorCode(error);
  const message = getSafeErrorMessage(error) ?? fallbackMessage ?? 'An unexpected error occurred';

  return createErrorResponse(reply, statusCode, errorCode, message);
}

// ============================================================================
// Specialized Response Helpers
// ============================================================================

/**
 * Create a 404 Not Found response for missing bucket
 */
export function createBucketNotFoundResponse(
  reply: FastifyReply,
  bucketName: string
): ErrorResponse {
  return createErrorResponse(
    reply,
    404,
    'BUCKET_NOT_FOUND',
    `Bucket '${bucketName}' does not exist`,
    { bucketName }
  );
}

/**
 * Create a 404 Not Found response for missing object
 */
export function createObjectNotFoundResponse(
  reply: FastifyReply,
  bucketName: string,
  objectKey: string
): ErrorResponse {
  return createErrorResponse(
    reply,
    404,
    'OBJECT_NOT_FOUND',
    `Object '${objectKey}' does not exist in bucket '${bucketName}'`,
    { bucketName, objectKey }
  );
}

/**
 * Create a 400 Bad Request response for invalid parameter
 */
export function createInvalidParamResponse(
  reply: FastifyReply,
  paramName: string,
  expectedFormat: string
): ErrorResponse {
  return createErrorResponse(
    reply,
    400,
    'VALIDATION_INVALID_PARAM',
    `Parameter '${paramName}' has invalid format. Expected: ${expectedFormat}`,
    { parameter: paramName, expectedFormat }
  );
}

/**
 * Create a 400 Bad Request response for missing required parameter
 */
export function createMissingParamResponse(
  reply: FastifyReply,
  paramName: string
): ErrorResponse {
  return createErrorResponse(
    reply,
    400,
    'VALIDATION_INVALID_PARAM',
    `Required parameter '${paramName}' is missing`,
    { parameter: paramName }
  );
}

/**
 * Create a 401 Unauthorized response for authentication errors
 */
export function createAuthErrorResponse(
  reply: FastifyReply,
  message: string = 'Invalid R2 credentials'
): ErrorResponse {
  return createErrorResponse(
    reply,
    401,
    'AUTH_INVALID_CREDENTIALS',
    message
  );
}

/**
 * Create a 403 Forbidden response for permission errors
 */
export function createPermissionDeniedResponse(
  reply: FastifyReply,
  operation: string
): ErrorResponse {
  return createErrorResponse(
    reply,
    403,
    'AUTH_PERMISSION_DENIED',
    `Insufficient permissions to ${operation}`,
    { operation }
  );
}

/**
 * Create a 500 Internal Server Error response
 */
export function createInternalErrorResponse(
  reply: FastifyReply,
  message: string = 'An unexpected error occurred'
): ErrorResponse {
  return createErrorResponse(reply, 500, 'INTERNAL_SERVER_ERROR', message);
}

/**
 * Create a 502 Bad Gateway response for R2 service errors
 */
export function createR2ServiceErrorResponse(
  reply: FastifyReply,
  operation: string
): ErrorResponse {
  return createErrorResponse(
    reply,
    502,
    'R2_SERVICE_ERROR',
    `R2 service error while ${operation}`,
    { operation }
  );
}

/**
 * Create a 504 Gateway Timeout response for R2 timeouts
 */
export function createR2TimeoutResponse(reply: FastifyReply): ErrorResponse {
  return createErrorResponse(
    reply,
    504,
    'R2_TIMEOUT',
    'Request to R2 timed out. Please try again.'
  );
}

// ============================================================================
// Response Type Guards
// ============================================================================

/**
 * Check if response is a success response
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { status: 'ok'; data: T } {
  return response.status === 'ok' && response.data !== undefined;
}

/**
 * Check if response is an error response
 */
export function isErrorResponse(
  response: ApiResponse
): response is ErrorResponse {
  return response.status === 'error' && response.error !== undefined;
}

// ============================================================================
// Response Logging Helpers
// ============================================================================

/**
 * Extract key information from response for logging
 * Safe to log (excludes sensitive data)
 */
export function getResponseLogInfo(response: ApiResponse): {
  status: string;
  requestId: string;
  timestamp: string;
  errorCode?: ErrorCode;
} {
  return {
    status: response.status,
    requestId: response.meta.requestId,
    timestamp: response.meta.timestamp,
    errorCode: response.error?.code,
  };
}

/**
 * Create a sanitized error object safe for logging
 * Removes sensitive details but keeps useful debugging info
 */
export function createSafeErrorLog(error: unknown): {
  name: string;
  message: string;
  code?: ErrorCode;
  statusCode?: number;
} {
  if (isAppError(error)) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
  };
}
