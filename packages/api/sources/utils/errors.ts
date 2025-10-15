/**
 * Error Handling Utilities
 *
 * Provides error classes and utilities for mapping AWS S3/R2 errors
 * to consistent API error responses.
 */

import type { ApiError, ErrorCode } from '../types/api.ts';
import { ERROR_STATUS_CODES } from '../types/api.ts';

/**
 * Get HTTP status code for an error code
 * @param errorCode - API error code
 * @returns HTTP status code
 */
export function getStatusCodeForError(errorCode: ErrorCode): number {
  return ERROR_STATUS_CODES[errorCode] ?? 500;
}

// ============================================================================
// Custom Error Class
// ============================================================================

/**
 * Application error class with error code and HTTP status
 * Extends native Error with additional context for API responses
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode ?? ERROR_STATUS_CODES[code];
    this.details = details;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Convert AppError to ApiError format for responses
   */
  toApiError(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

// ============================================================================
// S3/R2 Error Mapping
// ============================================================================

/**
 * AWS S3 error interface (subset of actual AWS SDK error)
 */
interface S3Error extends Error {
  name: string;
  $metadata?: {
    httpStatusCode?: number;
  };
  Code?: string;
  BucketName?: string;
  Key?: string;
}

/**
 * Type guard to check if error is an S3Error
 */
function isS3Error(error: unknown): error is S3Error {
  return (
    error instanceof Error &&
    (typeof (error as S3Error).$metadata === 'object' ||
      typeof (error as S3Error).Code === 'string')
  );
}

/**
 * Map AWS S3/R2 errors to application error codes
 *
 * @param error - Error from AWS SDK S3 client
 * @param context - Additional context (bucket name, object key, etc.)
 * @returns AppError with appropriate error code and status
 */
export function mapS3Error(
  error: unknown,
  context?: {
    bucketName?: string;
    objectKey?: string;
  }
): AppError {
  // Handle non-Error types
  if (!(error instanceof Error)) {
    return new AppError(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      500,
      { errorType: typeof error }
    );
  }

  // Check if it's an S3-specific error
  if (!isS3Error(error)) {
    // Generic error handling
    return new AppError(
      'INTERNAL_SERVER_ERROR',
      error.message ?? 'An unexpected error occurred',
      500,
      { errorName: error.name }
    );
  }

  // Extract error name (AWS SDK uses 'name' property)
  const errorName = error.name ?? error.Code ?? 'UnknownError';

  // Map S3 error names to API error codes
  switch (errorName) {
    // Resource Not Found Errors
    case 'NoSuchBucket':
      return new AppError(
        'BUCKET_NOT_FOUND',
        `Bucket '${context?.bucketName ?? 'unknown'}' does not exist`,
        404,
        { bucketName: context?.bucketName ?? error.BucketName }
      );

    case 'NoSuchKey':
      return new AppError(
        'OBJECT_NOT_FOUND',
        `Object '${context?.objectKey ?? 'unknown'}' does not exist in bucket '${context?.bucketName ?? 'unknown'}'`,
        404,
        {
          bucketName: context?.bucketName ?? error.BucketName,
          objectKey: context?.objectKey ?? error.Key,
        }
      );

    case 'NotFound':
      // Generic not found - determine resource type from context
      if (context?.objectKey) {
        return new AppError(
          'OBJECT_NOT_FOUND',
          `Object '${context.objectKey}' does not exist`,
          404,
          { bucketName: context.bucketName, objectKey: context.objectKey }
        );
      }
      return new AppError(
        'BUCKET_NOT_FOUND',
        `Bucket '${context?.bucketName ?? 'unknown'}' does not exist`,
        404,
        { bucketName: context?.bucketName }
      );

    // Authentication Errors
    case 'InvalidAccessKeyId':
    case 'SignatureDoesNotMatch':
    case 'InvalidToken':
      return new AppError(
        'AUTH_INVALID_CREDENTIALS',
        'Invalid R2 credentials. Please check your access key and secret.',
        401,
        { errorName }
      );

    case 'MissingSecurityHeader':
    case 'AuthorizationHeaderMalformed':
      return new AppError(
        'AUTH_MISSING_CREDENTIALS',
        'R2 credentials are not properly configured',
        401,
        { errorName }
      );

    case 'AccessDenied':
    case 'Forbidden':
      return new AppError(
        'AUTH_PERMISSION_DENIED',
        'Insufficient permissions for this operation',
        403,
        {
          errorName,
          bucketName: context?.bucketName,
          objectKey: context?.objectKey,
        }
      );

    // Validation Errors
    case 'InvalidBucketName':
      return new AppError(
        'VALIDATION_INVALID_PARAM',
        'Bucket name is invalid',
        400,
        { bucketName: context?.bucketName, errorName }
      );

    case 'KeyTooLongError':
      return new AppError(
        'VALIDATION_INVALID_KEY',
        'Object key exceeds maximum length (1024 bytes)',
        400,
        { objectKey: context?.objectKey, errorName }
      );

    case 'InvalidRange':
      return new AppError(
        'VALIDATION_INVALID_RANGE',
        'The requested range is not valid',
        416,
        { errorName }
      );

    case 'EntityTooLarge':
    case 'EntityTooSmall':
      return new AppError(
        'VALIDATION_FILE_TOO_LARGE',
        'File size exceeds allowed limits',
        413,
        { errorName }
      );

    // Conflict Errors
    case 'BucketAlreadyExists':
    case 'BucketAlreadyOwnedByYou':
      return new AppError(
        'BUCKET_ALREADY_EXISTS',
        `Bucket '${context?.bucketName ?? 'unknown'}' already exists`,
        409,
        { bucketName: context?.bucketName, errorName }
      );

    // Service Errors
    case 'ServiceUnavailable':
    case 'SlowDown':
      return new AppError(
        'R2_SERVICE_ERROR',
        'R2 service is temporarily unavailable',
        502,
        { errorName, retryAfter: '60s' }
      );

    case 'RequestTimeout':
    case 'OperationAborted':
      return new AppError('R2_TIMEOUT', 'Request to R2 timed out', 504, {
        errorName,
      });

    case 'TooManyRequests':
    case 'RequestLimitExceeded':
      return new AppError(
        'R2_RATE_LIMIT',
        'Rate limit exceeded. Please slow down your requests.',
        429,
        { errorName, retryAfter: '10s' }
      );

    // Network Errors
    case 'NetworkingError':
    case 'ENOTFOUND':
    case 'ECONNREFUSED':
    case 'ETIMEDOUT':
      return new AppError(
        'R2_NETWORK_ERROR',
        'Failed to connect to R2 service',
        502,
        { errorName }
      );

    // Default: Internal Server Error
    default:
      return new AppError(
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred while processing your request',
        500,
        {
          errorName,
          bucketName: context?.bucketName,
          objectKey: context?.objectKey,
        }
      );
  }
}

// ============================================================================
// Error Factory Functions
// ============================================================================

/**
 * Create validation error for missing required parameter
 */
export function createMissingParamError(paramName: string): AppError {
  return new AppError(
    'VALIDATION_INVALID_PARAM',
    `Required parameter '${paramName}' is missing`,
    400,
    { parameter: paramName }
  );
}

/**
 * Create validation error for invalid parameter format
 */
export function createInvalidParamError(
  paramName: string,
  expectedFormat: string,
  actualValue?: unknown
): AppError {
  return new AppError(
    'VALIDATION_INVALID_PARAM',
    `Parameter '${paramName}' has invalid format. Expected: ${expectedFormat}`,
    400,
    {
      parameter: paramName,
      expectedFormat,
      actualValue: actualValue !== undefined ? String(actualValue) : undefined,
    }
  );
}

/**
 * Create validation error for invalid object key
 */
export function createInvalidKeyError(
  key: string,
  reason: string
): AppError {
  return new AppError(
    'VALIDATION_INVALID_KEY',
    `Object key is invalid: ${reason}`,
    400,
    { objectKey: key, reason }
  );
}

/**
 * Create error for missing search query
 */
export function createMissingQueryError(): AppError {
  return new AppError(
    'VALIDATION_MISSING_QUERY',
    "Search query parameter 'q' is required",
    400,
    { parameter: 'q' }
  );
}

/**
 * Create generic internal server error
 */
export function createInternalError(
  message: string = 'An unexpected error occurred',
  details?: Record<string, unknown>
): AppError {
  return new AppError('INTERNAL_SERVER_ERROR', message, 500, details);
}

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Check if error is an AppError instance
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Get HTTP status code from error
 * Defaults to 500 for unknown errors
 */
export function getStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  if (isS3Error(error) && error.$metadata?.httpStatusCode) {
    return error.$metadata.httpStatusCode;
  }
  return 500;
}

/**
 * Get error code from error
 * Defaults to INTERNAL_SERVER_ERROR for unknown errors
 */
export function getErrorCode(error: unknown): ErrorCode {
  if (isAppError(error)) {
    return error.code;
  }
  return 'INTERNAL_SERVER_ERROR';
}

/**
 * Extract safe error message (never expose internal details)
 */
export function getSafeErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    // For non-AppErrors, return generic message to avoid leaking internals
    return 'An unexpected error occurred';
  }
  return 'An unknown error occurred';
}
