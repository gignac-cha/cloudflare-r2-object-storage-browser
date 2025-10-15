/**
 * API Type Definitions
 *
 * Complete TypeScript type definitions for the R2 Object Storage Browser API.
 * Based on API_ROUTES_SPEC.md v1.0.0
 */

// ============================================================================
// Common Types
// ============================================================================

/**
 * Standard API response envelope
 * All API responses follow this consistent structure
 */
export interface ApiResponse<T = unknown> {
  status: 'ok' | 'error';
  data?: T;
  error?: ApiError;
  meta: ResponseMeta;
}

/**
 * Response metadata included in every API response
 */
export interface ResponseMeta {
  /** ISO 8601 UTC timestamp when response was generated */
  timestamp: string;
  /** UUID v4 for request tracking and debugging */
  requestId: string;
}

/**
 * Error details structure for error responses
 */
export interface ApiError {
  /** Machine-readable error code */
  code: ErrorCode;
  /** Human-readable error message */
  message: string;
  /** Optional additional context about the error */
  details?: Record<string, unknown>;
}

/**
 * Comprehensive error codes enum
 * Organized by category for easy maintenance
 */
export type ErrorCode =
  // Authentication Errors (1xxx)
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_MISSING_CREDENTIALS'
  | 'AUTH_PERMISSION_DENIED'
  // Resource Errors (2xxx)
  | 'BUCKET_NOT_FOUND'
  | 'OBJECT_NOT_FOUND'
  | 'BUCKET_ALREADY_EXISTS'
  // Validation Errors (3xxx)
  | 'VALIDATION_INVALID_KEY'
  | 'VALIDATION_MISSING_QUERY'
  | 'VALIDATION_INVALID_RANGE'
  | 'VALIDATION_INVALID_PARAM'
  | 'VALIDATION_FILE_TOO_LARGE'
  // External Service Errors (4xxx)
  | 'R2_SERVICE_ERROR'
  | 'R2_TIMEOUT'
  | 'R2_RATE_LIMIT'
  | 'R2_NETWORK_ERROR'
  // Server Errors (5xxx)
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE';

// ============================================================================
// Health Check Types
// ============================================================================

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
}

// ============================================================================
// Bucket Types
// ============================================================================

/**
 * Bucket information from R2
 */
export interface Bucket {
  /** Bucket name (unique identifier) */
  name: string;
  /** ISO 8601 UTC timestamp of bucket creation */
  creationDate: string;
}

/**
 * List buckets response
 */
export interface ListBucketsResponse {
  status: 'ok';
  data: Bucket[];
  /** Total number of buckets returned */
  count: number;
  meta: ResponseMeta;
}

// ============================================================================
// Object Types
// ============================================================================

/**
 * Object metadata from R2
 */
export interface S3Object {
  /** Object key (full path in bucket) */
  key: string;
  /** File size in bytes */
  size: number;
  /** ISO 8601 UTC timestamp of last modification */
  lastModified: string;
  /** ETag (MD5 hash in quotes) for integrity verification */
  etag: string;
  /** R2 storage class */
  storageClass: StorageClass;
}

/**
 * Storage class types supported by R2
 */
export type StorageClass = 'STANDARD' | 'INFREQUENT_ACCESS';

/**
 * Pagination information for object listing
 */
export interface Pagination {
  /** Whether more results are available */
  isTruncated: boolean;
  /** Maximum keys requested per page */
  maxKeys: number;
  /** Actual number of keys returned in this response */
  keyCount: number;
  /** Prefix filter applied to listing */
  prefix?: string;
  /** Delimiter used for hierarchical listing */
  delimiter?: string;
  /** Current continuation token (if paginating) */
  continuationToken?: string;
  /** Token to use for fetching next page */
  nextContinuationToken?: string;
  /** Common prefixes (folder-like groupings) */
  commonPrefixes?: string[];
}

/**
 * List objects response
 */
export interface ListObjectsResponse {
  status: 'ok';
  data: S3Object[];
  pagination: Pagination;
  meta: ResponseMeta;
}

/**
 * Object upload response
 */
export interface UploadObjectResponse {
  status: 'ok';
  data: {
    /** Object key (full path) */
    key: string;
    /** ETag for uploaded object */
    etag: string;
    /** File size in bytes */
    size: number;
    /** Content-Type of uploaded object */
    contentType: string;
    /** ISO 8601 UTC timestamp of upload */
    lastModified: string;
  };
  meta: ResponseMeta;
}

/**
 * Object deletion response
 */
export interface DeleteObjectResponse {
  status: 'ok';
  data: {
    /** Object key that was deleted */
    key: string;
    /** Deletion status (always true) */
    deleted: boolean;
  };
  meta: ResponseMeta;
}

