# Cloudflare R2 Object Storage Browser API

A high-performance REST API for managing Cloudflare R2 object storage, built with Fastify and TypeScript.

## Features

- List R2 buckets with detailed metadata
- Browse objects with folder/prefix navigation
- Upload and download files with streaming support
- Delete objects from buckets
- Search objects by name with filtering
- Comprehensive error handling with detailed error codes
- Full pagination support for large datasets
- Type-safe TypeScript implementation

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Development](#development)
- [Build & Deployment](#build--deployment)
- [Error Codes](#error-codes)
- [Examples](#examples)
- [Architecture](#architecture)
- [Contributing](#contributing)

---

## Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd packages/api

# 2. Install dependencies
pnpm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your R2 credentials

# 4. Start development server
pnpm dev

# Server will start on a random port and display:
# Server is running on http://127.0.0.1:XXXXX
# PORT=XXXXX
```

The API will be available at `http://127.0.0.1:<PORT>` where `<PORT>` is randomly assigned for security.

---

## Installation

### Prerequisites

- Node.js 20.x or later
- pnpm 10.x or later
- Cloudflare R2 account with API credentials

### Install Dependencies

```bash
pnpm install
```

---

## Configuration

### Environment Variables

Create a `.env` file in the **project root** (not in `packages/api/`):

```bash
/Users/cha/projects/cloudflare-r2-object-storage-browser/.env
```

Required environment variables:

```env
# R2 API Endpoint
# Format: https://<account-id>.r2.cloudflarestorage.com
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# R2 Access Key ID
# Obtain from Cloudflare Dashboard: R2 > Manage R2 API Tokens
R2_ACCESS_KEY_ID=your_access_key_id_here

# R2 Secret Access Key
# Keep this secret! Never commit to version control
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
```

### Getting R2 Credentials

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** in the sidebar
3. Click **Manage R2 API Tokens**
4. Click **Create API Token**
5. Set permissions (Read & Write recommended for full functionality)
6. Copy the generated credentials to your `.env` file

**Security Note:** Never commit `.env` to version control. The `.env` file is already in `.gitignore`.

---

## API Endpoints

### Base URL

```
http://127.0.0.1:<PORT>
```

### Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check - Verify API is running |
| `GET` | `/buckets` | List all R2 buckets |
| `GET` | `/buckets/:bucket/objects` | List objects in bucket with pagination |
| `HEAD` | `/buckets/:bucket/objects/*` | Get object metadata without downloading |
| `GET` | `/buckets/:bucket/objects/*` | Download object with streaming |
| `PUT` | `/buckets/:bucket/objects/*` | Upload object with streaming |
| `DELETE` | `/buckets/:bucket/objects/*` | Delete object from bucket |
| `GET` | `/buckets/:bucket/search` | Search objects by name |

### 1. Health Check

Check if the API server is running.

```bash
GET /
```

**Response: 200 OK**
```json
{
  "status": "ok",
  "message": "Cloudflare R2 Object Storage Browser API",
  "version": "1.0.0",
  "timestamp": "2025-10-14T04:00:00.000Z"
}
```

### 2. List Buckets

Retrieve all R2 buckets accessible with current credentials.

```bash
GET /buckets
```

**Response: 200 OK**
```json
{
  "status": "ok",
  "buckets": [
    {
      "name": "my-bucket",
      "creationDate": "2025-01-15T10:30:00.000Z"
    },
    {
      "name": "another-bucket",
      "creationDate": "2025-02-20T15:45:00.000Z"
    }
  ],
  "count": 2
}
```

### 3. List Objects

List objects in a bucket with folder navigation and pagination.

```bash
GET /buckets/:bucket/objects?prefix=folder/&delimiter=/&maxKeys=100
```

**Query Parameters:**
- `prefix` (optional): Filter by folder path
- `delimiter` (optional): Path separator (default: `/`)
- `maxKeys` (optional): Max items per page (default: 1000, max: 1000)
- `continuationToken` (optional): Pagination token from previous response
- `modifiedAfter` (optional): ISO 8601 date filter
- `modifiedBefore` (optional): ISO 8601 date filter
- `minSize` (optional): Minimum file size in bytes
- `maxSize` (optional): Maximum file size in bytes

**Response: 200 OK**
```json
{
  "status": "ok",
  "data": [
    {
      "key": "folder/file.txt",
      "size": 2048576,
      "lastModified": "2025-10-12T14:30:00.000Z",
      "etag": "\"d41d8cd98f00b204e9800998ecf8427e\"",
      "storageClass": "STANDARD"
    }
  ],
  "pagination": {
    "isTruncated": false,
    "maxKeys": 100,
    "keyCount": 1,
    "prefix": "folder/",
    "delimiter": "/",
    "commonPrefixes": ["folder/subfolder/"]
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "abc123-def456-789"
  }
}
```

### 4. Get Object Metadata

Retrieve object metadata without downloading content.

```bash
HEAD /buckets/:bucket/objects/path/to/file.txt
```

**Response: 200 OK**
```http
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 2048576
Last-Modified: Tue, 12 Oct 2025 14:30:00 GMT
ETag: "d41d8cd98f00b204e9800998ecf8427e"
Accept-Ranges: bytes
X-Amz-Storage-Class: STANDARD
```

### 5. Download Object

Download object with streaming support.

```bash
GET /buckets/:bucket/objects/path/to/file.txt
```

**Response: 200 OK** (binary stream)
```http
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 2048576
Content-Disposition: attachment; filename="file.txt"
Last-Modified: Tue, 12 Oct 2025 14:30:00 GMT
ETag: "d41d8cd98f00b204e9800998ecf8427e"

[binary content stream]
```

### 6. Upload Object

Upload object with streaming support.

```bash
PUT /buckets/:bucket/objects/path/to/file.txt
Content-Type: text/plain
Content-Length: 1024

[binary content]
```

**Response: 201 Created**
```json
{
  "status": "ok",
  "data": {
    "key": "path/to/file.txt",
    "etag": "\"098f6bcd4621d373cade4e832627b4f6\"",
    "size": 1024,
    "contentType": "text/plain",
    "lastModified": "2025-10-14T04:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "xyz789"
  }
}
```

### 7. Delete Object

Delete object from bucket.

```bash
DELETE /buckets/:bucket/objects/path/to/file.txt
```

**Response: 200 OK**
```json
{
  "status": "ok",
  "data": {
    "key": "path/to/file.txt",
    "deleted": true
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "del123"
  }
}
```

### 8. Search Objects

Search objects by name within a bucket.

```bash
GET /buckets/:bucket/search?q=report&prefix=documents/
```

**Query Parameters:**
- `q` (required): Search query (case-insensitive substring match)
- `prefix` (optional): Limit search to prefix/folder
- `maxKeys` (optional): Max results (default: 100, max: 1000)
- `continuationToken` (optional): Pagination token

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
    }
  ],
  "searchMeta": {
    "query": "report",
    "prefix": "documents/",
    "totalMatches": 1,
    "searchTime": 0.15
  },
  "pagination": {
    "isTruncated": false,
    "maxKeys": 100,
    "keyCount": 1
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "search123"
  }
}
```

---

## Development

### Available Scripts

```bash
# Start development server with auto-reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type checking
pnpm typecheck
```

### Development Server

The development server uses Node.js `--watch` mode for automatic reloading:

```bash
pnpm dev
```

Changes to TypeScript files will automatically restart the server.

### Project Structure

```
packages/api/
├── sources/
│   ├── routes/
│   │   ├── health.ts         # Health check endpoint
│   │   ├── buckets.ts        # Bucket listing
│   │   └── objects.ts        # Object operations
│   ├── types/
│   │   └── api.ts            # TypeScript type definitions
│   ├── utils/
│   │   ├── errors.ts         # Error mapping utilities
│   │   └── response.ts       # Response helpers
│   ├── application.ts        # Fastify app setup
│   ├── r2-client.ts          # S3 client configuration
│   ├── options.ts            # Config management
│   └── server.ts             # Server entry point
├── outputs/                  # Build output (gitignored)
├── scripts/
│   └── build.ts              # Production build script
├── package.json
├── tsconfig.json
└── README.md
```

---

## Build & Deployment

### Production Build

The API uses an N:M bundling strategy to optimize deployment:

```bash
pnpm build
```

This creates 3 optimized bundles in `outputs/`:
- `server.js` - Entry point
- `routes.js` - Route handlers
- `utils.js` - Utilities and helpers

### Build Configuration

- **Target**: Node.js 20+
- **Format**: ESM (ES Modules)
- **Bundler**: esbuild (fast, efficient)
- **Source Maps**: Enabled for debugging

### Running in Production

```bash
# After building
pnpm start

# Or directly
node outputs/server.js
```

### Deployment Considerations

1. **Port Assignment**: Server uses a random port by default. Capture the `PORT=XXXXX` output for client configuration.
2. **Environment**: Ensure `.env` file exists in project root with valid R2 credentials.
3. **Security**: API only listens on `127.0.0.1` (localhost) - not exposed to external network.
4. **Logging**: Fastify logger is enabled - logs go to stdout/stderr.

---

## Error Codes

All error responses follow a consistent format:

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

### Error Code Reference

#### Authentication Errors (401/403)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | R2 credentials are invalid |
| `AUTH_MISSING_CREDENTIALS` | 401 | R2 credentials not configured |
| `AUTH_PERMISSION_DENIED` | 403 | Insufficient permissions for operation |

#### Resource Errors (404/409)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BUCKET_NOT_FOUND` | 404 | Bucket does not exist |
| `OBJECT_NOT_FOUND` | 404 | Object does not exist |
| `BUCKET_ALREADY_EXISTS` | 409 | Bucket name already taken |

#### Validation Errors (400/413/416)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_INVALID_KEY` | 400 | Object key is invalid |
| `VALIDATION_MISSING_QUERY` | 400 | Required query parameter missing |
| `VALIDATION_INVALID_RANGE` | 416 | Range request is invalid |
| `VALIDATION_INVALID_PARAM` | 400 | Query parameter format invalid |
| `VALIDATION_FILE_TOO_LARGE` | 413 | File exceeds upload limit |

#### Service Errors (429/500/502/503/504)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `R2_SERVICE_ERROR` | 502 | R2 service error |
| `R2_TIMEOUT` | 504 | R2 request timed out |
| `R2_RATE_LIMIT` | 429 | Rate limit exceeded |
| `R2_NETWORK_ERROR` | 502 | Network connection failed |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Server temporarily unavailable |

### Error Handling Best Practices

**Client-Side:**
1. Check `status` field: `"ok"` or `"error"`
2. Display `error.message` to user
3. Log `error.code` and `meta.requestId` for debugging
4. Implement retry logic for 5xx errors with exponential backoff

**Example:**
```typescript
const response = await fetch('/buckets');
const data = await response.json();

if (data.status === 'error') {
  console.error(`Error ${data.error.code}: ${data.error.message}`);
  console.error(`Request ID: ${data.meta.requestId}`);
  // Handle error appropriately
}
```

---

## Examples

See [EXAMPLES.md](./EXAMPLES.md) for comprehensive examples including:

- curl commands for all endpoints
- JavaScript/TypeScript client examples
- Common workflows (list, upload, download, search, delete)
- Error handling patterns
- Pagination examples
- Streaming upload/download examples

Quick curl examples:

```bash
# List buckets
curl http://localhost:3000/buckets

# List objects in bucket
curl http://localhost:3000/buckets/my-bucket/objects

# Upload file
curl -X PUT \
  -H "Content-Type: text/plain" \
  --data-binary @file.txt \
  http://localhost:3000/buckets/my-bucket/objects/uploads/file.txt

# Download file
curl http://localhost:3000/buckets/my-bucket/objects/uploads/file.txt \
  -o downloaded-file.txt

# Search objects
curl "http://localhost:3000/buckets/my-bucket/search?q=report"

# Delete object
curl -X DELETE \
  http://localhost:3000/buckets/my-bucket/objects/uploads/file.txt
```

---

## Architecture

### Design Philosophy

1. **RESTful**: Resource-oriented URLs, standard HTTP methods
2. **Streaming**: Efficient memory usage for large files
3. **Type-Safe**: Full TypeScript with comprehensive type definitions
4. **Error Handling**: Consistent error responses with detailed codes
5. **Performance**: N:M bundling for optimal startup time

### Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify 5.x (high-performance HTTP server)
- **Language**: TypeScript 5.9+ (type safety)
- **R2 Client**: AWS SDK for S3 (R2-compatible)
- **Build Tool**: esbuild (fast bundling)

### Response Envelope

All API responses use a consistent envelope structure:

**Success:**
```json
{
  "status": "ok",
  "data": { /* resource data */ },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

**Error:**
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { /* optional context */ }
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

**Pagination:**
```json
{
  "status": "ok",
  "data": [ /* items */ ],
  "pagination": {
    "isTruncated": true,
    "maxKeys": 1000,
    "keyCount": 1000,
    "nextContinuationToken": "token"
  },
  "meta": { /* ... */ }
}
```

### URL Encoding

All path parameters MUST be URL-encoded:

```bash
# Original key: folder/file.txt
# Encoded:      folder%2Ffile.txt
GET /buckets/my-bucket/objects/folder%2Ffile.txt

# Original key: file name.txt
# Encoded:      file%20name.txt
GET /buckets/my-bucket/objects/file%20name.txt
```

---

## Contributing

### Code Style

Follow these critical rules (see [CLAUDE.md](./CLAUDE.md) for full guidelines):

1. **Import Extensions**: Always use `.ts` extensions
   ```typescript
   import { options } from './options.ts';  // ✅ CORRECT
   import { options } from './options.js';  // ❌ WRONG
   ```

2. **Nullish Coalescing**: Always use `??` for defaults
   ```typescript
   const port = config.port ?? 3000;  // ✅ CORRECT
   const port = config.port || 3000;  // ❌ WRONG
   ```

3. **Type Imports**: Use `type` imports for TypeScript types
   ```typescript
   import type { FastifyInstance } from 'fastify';
   ```

### Development Workflow

1. Create a feature branch
2. Make changes with comprehensive tests
3. Ensure `pnpm typecheck` passes
4. Test manually with curl or HTTP client
5. Update documentation if needed
6. Submit pull request

---

## Troubleshooting

### Server Won't Start

**Problem**: Server fails to start or exits immediately

**Solutions:**
- Check `.env` file exists in project root: `/Users/cha/projects/cloudflare-r2-object-storage-browser/.env`
- Verify R2 credentials are correct
- Check Node.js version: `node --version` (should be 20+)
- Review error logs in console output

### Cannot Connect to R2

**Problem**: API returns `AUTH_INVALID_CREDENTIALS` or connection errors

**Solutions:**
- Verify R2_ENDPOINT format: `https://<account-id>.r2.cloudflarestorage.com`
- Confirm R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are correct
- Check API token permissions in Cloudflare Dashboard
- Test credentials with AWS CLI: `aws s3 ls --endpoint-url=$R2_ENDPOINT`

### 404 Bucket Not Found

**Problem**: Bucket exists but API returns 404

**Solutions:**
- Verify bucket name spelling (case-sensitive)
- Check API token has access to this bucket
- List all buckets: `curl http://localhost:PORT/buckets`

### Large File Upload Fails

**Problem**: Upload fails for large files

**Solutions:**
- Check file size limit (R2 supports up to 5GB per PUT request)
- For files >5GB, use multipart upload (future feature)
- Verify network stability
- Check disk space on server

---

## Resources

- [API Routes Specification](./API_ROUTES_SPEC.md) - Complete API design document
- [Examples](./EXAMPLES.md) - Comprehensive usage examples
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Fastify Documentation](https://fastify.dev/)
- [AWS SDK S3 Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues, questions, or feature requests:

1. Check [Troubleshooting](#troubleshooting) section
2. Review [EXAMPLES.md](./EXAMPLES.md) for usage patterns
3. Consult [API_ROUTES_SPEC.md](./API_ROUTES_SPEC.md) for detailed specs
4. Open an issue on GitHub with:
   - Error message and `requestId` from response
   - Steps to reproduce
   - Expected vs actual behavior

---

**Built with ❤️ using Fastify, TypeScript, and Cloudflare R2**
