# API Routes Specification

**Project**: Cloudflare R2 Object Storage Browser API
**Version**: 1.0.0
**Last Updated**: 2025-10-14
**Status**: Design Complete - Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [API Design Principles](#api-design-principles)
3. [Resource Hierarchy](#resource-hierarchy)
4. [Common Patterns](#common-patterns)
5. [Endpoint Specifications](#endpoint-specifications)
6. [Request/Response Schemas](#requestresponse-schemas)
7. [Error Handling](#error-handling)
8. [Status Codes Reference](#status-codes-reference)
9. [Implementation Guidelines](#implementation-guidelines)

---

## Overview

### Architecture

- **Framework**: Fastify 5.x
- **API Style**: RESTful
- **Data Format**: JSON
- **Authentication**: Environment-based R2 credentials
- **Transport**: HTTP/1.1 (localhost only)

### Design Philosophy

1. **Resource-Oriented**: URLs represent resources (buckets, objects), not actions
2. **Stateless**: Each request contains all necessary information
3. **Consistent**: Predictable patterns across all endpoints
4. **Hierarchical**: Nested resources reflect R2 structure (`/buckets/{name}/objects/{key}`)
5. **Pragmatic**: Balance REST purity with practical requirements

---

## API Design Principles

### RESTful Design

```
✅ CORRECT:
GET    /buckets                           # List all buckets
GET    /buckets/{bucket}/objects          # List objects in bucket
GET    /buckets/{bucket}/objects/{key}    # Get specific object
PUT    /buckets/{bucket}/objects/{key}    # Upload object
DELETE /buckets/{bucket}/objects/{key}    # Delete object

❌ WRONG:
GET    /getBuckets                        # Actions in URL
POST   /uploadObject                      # Non-RESTful naming
GET    /bucket?name=foo                   # Query params for resource ID
```

### HTTP Methods

- **GET**: Read resources (idempotent, cacheable, no body)
- **HEAD**: Get metadata only (same as GET but no body)
- **PUT**: Upload/replace object (idempotent)
- **DELETE**: Remove resources (idempotent)
- **POST**: Create or trigger actions (non-idempotent)

### URL Encoding

All path parameters MUST be URL-encoded:
- Object keys: `folder/file.txt` → `folder%2Ffile.txt`
- Special characters: `file name.txt` → `file%20name.txt`
- Already encoded keys: Do not double-encode

---

## Resource Hierarchy

```
/
├── health                                 # System health check
├── buckets                                # Top-level container
│   └── {bucketName}
│       ├── objects                        # Object listing
│       │   └── {objectKey}                # Individual object
│       └── search                         # Search within bucket
```

### Resource Relationships

- **Bucket**: Top-level container (1:N with objects)
- **Object**: File with key (path), content, and metadata
- **Prefix**: Virtual folder structure using "/" delimiter
- **Common Prefix**: Folder-like grouping in list responses

---

## Common Patterns

### Response Envelope

All API responses follow a consistent envelope structure:

**Success Response:**
```json
{
  "status": "ok",
  "data": { /* resource data */ },
  "meta": {
    "timestamp": "2025-10-14T04:00:00Z",
    "requestId": "uuid-v4"
  }
}
```

**Error Response:**
```json
{
  "status": "error",
  "error": {
    "code": "BUCKET_NOT_FOUND",
    "message": "Bucket 'my-bucket' does not exist",
    "details": {
      "bucketName": "my-bucket"
    }
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00Z",
    "requestId": "uuid-v4"
  }
}
```

**Paginated Response:**
```json
{
  "status": "ok",
  "data": [ /* items */ ],
  "pagination": {
    "isTruncated": true,
    "maxKeys": 1000,
    "keyCount": 1000,
    "nextContinuationToken": "base64-encoded-token",
    "commonPrefixes": ["folder1/", "folder2/"]
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00Z",
    "requestId": "uuid-v4"
  }
}
```

### Pagination Strategy

**Cursor-Based Pagination** (matching S3 API):
- Query parameter: `continuationToken` (from previous response)
- Response field: `nextContinuationToken` (for next page)
- Response field: `isTruncated` (boolean indicating more results)
- Max items per page: Configurable via `maxKeys` (default: 1000)

### Date Format

- **ISO 8601**: `2025-10-14T04:00:00.000Z`
- **Timezone**: Always UTC
- **Fields**: `lastModified`, `creationDate`, `timestamp`

### Size Format

- **Bytes**: Integer (e.g., `1024`)
- **Client Formatting**: Frontend converts to KB/MB/GB for display

---

## Endpoint Specifications

### 1. Health Check

#### `GET /health`

System health check endpoint.

**Purpose**: Verify API server is running and responsive.

**Request:**
```http
GET /health HTTP/1.1
Host: localhost:3000
```

**Response: 200 OK**
```json
{
  "status": "ok",
  "service": "r2-object-storage-api",
  "version": "1.0.0",
  "uptime": 3600,
  "timestamp": "2025-10-14T04:00:00.000Z"
}
```

**Status Codes:**
- `200 OK`: Service is healthy

---

### 2. List Buckets

#### `GET /buckets`

List all R2 buckets accessible with current credentials.

**Purpose**: Retrieve all buckets for sidebar display.

**Request:**
```http
GET /buckets HTTP/1.1
Host: localhost:3000
```

**Response: 200 OK**
```json
{
  "status": "ok",
  "data": [
    {
      "name": "my-bucket",
      "creationDate": "2025-01-15T10:30:00.000Z"
    },
    {
      "name": "another-bucket",
      "creationDate": "2025-02-20T15:45:00.000Z"
    }
  ],
  "count": 2,
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "abc123"
  }
}
```

**Status Codes:**
- `200 OK`: Successfully retrieved buckets
- `401 Unauthorized`: Invalid R2 credentials
- `500 Internal Server Error`: R2 service error

**Error Example: 401 Unauthorized**
```json
{
  "status": "error",
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid R2 credentials. Please check your access key and secret.",
    "details": {
      "endpoint": "https://account-id.r2.cloudflarestorage.com"
    }
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "xyz789"
  }
}
```

---

### 3. List Objects

#### `GET /buckets/{bucket}/objects`

List objects in a bucket with folder/prefix navigation support.

**Purpose**: Display files and folders in main content area.

**Path Parameters:**
- `bucket` (string, required): Bucket name

**Query Parameters:**
- `prefix` (string, optional): Filter by folder path (e.g., `folder/subfolder/`)
- `delimiter` (string, optional): Path separator (default: `"/"`, use `""` for flat listing)
- `maxKeys` (number, optional): Max items per page (default: `1000`, max: `1000`)
- `continuationToken` (string, optional): Pagination token from previous response
- `modifiedAfter` (string, optional): ISO 8601 date filter (e.g., `2025-10-01T00:00:00.000Z`)
- `modifiedBefore` (string, optional): ISO 8601 date filter
- `minSize` (number, optional): Minimum file size in bytes
- `maxSize` (number, optional): Maximum file size in bytes

**Request:**
```http
GET /buckets/my-bucket/objects?prefix=photos/&delimiter=/&maxKeys=100 HTTP/1.1
Host: localhost:3000
```

**Response: 200 OK**
```json
{
  "status": "ok",
  "data": [
    {
      "key": "photos/beach.jpg",
      "size": 2048576,
      "lastModified": "2025-10-12T14:30:00.000Z",
      "etag": "\"d41d8cd98f00b204e9800998ecf8427e\"",
      "storageClass": "STANDARD"
    },
    {
      "key": "photos/sunset.png",
      "size": 3145728,
      "lastModified": "2025-10-13T09:15:00.000Z",
      "etag": "\"e2fc714c4727ee9395f324cd2e7f331f\"",
      "storageClass": "STANDARD"
    }
  ],
  "pagination": {
    "isTruncated": false,
    "maxKeys": 100,
    "keyCount": 2,
    "prefix": "photos/",
    "delimiter": "/",
    "commonPrefixes": [
      "photos/2024/",
      "photos/2025/"
    ]
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "def456"
  }
}
```

**Status Codes:**
- `200 OK`: Successfully retrieved objects
- `400 Bad Request`: Invalid query parameters
- `404 Not Found`: Bucket does not exist
- `500 Internal Server Error`: R2 service error

**Error Example: 404 Not Found**
```json
{
  "status": "error",
  "error": {
    "code": "BUCKET_NOT_FOUND",
    "message": "Bucket 'invalid-bucket' does not exist",
    "details": {
      "bucketName": "invalid-bucket"
    }
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "err404"
  }
}
```

**Notes:**
- `commonPrefixes`: Array of folder-like prefixes (virtual folders)
- `delimiter="/"`: Returns folder structure (hierarchical)
- `delimiter=""`: Returns flat list of all objects with matching prefix
- Empty `prefix`: Lists objects at root level

---

### 4. Get Object Metadata

#### `HEAD /buckets/{bucket}/objects/{key}`

Retrieve object metadata without downloading content.

**Purpose**: Check if object exists, get size/type before download, display properties panel.

**Path Parameters:**
- `bucket` (string, required): Bucket name
- `key` (string, required): Object key (URL-encoded)

**Request:**
```http
HEAD /buckets/my-bucket/objects/photos%2Fbeach.jpg HTTP/1.1
Host: localhost:3000
```

**Response: 200 OK**
```http
HTTP/1.1 200 OK
Content-Type: image/jpeg
Content-Length: 2048576
Last-Modified: Tue, 12 Oct 2025 14:30:00 GMT
ETag: "d41d8cd98f00b204e9800998ecf8427e"
Accept-Ranges: bytes
X-Amz-Storage-Class: STANDARD
```

**Status Codes:**
- `200 OK`: Object exists, metadata returned in headers
- `404 Not Found`: Object does not exist
- `500 Internal Server Error`: R2 service error

**Error Example: 404 Not Found**
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "status": "error",
  "error": {
    "code": "OBJECT_NOT_FOUND",
    "message": "Object 'photos/missing.jpg' does not exist in bucket 'my-bucket'",
    "details": {
      "bucketName": "my-bucket",
      "objectKey": "photos/missing.jpg"
    }
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "head404"
  }
}
```

**Notes:**
- No response body (HEAD request)
- All metadata in response headers
- Same headers as GET request would return

---

### 5. Download Object

#### `GET /buckets/{bucket}/objects/{key}`

Download object content.

**Purpose**: Download files to local machine, preview text files in UI.

**Path Parameters:**
- `bucket` (string, required): Bucket name
- `key` (string, required): Object key (URL-encoded)

**Query Parameters:**
- `range` (string, optional): Byte range for partial download (e.g., `bytes=0-1024`)

**Request:**
```http
GET /buckets/my-bucket/objects/photos%2Fbeach.jpg HTTP/1.1
Host: localhost:3000
```

**Response: 200 OK**
```http
HTTP/1.1 200 OK
Content-Type: image/jpeg
Content-Length: 2048576
Content-Disposition: attachment; filename="beach.jpg"
Last-Modified: Tue, 12 Oct 2025 14:30:00 GMT
ETag: "d41d8cd98f00b204e9800998ecf8427e"
Accept-Ranges: bytes
X-Amz-Storage-Class: STANDARD

[binary content]
```

**Partial Download Request:**
```http
GET /buckets/my-bucket/objects/large-file.txt?range=bytes%3D0-1048575 HTTP/1.1
Host: localhost:3000
```

**Partial Download Response: 206 Partial Content**
```http
HTTP/1.1 206 Partial Content
Content-Type: text/plain
Content-Length: 1048576
Content-Range: bytes 0-1048575/10485760
Content-Disposition: attachment; filename="large-file.txt"
ETag: "abc123"

[partial content - first 1MB]
```

**Status Codes:**
- `200 OK`: Full object content returned
- `206 Partial Content`: Partial content returned (range request)
- `404 Not Found`: Object does not exist
- `416 Range Not Satisfiable`: Invalid range request
- `500 Internal Server Error`: R2 service error

**Error Example: 404 Not Found**
```json
{
  "status": "error",
  "error": {
    "code": "OBJECT_NOT_FOUND",
    "message": "Object 'photos/missing.jpg' does not exist in bucket 'my-bucket'",
    "details": {
      "bucketName": "my-bucket",
      "objectKey": "photos/missing.jpg"
    }
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "get404"
  }
}
```

**Notes:**
- Binary streaming for efficient memory usage
- Content-Type from R2 metadata (or `application/octet-stream`)
- Content-Disposition: `attachment` for downloads, `inline` for previews
- Range requests support for large file preview (first 1MB)

---

### 6. Upload Object

#### `PUT /buckets/{bucket}/objects/{key}`

Upload object to R2.

**Purpose**: Upload files via drag & drop or file picker.

**Path Parameters:**
- `bucket` (string, required): Bucket name
- `key` (string, required): Object key (URL-encoded, desired path in bucket)

**Request Headers:**
- `Content-Type` (optional): MIME type of object (default: `application/octet-stream`)
- `Content-Length` (required): Size in bytes

**Request Body:** Binary file content

**Request:**
```http
PUT /buckets/my-bucket/objects/uploads%2Fdocument.pdf HTTP/1.1
Host: localhost:3000
Content-Type: application/pdf
Content-Length: 1024000

[binary content]
```

**Response: 201 Created**
```json
{
  "status": "ok",
  "data": {
    "key": "uploads/document.pdf",
    "etag": "\"098f6bcd4621d373cade4e832627b4f6\"",
    "size": 1024000,
    "contentType": "application/pdf",
    "lastModified": "2025-10-14T04:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "put201"
  }
}
```

**Status Codes:**
- `201 Created`: Object successfully uploaded
- `400 Bad Request`: Invalid request (missing headers, invalid key)
- `404 Not Found`: Bucket does not exist
- `413 Payload Too Large`: File exceeds size limit
- `500 Internal Server Error`: R2 service error

**Error Example: 400 Bad Request**
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_INVALID_KEY",
    "message": "Object key cannot be empty or contain invalid characters",
    "details": {
      "bucketName": "my-bucket",
      "objectKey": "",
      "invalidCharacters": []
    }
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "put400"
  }
}
```

**Notes:**
- PUT is idempotent (overwrites existing object)
- No multipart upload in Phase 1 (deferred to LATER phase)
- File size limit: Determined by R2 (typically 5GB for PUT)
- Content-Type detection: Use MIME type sniffing if not provided

---

### 7. Delete Object

#### `DELETE /buckets/{bucket}/objects/{key}`

Delete object from R2.

**Purpose**: Remove unwanted files to save storage costs.

**Path Parameters:**
- `bucket` (string, required): Bucket name
- `key` (string, required): Object key (URL-encoded)

**Request:**
```http
DELETE /buckets/my-bucket/objects/old-files%2Fdeprecated.txt HTTP/1.1
Host: localhost:3000
```

**Response: 200 OK**
```json
{
  "status": "ok",
  "data": {
    "key": "old-files/deprecated.txt",
    "deleted": true
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "del200"
  }
}
```

**Status Codes:**
- `200 OK`: Object successfully deleted
- `404 Not Found`: Object or bucket does not exist (idempotent)
- `500 Internal Server Error`: R2 service error

**Error Example: 500 Internal Server Error**
```json
{
  "status": "error",
  "error": {
    "code": "R2_SERVICE_ERROR",
    "message": "Failed to delete object due to R2 service error",
    "details": {
      "bucketName": "my-bucket",
      "objectKey": "old-files/deprecated.txt",
      "r2Error": "ServiceUnavailable"
    }
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "del500"
  }
}
```

**Notes:**
- DELETE is idempotent (deleting non-existent object returns 200)
- No response body needed (204 No Content alternative)
- Frontend should show confirmation dialog before DELETE
- Cache invalidation: Clear folder listing cache for parent prefix

---

### 8. Search Objects

#### `GET /buckets/{bucket}/search`

Search for objects by name within a bucket.

**Purpose**: Find files quickly by name pattern.

**Path Parameters:**
- `bucket` (string, required): Bucket name

**Query Parameters:**
- `q` (string, required): Search query (case-insensitive substring match)
- `prefix` (string, optional): Limit search to prefix/folder
- `maxKeys` (number, optional): Max results (default: `100`, max: `1000`)
- `continuationToken` (string, optional): Pagination token

**Request:**
```http
GET /buckets/my-bucket/search?q=report&prefix=documents/ HTTP/1.1
Host: localhost:3000
```

**Response: 200 OK**
```json
{
  "status": "ok",
  "data": [
    {
      "key": "documents/quarterly-report.pdf",
      "size": 2048576,
      "lastModified": "2025-10-10T12:00:00.000Z",
      "etag": "\"abc123\"",
      "storageClass": "STANDARD",
      "matchType": "filename"
    },
    {
      "key": "documents/2024/annual-report.docx",
      "size": 1024000,
      "lastModified": "2025-09-15T08:30:00.000Z",
      "etag": "\"def456\"",
      "storageClass": "STANDARD",
      "matchType": "filename"
    }
  ],
  "searchMeta": {
    "query": "report",
    "prefix": "documents/",
    "totalMatches": 2,
    "searchTime": 0.15
  },
  "pagination": {
    "isTruncated": false,
    "maxKeys": 100,
    "keyCount": 2
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "search123"
  }
}
```

**Status Codes:**
- `200 OK`: Search completed (0+ results)
- `400 Bad Request`: Missing or invalid query parameter
- `404 Not Found`: Bucket does not exist
- `500 Internal Server Error`: R2 service error

**Error Example: 400 Bad Request**
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_MISSING_QUERY",
    "message": "Search query parameter 'q' is required",
    "details": {
      "parameter": "q"
    }
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "search400"
  }
}
```

**Implementation Notes:**
- **Phase 1 Implementation**: Client-side filtering
  1. Fetch all objects with `ListObjectsV2` (using `prefix` if provided)
  2. Filter results by case-insensitive substring match on object key
  3. Return matching objects in standard format

- **Search Algorithm**: Case-insensitive substring match on file name (not full path)
  - Query: `"report"` matches: `"Report.pdf"`, `"annual-report.docx"`, `"reports/Q1.xlsx"`
  - Extract filename from key: `"documents/report.pdf"` → `"report.pdf"`

- **Performance Considerations**:
  - For large buckets (>10,000 objects), this approach may be slow
  - Consider pagination at API level (return first N matches)
  - Future optimization: Server-side streaming search

- **Debouncing**: Frontend should debounce search input (300ms) to reduce API calls

---

## Request/Response Schemas

### TypeScript Type Definitions

```typescript
// ============================================================================
// Common Types
// ============================================================================

/** Standard API response envelope */
interface ApiResponse<T = unknown> {
  status: 'ok' | 'error';
  data?: T;
  error?: ApiError;
  meta: ResponseMeta;
}

/** Response metadata */
interface ResponseMeta {
  timestamp: string;        // ISO 8601 UTC timestamp
  requestId: string;        // UUID v4 for request tracking
}

/** Error details */
interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/** Error codes enum */
type ErrorCode =
  // Authentication (1xxx)
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
// Bucket Types
// ============================================================================

/** Bucket information */
interface Bucket {
  name: string;
  creationDate: string;     // ISO 8601
}

/** List buckets response */
interface ListBucketsResponse {
  status: 'ok';
  data: Bucket[];
  count: number;
  meta: ResponseMeta;
}

// ============================================================================
// Object Types
// ============================================================================

/** Object metadata */
interface S3Object {
  key: string;
  size: number;             // Bytes
  lastModified: string;     // ISO 8601
  etag: string;             // MD5 hash in quotes
  storageClass: StorageClass;
}

/** Storage class types */
type StorageClass = 'STANDARD' | 'INFREQUENT_ACCESS';

/** Pagination information for object listing */
interface Pagination {
  isTruncated: boolean;
  maxKeys: number;
  keyCount: number;
  prefix?: string;
  delimiter?: string;
  continuationToken?: string;
  nextContinuationToken?: string;
  commonPrefixes?: string[];
}

/** List objects response */
interface ListObjectsResponse {
  status: 'ok';
  data: S3Object[];
  pagination: Pagination;
  meta: ResponseMeta;
}

/** Object upload response */
interface UploadObjectResponse {
  status: 'ok';
  data: {
    key: string;
    etag: string;
    size: number;
    contentType: string;
    lastModified: string;
  };
  meta: ResponseMeta;
}

/** Object deletion response */
interface DeleteObjectResponse {
  status: 'ok';
  data: {
    key: string;
    deleted: boolean;
  };
  meta: ResponseMeta;
}

// ============================================================================
// Search Types
// ============================================================================

/** Search result object (extends S3Object) */
interface SearchResult extends S3Object {
  matchType: 'filename' | 'path';
}

/** Search metadata */
interface SearchMeta {
  query: string;
  prefix?: string;
  totalMatches: number;
  searchTime: number;       // Seconds
}

/** Search response */
interface SearchObjectsResponse {
  status: 'ok';
  data: SearchResult[];
  searchMeta: SearchMeta;
  pagination: Pagination;
  meta: ResponseMeta;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/** List objects query parameters */
interface ListObjectsQuery {
  prefix?: string;
  delimiter?: string;
  maxKeys?: number;
  continuationToken?: string;
  modifiedAfter?: string;   // ISO 8601
  modifiedBefore?: string;  // ISO 8601
  minSize?: number;         // Bytes
  maxSize?: number;         // Bytes
}

/** Search query parameters */
interface SearchQuery {
  q: string;                // Required
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
}

/** Download range parameters */
interface DownloadQuery {
  range?: string;           // Format: "bytes=0-1024"
}
```

---

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "additionalContext": "value"
    }
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "uuid"
  }
}
```

### Error Code Catalog

#### Authentication Errors (1xxx)

| Code | HTTP Status | Description | Example |
|------|-------------|-------------|---------|
| `AUTH_INVALID_CREDENTIALS` | 401 | R2 credentials are invalid | Invalid access key ID or secret |
| `AUTH_MISSING_CREDENTIALS` | 401 | R2 credentials not configured | Missing environment variables |
| `AUTH_PERMISSION_DENIED` | 403 | Valid credentials but insufficient permissions | Read-only key attempting write |

#### Resource Errors (2xxx)

| Code | HTTP Status | Description | Example |
|------|-------------|-------------|---------|
| `BUCKET_NOT_FOUND` | 404 | Bucket does not exist | Typo in bucket name |
| `OBJECT_NOT_FOUND` | 404 | Object does not exist | File was deleted |
| `BUCKET_ALREADY_EXISTS` | 409 | Bucket name already taken | Create bucket with existing name |

#### Validation Errors (3xxx)

| Code | HTTP Status | Description | Example |
|------|-------------|-------------|---------|
| `VALIDATION_INVALID_KEY` | 400 | Object key is invalid | Empty key, invalid characters |
| `VALIDATION_MISSING_QUERY` | 400 | Required query parameter missing | Search without `q` parameter |
| `VALIDATION_INVALID_RANGE` | 416 | Range request is invalid | `bytes=1000-500` (invalid range) |
| `VALIDATION_INVALID_PARAM` | 400 | Query parameter format invalid | `maxKeys=abc` (not a number) |
| `VALIDATION_FILE_TOO_LARGE` | 413 | File exceeds upload limit | Uploading 10GB file via PUT |

#### External Service Errors (4xxx)

| Code | HTTP Status | Description | Example |
|------|-------------|-------------|---------|
| `R2_SERVICE_ERROR` | 502 | R2 returned an error | R2 internal service error |
| `R2_TIMEOUT` | 504 | R2 request timed out | Network timeout after 30s |
| `R2_RATE_LIMIT` | 429 | R2 rate limit exceeded | Too many requests per second |
| `R2_NETWORK_ERROR` | 502 | Network connection failed | DNS resolution failure |

#### Server Errors (5xxx)

| Code | HTTP Status | Description | Example |
|------|-------------|-------------|---------|
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error | Unhandled exception |
| `SERVICE_UNAVAILABLE` | 503 | Server temporarily unavailable | Server restarting |

### Error Handling Strategy

**Backend (API):**
1. **Catch All Errors**: Wrap route handlers in try-catch
2. **Log Errors**: Log full error with stack trace (never expose to client)
3. **Sanitize Response**: Return only safe error information to client
4. **Generate Request ID**: UUID v4 for request tracking
5. **Map S3 Errors**: Transform AWS SDK errors to API error codes

**Frontend (macOS App):**
1. **User-Friendly Messages**: Display `error.message` to user
2. **Retry Logic**: Implement exponential backoff for transient errors (5xx)
3. **Error Tracking**: Log errors with `requestId` for debugging
4. **Contextual Actions**: Provide actionable next steps (e.g., "Check credentials")

### Example Error Mapping

```typescript
// Map AWS SDK S3 errors to API error codes
function mapS3Error(error: unknown): ApiError {
  if (error instanceof Error) {
    const name = (error as any).name;

    switch (name) {
      case 'NoSuchBucket':
        return {
          code: 'BUCKET_NOT_FOUND',
          message: 'The specified bucket does not exist',
          details: { bucketName: extractBucketName(error) }
        };

      case 'NoSuchKey':
        return {
          code: 'OBJECT_NOT_FOUND',
          message: 'The specified object does not exist',
          details: { objectKey: extractObjectKey(error) }
        };

      case 'InvalidAccessKeyId':
      case 'SignatureDoesNotMatch':
        return {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Invalid R2 credentials',
          details: {}
        };

      case 'AccessDenied':
        return {
          code: 'AUTH_PERMISSION_DENIED',
          message: 'Insufficient permissions for this operation',
          details: {}
        };

      case 'RequestTimeout':
        return {
          code: 'R2_TIMEOUT',
          message: 'Request to R2 timed out',
          details: {}
        };

      case 'ServiceUnavailable':
        return {
          code: 'R2_SERVICE_ERROR',
          message: 'R2 service is temporarily unavailable',
          details: {}
        };

      default:
        return {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          details: { errorName: name }
        };
    }
  }

  return {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    details: {}
  };
}
```

---

## Status Codes Reference

### Success Codes (2xx)

| Code | Name | Usage |
|------|------|-------|
| `200` | OK | Successful GET, HEAD, DELETE requests |
| `201` | Created | Successful PUT (upload) with new resource created |
| `204` | No Content | Successful DELETE with no response body (alternative to 200) |
| `206` | Partial Content | Successful range request (partial download) |

### Client Error Codes (4xx)

| Code | Name | Usage |
|------|------|-------|
| `400` | Bad Request | Invalid request format, validation error |
| `401` | Unauthorized | Missing or invalid authentication |
| `403` | Forbidden | Valid auth but insufficient permissions |
| `404` | Not Found | Resource doesn't exist (bucket or object) |
| `409` | Conflict | Resource already exists or state conflict |
| `413` | Payload Too Large | File size exceeds limit |
| `416` | Range Not Satisfiable | Invalid range request |
| `422` | Unprocessable Entity | Semantic validation failed |
| `429` | Too Many Requests | Rate limit exceeded |

### Server Error Codes (5xx)

| Code | Name | Usage |
|------|------|-------|
| `500` | Internal Server Error | Unexpected server error |
| `502` | Bad Gateway | Upstream service error (R2) |
| `503` | Service Unavailable | Temporary unavailability |
| `504` | Gateway Timeout | Upstream timeout (R2) |

### Status Code Decision Tree

```
Is the request successful?
├─ Yes → 2xx
│  ├─ Resource created? → 201 Created
│  ├─ Partial content? → 206 Partial Content
│  ├─ No content to return? → 204 No Content
│  └─ Otherwise → 200 OK
│
└─ No → Is it a client error?
   ├─ Yes → 4xx
   │  ├─ Invalid request format? → 400 Bad Request
   │  ├─ Authentication issue? → 401 Unauthorized
   │  ├─ Permission issue? → 403 Forbidden
   │  ├─ Resource not found? → 404 Not Found
   │  ├─ Resource conflict? → 409 Conflict
   │  ├─ File too large? → 413 Payload Too Large
   │  ├─ Invalid range? → 416 Range Not Satisfiable
   │  └─ Rate limit? → 429 Too Many Requests
   │
   └─ No (server error) → 5xx
      ├─ R2 service error? → 502 Bad Gateway
      ├─ R2 timeout? → 504 Gateway Timeout
      ├─ Server down? → 503 Service Unavailable
      └─ Unknown error? → 500 Internal Server Error
```

---

## Implementation Guidelines

### Project Structure

```
packages/api/
├── sources/
│   ├── routes/
│   │   ├── health.ts           # Health check endpoint
│   │   ├── buckets.ts          # Bucket listing (existing)
│   │   └── objects.ts          # Object operations (NEW)
│   ├── types/
│   │   ├── api.ts              # API response types (NEW)
│   │   ├── s3.ts               # S3/R2 types (NEW)
│   │   └── errors.ts           # Error types (NEW)
│   ├── utils/
│   │   ├── errors.ts           # Error mapping utilities (NEW)
│   │   ├── response.ts         # Response helpers (NEW)
│   │   └── validation.ts       # Input validation (NEW)
│   ├── application.ts          # Fastify app setup (existing)
│   ├── r2-client.ts            # S3 client config (existing)
│   ├── options.ts              # Config management (existing)
│   └── server.ts               # Server entry point (existing)
└── API_ROUTES_SPEC.md          # This document
```

### Implementation Checklist

#### Phase 1: Type Definitions
- [ ] Create `sources/types/api.ts` with TypeScript interfaces
- [ ] Create `sources/types/s3.ts` with S3/R2 types
- [ ] Create `sources/types/errors.ts` with error types
- [ ] Export all types from `sources/types/index.ts`

#### Phase 2: Utilities
- [ ] Create `sources/utils/errors.ts` with error mapping functions
- [ ] Create `sources/utils/response.ts` with response helpers
- [ ] Create `sources/utils/validation.ts` with input validators
- [ ] Write unit tests for utility functions

#### Phase 3: Object Routes
- [ ] Create `sources/routes/objects.ts`
- [ ] Implement `GET /buckets/{bucket}/objects` (list objects)
- [ ] Implement `HEAD /buckets/{bucket}/objects/{key}` (get metadata)
- [ ] Implement `GET /buckets/{bucket}/objects/{key}` (download)
- [ ] Implement `PUT /buckets/{bucket}/objects/{key}` (upload)
- [ ] Implement `DELETE /buckets/{bucket}/objects/{key}` (delete)
- [ ] Implement `GET /buckets/{bucket}/search` (search)

#### Phase 4: Integration
- [ ] Register object routes in `application.ts`
- [ ] Update existing bucket routes to use new response format
- [ ] Add request ID generation middleware
- [ ] Add CORS middleware for development
- [ ] Add request/response logging

#### Phase 5: Testing
- [ ] Write integration tests for each endpoint
- [ ] Test error scenarios (404, 401, 500)
- [ ] Test pagination with large datasets
- [ ] Test file upload/download with various sizes
- [ ] Test search functionality

### Code Style Guidelines

**Follow CLAUDE.md rules:**
1. Always use `.ts` extensions in imports
2. Always use `??` for defaults (never `||`)
3. Use `type` imports for TypeScript types

**Fastify Route Pattern:**
```typescript
import type { FastifyInstance } from 'fastify';
import type { ListObjectsQuery, ListObjectsResponse } from '../types/api.ts';
import { r2Client } from '../r2-client.ts';
import { createSuccessResponse, createErrorResponse } from '../utils/response.ts';
import { mapS3Error } from '../utils/errors.ts';

export async function registerObjectRoutes(server: FastifyInstance) {
  // List objects
  server.get<{
    Params: { bucket: string };
    Querystring: ListObjectsQuery;
  }>('/buckets/:bucket/objects', async (request, reply) => {
    try {
      const { bucket } = request.params;
      const { prefix, delimiter, maxKeys, continuationToken } = request.query;

      // Validate inputs
      if (!bucket) {
        return createErrorResponse(reply, 400, 'VALIDATION_INVALID_PARAM',
          'Bucket name is required');
      }

      // Call R2
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        Delimiter: delimiter ?? '/',
        MaxKeys: maxKeys ?? 1000,
        ContinuationToken: continuationToken,
      });

      const response = await r2Client.send(command);

      // Format response
      return createSuccessResponse<ListObjectsResponse['data']>(reply, 200, {
        data: (response.Contents ?? []).map(obj => ({
          key: obj.Key ?? '',
          size: obj.Size ?? 0,
          lastModified: obj.LastModified?.toISOString() ?? '',
          etag: obj.ETag ?? '',
          storageClass: (obj.StorageClass ?? 'STANDARD') as StorageClass,
        })),
        pagination: {
          isTruncated: response.IsTruncated ?? false,
          maxKeys: response.MaxKeys ?? 1000,
          keyCount: response.KeyCount ?? 0,
          prefix: response.Prefix,
          delimiter: response.Delimiter,
          continuationToken: response.ContinuationToken,
          nextContinuationToken: response.NextContinuationToken,
          commonPrefixes: (response.CommonPrefixes ?? [])
            .map(cp => cp.Prefix)
            .filter((p): p is string => p !== undefined),
        },
      });
    } catch (error) {
      const apiError = mapS3Error(error);
      return createErrorResponse(reply, 500, apiError.code, apiError.message, apiError.details);
    }
  });
}
```

**Response Helper Pattern:**
```typescript
import type { FastifyReply } from 'fastify';
import type { ApiResponse, ErrorCode } from '../types/api.ts';
import { randomUUID } from 'node:crypto';

export function createSuccessResponse<T>(
  reply: FastifyReply,
  statusCode: number,
  data: T
): ApiResponse<T> {
  reply.status(statusCode);
  return {
    status: 'ok',
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: randomUUID(),
    },
  };
}

export function createErrorResponse(
  reply: FastifyReply,
  statusCode: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): ApiResponse {
  reply.status(statusCode);
  return {
    status: 'error',
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: randomUUID(),
    },
  };
}
```

### Performance Considerations

1. **Streaming**: Use Node.js streams for file upload/download (avoid loading entire file into memory)
2. **Pagination**: Always paginate object listings (default `maxKeys=1000`)
3. **Caching**: Consider ETag-based caching for GET requests (future enhancement)
4. **Concurrency**: Limit concurrent R2 requests to avoid rate limits
5. **Timeout**: Set reasonable timeout for R2 operations (30s default)

### Security Considerations

1. **Input Validation**: Validate all path and query parameters
2. **Path Traversal**: Sanitize object keys to prevent directory traversal
3. **File Size Limits**: Enforce maximum upload size (5GB for PUT)
4. **CORS**: Restrict CORS to localhost only
5. **Credentials**: Never log or expose R2 credentials
6. **Rate Limiting**: Implement per-IP rate limiting (future enhancement)

### Testing Strategy

**Unit Tests:**
- Error mapping functions
- Response formatters
- Input validators

**Integration Tests:**
- Each endpoint with success scenarios
- Each endpoint with error scenarios
- Pagination edge cases
- Large file handling

**Manual Testing:**
- Upload/download various file types
- Test with real R2 bucket
- Verify CORS headers
- Check error messages

---

## Future Enhancements (LATER Phase)

The following features are documented in the PRD but deferred to future phases:

### Multipart Upload
- `POST /buckets/{bucket}/objects/{key}/multipart/initiate`
- `PUT /buckets/{bucket}/objects/{key}/multipart/{uploadId}/parts/{partNumber}`
- `POST /buckets/{bucket}/objects/{key}/multipart/{uploadId}/complete`
- `DELETE /buckets/{bucket}/objects/{key}/multipart/{uploadId}/abort`

### Presigned URLs
- `POST /buckets/{bucket}/objects/{key}/presigned-url`
- Generate temporary shareable links with expiration

### Copy/Move Operations
- `POST /buckets/{bucket}/objects/{key}/copy`
- `POST /buckets/{bucket}/objects/{key}/move`
- Cross-bucket support

### Batch Operations
- `POST /batch/delete`
- `POST /batch/copy`
- `POST /batch/move`

### Bucket Management
- `POST /buckets` (create bucket)
- `DELETE /buckets/{bucket}` (delete bucket)
- `GET /buckets/{bucket}/settings`
- `PUT /buckets/{bucket}/settings`

### Analytics & Stats
- `GET /buckets/{bucket}/stats`
- `GET /usage/bandwidth`
- `GET /usage/storage`

---

## Appendix

### URL Encoding Examples

| Original Key | Encoded Key | Notes |
|--------------|-------------|-------|
| `file.txt` | `file.txt` | No encoding needed |
| `folder/file.txt` | `folder%2Ffile.txt` | Forward slash encoded |
| `file name.txt` | `file%20name.txt` | Space encoded |
| `file+name.txt` | `file%2Bname.txt` | Plus sign encoded |
| `file&name.txt` | `file%26name.txt` | Ampersand encoded |
| `file#1.txt` | `file%231.txt` | Hash encoded |

### Content-Type Detection

Common MIME types for automatic detection:

| Extension | Content-Type |
|-----------|--------------|
| `.txt` | `text/plain` |
| `.html` | `text/html` |
| `.css` | `text/css` |
| `.js` | `application/javascript` |
| `.json` | `application/json` |
| `.pdf` | `application/pdf` |
| `.jpg`, `.jpeg` | `image/jpeg` |
| `.png` | `image/png` |
| `.gif` | `image/gif` |
| `.svg` | `image/svg+xml` |
| `.mp4` | `video/mp4` |
| `.zip` | `application/zip` |
| (unknown) | `application/octet-stream` |

### Range Request Examples

**Request first 1MB:**
```
GET /buckets/my-bucket/objects/large-file.bin?range=bytes%3D0-1048575
```

**Request last 1MB:**
```
GET /buckets/my-bucket/objects/large-file.bin?range=bytes%3D-1048576
```

**Request from offset:**
```
GET /buckets/my-bucket/objects/large-file.bin?range=bytes%3D1048576-
```

### API Versioning Strategy

**Phase 1**: No explicit versioning (v1 implicit)
- All routes are considered v1
- Breaking changes will trigger v2

**Future Phases**: URL path versioning
```
/v1/buckets                  # Current API
/v2/buckets                  # Future breaking changes
```

**Deprecation Policy**:
- 6 months notice for breaking changes
- Maintain previous version for 12 months
- Document migration guide

---

## Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-10-14 | API Architect | Initial design document |

---

**End of API Routes Specification**

For questions or clarifications, refer to:
- PRD: `/Users/cha/projects/cloudflare-r2-object-storage-browser/PRD.md`
- Code Guidelines: `/Users/cha/projects/cloudflare-r2-object-storage-browser/packages/api/CLAUDE.md`
- Implementation: `typescript-backend` and `r2-specialist` agents