/**
 * Batch delete response
 */
export interface BatchDeleteResponse {
  status: 'ok';
  data: {
    /** Number of objects successfully deleted */
    deletedCount: number;
    /** Array of successfully deleted object keys */
    deleted: string[];
    /** Array of objects that failed to delete */
    errors?: Array<{
      key: string;
      code: string;
      message: string;
    }>;
  };
  meta: ResponseMeta;
}

/**
 * Folder delete response
 */
export interface FolderDeleteResponse {
  status: 'ok';
  data: {
    /** Prefix/folder that was deleted */
    prefix: string;
    /** Total number of objects deleted */
    totalDeleted: number;
    /** Number of batches processed */
    batchCount: number;
  };
  meta: ResponseMeta;
}

// ============================================================================
// Search Types
// ============================================================================

/**
 * Search result object (extends S3Object with match information)
 */
export interface SearchResult extends S3Object {
  /** Type of match (filename or full path) */
  matchType: 'filename' | 'path';
}

/**
 * Search metadata
 */
export interface SearchMeta {
  /** Original search query */
  query: string;
  /** Prefix filter applied to search */
  prefix?: string;
  /** Total number of matches found */
  totalMatches: number;
  /** Search execution time in seconds */
  searchTime: number;
}

/**
 * Search response
 */
export interface SearchObjectsResponse {
  status: 'ok';
  data: SearchResult[];
  searchMeta: SearchMeta;
  pagination: Pagination;
  meta: ResponseMeta;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Query parameters for listing objects
 */
export interface ListObjectsQuery {
  /** Filter by folder path (e.g., "folder/subfolder/") */
  prefix?: string;
  /** Path separator (default: "/", use "" for flat listing) */
  delimiter?: string;
  /** Max items per page (default: 1000, max: 1000) */
  maxKeys?: number;
  /** Pagination token from previous response */
  continuationToken?: string;
  /** Filter objects modified after this date (ISO 8601) */
  modifiedAfter?: string;
  /** Filter objects modified before this date (ISO 8601) */
  modifiedBefore?: string;
  /** Minimum file size in bytes */
  minSize?: number;
  /** Maximum file size in bytes */
  maxSize?: number;
}

/**
 * Query parameters for search
 */
export interface SearchQuery {
  /** Search query (required, case-insensitive substring match) */
  q: string;
  /** Limit search to prefix/folder */
  prefix?: string;
  /** Max results (default: 100, max: 1000) */
  maxKeys?: number;
  /** Pagination token */
  continuationToken?: string;
}

/**
 * Query parameters for download
 */
export interface DownloadQuery {
  /** Byte range for partial download (e.g., "bytes=0-1024") */
  range?: string;
}

/**
 * Query parameters for folder delete
 */
export interface FolderDeleteQuery {
  /** Prefix/folder path to delete */
  prefix: string;
}

// ============================================================================
// Request Body Types
// ============================================================================

/**
 * Request body for batch delete
 */
export interface BatchDeleteBody {
  /** Array of object keys to delete (max 1000) */
  keys: string[];
}

// ============================================================================
// Route Parameter Types
// ============================================================================

/**
 * Path parameters for bucket-specific routes
 */
export interface BucketParams {
  /** Bucket name */
  bucket: string;
}

/**
 * Path parameters for object-specific routes
 */
export interface ObjectParams extends BucketParams {
  /** Object key (URL-encoded) */
  key: string;
}

// ============================================================================
// Error Response Types
// ============================================================================

/**
 * Standard error response envelope
 */
export interface ErrorResponse {
  status: 'error';
  error: ApiError;
  meta: ResponseMeta;
}

/**
 * HTTP status code for each error code
 * Maps error codes to appropriate HTTP status codes
 */
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  // Authentication Errors (401/403)
  AUTH_INVALID_CREDENTIALS: 401,
  AUTH_MISSING_CREDENTIALS: 401,
  AUTH_PERMISSION_DENIED: 403,
  // Resource Errors (404/409)
  BUCKET_NOT_FOUND: 404,
  OBJECT_NOT_FOUND: 404,
  BUCKET_ALREADY_EXISTS: 409,
  // Validation Errors (400/413/416)
  VALIDATION_INVALID_KEY: 400,
  VALIDATION_MISSING_QUERY: 400,
  VALIDATION_INVALID_RANGE: 416,
  VALIDATION_INVALID_PARAM: 400,
  VALIDATION_FILE_TOO_LARGE: 413,
  // External Service Errors (429/502/504)
  R2_SERVICE_ERROR: 502,
  R2_TIMEOUT: 504,
  R2_RATE_LIMIT: 429,
  R2_NETWORK_ERROR: 502,
  // Server Errors (500/503)
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};
